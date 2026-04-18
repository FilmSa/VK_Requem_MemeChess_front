export default function Badge({ children, className = "", style = {} }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
