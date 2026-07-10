import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import PassengerPage from "@/pages/PassengerPage";
import DriverPage from "@/pages/DriverPage";
import AdminPage from "@/pages/AdminPage";
import RoutesPage from "@/pages/RoutesPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppHeader />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/passenger" element={<PassengerPage />} />
            <Route
              path="/driver"
              element={
                <ProtectedRoute roles={["driver", "admin"]}>
                  <DriverPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#141417",
                color: "#fff",
                border: "1px solid #27272a",
                borderRadius: 0,
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
