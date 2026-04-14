import Logo from "../molecules/Logo.jsx";

export default function AuthCard({ title, children }) {
  return (
    <section className="relative w-full max-w-[416px] rounded-tl-[34px] rounded-br-[34px] border border-white/10 bg-[#17142d]/95 p-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_4px_8px_rgba(0,0,0,0.22),0_0_0_2px_rgba(47,200,227,0.6)] backdrop-blur-[2px]">
      <div className="flex justify-center">
        <Logo />
      </div>

      <h1 className="mt-5 text-center text-[28px] font-semibold tracking-[-0.02em] text-[#a8e7ff] sm:text-[30px]">
        {title}
      </h1>

      <div className="mt-[10px]">{children}</div>
    </section>
  );
}
