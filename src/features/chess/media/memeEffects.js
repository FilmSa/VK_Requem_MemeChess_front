import { withAssetBase } from "../../../shared/lib/assets.js";
import { MEME_MANIFEST } from "./generated/memeManifest.js";

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg"]);
const IMAGE_EXTENSIONS = new Set([".gif", ".png", ".jpg", ".jpeg", ".svg"]);
const DEFAULT_TAG = "DEFOLT";

const TAG_ALIASES = {
  ATTACK: "ATTACK",
  CHECK: "CHECK",
  DANGER: "DANGER",
  DEFAULT: DEFAULT_TAG,
  DEFOLT: DEFAULT_TAG,
  SMART: "SMART",
};

const TAG_DURATIONS = {
  ATTACK: 4200,
  CHECK: 5200,
  DANGER: 5600,
  SMART: 4600,
  [DEFAULT_TAG]: 3600,
};

function getFileExtension(assetPath) {
  return assetPath.slice(assetPath.lastIndexOf(".")).toLowerCase();
}

function isVideoAsset(assetPath) {
  return VIDEO_EXTENSIONS.has(getFileExtension(assetPath));
}

function isImageAsset(assetPath) {
  return IMAGE_EXTENSIONS.has(getFileExtension(assetPath));
}

function normalizeTag(tag) {
  const normalizedTag = String(tag || "").trim().toUpperCase();
  return TAG_ALIASES[normalizedTag] || "";
}

function pickRandomItem(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function resolveAvailableTags(candidateTags) {
  const seenTags = new Set();

  candidateTags.forEach((tag) => {
    const normalizedTag = normalizeTag(tag);
    if (!normalizedTag || seenTags.has(normalizedTag)) {
      return;
    }

    const assets = MEME_MANIFEST[normalizedTag];
    if (Array.isArray(assets) && assets.length > 0) {
      seenTags.add(normalizedTag);
    }
  });

  if (seenTags.size > 0) {
    return [...seenTags];
  }

  const defaultAssets = MEME_MANIFEST[DEFAULT_TAG];
  if (Array.isArray(defaultAssets) && defaultAssets.length > 0) {
    return [DEFAULT_TAG];
  }

  return [];
}

export function pickRandomMemeEffect(candidateTags = []) {
  const availableTags = resolveAvailableTags(candidateTags);
  const selectedTag = pickRandomItem(availableTags);

  if (!selectedTag) {
    return null;
  }

  const assetPath = pickRandomItem(MEME_MANIFEST[selectedTag]);
  if (!assetPath) {
    return null;
  }

  const mediaType = isVideoAsset(assetPath)
    ? "video"
    : isImageAsset(assetPath)
    ? "image"
    : "";

  if (!mediaType) {
    return null;
  }

  return {
    id: `meme:${selectedTag}:${assetPath}`,
    name: `${selectedTag} meme`,
    tag: selectedTag,
    asset: withAssetBase(assetPath),
    sound: mediaType === "video" ? withAssetBase(assetPath) : null,
    volume: mediaType === "video" ? 0.5 : 0,
    duration: TAG_DURATIONS[selectedTag] ?? TAG_DURATIONS[DEFAULT_TAG],
    mediaType,
  };
}
