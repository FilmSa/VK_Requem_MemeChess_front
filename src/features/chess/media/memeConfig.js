import { withAssetBase } from "../../../shared/lib/assets.js";
import {
  MEME_ASSET_VERSION,
  MEME_CATALOG_BY_CATEGORY,
} from "./generated/memeCatalog.js";

export { MEME_ASSET_VERSION };

export const MEME_CATEGORIES = Object.freeze({
  FORK_PIN: "FORKPIN",
  IMPORTANT_CAPTURE: "VZYATIEVAZHNOIFIGYRI",
  CHECK: "SHAH",
  SACRIFICE: "ZHERTVA",
  DEVELOPMENT: "RAZVITIEFIGURI",
});

const CATEGORY_DEFINITIONS = Object.freeze({
  [MEME_CATEGORIES.FORK_PIN]: {
    id: "fork-pin",
    name: "Fork, pin, or attack",
    duration: 6000,
  },
  [MEME_CATEGORIES.IMPORTANT_CAPTURE]: {
    id: "important-capture",
    name: "Important capture",
    duration: 6000,
  },
  [MEME_CATEGORIES.CHECK]: {
    id: "check",
    name: "Check",
    duration: 6000,
  },
  [MEME_CATEGORIES.SACRIFICE]: {
    id: "sacrifice",
    name: "Sacrifice",
    duration: 6000,
  },
  [MEME_CATEGORIES.DEVELOPMENT]: {
    id: "development",
    name: "Development",
    duration: 6000,
  },
});

function buildCategoryMemes(categoryKey, definition) {
  const entries = Array.isArray(MEME_CATALOG_BY_CATEGORY[categoryKey])
    ? MEME_CATALOG_BY_CATEGORY[categoryKey]
    : [];

  return entries
    .map((entry, index) => {
      const mediaType = String(entry?.mediaType || "").trim().toLowerCase();
      const asset = String(entry?.asset || "").trim();
      const id = String(entry?.id || "").trim();
      const repeatKey = String(entry?.repeatKey || id).trim();

      if (!id || !asset || (mediaType !== "video" && mediaType !== "image")) {
        return null;
      }

      const resolvedAsset = withAssetBase(asset);

      return {
        id,
        name: `${definition.name} meme ${index + 1}`,
        category: categoryKey,
        repeatKey,
        asset: resolvedAsset,
        sound: mediaType === "video" ? resolvedAsset : null,
        volume: mediaType === "video" ? 0.5 : 0,
        duration: definition.duration,
        mediaType,
      };
    })
    .filter(Boolean);
}

export const MEME_CATEGORY_CONFIG = Object.freeze(
  Object.fromEntries(
    Object.entries(CATEGORY_DEFINITIONS).map(([categoryKey, definition]) => [
      categoryKey,
      Object.freeze({
        ...definition,
        key: categoryKey,
        memes: Object.freeze(buildCategoryMemes(categoryKey, definition)),
      }),
    ])
  )
);

export const ALL_MEME_EFFECTS = Object.freeze(
  Object.values(MEME_CATEGORY_CONFIG).flatMap((categoryConfig) => categoryConfig.memes)
);

export const ALL_MEME_ASSET_URLS = Object.freeze(
  [...new Set(ALL_MEME_EFFECTS.flatMap((meme) => [meme.asset, meme.sound]).filter(Boolean))]
);

export const MEME_BY_ID = Object.freeze(
  Object.fromEntries(ALL_MEME_EFFECTS.map((meme) => [meme.id, meme]))
);

export function getMemeCategoryConfig(categoryKey) {
  return MEME_CATEGORY_CONFIG[String(categoryKey || "").trim().toUpperCase()] || null;
}

export function getMemeById(memeId) {
  return MEME_BY_ID[String(memeId || "").trim()] || null;
}
