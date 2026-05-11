import {
  DEFAULT_EMOJI_QUICK_ACCESS_IDS,
  EMOJI_PREVIEW_ITEMS,
  MAX_EMOJI_QUICK_ACCESS_ITEMS,
} from "../constants/emojiPreviewMedia.js";
import { normalizeEmoteSlug } from "../constants/customizationCatalog.js";
import { withAssetBase } from "./assets.js";

const emojiQuickAccessStorageKeyPrefix =
  "meme-chess.main-menu.emoji-quick-access";
const emojiQuickAccessChangeEventName =
  "meme-chess.main-menu.emoji-quick-access-change";

function isEmojiCard(cardId) {
  return Boolean(normalizeEmoteSlug(cardId));
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
      .map((value) => normalizeEmoteSlug(value))
      .filter(Boolean)
      .slice(0, MAX_EMOJI_QUICK_ACCESS_ITEMS);

    return normalizedIds;
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
    const normalizedIds = quickAccessIds
      .map((value) => normalizeEmoteSlug(value))
      .filter(Boolean)
      .slice(0, MAX_EMOJI_QUICK_ACCESS_ITEMS);
    window.localStorage.setItem(storageKey, JSON.stringify(normalizedIds));
    dispatchEmojiQuickAccessChange(userId, normalizedIds);
  } catch {
    // Ignore storage access issues and keep the selection in memory only.
  }
}

export function updateEmojiQuickAccessIds(currentIds, selectedId) {
  const normalizedSelectedId = normalizeEmoteSlug(selectedId);
  if (!normalizedSelectedId) {
    return currentIds;
  }

  return [
    normalizedSelectedId,
    ...currentIds
      .map((currentId) => normalizeEmoteSlug(currentId))
      .filter(Boolean)
      .filter((currentId) => currentId !== normalizedSelectedId),
  ].slice(0, MAX_EMOJI_QUICK_ACCESS_ITEMS);
}

export function resolveEmojiQuickAccessItems(quickAccessIds) {
  const itemsById = new Map(EMOJI_PREVIEW_ITEMS.map((item) => [item.id, item]));

  return quickAccessIds
    .map((id) => normalizeEmoteSlug(id))
    .filter(Boolean)
    .map((id) => itemsById.get(id))
    .filter(Boolean);
}

export function resolveEmojiReactionById(itemId) {
  const normalizedItemId = normalizeEmoteSlug(itemId);
  const item = EMOJI_PREVIEW_ITEMS.find(
    (emojiItem) => emojiItem.id === normalizedItemId
  );

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

function dispatchEmojiQuickAccessChange(userId, quickAccessIds) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(emojiQuickAccessChangeEventName, {
      detail: {
        userId: String(userId || "").trim(),
        quickAccessIds,
      },
    })
  );
}

export function subscribeEmojiQuickAccessChanges(userId, callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const normalizedUserId = String(userId || "").trim();
  const listener = (event) => {
    if (!event?.detail) {
      return;
    }

    if (String(event.detail.userId || "").trim() !== normalizedUserId) {
      return;
    }

    callback(event.detail.quickAccessIds || DEFAULT_EMOJI_QUICK_ACCESS_IDS);
  };

  window.addEventListener(emojiQuickAccessChangeEventName, listener);

  return () => {
    window.removeEventListener(emojiQuickAccessChangeEventName, listener);
  };
}
