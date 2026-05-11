import classicIcon from "../../../../icons/classic.svg";
import rapidIcon from "../../../../icons/Rapid.svg";
import blitzIcon from "../../../../icons/Blitz.svg";
import bulletIcon from "../../../../icons/Bullet.svg";
import startGameIcon from "../../../../icons/startgame.svg";
import friendGameIcon from "../../../../icons/friendgame.svg";
import topTabIcon from "../../../../icons/sword.svg";
import customizeTabIcon from "../../../../icons/bak.svg";
import {
  DEFAULT_EMOJI_QUICK_ACCESS_IDS,
  EMOJI_PREVIEW_ITEMS,
} from "../../../shared/constants/emojiPreviewMedia.js";
import {
  BOARD_CATALOG_ITEMS,
  DEFAULT_BOARD_SKIN_SLUG,
  DEFAULT_PIECE_SKIN_SLUG,
  PIECE_CATALOG_ITEMS,
} from "../../../shared/constants/customizationCatalog.js";

export const TIME_CONTROL_UNLIMITED = "unlimited";

export const TIME_CONTROL_PRESETS = {
  classic: {
    id: "classic",
    label: "30+9",
    title: "Classic",
  },
  rapid: {
    id: "rapid",
    label: "15+9",
    title: "Rapid",
  },
  blitz: {
    id: "blitz",
    label: "3+2",
    title: "Blitz",
  },
  bullet: {
    id: "bullet",
    label: "1+5",
    title: "Bullet",
  },
};

const emojiItems = EMOJI_PREVIEW_ITEMS.map((item) => ({
  ...item,
  time: "",
}));

const boardItems = BOARD_CATALOG_ITEMS;
const pieceSkinItems = PIECE_CATALOG_ITEMS;

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
      title: TIME_CONTROL_PRESETS.classic.title,
      time: TIME_CONTROL_PRESETS.classic.label,
      icon: classicIcon,
      background: "linear-gradient(121.87deg, #b700ff 0%, #6e0099 100%)",
    },
    {
      id: "rapid",
      title: TIME_CONTROL_PRESETS.rapid.title,
      time: TIME_CONTROL_PRESETS.rapid.label,
      icon: rapidIcon,
      background: "linear-gradient(121.87deg, #ff00c8 0%, #990078 100%)",
    },
    {
      id: "blitz",
      title: TIME_CONTROL_PRESETS.blitz.title,
      time: TIME_CONTROL_PRESETS.blitz.label,
      icon: blitzIcon,
      background: "linear-gradient(121.87deg, #16ceef 0%, #1f9fb5 100%)",
    },
    {
      id: "bullet",
      title: TIME_CONTROL_PRESETS.bullet.title,
      time: TIME_CONTROL_PRESETS.bullet.label,
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

export function resolveSelectedTimeControl(cardId) {
  return TIME_CONTROL_PRESETS[cardId] || TIME_CONTROL_PRESETS[DEFAULT_CARD_IDS.new];
}

export function resolveTimeControlLabel(timeControlId) {
  if (
    !timeControlId ||
    String(timeControlId).trim().toLowerCase() === TIME_CONTROL_UNLIMITED
  ) {
    return "Бесконечное";
  }

  return TIME_CONTROL_PRESETS[timeControlId]?.label || "Бесконечное";
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

