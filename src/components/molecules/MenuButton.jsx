import { Link } from "react-router-dom";
import Text from "../atoms/Text";
import Icon from "../atoms/Icon";

export default function MenuButton({ label, icon, to, active }) {
  return (
    <Link
      to={to}
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
        no-underline
        border-none
        outline-none
        ${active
          ? "bg-[linear-gradient(135deg,#5238c8_0%,#2a1e5d_100%)] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
          : "bg-transparent shadow-none"}
      `}
    >
      <Text
        className={`
          text-[24px]
          leading-none
          font-normal
          ${active
            ? "bg-[linear-gradient(90deg,#2fc8e3_0%,#ffffff_100%)] bg-clip-text text-transparent"
            : "text-[#7BE9FF]"}
        `}
        style={{ fontFamily: '"Unbounded", sans-serif' }}
      >
        {label}
      </Text>

      <Icon
        src={icon}
        alt={label}
        className="w-[32px] h-[32px] object-contain shrink-0"
      />
    </Link>
  );
}