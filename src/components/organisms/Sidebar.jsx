import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

import Logo from "../molecules/Logo";
import MenuButton from "../molecules/MenuButton";
import UserInfo from "../molecules/UserInfo";
import CurrencyBadge from "../molecules/Currency";

const menuItems = [
  { id: "play", label: "Играть", icon: "/icons/sword.svg", to: "/" },
  { id: "tournaments", label: "Турниры", icon: "/icons/cup.svg", to: "/tournaments" },
  { id: "shop", label: "Магазин", icon: "/icons/cart.svg", to: "/shop" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="
        w-[247px]
        min-w-[247px]
        max-w-[247px]
        h-full
        overflow-hidden
        shrink-0
        px-[20px]
        py-[20px]
        flex
        flex-col
        bg-[linear-gradient(90deg,#160936_0%,#0a183c_22.6%)]
      "
    >
      <Logo />

      <div className="flex-1 flex flex-col justify-end">
        <nav className="flex flex-col gap-[10px]">
          {menuItems.map((item) => (
            <MenuButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              to={item.to}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="mt-[18px] w-[207px]">
          <Link to="/profile" className="no-underline">
            <UserInfo
              name="ChessMaster"
              level="14 lvl"
              avatar="/icons/avatar.jpg"
            />
          </Link>

          <div className="flex gap-[8px]">
            <CurrencyBadge
              icon="/icons/crown.svg"
              value="360"
              bgClass="bg-[#7b056f]"
              borderClass="border-[#de67ff]"
              textClass="text-[#de67ff]"
            />

            <CurrencyBadge
              icon="/icons/rock.svg"
              value="3228"
              bgClass="bg-[radial-gradient(50%_50%_at_50%_50%,#287078_0%,#205357_100%)]"
              borderClass="border-[#55f3ff]"
              textClass="text-[#55f3ff]"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}