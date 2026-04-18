export default function AuthButton({ children, icon, disabled, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      className="flex h-[72px] w-full items-center justify-between rounded-tl-[20px] rounded-br-[20px] border-none px-5 text-left shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(255,255,255,0.06)] transition-all"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled
          ? "color-mix(in srgb, var(--color-accent) 55%, transparent)"
          : "var(--color-accent)",
      }}
    >
      <span className="text-[28px] font-semibold text-white sm:text-[30px]">
        {children}
      </span>
      <img src={icon} alt="" className="h-[44px] w-[44px] object-contain" />
    </button>
  );
}
