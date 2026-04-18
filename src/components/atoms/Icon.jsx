import { getIcon } from "../../shared/constants/iconsConfig";


export default function Icon({ 
  iconKey, 
  src, 
  alt = "", 
  className = "", 
  style = {},
  width,
  height,
}) {
  let iconSrc = src;
  let iconAlt = alt;

  if (iconKey) {
    const iconData = getIcon(iconKey);
    if (iconData) {
      iconSrc = iconData.src;
      iconAlt = iconData.alt;
    }
  }

  const finalStyle = {
    ...style,
    ...(width && { width }),
    ...(height && { height }),
  };

  return (
    <img 
      src={iconSrc} 
      alt={iconAlt} 
      className={className}
      style={finalStyle}
    />
  );
}
