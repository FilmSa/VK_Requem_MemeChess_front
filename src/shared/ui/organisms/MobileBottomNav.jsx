import { useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Главная",
    to: "/",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12L12 3L21 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10V20H19V10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "favorites",
    label: "Избранное",
    to: "/favorites",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21L5 14C3.5 12.5 3 10.5 3 9C3 6 5.5 4 8 4C10 4 11.5 5.5 12 7C12.5 5.5 14 4 16 4C18.5 4 21 6 21 9C21 10.5 20.5 12.5 19 14L12 21Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "shop",
    label: "Магазин",
    to: "/shop",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7H20L18 20H6L4 7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M8 7V5C8 3 9.5 2 12 2C14.5 2 16 3 16 5V7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Профиль",
    to: "/profile",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4 22C4 17 7.5 14 12 14C16.5 14 20 17 20 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function isPathActive(itemPath, currentPathname) {
  if (itemPath === "/") {
    return currentPathname === "/" || currentPathname.startsWith("/play");
  }
  if (itemPath === "/profile") {
    return currentPathname.startsWith("/profile");
  }
  return currentPathname.startsWith(itemPath);
}

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = useCallback(
    (to) => {
      navigate(to);
    },
    [navigate]
  );

  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = isPathActive(item.to, location.pathname);
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-bottom-nav__item ${isActive ? "is-active" : ""}`}
            onClick={() => handleNavClick(item.to)}
          >
            <span className="mobile-bottom-nav__icon">{item.icon}</span>
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}