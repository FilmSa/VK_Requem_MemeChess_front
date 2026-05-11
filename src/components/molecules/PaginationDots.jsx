export default function PaginationDots({
  total,
  currentIndex,
  className = "",
}) {
  if (!Number.isFinite(total) || total <= 1) {
    return null;
  }

  return (
    <div className={`flex gap-[10px] ${className}`}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className="h-[15px] w-[36px] rounded-[3px]"
          style={{
            background:
              index === currentIndex
                ? "var(--shop-dot-active)"
                : "var(--shop-dot-inactive)",
          }}
        />
      ))}
    </div>
  );
}
