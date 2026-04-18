import Logo from "../molecules/Logo.jsx";

export default function AuthCard({ title, children }) {
  return (
    <section
      className="relative w-full max-w-[416px] rounded-tl-[34px] rounded-br-[34px] border p-[20px] backdrop-blur-[2px]"
      style={{
        borderColor: "var(--auth-card-border)",
        background: "var(--auth-card-background)",
        boxShadow: "var(--auth-card-shadow)",
      }}
    >
      <div className="flex justify-center">
        <Logo />
      </div>

      <h1
        className="mt-5 text-center text-[28px] font-semibold tracking-[-0.02em] sm:text-[30px]"
        style={{ color: "var(--auth-title-color)" }}
      >
        {title}
      </h1>

      <div className="mt-[10px]">{children}</div>
    </section>
  );
}
