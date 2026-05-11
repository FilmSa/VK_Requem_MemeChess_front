import { useLocation } from "react-router-dom";
import Logo from "../../../components/molecules/Logo.jsx";
import MenuButton from "../../../components/molecules/MenuButton.jsx";
import SidebarProfileCard from "../../../components/molecules/SidebarProfileCard.jsx";
import { useAuth } from "../../../features/auth/useAuth.js";
import { withAssetBase } from "../../lib/assets.js";

const menuItems = [
  {
    id: "play",
    label: "\u0418\u0433\u0440\u0430\u0442\u044c",
    icon: withAssetBase("/icons/sword.svg"),
    to: "/",
  },
  {
    id: "shop",
    label: "\u041c\u0430\u0433\u0430\u0437\u0438\u043d",
    icon: withAssetBase("/icons/cart.svg"),
    to: "/shop",
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isPlaySection =
    location.pathname === "/" || location.pathname.startsWith("/play");

  async function handleLogout() {
    await logout();
  }

  return (
    <aside
      className="relative z-[200] flex h-full w-[247px] min-w-[247px] max-w-[247px] shrink-0 flex-col overflow-hidden px-[20px] py-[20px]"
      style={{ background: "var(--sidebar-background)" }}
    >
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

        <div className="flex flex-col gap-[14px]">
          <SidebarProfileCard
            user={user}
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </aside>
  );
}
