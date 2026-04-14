function UserGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 12C13.933 12 15.5 10.433 15.5 8.5C15.5 6.567 13.933 5 12 5C10.067 5 8.5 6.567 8.5 8.5C8.5 10.433 10.067 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 18.5C6.5 15.739 8.739 13.5 11.5 13.5H12.5C15.261 13.5 17.5 15.739 17.5 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 10V8.5C8 6.291 9.791 4.5 12 4.5C14.209 4.5 16 6.291 16 8.5V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="6.5"
        y="10"
        width="11"
        height="9"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="4.5"
        y="6.5"
        width="15"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 8L12 12L17.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const iconMap = {
  user: UserGlyph,
  lock: LockGlyph,
  mail: MailGlyph,
};

export default function AuthInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  icon = "user",
}) {
  const Icon = iconMap[icon] || UserGlyph;

  return (
    <label className="block">
      <span className="mb-[10px] block text-[15px] font-medium leading-none text-[#b2b4c7]">
        {label}
      </span>

      <div className="relative">
        <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#b7bbd1]">
          <Icon />
        </span>

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-[58px] w-full rounded-[14px] border-none bg-[#0b0f2b] pl-[42px] pr-4 text-[19px] font-medium text-white outline-none transition-shadow placeholder:text-[17px] placeholder:text-[#b0b2c0] ${
            error
              ? "shadow-[inset_0_4px_4px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,95,95,0.95)]"
              : "shadow-[inset_0_4px_4px_rgba(0,0,0,0.25)] focus:shadow-[inset_0_4px_4px_rgba(0,0,0,0.25),0_0_0_1px_rgba(47,200,227,0.95),0_0_18px_rgba(47,200,227,0.22)]"
          }`}
          style={{ color: "#ffffff" }}
        />
      </div>

      {error ? <p className="mt-[10px] text-[13px] text-[#ff6b6b]">{error}</p> : null}
    </label>
  );
}
