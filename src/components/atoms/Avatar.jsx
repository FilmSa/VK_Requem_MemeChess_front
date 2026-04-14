export default function Avatar({ src, alt = "аватар", className = "" }) {
  return <img src={src} alt={alt} className={className} />;
}
