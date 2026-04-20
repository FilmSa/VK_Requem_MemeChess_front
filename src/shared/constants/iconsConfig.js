import { withAssetBase } from "../lib/assets.js";

export const ICONS = {
  game: withAssetBase("/icons/gameIcon.svg"),
  surrender: withAssetBase("/icons/surrender.svg"),
  draw: withAssetBase("/icons/draw.svg"),
  cup: withAssetBase("/icons/cup.svg"),
  sword: withAssetBase("/images/toyota-yaris.gif"),
  rock: withAssetBase("/images/skeleton-mad-skeleton.gif"),
  cart: withAssetBase("/icons/cart.svg"),
  crown: withAssetBase("/icons/crown.svg"),
};

/**
 * Метаданные иконок для UI.
 */
export const ICON_METADATA = {
  game: {
    name: "Партия",
    path: ICONS.game,
    alt: "Иконка партии",
  },
  surrender: {
    name: "Сдаться",
    path: ICONS.surrender,
    alt: "Иконка сдачи",
  },
  draw: {
    name: "Ничья",
    path: ICONS.draw,
    alt: "Иконка ничьей",
  },
  cup: {
    name: "Кубок",
    path: ICONS.cup,
    alt: "Иконка кубка",
  },
  sword: {
    name: "Меч",
    path: ICONS.sword,
    alt: "Иконка меча",
  },
  rock: {
    name: "Камень",
    path: ICONS.rock,
    alt: "Иконка камня",
  },
  cart: {
    name: "Корзина",
    path: ICONS.cart,
    alt: "Иконка корзины",
  },
  crown: {
    name: "Корона",
    path: ICONS.crown,
    alt: "Иконка короны",
  },
};

export function getIcon(key, style = {}) {
  const icon = ICON_METADATA[key];
  if (!icon) {
    console.warn(`Иконка не найдена: ${key}`);
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
