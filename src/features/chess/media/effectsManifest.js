export const BOARD_EFFECTS = {
  "1": {
    id: "1",
    name: "Default Move",
    asset: "/effects/scelet.mp4",
    sound: "/sounds/skeleton.mp3",
    volume: 0.5,
    duration: 6000,
    mediaType: "video",
  },
  "2": {
    id: "2",
    name: "Ahmed",
    asset: "/effects/ahmed.gif",
    sound: "/sounds/ahmad-mohsen.mp3",
    volume: 0.5,
    duration: 4000,
    mediaType: "image",
  },
  "3": {
    id: "3",
    name: "No Brain",
    asset: "/effects/nobrain.mp4",
    sound: "/effects/nobrain.mp4",
    volume: 0.5,
    duration: 4600,
    mediaType: "video",
  },
  "4": {
    id: "4",
    name: "Speed",
    asset: "/effects/ishowspeed.mp4",
    sound: "/effects/ishowspeed.mp3",
    volume: 0.1,
    duration: 6000,
    mediaType: "video",
  },
  "5": {
    id: "5",
    name: "Cat",
    asset: "/effects/cat.mp4",
    sound: "/effects/cat.mp4",
    volume: 0.1,
    duration: 4000,
    mediaType: "video",
  },
};

export function getBoardEffectConfig(effectId) {
  return BOARD_EFFECTS[String(effectId)] ?? null;
}
