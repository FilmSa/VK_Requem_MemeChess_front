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
    name: "vibecoding",
    asset: "/effects/nobrain.mp4",
    sound: "/effects/nobrain.mp4",
    volume: 0.5,
    duration: 4600,
    type: "overlay",
  },
  "4": {
    id: "4",
    name: "showspeed",
    asset: "/effects/ishowspeed.mp4",
    sound: "/effects/ishowspeed.mp4",
    volume: 0.1,
    duration: 6000,
    type: "overlay",
  },
   "5": {
    id: "5",
    name: "cat",
    asset: "/effects/cat.mp4",
    sound: "/effects/cat.mp4",
    volume: 0.1,
    duration: 4000,
    type: "overlay",
  },
};

export function getEffectConfig(effectId) {
  return EFFECTS[String(effectId)] ?? null;
}