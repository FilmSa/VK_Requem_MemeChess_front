import { useCallback } from "react";
import Text from "../atoms/Text";
import Icon from "../atoms/Icon";
import { useReliableNavigate } from "../../shared/router/useReliableNavigate.js";

export default function MenuButton({ label, icon, to, active, preload }) {
  const reliableNavigate = useReliableNavigate();

  const handleActivate = useCallback(
    async (event) => {
      event?.preventDefault?.();

      try {
        await preload?.();
      } catch {
        // Ignore preload failures and let navigation continue.
      }

      reliableNavigate(to);
    },
    [preload, reliableNavigate, to]
  );

  return (
    <button
      type="button"
      onClick={handleActivate}
      onMouseEnter={() => {
        void preload?.();
      }}
      onFocus={() => {
        void preload?.();
      }}
      className="flex h-[56px] w-[207px] items-center justify-between rounded-[20px_0px] border-none px-[8px] py-[6px] no-underline outline-none transition-all"
      style={{
        background: active ? "var(--menu-item-active-bg)" : "transparent",
        boxShadow: active ? "var(--menu-item-shadow)" : "none",
        textAlign: "left",
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
    </button>
  );
}
