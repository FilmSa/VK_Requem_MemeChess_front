export default function LogoWord({ children }) {
  return (
    <div
      className="
        text-[40px]
        font-normal
        leading-[1]
        bg-[linear-gradient(90deg,#02d9ff_0%,#cc02bf_40.07%,#610199_90.87%)]
        bg-clip-text
        text-transparent
      "
      style={{ fontFamily: '"Tilt Warp", cursive' }}
    >
      {children}
    </div>
  );
}