import Text from "../atoms/Text";
import Icon from "../atoms/Icon";
import { buildAppHref } from "../../shared/router/buildAppHref.js";

export default function MenuButton({ label, icon, to, active }) {
  return (
    <a
      href={buildAppHref(to)}
      className="flex h-[56px] w-[207px] items-center justify-between rounded-[20px_0px] border-none px-[8px] py-[6px] no-underline outline-none transition-all"
      style={{
        background: active ? "var(--menu-item-active-bg)" : "transparent",
        boxShadow: active ? "var(--menu-item-shadow)" : "none",
      }}
    >
      <Text
        className="text-[24px] font-normal leading-none"
        style={{
          fontFamily: '"Unbounded", sans-serif',
          ...(active
            ? {
                backgroundImage: "var(--menu-item-active-text)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : {
                color: "var(--menu-item-text)",
              }),
        }}
      >
        {label}
      </Text>

      <Icon
        src={icon}
        alt={label}
        className="h-[32px] w-[32px] shrink-0 object-contain"
      />
    </a>
  );
}
