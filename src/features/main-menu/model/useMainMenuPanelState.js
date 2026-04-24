import { useEffect, useMemo, useState } from "react";
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
} from "../../../shared/lib/boardSkin.js";
import {
  persistEmojiQuickAccess,
  readStoredEmojiQuickAccess,
  updateEmojiQuickAccessIds,
} from "../../../shared/lib/emojiQuickAccess.js";
import {
  persistPieceSkin,
  readStoredPieceSkin,
} from "../../../shared/lib/pieceSkin.js";

export function useMainMenuPanelState({ userId } = {}) {
  const [activeTab, setActiveTab] = useState("new");
  const [activeCardId, setActiveCardId] = useState(DEFAULT_CARD_IDS.new);
  const [selectedMode, setSelectedMode] = useState(MODE_OPTIONS[0]);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [memeMode, setMemeMode] = useState(true);
  const [depositFrom, setDepositFrom] = useState("");
  const [depositTo, setDepositTo] = useState("");
  const [openCustomizeSections, setOpenCustomizeSections] = useState({
    emoji: true,
    boards: true,
    pieces: true,
  });
  const [expandedCustomizeSections, setExpandedCustomizeSections] = useState({});
  const [selectedEmojiQuickAccessIds, setSelectedEmojiQuickAccessIds] = useState(
    () => readStoredEmojiQuickAccess(userId)
  );
  const [selectedPieceSkin, setSelectedPieceSkin] = useState(
    () => readStoredPieceSkin()
  );
  const [selectedBoardSkin, setSelectedBoardSkin] = useState(
    () => readStoredBoardSkin()
  );

  const cards = useMemo(() => CARD_SETS[activeTab] || [], [activeTab]);

  useEffect(() => {
    setSelectedEmojiQuickAccessIds(readStoredEmojiQuickAccess(userId));
  }, [userId]);

  useEffect(() => {
    persistEmojiQuickAccess(userId, selectedEmojiQuickAccessIds);
  }, [selectedEmojiQuickAccessIds, userId]);

  useEffect(() => {
    setSelectedPieceSkin(readStoredPieceSkin());
  }, []);

  useEffect(() => {
    persistPieceSkin(selectedPieceSkin);
  }, [selectedPieceSkin]);

  useEffect(() => {
    setSelectedBoardSkin(readStoredBoardSkin());
  }, []);

  useEffect(() => {
    persistBoardSkin(selectedBoardSkin);
  }, [selectedBoardSkin]);

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
