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

const ANALYZER_TAG_TO_MEME_TAGS = {
  attack: ["ATTACK"],
  blunder: ["DANGER"],
  castling: ["SMART"],
  castling_attack: ["SMART", "ATTACK"],
  castling_check: ["SMART", "CHECK"],
  check: ["CHECK"],
  checkmate: ["CHECK", "DANGER"],
  conversion: ["SMART"],
  double_check: ["CHECK", "DANGER"],
  forced_mate: ["DANGER", "CHECK"],
  fork: ["SMART", "ATTACK"],
  hanging_piece: ["ATTACK", "DANGER"],
  inaccuracy: ["DANGER"],
  mate_threat: ["DANGER"],
  mistake: ["DANGER"],
  missed_opportunity: ["DANGER"],
  opening: ["SMART"],
  opening_caro_kann_defense: ["SMART"],
  opening_french_defense: ["SMART"],
  opening_italian_game: ["SMART"],
  opening_kings_indian_defense: ["SMART"],
  opening_open_game: ["SMART"],
  opening_queens_gambit: ["SMART"],
  opening_ruy_lopez: ["SMART"],
  opening_sicilian_defense: ["SMART"],
  perpetual_check: ["CHECK", "DANGER"],
  pin_to_king: ["SMART", "ATTACK"],
  relative_pin: ["SMART"],
  win_material: ["ATTACK", "SMART"],
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

export function mapAnalyzerTagsToMemeTags(tags = [], quality = "") {
  const candidateTags = [];

  tags.forEach((tag) => {
    const normalizedTag = String(tag || "").trim().toLowerCase();
    const mappedTags = ANALYZER_TAG_TO_MEME_TAGS[normalizedTag];

    if (Array.isArray(mappedTags)) {
      candidateTags.push(...mappedTags);
    }
  });

  const normalizedQuality = String(quality || "").trim().toLowerCase();

  if (["blunder", "mistake", "inaccuracy"].includes(normalizedQuality)) {
    candidateTags.push("DANGER");
  }

  if (normalizedQuality === "best" || normalizedQuality === "excellent") {
    candidateTags.push("SMART");
  }

  return [...new Set(candidateTags)];
}
