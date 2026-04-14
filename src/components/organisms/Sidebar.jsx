import { useLocation } from "react-router-dom";

import Logo from "../molecules/Logo.jsx";
import MenuButton from "../molecules/MenuButton.jsx";
import SidebarProfileCard from "../molecules/SidebarProfileCard.jsx";
import { useAuth } from "../../features/auth/useAuth.js";

const menuItems = [
  { id: "play", label: "Играть", icon: "/icons/sword.svg", to: "/" },
  { id: "tournaments", label: "Турниры", icon: "/icons/cup.svg", to: "/tournaments" },
  { id: "shop", label: "Магазин", icon: "/icons/cart.svg", to: "/shop" },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isPlaySection =
    location.pathname === "/" || location.pathname.startsWith("/play");

  async function handleLogout() {
    await logout();
  }

  return (
    <aside className="flex h-full w-[247px] min-w-[247px] max-w-[247px] shrink-0 flex-col overflow-hidden bg-[linear-gradient(90deg,#160936_0%,#0a183c_22.6%)] px-[20px] py-[20px]">
      <Logo />

      <div className="flex flex-1 flex-col justify-between pt-[28px]">
        <nav className="flex flex-col gap-[10px]">
          {menuItems.map((item) => (
            <MenuButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              to={item.to}
              active={
                item.id === "play"
                  ? isPlaySection
                  : location.pathname === item.to
              }
            />
          ))}
        </nav>

        <SidebarProfileCard
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
      </div>
    </aside>
  );
}
