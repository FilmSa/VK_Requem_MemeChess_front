import classicIcon from "../../../../icons/classic.svg";
import rapidIcon from "../../../../icons/Rapid.svg";
import blitzIcon from "../../../../icons/Blitz.svg";
import bulletIcon from "../../../../icons/Bullet.svg";
import startGameIcon from "../../../../icons/startgame.svg";
import friendGameIcon from "../../../../icons/friendgame.svg";
import topTabIcon from "../../../../icons/sword.svg";
import customizeTabIcon from "../../../../icons/bak.svg";
import defaultPiecePreviewImage from "/images/image.jpg?url";
import imperiumPreviewImage from "/images/imperium.png?url";
import RomePreviewImage from "/images/Rome.png?url";
import LotrPreviewImage from "/images/Lotr.png?url";
import HaloPreviewImage from "/images/Halo.png?url";
import {
  DEFAULT_EMOJI_QUICK_ACCESS_IDS,
  EMOJI_PREVIEW_ITEMS,
} from "../../../shared/constants/emojiPreviewMedia.js";
import { DEFAULT_BOARD_SKIN_ID } from "../../../shared/lib/boardSkin.js";
import { DEFAULT_PIECE_SKIN_ID } from "../../../shared/lib/pieceSkin.js";

const emojiItems = EMOJI_PREVIEW_ITEMS.map((item) => ({
  ...item,
  time: "",
  background: "#0B0F2B",
  cornerStyle: "diagonal",
}));

const boardItems = [
  {
    id: DEFAULT_BOARD_SKIN_ID,
    title: "\u0421\u0435\u0440\u043e-\u0433\u043e\u043b\u0443\u0431\u0430\u044f \u0434\u043e\u0441\u043a\u0430",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#E8EDF9",
    darkSquare: "#B7C0D8",
  },
  {
    id: "board-skin-burgundy",
    title: "\u0411\u043e\u0440\u0434\u043e\u0432\u043e-\u0431\u0435\u0436\u0435\u0432\u0430\u044f \u0434\u043e\u0441\u043a\u0430",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#D9C2A0",
    darkSquare: "#6B1F32",
  },
  {
    id: "board-skin-mono",
    title: "\u0427\u0435\u0440\u043d\u043e-\u0431\u0435\u043b\u0430\u044f \u0434\u043e\u0441\u043a\u0430",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#F4F4F4",
    darkSquare: "#1A1A1A",
  },
  {
    id: "board-skin-rome",
    title: "\u0427\u0435\u0440\u043d\u043e-\u0431\u0435\u043b\u0430\u044f \u0434\u043e\u0441\u043a\u0430",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#e9d7bc",
        darkSquare: "#E5BA57",
  },
  {
    id: "board-skin-halo",
    title: "\u0427\u0435\u0440\u043d\u043e-\u0431\u0435\u043b\u0430\u044f \u0434\u043e\u0441\u043a\u0430",
    previewType: "board",
    previewShape: "square",
    lightSquare: "#5ad2f0",
    darkSquare: "#2d394b",
  },
];

const pieceSkinItems = [
  {
    id: DEFAULT_PIECE_SKIN_ID,
    title: "\u041a\u043b\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0444\u0438\u0433\u0443\u0440\u044b",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: defaultPiecePreviewImage,
  },
  {
    id: "piece-skin-imperium",
    title: "Imperium",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: imperiumPreviewImage,
  },
  {
    id: "piece-skin-ROME",
    title: "ROME",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: RomePreviewImage,
  },
  {
    id: "piece-skin-Halo",
    title: "Halo",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: HaloPreviewImage,
  },
  {
    id: "piece-skin-Lotr",
    title: "Lotr",
    previewShape: "wide",
    previewContentFit: "fill",
    imageSrc: LotrPreviewImage,
  },
];

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
  customize: [...emojiItems, ...boardItems, ...pieceSkinItems],
};

export const PIECE_SKIN_ITEM_IDS = new Set(pieceSkinItems.map((item) => item.id));
export const BOARD_SKIN_ITEM_IDS = new Set(boardItems.map((item) => item.id));

export const CUSTOMIZE_SECTIONS = [
  {
    id: "emoji",
    title: "\u042d\u043c\u043e\u0434\u0437\u0438:",
    quickAccessTitle: "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u0434\u043e\u0441\u0442\u0443\u043f:",
    ownedTitle: "\u0423 \u043c\u0435\u043d\u044f \u0435\u0441\u0442\u044c:",
    quickAccessIds: DEFAULT_EMOJI_QUICK_ACCESS_IDS,
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
    ownedIds: pieceSkinItems.map((item) => item.id),
    collapsedCount: 6,
  },
];

export const MODE_OPTIONS = [
  "\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430",
  "\u0424\u0438\u0448\u0435\u0440",
  "\u042d\u0432\u043e\u043b\u044e\u0446\u0438\u044f",
];

export function resolveMatchmakingGameMode(label) {
  switch (label) {
    case "\u0424\u0438\u0448\u0435\u0440":
      return "fischer";
    case "\u042d\u0432\u043e\u043b\u044e\u0446\u0438\u044f":
      return "evolution";
    default:
      return "classic";
  }
}

export const BOT_DIFFICULTY_OPTIONS = [
  {
    id: "easy",
    label: "\u041b\u0435\u0433\u043a\u0438\u0439",
    description: "\u041d\u0435\u0431\u043e\u043b\u044c\u0448\u0430\u044f \u0433\u043b\u0443\u0431\u0438\u043d\u0430 \u0440\u0430\u0441\u0447\u0435\u0442\u0430",
  },
  {
    id: "medium",
    label: "\u0421\u0440\u0435\u0434\u043d\u0438\u0439",
    description: "\u0411\u0430\u043b\u0430\u043d\u0441 \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438 \u0438 \u0441\u0438\u043b\u044b",
  },
  {
    id: "hard",
    label: "\u0421\u043b\u043e\u0436\u043d\u044b\u0439",
    description: "\u041c\u0430\u043a\u0441\u0438\u043c\u0443\u043c \u0433\u043b\u0443\u0431\u0438\u043d\u044b \u0438\u0437 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445",
  },
];

export const MENU_FIELD_LABELS = {
  mode: "\u0420\u0435\u0436\u0438\u043c:",
  memeMode: "\u041c\u0435\u043c-\u044d\u0444\u0444\u0435\u043a\u0442\u044b:",
  deposit: "\u0414\u0435\u043f\u043e\u0437\u0438\u0442:",
  depositFrom: "\u041e\u0442",
  depositTo: "\u0414\u043e",
};

export const MENU_ACTIONS = {
  startGameIcon,
  friendGameIcon,
  startGameLabel: "\u041d\u0430\u0447\u0430\u0442\u044c \u043f\u0430\u0440\u0442\u0438\u044e",
  searchingLabel: "\u0418\u0449\u0435\u043c \u0441\u043e\u043f\u0435\u0440\u043d\u0438\u043a\u0430...",
  friendGameLabel: "\u0421\u044b\u0433\u0440\u0430\u0442\u044c \u0441 \u0434\u0440\u0443\u0433\u043e\u043c",
  leaveSearchLabel: "\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u043f\u043e\u0438\u0441\u043a\u0430",
  creatingInviteLabel: "\u0421\u043e\u0437\u0434\u0430\u0435\u043c \u0441\u0441\u044b\u043b\u043a\u0443...",
};

export const DEFAULT_CARD_IDS = {
  new: "rapid",
  customize: emojiItems[0].id,
};
