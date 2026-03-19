export default function Text({ children, className = "", style = {} }) {
  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}