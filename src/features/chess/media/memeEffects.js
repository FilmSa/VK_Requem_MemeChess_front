import { getMemeById, getMemeCategoryConfig } from "./memeConfig.js";

const GLOBAL_RECENT_REPEAT_WINDOW = 6;

function shuffleItems(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [
      nextItems[swapIndex],
      nextItems[index],
    ];
  }

  return nextItems;
}

function createDeck(categoryConfig, lastMemeId = "") {
  const shuffledMemes = shuffleItems(categoryConfig?.memes || []);

  if (shuffledMemes.length > 1 && shuffledMemes[0]?.id === lastMemeId) {
    const swapIndex = shuffledMemes.findIndex((meme) => meme.id !== lastMemeId);
    if (swapIndex > 0) {
      [shuffledMemes[0], shuffledMemes[swapIndex]] = [
        shuffledMemes[swapIndex],
        shuffledMemes[0],
      ];
    }
  }

  return shuffledMemes;
}

export function createMemeRotationState() {
  return {
    decksByCategory: new Map(),
    lastMemeIdByCategory: new Map(),
    lastGlobalMemeId: "",
    recentRepeatKeys: [],
  };
}

function pickDeckIndex(deck, rotationState) {
  const recentRepeatKeys = Array.isArray(rotationState?.recentRepeatKeys)
    ? rotationState.recentRepeatKeys
    : [];
  const lastGlobalMemeId = String(rotationState?.lastGlobalMemeId || "").trim();
  const preferredIndex = deck.findIndex(
    (meme) =>
      meme?.id !== lastGlobalMemeId &&
      !recentRepeatKeys.includes(String(meme?.repeatKey || ""))
  );

  if (preferredIndex >= 0) {
    return preferredIndex;
  }

  const nonImmediateRepeatIndex = deck.findIndex(
    (meme) => meme?.id !== lastGlobalMemeId
  );

  return nonImmediateRepeatIndex >= 0 ? nonImmediateRepeatIndex : 0;
}

export function pickNextMemeEffect(categoryKey, rotationState) {
  const categoryConfig = getMemeCategoryConfig(categoryKey);

  if (!categoryConfig || !rotationState) {
    return null;
  }

  const normalizedCategoryKey = categoryConfig.key;
  let deck = rotationState.decksByCategory.get(normalizedCategoryKey);

  if (!Array.isArray(deck) || deck.length === 0) {
    deck = createDeck(
      categoryConfig,
      rotationState.lastMemeIdByCategory.get(normalizedCategoryKey) || ""
    );
  }

  const nextMemeIndex = pickDeckIndex(deck, rotationState);
  const [nextMeme] =
    nextMemeIndex >= 0 ? deck.splice(nextMemeIndex, 1) : [null];
  rotationState.decksByCategory.set(normalizedCategoryKey, deck);

  if (nextMeme?.id) {
    rotationState.lastMemeIdByCategory.set(normalizedCategoryKey, nextMeme.id);
    rotationState.lastGlobalMemeId = nextMeme.id;
  }

  if (nextMeme?.repeatKey) {
    rotationState.recentRepeatKeys = [
      ...rotationState.recentRepeatKeys.filter(
        (repeatKey) => repeatKey !== nextMeme.repeatKey
      ),
      nextMeme.repeatKey,
    ].slice(-GLOBAL_RECENT_REPEAT_WINDOW);
  }

  return nextMeme;
}

function extractMemeId(entry) {
  return String(entry?.memeId || entry?.meme_id || entry?.id || "").trim();
}

function stableHash(value) {
  let hash = 2166136261;
  const input = String(value || "");

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getMemeEffectById(memeId) {
  return getMemeById(memeId);
}

export function pickDeterministicMemeEffect(
  categoryKey,
  { gameId = "", moveKey = "", moveNumber = 0, previousEntries = [] } = {}
) {
  const categoryConfig = getMemeCategoryConfig(categoryKey);
  const availableMemes = Array.isArray(categoryConfig?.memes)
    ? categoryConfig.memes
    : [];

  if (!availableMemes.length) {
    return null;
  }

  const previousItems = Array.isArray(previousEntries) ? previousEntries : [];
  const usageById = new Map();
  previousItems.forEach((entry) => {
    const memeId = extractMemeId(entry);
    if (!memeId) {
      return;
    }
    usageById.set(memeId, (usageById.get(memeId) || 0) + 1);
  });
  const lastMemeId = [...previousItems]
    .reverse()
    .map((entry) => extractMemeId(entry))
    .find(Boolean);
  const recentRepeatKeys = previousItems
    .slice(-GLOBAL_RECENT_REPEAT_WINDOW)
    .map((entry) => getMemeById(extractMemeId(entry))?.repeatKey || "")
    .filter(Boolean);

  let candidates = availableMemes.filter(
    (meme) =>
      meme?.id !== lastMemeId &&
      !recentRepeatKeys.includes(String(meme?.repeatKey || ""))
  );

  if (!candidates.length) {
    candidates = availableMemes.filter((meme) => meme?.id !== lastMemeId);
  }

  if (!candidates.length) {
    candidates = availableMemes;
  }

  if (candidates.length > 1) {
    const minUsageCount = Math.min(
      ...candidates.map((meme) => usageById.get(String(meme?.id || "")) || 0)
    );
    candidates = candidates.filter(
      (meme) => (usageById.get(String(meme?.id || "")) || 0) === minUsageCount
    );
  }

  const seed = `${String(gameId || "").trim()}|${String(moveKey || "").trim()}|${Number(moveNumber) || 0}|${categoryConfig.key}`;
  return candidates[stableHash(seed) % candidates.length] || candidates[0] || null;
}
