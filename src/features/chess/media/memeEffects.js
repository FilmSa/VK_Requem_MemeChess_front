import { getMemeCategoryConfig } from "./memeConfig.js";

const GLOBAL_RECENT_REPEAT_WINDOW = 3;

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
