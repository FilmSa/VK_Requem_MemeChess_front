import Icon from "../atoms/Icon.jsx";

export default function GameHeaderMolecule({
  iconKey = "game",
  title = "Партия",
}) {
  return (
    <div
      className="flex h-[80px] w-full items-center px-[54px]"
      style={{ borderBottom: "1px solid var(--main-menu-divider)" }}
    >
      <div className="flex items-center gap-[12px]">
        <span
          className="text-[20px] font-medium leading-none"
          style={{
            color: "var(--main-menu-text)",
            fontFamily: '"Unbounded", sans-serif',
          }}
        >
          {title}
        </span>
        <Icon iconKey={iconKey} width={25} height={25} />
      </div>
    </div>
  );
}
