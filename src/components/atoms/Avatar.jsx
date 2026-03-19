export default function Avatar({ src, alt = "avatar", className = "" }) {
  return <img src={src} alt={alt} className={className} />;
}