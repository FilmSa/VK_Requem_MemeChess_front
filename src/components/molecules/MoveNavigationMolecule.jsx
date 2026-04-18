import Icon from "../atoms/Icon.jsx";

function NavigationButton({ iconSrc, title, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-[48px] w-[52px] items-center justify-center border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon src={iconSrc} alt="" width={32} height={32} />
    </button>
  );
}

export default function MoveNavigationMolecule({
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
}) {
  return (
    <div
      className="flex w-fit items-center overflow-hidden rounded-tl-[16px] rounded-br-[16px] px-[10px]"
      style={{
        background: "var(--main-menu-control-bg)",
        boxShadow: "var(--main-menu-surface-shadow)",
      }}
    >
      <NavigationButton
        iconSrc="/icons/left.svg"
        title="Предыдущий ход"
        onClick={onPrevious}
        disabled={previousDisabled}
      />
      <NavigationButton
        iconSrc="/icons/right.svg"
        title="Следующий ход"
        onClick={onNext}
        disabled={nextDisabled}
      />
    </div>
  );
}
