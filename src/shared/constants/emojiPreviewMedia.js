const EMOJI_FILES = [
  "axe.mp4",
  "cat.mp4",
  "dog.mp4",
  "ishowspeed.mp4",
  "nobrain.mp4",
  "scelet.mp4",
];

function formatEmojiTitle(fileName, index) {
  const baseName = fileName.replace(/\.mp4$/i, "");

  if (baseName === "ishowspeed") {
    return "IShowSpeed";
  }

  if (baseName === "scelet") {
    return "Scelet";
  }

  return baseName.charAt(0).toUpperCase() + baseName.slice(1) || `Эмодзи ${index + 1}`;
}

export function createEmojiPreviewItems(count, prefix = "emoji") {
  return Array.from({ length: count }, (_, index) => {
    const fileName = EMOJI_FILES[index % EMOJI_FILES.length];

    return {
      id: `${prefix}-${index + 1}`,
      title: formatEmojiTitle(fileName, index),
      videoSrc: `/emoji/${fileName}`,
      previewTime: 0.05,
    };
  });
}

export const EMOJI_PREVIEW_ITEMS = createEmojiPreviewItems(15);

export const MAX_EMOJI_QUICK_ACCESS_ITEMS = 3;

export const DEFAULT_EMOJI_QUICK_ACCESS_IDS = EMOJI_PREVIEW_ITEMS.slice(
  0,
  MAX_EMOJI_QUICK_ACCESS_ITEMS
).map((item) => item.id);
