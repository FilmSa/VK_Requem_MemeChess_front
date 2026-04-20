import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../features/auth/ProtectedRoute.jsx";
import HomePage from "../pages/HomePage.jsx";
import InvitePage from "../pages/InvitePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import PlayPage from "../pages/PlayPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ShopPage from "../pages/ShopPage.jsx";
import TournamentsPage from "../pages/TournamentsPage.jsx";

export default function App() {
  const useHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";
  const Router = useHashRouter ? HashRouter : BrowserRouter;
  const browserBasename =
    !useHashRouter && import.meta.env.BASE_URL !== "/"
      ? import.meta.env.BASE_URL
      : undefined;

  return (
    <Router basename={browserBasename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
