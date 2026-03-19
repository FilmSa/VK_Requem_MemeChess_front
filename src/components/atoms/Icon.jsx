export default function Icon({ src, alt = "", className = "" }) {
  return <img src={src} alt={alt} className={className} />;
}