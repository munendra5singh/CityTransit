# CityTransit — Local Public Transport Live Tracking

## Original Problem Statement
Build a full-stack Local Public Transport (Bus / Magic / Auto / Van / Mini Bus) Live Tracking system for Indian cities. Three parts: Driver App (secure login, profile, vehicle registration, route selection, big Go Live button, GPS broadcast every 3-5 sec, dashboard with distance/online time), Passenger App/Website (search by vehicle number / route / city, live vehicle list, info modal, Live Google Map / Leaflet, call driver, favorite routes, recent searches), Admin Panel (dashboard stats, driver/vehicle/route management, live monitoring map, reports).

## User Personas
- **Passenger**: opens web app, searches for a bus/route, sees live map, taps to call driver, favorites routes.
- **Driver**: logs in, picks their vehicle + route, hits Go Live, GPS auto-broadcasts. Sees own metrics.
- **Admin**: monitors network, approves/blocks drivers/vehicles/routes, sees stats & reports.

## Tech Stack
- Backend: FastAPI + Motor (MongoDB) + PyJWT + bcrypt
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + framer-motion + react-leaflet (dark CartoDB tiles) + sonner
- Auth: Email + Password (JWT via httpOnly cookie + Bearer localStorage fallback), roles: passenger/driver/admin

## What's Been Implemented (2026-02)
- ✅ Auth: register, login, logout, me, profile update, role guards
- ✅ Routes: list (approved by default), create (auto-approved for admin, pending for drivers), approve, edit, delete
- ✅ Vehicles: driver-owned CRUD, admin approve/list, duplicate-number guard
- ✅ Driver Go Live / Go Offline session, GPS location updates every ~4s with distance accumulation
- ✅ Live vehicles API (global + filtered by route/vehicle_number)
- ✅ Admin: stats, drivers/vehicles/routes/users management, live monitoring map, reports (trips + distance)
- ✅ Frontend: Landing hero, Login (with demo account buttons), Register (role selector), Passenger (live map + route list + vehicle cards + info modal + favorites + recents), Driver (Go Live UI, real-time GPS, stats, add vehicle/route modals), Admin (7 tabs: dashboard/drivers/vehicles/routes/users/live/reports), Routes browse page
- ✅ Seed data: 1 admin, 1 demo driver + vehicle (UP14AB1234), 1 demo passenger, 5 popular routes
- ✅ Testing agent report: backend 100%, frontend ~95% (register testids fixed after)

## Prioritized Backlog
### P0 (blocker for real-world use)
- Real-time refresh via WebSocket (currently 4s polling)
- Mobile OTP login (Twilio integration)

### P1
- ETA calculation using route stops + current position
- Push notifications when a favorited route has a live vehicle nearby
- Driver mobile PWA install prompt + wake lock so GPS stays on with screen off
- Historical trips view for drivers
- Vehicle icons colored by type (Bus/Auto/Van)

### P2
- Multi-language UI (Hindi + English)
- Passenger crowd-report / feedback per trip
- Fare estimator
- Admin CSV export for reports
- Google Maps swap-in (optional)

## Test Credentials
See `/app/memory/test_credentials.md`.

## Key Files
- Backend: `/app/backend/server.py`
- Frontend entry: `/app/frontend/src/App.js`
- Auth context: `/app/frontend/src/lib/auth.jsx`
- API client: `/app/frontend/src/lib/apiClient.js`
- Pages: `/app/frontend/src/pages/` (Landing, Login, Register, Passenger, Driver, Admin, Routes)
