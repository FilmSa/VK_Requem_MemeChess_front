import { useMemo, useState } from "react";
import {
  CARD_SETS,
  DEFAULT_CARD_IDS,
  MODE_OPTIONS,
} from "../config/menuConfig.js";

export function useMainMenuPanelState() {
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

  const cards = useMemo(() => CARD_SETS[activeTab] || [], [activeTab]);

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
    cards,
    selectTab,
    toggleCustomizeSection,
    toggleCustomizeExpanded,
    setActiveCardId,
    setSelectedMode,
    setIsModeOpen,
    setMemeMode,
    setDepositFrom,
    setDepositTo,
  };
}
