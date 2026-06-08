import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOARD_SKIN_ITEM_IDS,
  CARD_SETS,
  DEFAULT_CARD_IDS,
  MODE_OPTIONS,
  PIECE_SKIN_ITEM_IDS,
} from "../config/menuConfig.js";
import {
  persistBoardSkin,
  readStoredBoardSkin,
  subscribeBoardSkinChanges,
} from "../../../shared/lib/boardSkin.js";
import {
  persistEmojiQuickAccess,
  readStoredEmojiQuickAccess,
  subscribeEmojiQuickAccessChanges,
  updateEmojiQuickAccessIds,
} from "../../../shared/lib/emojiQuickAccess.js";
import {
  persistPieceSkin,
  readStoredPieceSkin,
  subscribePieceSkinChanges,
} from "../../../shared/lib/pieceSkin.js";
import {
  persistMemeMode,
  readStoredMemeMode,
} from "../../../shared/lib/memeMode.js";

function normalizeStakeInput(value) {
  const digitsOnly = String(value ?? "").replace(/\D+/g, "");
  return digitsOnly.replace(/^0+(?=\d)/, "");
}

export function useMainMenuPanelState({ userId } = {}) {
  const [activeTab, setActiveTab] = useState("new");
  const [activeCardId, setActiveCardId] = useState(DEFAULT_CARD_IDS.new);
  const [selectedMode, setSelectedMode] = useState(MODE_OPTIONS[0]);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [memeMode, setMemeMode] = useState(() => readStoredMemeMode());
  const [depositFrom, setDepositFromState] = useState("");
  const [depositTo, setDepositToState] = useState("");
  const [openCustomizeSections, setOpenCustomizeSections] = useState({
    emoji: true,
    boards: true,
    pieces: true,
  });
  const [expandedCustomizeSections, setExpandedCustomizeSections] = useState({});
const [selectedBoardSkin, setSelectedBoardSkin] = useState(() =>
    readStoredBoardSkin()
  );
  const [selectedPieceSkin, setSelectedPieceSkin] = useState(() =>
    readStoredPieceSkin()
  );
  const [selectedEmojiQuickAccessIds, setSelectedEmojiQuickAccessIds] = useState(
    () => readStoredEmojiQuickAccess(userId)
  );
  const skipNextPersistRef = useRef(false);

  const cards = useMemo(() => CARD_SETS[activeTab] || CARD_SETS.new, [activeTab]);

  useEffect(() => {
    setSelectedEmojiQuickAccessIds(readStoredEmojiQuickAccess(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return () => {};
    }

    return subscribeEmojiQuickAccessChanges(userId, (nextIds) => {
      skipNextPersistRef.current = true;
      setSelectedEmojiQuickAccessIds(nextIds);
    });
  }, [userId]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    persistEmojiQuickAccess(userId, selectedEmojiQuickAccessIds);
  }, [selectedEmojiQuickAccessIds, userId]);

  useEffect(() => {
    setSelectedPieceSkin(readStoredPieceSkin());
  }, []);

  useEffect(() => {
    return subscribePieceSkinChanges((skinId) => {
      setSelectedPieceSkin(skinId);
    });
  }, []);

  useEffect(() => {
    persistPieceSkin(selectedPieceSkin);
  }, [selectedPieceSkin]);

  useEffect(() => {
    setSelectedBoardSkin(readStoredBoardSkin());
  }, []);

  useEffect(() => {
    return subscribeBoardSkinChanges((skinId) => {
      setSelectedBoardSkin(skinId);
    });
  }, []);

  useEffect(() => {
    persistBoardSkin(selectedBoardSkin);
  }, [selectedBoardSkin]);

  useEffect(() => {
    persistMemeMode(memeMode);
  }, [memeMode]);

  function selectTab(tabId) {
    setActiveTab(tabId);
    setActiveCardId(DEFAULT_CARD_IDS[tabId] || "");
    setIsModeOpen(false);
  }

  function toggleCustomizeSection(sectionId) {
    setOpenCustomizeSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function toggleCustomizeExpanded(sectionId) {
    setExpandedCustomizeSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function selectCard(cardId) {
    setActiveCardId(cardId);

    if (PIECE_SKIN_ITEM_IDS.has(cardId)) {
      setSelectedPieceSkin(cardId);
    }

    if (BOARD_SKIN_ITEM_IDS.has(cardId)) {
      setSelectedBoardSkin(cardId);
    }

    setSelectedEmojiQuickAccessIds((currentIds) => {
      return updateEmojiQuickAccessIds(currentIds, cardId);
    });
  }

  function setDepositFrom(value) {
    const nextFrom = normalizeStakeInput(value);

    setDepositFromState(nextFrom);
    setDepositToState((currentTo) => {
      if (!nextFrom || !currentTo) {
        return currentTo;
      }

      return Number(currentTo) < Number(nextFrom) ? nextFrom : currentTo;
    });
  }

  function setDepositTo(value) {
    const nextTo = normalizeStakeInput(value);

    setDepositToState(nextTo);
    setDepositFromState((currentFrom) => {
      if (!nextTo || !currentFrom) {
        return currentFrom;
      }

      return Number(currentFrom) > Number(nextTo) ? nextTo : currentFrom;
    });
  }

  return {
    activeTab,
    activeCardId,
    selectedMode,
    isModeOpen,
    memeMode,
    depositFrom,
    depositTo,
    openCustomizeSections,
    expandedCustomizeSections,
    selectedEmojiQuickAccessIds,
    selectedPieceSkin,
    selectedBoardSkin,
    cards,
    selectTab,
    selectCard,
    toggleCustomizeSection,
    toggleCustomizeExpanded,
    setSelectedMode,
    setIsModeOpen,
    setMemeMode,
    setDepositFrom,
    setDepositTo,
  };
}
