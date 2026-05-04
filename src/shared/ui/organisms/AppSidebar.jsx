import { useLocation } from "react-router-dom";
import { useAuth } from "../../../features/auth/useAuth.js";
import Logo from "../../../components/molecules/Logo.jsx";
import MenuButton from "../../../components/molecules/MenuButton.jsx";
import SidebarProfileCard from "../../../components/molecules/SidebarProfileCard.jsx";
import { withAssetBase } from "../../lib/assets.js";

const menuItems = [
  {
    id: "play",
    label: "Играть",
    icon: withAssetBase("/icons/sword.svg"),
    to: "/",
  },
  {
    id: "tournaments",
    label: "Турниры",
    icon: withAssetBase("/icons/cup.svg"),
    to: "/tournaments",
  },
  {
    id: "shop",
    label: "Магазин",
    icon: withAssetBase("/icons/cart.svg"),
    to: "/shop",
  },
];

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("ru-RU").format(value);
}

function SidebarCurrencyCard({ gameFunds, isAuthenticated }) {
  return (
    <div
      className="w-[207px] overflow-hidden rounded-[24px] border p-[16px]"
      style={{
        borderColor: "var(--sidebar-card-border)",
        background: "var(--sidebar-card-background)",
        boxShadow: "var(--sidebar-card-shadow)",
      }}
    >
      <div className="flex items-center gap-[12px]">
        <div
          className="flex h-[42px] w-[42px] items-center justify-center rounded-[16px]"
          style={{
            background: "var(--sidebar-primary-button-bg)",
          }}
        >
          <img
            src={withAssetBase("/icons/crown.svg")}
            alt=""
            className="h-[20px] w-[20px] object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Игровая валюта
          </p>
          <p
            className="mt-[6px] truncate text-[24px] font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {isAuthenticated ? formatCurrency(gameFunds) : "—"}
          </p>
        </div>
      </div>

    </div>
  );
}

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
          <SidebarCurrencyCard
            gameFunds={Number(user?.game_funds ?? 0)}
            isAuthenticated={isAuthenticated}
          />

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
