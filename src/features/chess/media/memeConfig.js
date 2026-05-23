import { withAssetBase } from "../../../shared/lib/assets.js";
import { MEME_MANIFEST } from "./generated/memeManifest.js";

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg"]);
const IMAGE_EXTENSIONS = new Set([".gif", ".png", ".jpg", ".jpeg", ".svg"]);

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

function getFileExtension(assetPath) {
  const lastDotIndex = assetPath.lastIndexOf(".");
  return lastDotIndex >= 0 ? assetPath.slice(lastDotIndex).toLowerCase() : "";
}

function getMediaType(assetPath) {
  const extension = getFileExtension(assetPath);

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  return "";
}

function getBaseName(assetPath) {
  const normalizedPath = String(assetPath || "").replace(/\\/g, "/");
  const fileName = normalizedPath.split("/").pop() || "";
  const extension = getFileExtension(fileName);

  if (!extension) {
    return fileName;
  }

  return fileName.slice(0, Math.max(0, fileName.length - extension.length));
}

function createSlug(value, fallback) {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function buildCategoryMemes(categoryKey, definition) {
  const assets = Array.isArray(MEME_MANIFEST[categoryKey])
    ? MEME_MANIFEST[categoryKey]
    : [];
  const usedSlugs = new Map();

  return assets
    .map((assetPath, index) => {
      const mediaType = getMediaType(assetPath);
      if (!mediaType) {
        return null;
      }

      const baseSlug = createSlug(getBaseName(assetPath), `asset-${index + 1}`);
      const duplicateCount = usedSlugs.get(baseSlug) || 0;
      usedSlugs.set(baseSlug, duplicateCount + 1);
      const slug =
        duplicateCount > 0 ? `${baseSlug}-${duplicateCount + 1}` : baseSlug;
      const id = `meme-${definition.id}-${slug}`;
      const resolvedAsset = withAssetBase(assetPath);

      return {
        id,
        name: `${definition.name} meme ${index + 1}`,
        category: categoryKey,
        repeatKey: baseSlug,
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

export const MEME_BY_ID = Object.freeze(
  Object.fromEntries(
    Object.values(MEME_CATEGORY_CONFIG)
      .flatMap((categoryConfig) => categoryConfig.memes)
      .map((meme) => [meme.id, meme])
  )
);

export function getMemeCategoryConfig(categoryKey) {
  return MEME_CATEGORY_CONFIG[String(categoryKey || "").trim().toUpperCase()] || null;
}

export function getMemeById(memeId) {
  return MEME_BY_ID[String(memeId || "").trim()] || null;
}
