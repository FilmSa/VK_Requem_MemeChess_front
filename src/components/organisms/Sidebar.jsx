import { useState } from "react";

const menuItems = [
  { id: "play", label: "Играть", icon: "/icons/sword.svg" },
  { id: "tournaments", label: "Турниры", icon: "/icons/cup.svg" },
  { id: "shop", label: "Магазин", icon: "/icons/cart.svg" },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("play");

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
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item.id)}
                className={`
                  w-[207px]
                  h-[56px]
                  px-[8px]
                  py-[6px]
                  rounded-[20px_0px]
                  flex
                  items-center
                  justify-between
                  transition-all
                  border-none
                  outline-none
                  focus:outline-none
                  ${
                    isActive
                      ? "bg-[linear-gradient(135deg,#5238c8_0%,#2a1e5d_100%)] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                      : "bg-transparent shadow-none"
                  }
                `}
              >
                <span
                  className={`
                    text-[24px]
                    leading-none
                    font-normal
                    ${
                      isActive
                        ? "bg-[linear-gradient(90deg,#2fc8e3_0%,#ffffff_100%)] bg-clip-text text-transparent"
                        : "text-[#7BE9FF]"
                    }
                  `}
                  style={{ fontFamily: '"Unbounded", sans-serif' }}
                >
                  {item.label}
                </span>

                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-[32px] h-[32px] object-contain shrink-0"
                />
              </button>
            );
          })}
        </nav>

        <div className="mt-[18px] w-[207px]">
          <div className="flex items-center gap-[10px] mb-[12px]">
            <div className="w-[54px] h-[54px] rounded-full overflow-hidden shrink-0 bg-white/20">
              <img
                src="/icons/avatar.jpg"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center">
              <div
                className="font-medium text-[14px] leading-[1.2] text-[#ffff]"
                style={{ fontFamily: '"Unbounded", sans-serif' }}
              >
                ChessMaster
              </div>

              <div
                className="font-medium text-[20px] leading-[1.2] text-[#ffd700]"
                style={{ fontFamily: '"Unbounded", sans-serif' }}
              >
                14 lvl
              </div>
            </div>
          </div>

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

function Logo() {
  return (
    <div className="w-[168px]">
      <div
        className="
          text-[40px]
          font-normal
          leading-[1]
          bg-[linear-gradient(90deg,#02d9ff_0%,#cc02bf_40.07%,#610199_90.87%)]
          bg-clip-text
          text-transparent
        "
        style={{ fontFamily: '"Tilt Warp", cursive' }}
      >
        Pawn
      </div>

      <div
        className="
          text-[40px]
          font-normal
          leading-[1]
          bg-[linear-gradient(90deg,#02d9ff_0%,#cc02bf_40.07%,#610199_90.87%)]
          bg-clip-text
          text-transparent
        "
        style={{ fontFamily: '"Tilt Warp", cursive' }}
      >
        Requiem
      </div>
    </div>
  );
}

function CurrencyBadge({ icon, value, bgClass, borderClass, textClass }) {
  return (
    <div
      className={`
        w-[99px]
        h-[32px]
        px-[10px]
        border
        rounded-[14px_0px]
        flex
        items-center
        justify-center
        gap-[6px]
        ${bgClass}
        ${borderClass}
      `}
    >
      <img src={icon} alt="" className="w-[14px] h-[14px] object-contain" />

      <span
        className={`text-[14px] font-medium leading-none ${textClass}`}
        style={{ fontFamily: '"Unbounded", sans-serif' }}
      >
        {value}
      </span>
    </div>
  );
}