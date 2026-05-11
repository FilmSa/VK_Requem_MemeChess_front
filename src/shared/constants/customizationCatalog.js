import defaultPiecePreviewImage from "/images/image.jpg?url";
import imperiumPreviewImage from "/images/imperium.png?url";
import romePreviewImage from "/images/Rome.png?url";
import lotrPreviewImage from "/images/Lotr.png?url";
import haloPreviewImage from "/images/Halo.png?url";
import { withAssetBase } from "../lib/assets.js";

export const DEFAULT_PIECE_SKIN_SLUG = "piece.classic";
export const DEFAULT_BOARD_SKIN_SLUG = "board.classic";
export const DEFAULT_EMOTE_SLUGS = [
  "emote.cat",
  "emote.dog",
  "emote.scelet",
];

const LEGACY_EMOTE_FILE_ORDER = [
  "axe",
  "cat",
  "dog",
  "ishowspeed",
  "nobrain",
  "scelet",
];

export const LEGACY_PIECE_SKIN_SLUGS = {
  "piece-skin-default": "piece.classic",
  "piece-skin-imperium": "piece.imperium",
  "piece-skin-ROME": "piece.rome",
  "piece-skin-Halo": "piece.halo",
  "piece-skin-Lotr": "piece.lotr",
};

export const LEGACY_BOARD_SKIN_SLUGS = {
  "board-skin-green": "board.classic",
  "board-skin-burgundy": "board.burgundy",
  "board-skin-mono": "board.mono",
  "board-skin-rome": "board.rome",
  "board-skin-halo": "board.halo",
};

export const EMOTE_CATALOG_ITEMS = [
  {
    id: "emote.cat",
    slug: "emote.cat",
    type: "emote",
    title: "Cat",
    videoSrc: withAssetBase("/emoji/cat.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.dog",
    slug: "emote.dog",
    type: "emote",
    title: "Dog",
    videoSrc: withAssetBase("/emoji/dog.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.scelet",
    slug: "emote.scelet",
    type: "emote",
    title: "Scelet",
    videoSrc: withAssetBase("/emoji/scelet.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.axe",
    slug: "emote.axe",
    type: "emote",
    title: "Axe",
    videoSrc: withAssetBase("/emoji/axe.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.ishowspeed",
    slug: "emote.ishowspeed",
    type: "emote",
    title: "IShowSpeed",
    videoSrc: withAssetBase("/emoji/ishowspeed.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.nobrain",
    slug: "emote.nobrain",
    type: "emote",
    title: "NoBrain",
    videoSrc: withAssetBase("/emoji/nobrain.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.brilliant",
    slug: "emote.brilliant",
    type: "emote",
    title: "Brilliant",
    videoSrc: withAssetBase("/emoji/brilliant.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.chinarock",
    slug: "emote.chinarock",
    type: "emote",
    title: "ChinaRock",
    videoSrc: withAssetBase("/emoji/chinarock.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.hello",
    slug: "emote.hello",
    type: "emote",
    title: "Hello",
    videoSrc: withAssetBase("/emoji/hello.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.nononono",
    slug: "emote.nononono",
    type: "emote",
    title: "NoNoNoNo",
    videoSrc: withAssetBase("/emoji/nononono.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.oaoaoao",
    slug: "emote.oaoaoao",
    type: "emote",
    title: "OAOAOAO",
    videoSrc: withAssetBase("/emoji/oaoaoao.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.ohno",
    slug: "emote.ohno",
    type: "emote",
    title: "OhNo",
    videoSrc: withAssetBase("/emoji/ohno.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.seletonchik",
    slug: "emote.seletonchik",
    type: "emote",
    title: "Seletonchik",
    videoSrc: withAssetBase("/emoji/seletonchik.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.sigma",
    slug: "emote.sigma",
    type: "emote",
    title: "Sigma",
    videoSrc: withAssetBase("/emoji/sigma.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
  {
    id: "emote.toyota",
    slug: "emote.toyota",
    type: "emote",
    title: "Toyota",
    videoSrc: withAssetBase("/emoji/toyota.mp4"),
    previewTime: 0.05,
    background: "#0B0F2B",
    cornerStyle: "diagonal",
  },
];

export const BOARD_CATALOG_ITEMS = [
  {
    id: "board.classic",
    slug: "board.classic",
    type: "board_skin",
    title: "Classic board",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#E8EDF9",
    darkSquare: "#B7C0D8",
  },
  {
    id: "board.burgundy",
    slug: "board.burgundy",
    type: "board_skin",
    title: "Burgundy board",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#D9C2A0",
    darkSquare: "#6B1F32",
  },
  {
    id: "board.mono",
    slug: "board.mono",
    type: "board_skin",
    title: "Mono board",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#F4F4F4",
    darkSquare: "#1A1A1A",
  },
  {
    id: "board.rome",
    slug: "board.rome",
    type: "board_skin",
    title: "Rome board",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#E9D7BC",
    darkSquare: "#E5BA57",
  },
  {
    id: "board.halo",
    slug: "board.halo",
    type: "board_skin",
    title: "Halo board",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#5AD2F0",
    darkSquare: "#2D394B",
  },
];

export const PIECE_CATALOG_ITEMS = [
  {
    id: "piece.classic",
    slug: "piece.classic",
    type: "piece_skin",
    title: "Classic pieces",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: defaultPiecePreviewImage,
    shopHeroImage: defaultPiecePreviewImage,
  },
  {
    id: "piece.imperium",
    slug: "piece.imperium",
    type: "piece_skin",
    title: "Imperium",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: imperiumPreviewImage,
    shopHeroImage: imperiumPreviewImage,
  },
  {
    id: "piece.rome",
    slug: "piece.rome",
    type: "piece_skin",
    title: "ROME",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: romePreviewImage,
    shopHeroImage: romePreviewImage,
  },
  {
    id: "piece.halo",
    slug: "piece.halo",
    type: "piece_skin",
    title: "Halo",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: haloPreviewImage,
    shopHeroImage: haloPreviewImage,
  },
  {
    id: "piece.lotr",
    slug: "piece.lotr",
    type: "piece_skin",
    title: "Lotr",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: lotrPreviewImage,
    shopHeroImage: lotrPreviewImage,
  },
];

export const CUSTOMIZATION_CATALOG_ITEMS = [
  ...EMOTE_CATALOG_ITEMS,
  ...BOARD_CATALOG_ITEMS,
  ...PIECE_CATALOG_ITEMS,
];

export const CUSTOMIZATION_CATALOG_BY_SLUG = new Map(
  CUSTOMIZATION_CATALOG_ITEMS.map((item) => [item.slug, item])
);

export function getCustomizationItem(slug) {
  return CUSTOMIZATION_CATALOG_BY_SLUG.get(normalizeCustomizationSlug(slug)) || null;
}

export function normalizePieceSkinSlug(value) {
  const normalizedValue = String(value || "").trim();
  return (
    LEGACY_PIECE_SKIN_SLUGS[normalizedValue] ||
    (normalizedValue.startsWith("piece.") &&
    CUSTOMIZATION_CATALOG_BY_SLUG.has(normalizedValue)
      ? normalizedValue
      : "")
  );
}

export function normalizeBoardSkinSlug(value) {
  const normalizedValue = String(value || "").trim();
  if (normalizedValue === "board-skin-green") {
    return DEFAULT_BOARD_SKIN_SLUG;
  }

  return (
    LEGACY_BOARD_SKIN_SLUGS[normalizedValue] ||
    (normalizedValue.startsWith("board.") &&
    CUSTOMIZATION_CATALOG_BY_SLUG.has(normalizedValue)
      ? normalizedValue
      : "")
  );
}

export function normalizeEmoteSlug(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.startsWith("emote.") &&
    CUSTOMIZATION_CATALOG_BY_SLUG.has(normalizedValue)
  ) {
    return normalizedValue;
  }

  const legacyMatch = normalizedValue.match(/^emoji-(\d+)$/i);
  if (!legacyMatch) {
    return "";
  }

  const legacyIndex = Math.max(Number.parseInt(legacyMatch[1], 10) - 1, 0);
  const fileName =
    LEGACY_EMOTE_FILE_ORDER[legacyIndex % LEGACY_EMOTE_FILE_ORDER.length];

  return fileName ? `emote.${fileName}` : "";
}

export function normalizeCustomizationSlug(value) {
  return (
    normalizePieceSkinSlug(value) ||
    normalizeBoardSkinSlug(value) ||
    normalizeEmoteSlug(value)
  );
}
