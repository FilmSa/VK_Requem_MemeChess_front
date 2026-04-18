export default function SectionTitle({ children, className = "" }) {
  return (
    <div
      className={`text-[20px] font-medium leading-none text-white ${className}`}
      style={{ fontFamily: '"Unbounded", sans-serif' }}
    >
      {children}
    </div>
  );
}
