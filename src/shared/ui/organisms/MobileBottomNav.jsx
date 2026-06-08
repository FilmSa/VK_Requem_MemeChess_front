import { useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import startGameIcon from "../../../../icons/startgame.svg";
import { withAssetBase } from "../../../shared/lib/assets.js";


const NAV_ITEMS = [
  {
    id: "home",
    label: "Играть",
    to: "/",
    icon: (
      <img 
        src={ startGameIcon }
        alt="Играть"
      />
    ),
  },
  {
    id: "shop",
    label: "Магазин",
    to: "/shop",
    icon: (
      <img
        src={withAssetBase("/icons/cart.svg")}
        alt="Магазин"
      />
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