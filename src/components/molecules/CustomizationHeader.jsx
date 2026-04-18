import IconButton from "../atoms/IconButton.jsx";
import SectionTitle from "../atoms/SectionTitle.jsx";

export default function CustomizationHeader({ title, isOpen, onToggle }) {
  return (
    <div className="flex h-[60px] w-full items-center justify-between">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex h-full flex-1 items-center border-none bg-transparent px-0 py-0 text-left"
      >
        <SectionTitle>{title}</SectionTitle>
      </button>
      <IconButton isExpanded={isOpen} onClick={onToggle} />
    </div>
  );
}
