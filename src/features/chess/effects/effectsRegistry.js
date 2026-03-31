export const EFFECTS = {
  "1": {
    id: "1",
    name: "Default Move",
    asset: "/effects/scelet.mp4",
    sound: "/sounds/skeleton.mp3",
    volume: 0.5,
    duration: 6000,
    type: "overlay",
  },

  "2": {
    id: "2",
    name: "Ezh",
    asset: "/effects/ahmed.gif",
    sound: "/sounds/ahmad-mohsen.mp3",
    volume: 0.5,
    duration: 4000,
    type: "overlay",
  },

  "3": {
    id: "3",
    name: "billi",
    asset: "/effects/billi.mp4",
    duration: 1200,
    type: "overlay",
  },
};

export function getEffectConfig(effectId) {
  return EFFECTS[String(effectId)] ?? null;
}