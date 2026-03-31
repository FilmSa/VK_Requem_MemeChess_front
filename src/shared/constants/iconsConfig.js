export const ICONS = {
  // Game UI
  game: "/icons/gameIcon.svg",
  surrender: "/icons/surrender.svg",
  draw: "/icons/draw.svg",
  
  // Rewards/Currency
  cup: "/icons/cup.svg",
  
  // Combat
  sword: "/images/toyota-yaris.gif",
  rock: "/images/skeleton-mad-skeleton.gif",
  
  // Other
  cart: "/icons/cart.svg",
  crown: "/icons/crown.svg",
};

/**
 * Метаинформация об иконках для UI
 */
export const ICON_METADATA = {
  // Game actions
  game: {
    name: "Партия",
    path: ICONS.game,
    alt: "Game icon",
  },
  surrender: {
    name: "Сдаться",
    path: ICONS.surrender,
    alt: "Surrender icon",
  },
  draw: {
    name: "Ничья",
    path: ICONS.draw,
    alt: "Draw/Peace icon",
  },
  
  // Currency/Rewards
  cup: {
    name: "Чашка",
    path: ICONS.cup,
    alt: "Cup reward icon",
  },
  
  // Combat emojis equivalent
  sword: {
    name: "Меч",
    path: ICONS.sword,
    alt: "Sword icon",
  },
  rock: {
    name: "Камень",
    path: ICONS.rock,
    alt: "Rock icon",
  },
  
  // Other
  cart: {
    name: "Корзина",
    path: ICONS.cart,
    alt: "Cart icon",
  },
  crown: {
    name: "Корона",
    path: ICONS.crown,
    alt: "Crown icon",
  },
};


export function getIcon(key, style = {}) {
  const icon = ICON_METADATA[key];
  if (!icon) {
    console.warn(`Icon not found: ${key}`);
    return null;
  }

  return {
    src: icon.path,
    alt: icon.alt,
    name: icon.name,
    style,
  };
}

export const iconPaths = {
  game: ICONS.game,
  surrender: ICONS.surrender,
  draw: ICONS.draw,
  cup: ICONS.cup,
  sword: ICONS.sword,
  rock: ICONS.rock,
  cart: ICONS.cart,
  crown: ICONS.crown,
};
