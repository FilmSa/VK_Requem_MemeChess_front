import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "../features/auth/ProtectedRoute.jsx";
import HomePage from "../pages/HomePage.jsx";
import InvitePage from "../pages/InvitePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import PlayPage from "../pages/PlayPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ShopPage from "../pages/ShopPage.jsx";
import TournamentsPage from "../pages/TournamentsPage.jsx";

const PRIMARY_ROUTE_ORDER = new Map([
  ["/", 0],
  ["/play", 0],
  ["/shop", 1],
  ["/profile", 2],
]);

function resolvePrimaryRouteOrder(pathname) {
  if (pathname === "/play" || pathname.startsWith("/play?")) {
    return 0;
  }

  return PRIMARY_ROUTE_ORDER.get(pathname) ?? null;
}

function resolveRouteTransitionDirection(previousPathname, nextPathname) {
  const previousOrder = resolvePrimaryRouteOrder(previousPathname);
  const nextOrder = resolvePrimaryRouteOrder(nextPathname);

  if (previousOrder === null || nextOrder === null || previousOrder === nextOrder) {
    return "none";
  }

  return nextOrder > previousOrder ? "forward" : "backward";
}

function AnimatedRoutes() {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);
  const transitionDirection = resolveRouteTransitionDirection(
    previousPathnameRef.current,
    location.pathname
  );

  useEffect(() => {
    previousPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <div className="route-transition-shell">
      <div
        key={location.pathname}
        className={`route-transition route-transition--${transitionDirection}`}
      >
        <Routes location={location}>
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
      </div>
    </div>
  );
}

export default function App() {
  const useHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";
  const Router = useHashRouter ? HashRouter : BrowserRouter;
  const browserBasename =
    !useHashRouter && import.meta.env.BASE_URL !== "/"
      ? import.meta.env.BASE_URL
      : undefined;

  return (
    <Router basename={browserBasename}>
      <AnimatedRoutes />
    </Router>
  );
}
