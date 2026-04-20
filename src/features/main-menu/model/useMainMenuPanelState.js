import { useEffect, useMemo, useState } from "react";
import {
  CARD_SETS,
  DEFAULT_CARD_IDS,
  MODE_OPTIONS,
} from "../config/menuConfig.js";
import {
  persistEmojiQuickAccess,
  readStoredEmojiQuickAccess,
  updateEmojiQuickAccessIds,
} from "../../../shared/lib/emojiQuickAccess.js";

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

  const cards = useMemo(() => CARD_SETS[activeTab] || [], [activeTab]);

  useEffect(() => {
    setSelectedEmojiQuickAccessIds(readStoredEmojiQuickAccess(userId));
  }, [userId]);

  useEffect(() => {
    persistEmojiQuickAccess(userId, selectedEmojiQuickAccessIds);
  }, [selectedEmojiQuickAccessIds, userId]);

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
