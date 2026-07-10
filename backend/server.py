from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from typing import Optional, List, Literal
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------- Setup ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="CityTransit API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("citytransit")


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles: str):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return dep


def set_auth_cookie(response: Response, token: str):
    # In production (frontend and backend on different domains, e.g. GitHub
    # Pages + Render) cookies must be Secure + SameSite=None to be sent
    # cross-site. Locally (http://localhost) that combination is rejected by
    # browsers, so we fall back to Lax/non-secure there. Either way, the
    # frontend also stores the token in localStorage and sends it as a
    # Bearer header, so login keeps working even if the cookie is blocked.
    is_prod = os.environ.get("ENV", "development") == "production"
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=7 * 24 * 3600,
        path="/",
    )


# ---------- Models ----------
Role = Literal["passenger", "driver", "admin"]


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role = "passenger"
    mobile: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VehicleIn(BaseModel):
    vehicle_type: str  # Bus | Magic | Auto | Van | Mini Bus | Other
    vehicle_number: str
    vehicle_name: Optional[str] = None
    capacity: Optional[int] = None
    color: Optional[str] = None


class RouteIn(BaseModel):
    name: str
    origin: str
    destination: str
    stops: List[str] = []
    city: Optional[str] = None


class LocationIn(BaseModel):
    latitude: float
    longitude: float
    speed: Optional[float] = 0.0
    heading: Optional[float] = 0.0


class GoLiveIn(BaseModel):
    vehicle_id: str
    route_id: str


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    profile_photo: Optional[str] = None
    license: Optional[str] = None
    address: Optional[str] = None


# ---------- Auth Endpoints ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = new_id()
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "mobile": payload.mobile,
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "status": "approved" if payload.role != "driver" else "pending",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email, payload.role)
    set_auth_cookie(response, token)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": user_doc, "token": token}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("status") == "blocked":
        raise HTTPException(status_code=403, detail="Account blocked. Contact admin.")
    token = create_access_token(user["id"], user["email"], user["role"])
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.patch("/auth/profile")
async def update_profile(payload: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


# ---------- Routes Endpoints ----------
@api.get("/routes")
async def list_routes(status: Optional[str] = None):
    q = {}
    if status:
        q["status"] = status
    else:
        q["status"] = "approved"
    docs = await db.routes.find(q, {"_id": 0}).to_list(500)
    return docs


@api.post("/routes")
async def create_route(payload: RouteIn, user: dict = Depends(get_current_user)):
    doc = {
        "id": new_id(),
        "name": payload.name,
        "origin": payload.origin,
        "destination": payload.destination,
        "stops": payload.stops,
        "city": payload.city,
        "created_by": user["id"],
        "status": "approved" if user["role"] == "admin" else "pending",
        "created_at": now_iso(),
    }
    await db.routes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/routes/{route_id}")
async def update_route(route_id: str, payload: RouteIn, user: dict = Depends(require_role("admin"))):
    await db.routes.update_one({"id": route_id}, {"$set": payload.model_dump()})
    return await db.routes.find_one({"id": route_id}, {"_id": 0})


@api.post("/routes/{route_id}/approve")
async def approve_route(route_id: str, user: dict = Depends(require_role("admin"))):
    await db.routes.update_one({"id": route_id}, {"$set": {"status": "approved"}})
    return {"ok": True}


@api.delete("/routes/{route_id}")
async def delete_route(route_id: str, user: dict = Depends(require_role("admin"))):
    await db.routes.delete_one({"id": route_id})
    return {"ok": True}


# ---------- Vehicles ----------
@api.get("/vehicles")
async def list_vehicles(user: dict = Depends(get_current_user)):
    q = {} if user["role"] == "admin" else {"driver_id": user["id"]}
    docs = await db.vehicles.find(q, {"_id": 0}).to_list(500)
    return docs


@api.post("/vehicles")
async def create_vehicle(payload: VehicleIn, user: dict = Depends(require_role("driver", "admin"))):
    existing = await db.vehicles.find_one({"vehicle_number": payload.vehicle_number.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle number already registered")
    doc = {
        "id": new_id(),
        "driver_id": user["id"],
        "vehicle_type": payload.vehicle_type,
        "vehicle_number": payload.vehicle_number.upper(),
        "vehicle_name": payload.vehicle_name,
        "capacity": payload.capacity,
        "color": payload.color,
        "status": "approved" if user["role"] == "admin" else "pending",
        "created_at": now_iso(),
    }
    await db.vehicles.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/vehicles/{vehicle_id}/approve")
async def approve_vehicle(vehicle_id: str, user: dict = Depends(require_role("admin"))):
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": {"status": "approved"}})
    return {"ok": True}


@api.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, user: dict = Depends(get_current_user)):
    q = {"id": vehicle_id}
    if user["role"] != "admin":
        q["driver_id"] = user["id"]
    res = await db.vehicles.delete_one(q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    await db.live_locations.delete_one({"vehicle_id": vehicle_id})
    return {"ok": True}


@api.get("/vehicles/search")
async def search_vehicle(number: str):
    number = number.upper().replace(" ", "")
    docs = await db.vehicles.find({"_id": 0}).to_list(1000)
    matches = [v for v in docs if v.get("vehicle_number", "").replace(" ", "").upper().startswith(number)]
    return matches[:20]


# ---------- Go Live / Location ----------
@api.post("/driver/go-live")
async def go_live(payload: GoLiveIn, user: dict = Depends(require_role("driver"))):
    vehicle = await db.vehicles.find_one({"id": payload.vehicle_id, "driver_id": user["id"]})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    route = await db.routes.find_one({"id": payload.route_id})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    session = {
        "id": new_id(),
        "driver_id": user["id"],
        "driver_name": user["name"],
        "driver_mobile": user.get("mobile"),
        "vehicle_id": vehicle["id"],
        "vehicle_number": vehicle["vehicle_number"],
        "vehicle_type": vehicle["vehicle_type"],
        "route_id": route["id"],
        "route_name": route["name"],
        "route_origin": route["origin"],
        "route_destination": route["destination"],
        "is_live": True,
        "latitude": None,
        "longitude": None,
        "speed": 0.0,
        "heading": 0.0,
        "started_at": now_iso(),
        "last_update": now_iso(),
        "distance_km": 0.0,
    }
    await db.live_locations.update_one(
        {"driver_id": user["id"]},
        {"$set": session},
        upsert=True,
    )
    return session


@api.post("/driver/go-offline")
async def go_offline(user: dict = Depends(require_role("driver"))):
    session = await db.live_locations.find_one({"driver_id": user["id"]}, {"_id": 0})
    if session:
        await db.tracking_history.insert_one({**session, "ended_at": now_iso(), "id": new_id()})
    await db.live_locations.delete_one({"driver_id": user["id"]})
    return {"ok": True}


@api.post("/driver/location")
async def update_location(payload: LocationIn, user: dict = Depends(require_role("driver"))):
    existing = await db.live_locations.find_one({"driver_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=400, detail="Not live. Go live first.")
    # calc distance delta (haversine simplified)
    dist = existing.get("distance_km", 0.0)
    if existing.get("latitude") is not None:
        import math
        R = 6371.0
        lat1, lon1 = math.radians(existing["latitude"]), math.radians(existing["longitude"])
        lat2, lon2 = math.radians(payload.latitude), math.radians(payload.longitude)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(min(1.0, math.sqrt(a)))
        dist += R * c
    await db.live_locations.update_one(
        {"driver_id": user["id"]},
        {"$set": {
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "speed": payload.speed,
            "heading": payload.heading,
            "last_update": now_iso(),
            "distance_km": dist,
        }},
    )
    return {"ok": True, "distance_km": dist}


@api.get("/driver/session")
async def my_session(user: dict = Depends(require_role("driver"))):
    doc = await db.live_locations.find_one({"driver_id": user["id"]}, {"_id": 0})
    return doc or {"is_live": False}


@api.get("/live/vehicles")
async def live_vehicles(route_id: Optional[str] = None, vehicle_number: Optional[str] = None):
    q = {"is_live": True, "latitude": {"$ne": None}}
    if route_id:
        q["route_id"] = route_id
    if vehicle_number:
        q["vehicle_number"] = vehicle_number.upper().replace(" ", "")
    docs = await db.live_locations.find(q, {"_id": 0}).to_list(500)
    return docs


@api.get("/live/vehicles/{vehicle_id}")
async def get_live_vehicle(vehicle_id: str):
    doc = await db.live_locations.find_one({"vehicle_id": vehicle_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Vehicle not live")
    return doc


# ---------- Admin ----------
@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_role("admin"))):
    total_drivers = await db.users.count_documents({"role": "driver"})
    total_users = await db.users.count_documents({"role": "passenger"})
    total_vehicles = await db.vehicles.count_documents({})
    total_routes = await db.routes.count_documents({"status": "approved"})
    pending_routes = await db.routes.count_documents({"status": "pending"})
    pending_drivers = await db.users.count_documents({"role": "driver", "status": "pending"})
    pending_vehicles = await db.vehicles.count_documents({"status": "pending"})
    live_vehicles = await db.live_locations.count_documents({"is_live": True})
    return {
        "total_drivers": total_drivers,
        "total_users": total_users,
        "total_vehicles": total_vehicles,
        "total_routes": total_routes,
        "pending_routes": pending_routes,
        "pending_drivers": pending_drivers,
        "pending_vehicles": pending_vehicles,
        "live_vehicles": live_vehicles,
    }


@api.get("/admin/drivers")
async def admin_drivers(user: dict = Depends(require_role("admin"))):
    docs = await db.users.find({"role": "driver"}, {"_id": 0, "password_hash": 0}).to_list(500)
    return docs


@api.post("/admin/drivers/{driver_id}/approve")
async def admin_approve_driver(driver_id: str, user: dict = Depends(require_role("admin"))):
    await db.users.update_one({"id": driver_id, "role": "driver"}, {"$set": {"status": "approved"}})
    return {"ok": True}


@api.post("/admin/drivers/{driver_id}/block")
async def admin_block_driver(driver_id: str, user: dict = Depends(require_role("admin"))):
    await db.users.update_one({"id": driver_id, "role": "driver"}, {"$set": {"status": "blocked"}})
    await db.live_locations.delete_one({"driver_id": driver_id})
    return {"ok": True}


@api.delete("/admin/drivers/{driver_id}")
async def admin_delete_driver(driver_id: str, user: dict = Depends(require_role("admin"))):
    await db.users.delete_one({"id": driver_id, "role": "driver"})
    await db.vehicles.delete_many({"driver_id": driver_id})
    await db.live_locations.delete_one({"driver_id": driver_id})
    return {"ok": True}


@api.get("/admin/vehicles")
async def admin_vehicles(user: dict = Depends(require_role("admin"))):
    return await db.vehicles.find({}, {"_id": 0}).to_list(500)


@api.get("/admin/routes")
async def admin_routes(user: dict = Depends(require_role("admin"))):
    return await db.routes.find({}, {"_id": 0}).to_list(500)


@api.get("/admin/users")
async def admin_users(user: dict = Depends(require_role("admin"))):
    return await db.users.find({"role": "passenger"}, {"_id": 0, "password_hash": 0}).to_list(500)


@api.get("/admin/reports")
async def admin_reports(user: dict = Depends(require_role("admin"))):
    total_trips = await db.tracking_history.count_documents({})
    daily_trips = await db.tracking_history.count_documents({
        "ended_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}
    })
    total_distance = 0.0
    async for t in db.tracking_history.find({}, {"distance_km": 1, "_id": 0}):
        total_distance += t.get("distance_km", 0.0)
    return {
        "total_trips": total_trips,
        "daily_trips": daily_trips,
        "total_distance_km": round(total_distance, 2),
    }


# ---------- Seed ----------
async def seed_data():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@citytransit.in")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": new_id(),
            "email": admin_email,
            "name": "Super Admin",
            "role": "admin",
            "status": "approved",
            "password_hash": hash_password(admin_password),
            "created_at": now_iso(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Demo driver
    demo_driver_email = "driver@citytransit.in"
    driver = await db.users.find_one({"email": demo_driver_email})
    if not driver:
        driver_id = new_id()
        await db.users.insert_one({
            "id": driver_id,
            "email": demo_driver_email,
            "name": "Ramesh Kumar",
            "mobile": "+919876543210",
            "role": "driver",
            "status": "approved",
            "password_hash": hash_password("driver123"),
            "created_at": now_iso(),
        })
    else:
        driver_id = driver["id"]
        if not verify_password("driver123", driver["password_hash"]):
            await db.users.update_one({"email": demo_driver_email}, {"$set": {"password_hash": hash_password("driver123")}})

    # Demo passenger
    passenger_email = "user@citytransit.in"
    pu = await db.users.find_one({"email": passenger_email})
    if not pu:
        await db.users.insert_one({
            "id": new_id(),
            "email": passenger_email,
            "name": "Test Passenger",
            "mobile": "+919000000001",
            "role": "passenger",
            "status": "approved",
            "password_hash": hash_password("user123"),
            "created_at": now_iso(),
        })
    elif not verify_password("user123", pu["password_hash"]):
        await db.users.update_one({"email": passenger_email}, {"$set": {"password_hash": hash_password("user123")}})

    # Seed routes
    demo_routes = [
        {"name": "Ghaziabad → Noida", "origin": "Ghaziabad", "destination": "Noida", "city": "NCR",
         "stops": ["Vaishali", "Vasundhara", "Indirapuram", "Sector 62"]},
        {"name": "Delhi → Ghaziabad", "origin": "Delhi ISBT", "destination": "Ghaziabad", "city": "NCR",
         "stops": ["Anand Vihar", "Vaishali", "Mohan Nagar"]},
        {"name": "Meerut → Modinagar", "origin": "Meerut", "destination": "Modinagar", "city": "UP West",
         "stops": ["Partapur", "Muradnagar"]},
        {"name": "Hapur → Pilkhuwa", "origin": "Hapur", "destination": "Pilkhuwa", "city": "UP West",
         "stops": ["Babugarh", "Simbhaoli"]},
        {"name": "Noida → Faridabad", "origin": "Noida", "destination": "Faridabad", "city": "NCR",
         "stops": ["Kalindi Kunj", "Sarita Vihar"]},
    ]
    for r in demo_routes:
        exists = await db.routes.find_one({"name": r["name"]})
        if not exists:
            await db.routes.insert_one({
                "id": new_id(),
                **r,
                "status": "approved",
                "created_by": "system",
                "created_at": now_iso(),
            })

    # Seed a vehicle for demo driver
    demo_vehicle_number = "UP14AB1234"
    v = await db.vehicles.find_one({"vehicle_number": demo_vehicle_number})
    if not v:
        await db.vehicles.insert_one({
            "id": new_id(),
            "driver_id": driver_id,
            "vehicle_type": "Bus",
            "vehicle_number": demo_vehicle_number,
            "vehicle_name": "Ghaziabad Express",
            "capacity": 40,
            "color": "Red",
            "status": "approved",
            "created_at": now_iso(),
        })


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.vehicles.create_index("vehicle_number", unique=True)
    await db.routes.create_index("name")
    await db.live_locations.create_index("driver_id", unique=True)
    await seed_data()
    logger.info("CityTransit backend started with seed data")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)

# Browsers reject "Access-Control-Allow-Origin: *" combined with credentials,
# so in production we must list allowed origins explicitly. Set the
# ALLOWED_ORIGINS env var (comma-separated) to your GitHub Pages URL, e.g.
# https://<username>.github.io
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
if not ALLOWED_ORIGINS:
    # Sensible default for local development
    ALLOWED_ORIGINS = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
