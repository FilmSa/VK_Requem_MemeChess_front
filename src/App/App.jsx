import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "../features/auth/ProtectedRoute.jsx";
import {
  preloadHomePage,
  preloadInvitePage,
  preloadLoginPage,
  preloadPlayPage,
  preloadProfilePage,
  preloadRegisterPage,
  resolveRoutePreloader,
  preloadShopPage,
  preloadTournamentsPage,
  preloadFavoritesPage,
} from "./routeLoaders.js";

const HomePage = lazy(preloadHomePage);
const InvitePage = lazy(preloadInvitePage);
const LoginPage = lazy(preloadLoginPage);
const PlayPage = lazy(preloadPlayPage);
const ProfilePage = lazy(preloadProfilePage);
const RegisterPage = lazy(preloadRegisterPage);
const ShopPage = lazy(preloadShopPage);
const TournamentsPage = lazy(preloadTournamentsPage);
const FavoritesPage = lazy(preloadFavoritesPage);

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
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const previousPathnameRef = useRef(location.pathname);
  const transitionDirection = resolveRouteTransitionDirection(
    previousPathnameRef.current,
    displayedLocation.pathname
  );

  useEffect(() => {
    const isSameRoute =
      displayedLocation.pathname === location.pathname &&
      displayedLocation.search === location.search &&
      displayedLocation.hash === location.hash;

    if (isSameRoute) {
      return undefined;
    }

    let cancelled = false;
    const nextLocation = location;
    const routePreloader = resolveRoutePreloader(nextLocation.pathname);

    Promise.resolve(routePreloader ? routePreloader() : null)
      .catch(() => {})
      .finally(() => {
        if (cancelled) {
          return;
        }

        previousPathnameRef.current = displayedLocation.pathname;
        setDisplayedLocation(nextLocation);
      });

    return () => {
      cancelled = true;
    };
  }, [displayedLocation, location]);

  return (
    <div className="route-transition-shell">
      <div
        key={`${displayedLocation.pathname}${displayedLocation.search}`}
        className={`route-transition route-transition--${transitionDirection}`}
      >
        <Suspense fallback={<RouteLoadingScreen />}>
          <Routes location={displayedLocation}>
            <Route path="/" element={<HomePage />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
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
        </Suspense>
      </div>
    </div>
  );
}

function RouteLoadingScreen() {
  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-8">
      <div
        className="rounded-[24px] border px-6 py-5 text-[15px]"
        style={{
          borderColor: "var(--status-card-border)",
          background: "var(--status-card-background)",
          boxShadow: "var(--status-card-shadow)",
          color: "var(--color-text)",
        }}
      >
        Загружаем страницу...
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
