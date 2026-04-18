const EMOJI_VIDEO_SOURCES = [
  "/effects/arthas.mp4",
  "/effects/billi.mp4",
  "/effects/Canie.mp4",
  "/effects/cat.mp4",
  "/effects/dog.mp4",
  "/effects/ishowspeed.mp4",
  "/effects/Ni.mp4",
  "/effects/nobrain.mp4",
  "/effects/scelet.mp4",
];

const EMOJI_PREVIEW_SOURCES = [
  "/effects/ahmed.gif",
  "/effects/default-capture.gif",
  "/effects/bishop-capture.gif",
  "/effects/king-capture.gif",
  "/effects/knight-capture.gif",
  "/effects/queen-capture.gif",
  "/effects/rook-capture.gif",
];
export function createEmojiPreviewItems(count, prefix = "emoji") {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `Эмодзи ${index + 1}`,
    imageSrc: EMOJI_PREVIEW_SOURCES[index % EMOJI_PREVIEW_SOURCES.length],
    videoSrc: EMOJI_VIDEO_SOURCES[index % EMOJI_VIDEO_SOURCES.length],
    previewTime: 0.6,
  }));
}

export const PLAY_EMOJI_PREVIEW_ITEMS = createEmojiPreviewItems(3, "play-emoji");
