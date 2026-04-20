import {
  DEFAULT_EMOJI_QUICK_ACCESS_IDS,
  EMOJI_PREVIEW_ITEMS,
  MAX_EMOJI_QUICK_ACCESS_ITEMS,
} from "../constants/emojiPreviewMedia.js";
import { withAssetBase } from "./assets.js";

const emojiQuickAccessStorageKeyPrefix =
  "meme-chess.main-menu.emoji-quick-access";

function isEmojiCard(cardId) {
  return typeof cardId === "string" && cardId.startsWith("emoji-");
}

function getEmojiQuickAccessStorageKey(userId) {
  if (!userId) {
    return "";
  }

  return `${emojiQuickAccessStorageKeyPrefix}:${userId}`;
}

export function readStoredEmojiQuickAccess(userId) {
  const storageKey = getEmojiQuickAccessStorageKey(userId);

  if (!storageKey) {
    return DEFAULT_EMOJI_QUICK_ACCESS_IDS;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return DEFAULT_EMOJI_QUICK_ACCESS_IDS;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return DEFAULT_EMOJI_QUICK_ACCESS_IDS;
    }

    const normalizedIds = parsedValue
      .filter((value) => isEmojiCard(value))
      .slice(0, MAX_EMOJI_QUICK_ACCESS_ITEMS);

    return normalizedIds.length
      ? normalizedIds
      : DEFAULT_EMOJI_QUICK_ACCESS_IDS;
  } catch {
    return DEFAULT_EMOJI_QUICK_ACCESS_IDS;
  }
}

export function persistEmojiQuickAccess(userId, quickAccessIds) {
  const storageKey = getEmojiQuickAccessStorageKey(userId);
  if (!storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(quickAccessIds));
  } catch {
    // Ignore storage access issues and keep the selection in memory only.
  }
}

export function updateEmojiQuickAccessIds(currentIds, selectedId) {
  if (!isEmojiCard(selectedId)) {
    return currentIds;
  }

  return [
    selectedId,
    ...currentIds.filter((currentId) => currentId !== selectedId),
  ].slice(0, MAX_EMOJI_QUICK_ACCESS_ITEMS);
}

export function resolveEmojiQuickAccessItems(quickAccessIds) {
  const itemsById = new Map(EMOJI_PREVIEW_ITEMS.map((item) => [item.id, item]));

  return quickAccessIds.map((id) => itemsById.get(id)).filter(Boolean);
}

export function resolveEmojiReactionById(itemId) {
  const item = EMOJI_PREVIEW_ITEMS.find((emojiItem) => emojiItem.id === itemId);

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    videoSrc: item.videoSrc || "",
    imageSrc: item.imageSrc || withAssetBase("/images/default-emoji.png"),
  };
}
