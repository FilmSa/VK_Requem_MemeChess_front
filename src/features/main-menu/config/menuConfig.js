import classicIcon from "../../../../icons/classic.svg";
import rapidIcon from "../../../../icons/Rapid.svg";
import blitzIcon from "../../../../icons/Blitz.svg";
import bulletIcon from "../../../../icons/Bullet.svg";
import startGameIcon from "../../../../icons/startgame.svg";
import friendGameIcon from "../../../../icons/friendgame.svg";
import topTabIcon from "../../../../icons/sword.svg";
import customizeTabIcon from "../../../../icons/bak.svg";
import { createEmojiPreviewItems } from "../../../shared/constants/emojiPreviewMedia.js";

const boardImage = "/images/Board.png";

function createItems(prefix, count, factory) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    time: "",
    background: "#0B0F2B",
    ...factory(index),
  }));
}

const emojiItems = createEmojiPreviewItems(15).map((item) => ({
  ...item,
  time: "",
  background: "#0B0F2B",
  cornerStyle: "diagonal",
}));

const boardItems = createItems("board", 15, (index) => ({
  title: `\u0414\u043e\u0441\u043a\u0430 ${index + 1}`,
  imageSrc: boardImage,
}));

const pieceIcons = ["/pieces/wQ.png", "/pieces/wB.png", "/pieces/bK.svg"];
const pieceTitles = [
  "\u0424\u0435\u0440\u0437\u044c",
  "\u0421\u043b\u043e\u043d",
  "\u041a\u043e\u0440\u043e\u043b\u044c",
];

const pieceItems = createItems("piece", 15, (index) => ({
  title: `${pieceTitles[index % pieceTitles.length]} ${index + 1}`,
  icon: pieceIcons[index % pieceIcons.length],
}));

export const MENU_TABS = [
  {
    id: "new",
    label: "\u041d\u043e\u0432\u0430\u044f \u043f\u0430\u0440\u0442\u0438\u044f",
    icon: topTabIcon,
  },
  {
    id: "customize",
    label: "\u041a\u0430\u0441\u0442\u043e\u043c\u0438\u0437\u0430\u0446\u0438\u044f",
    icon: customizeTabIcon,
  },
];

export const CARD_SETS = {
  new: [
    {
      id: "classic",
      title: "Classic",
      time: "30+0",
      icon: classicIcon,
      background: "linear-gradient(121.87deg, #b700ff 0%, #6e0099 100%)",
    },
    {
      id: "rapid",
      title: "Rapid",
      time: "15+0",
      icon: rapidIcon,
      background: "linear-gradient(121.87deg, #ff00c8 0%, #990078 100%)",
    },
    {
      id: "blitz",
      title: "Blitz",
      time: "3+2",
      icon: blitzIcon,
      background: "linear-gradient(121.87deg, #16ceef 0%, #1f9fb5 100%)",
    },
    {
      id: "bullet",
      title: "Bullet",
      time: "1+0",
      icon: bulletIcon,
      background:
        "linear-gradient(120.45deg, rgba(255,36,39,0.75) 0.4%, rgba(177,25,27,0.75) 76.72%, rgba(153,21,24,0.75) 100%)",
    },
  ],
  customize: [...emojiItems, ...boardItems, ...pieceItems],
};

export const CUSTOMIZE_SECTIONS = [
  {
    id: "emoji",
    title: "\u042d\u043c\u043e\u0434\u0437\u0438:",
    quickAccessTitle: "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u0434\u043e\u0441\u0442\u0443\u043f:",
    ownedTitle: "\u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c:",
    quickAccessIds: emojiItems.slice(0, 3).map((item) => item.id),
    ownedIds: emojiItems.map((item) => item.id),
    collapsedCount: 6,
  },
  {
    id: "boards",
    title: "\u0414\u043e\u0441\u043a\u0430:",
    quickAccessTitle: "",
    ownedTitle: "\u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c:",
    quickAccessIds: [],
    ownedIds: boardItems.map((item) => item.id),
    collapsedCount: 6,
  },
  {
    id: "pieces",
    title: "\u0424\u0438\u0433\u0443\u0440\u044b:",
    quickAccessTitle: "",
    ownedTitle: "\u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c:",
    quickAccessIds: [],
    ownedIds: pieceItems.map((item) => item.id),
    collapsedCount: 6,
  },
];

export const MODE_OPTIONS = [
  "\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430",
  "\u0428\u0430\u0445\u043c\u0430\u0442\u044b 960",
  "\u0426\u0430\u0440\u044c \u0433\u043e\u0440\u044b",
];

export const MENU_FIELD_LABELS = {
  mode: "\u0420\u0435\u0436\u0438\u043c:",
  memeMode: "\u041c\u0435\u043c-\u0440\u0435\u0436\u0438\u043c:",
  deposit: "\u0414\u0435\u043f\u043e\u0437\u0438\u0442:",
  depositFrom: "\u041e\u0442",
  depositTo: "\u0414\u043e",
};

export const MENU_ACTIONS = {
  startGameIcon,
  friendGameIcon,
  startGameLabel: "\u041d\u0430\u0447\u0430\u0442\u044c \u043f\u0430\u0440\u0442\u0438\u044e",
  friendGameLabel: "\u0421\u044b\u0433\u0440\u0430\u0442\u044c \u0441 \u0434\u0440\u0443\u0433\u043e\u043c",
  creatingInviteLabel: "\u0421\u043e\u0437\u0434\u0430\u0435\u043c \u0441\u0441\u044b\u043b\u043a\u0443...",
};

export const DEFAULT_CARD_IDS = {
  new: "rapid",
  customize: emojiItems[0].id,
};
