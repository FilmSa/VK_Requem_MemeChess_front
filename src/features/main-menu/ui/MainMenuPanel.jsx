import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InviteLobbyModal from "../../../components/organisms/InviteLobbyModal.jsx";
import MainMenuPanelView from "../../../components/organisms/MainMenuPanel.jsx";
import { useAuth } from "../../auth/useAuth.js";
import {
  CUSTOMIZE_SECTIONS,
  MENU_ACTIONS,
  MENU_FIELD_LABELS,
  MENU_TABS,
  MODE_OPTIONS,
  resolveMatchmakingGameMode,
} from "../config/menuConfig.js";
import { useMainMenuPanelState } from "../model/useMainMenuPanelState.js";
import { useInviteLobby } from "../../game/model/useInviteLobby.js";
import { useMatchmaking } from "../../game/model/useMatchmaking.js";
import { savePlaySession } from "../../game/playSession.js";
import { useNotifications } from "../../notifications/useNotifications.js";

function parseStakeValue(value) {
  const parsedValue = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default function MainMenuPanel({ style }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationFallbackTimeoutRef = useRef(null);
  const {
    token,
    user,
    isAuthenticated,
    isInitializing,
    refreshCurrency,
  } = useAuth();
  const { showNotification, dismissNotification } = useNotifications();
  const [panelError, setPanelError] = useState("");

  const clearNavigationFallback = useCallback(() => {
    if (navigationFallbackTimeoutRef.current) {
      window.clearTimeout(navigationFallbackTimeoutRef.current);
      navigationFallbackTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearNavigationFallback, [clearNavigationFallback]);

  const navigateToPlay = useCallback(
    (gameId, state = undefined) => {
      if (!gameId) {
        return;
      }

      clearNavigationFallback();

      const encodedGameId = encodeURIComponent(gameId);
      const playPath = `/play?game=${encodedGameId}`;
      navigate(playPath, state ? { state } : undefined);

      if (typeof window === "undefined") {
        return;
      }

      const usesHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";
      const fallbackHref = usesHashRouter
        ? `${window.location.origin}${window.location.pathname}${window.location.search}#${playPath}`
        : new URL(playPath, window.location.href).toString();

      navigationFallbackTimeoutRef.current = window.setTimeout(() => {
        const isAlreadyOnTarget = usesHashRouter
          ? window.location.hash === `#${playPath}`
          : window.location.pathname === new URL(fallbackHref).pathname &&
            window.location.search === new URL(fallbackHref).search;

        if (!isAlreadyOnTarget) {
          window.location.assign(fallbackHref);
        }
      }, 160);
    },
    [clearNavigationFallback, navigate]
  );

  const {
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
  } = useMainMenuPanelState({ userId: user?.id });

  const handleAuthRequired = () =>
    navigate("/login", { state: { from: location } });

  const inviteLobby = useInviteLobby({
    token,
    userId: user?.id,
    isAuthenticated,
    isInitializing,
    onAuthRequired: handleAuthRequired,
    onGameReady: (gameId) => {
      savePlaySession({
        gameId,
        sessionToken: token,
        player: user,
      });

      navigateToPlay(gameId, {
        sessionToken: token,
        player: user,
      });
    },
  });

  const matchmaking = useMatchmaking({
    token,
    isAuthenticated,
    isInitializing,
    onAuthRequired: handleAuthRequired,
    onCurrencyChanged: refreshCurrency,
    onMatched: (result) => {
      const match = {
        agreedStake: result.agreedStake,
        gameMode: result.gameMode,
        gameCurrency: result.gameCurrency,
      };

      savePlaySession({
        gameId: result.gameId,
        match,
        sessionToken: token,
        player: user,
      });

      navigateToPlay(result.gameId, {
        match,
        sessionToken: token,
        player: user,
      });
    },
  });

  function handleModeSelect(option) {
    setPanelError("");
    setSelectedMode(option);
    setIsModeOpen(false);

    if (option === MODE_OPTIONS[1]) {
      setMemeMode(true);
      return;
    }

    if (option === MODE_OPTIONS[0]) {
      setMemeMode(false);
    }
  }

  function handleDepositFromChange(value) {
    setPanelError("");
    setDepositFrom(value);
  }

  function handleDepositToChange(value) {
    setPanelError("");
    setDepositTo(value);
  }

  function handleTabSelect(tabId) {
    if (matchmaking.isSearching && tabId !== activeTab) {
      return;
    }

    setPanelError("");
    selectTab(tabId);
  }

  function handleStartMatchmaking() {
    const minStake = parseStakeValue(depositFrom);
    const maxStake = parseStakeValue(depositTo);
    setIsModeOpen(false);

    if (minStake <= 0 || maxStake <= 0) {
      setPanelError("Введите диапазон ставки числами больше нуля.");
      return;
    }

    if (maxStake < minStake) {
      setPanelError("Поле «От» должно быть меньше или равно полю «До».");
      return;
    }

    setPanelError("");
    void matchmaking.startSearch({
      gameMode: resolveMatchmakingGameMode(selectedMode),
      minStake,
      maxStake,
    });
  }

  const modeField = {
    label: MENU_FIELD_LABELS.mode,
    value: selectedMode,
    options: MODE_OPTIONS,
    isOpen: isModeOpen,
    disabled: matchmaking.isSearching,
    onToggle: () => setIsModeOpen((value) => !value),
    onSelect: handleModeSelect,
  };

  const memeField = {
    label: MENU_FIELD_LABELS.memeMode,
    checked: memeMode,
    onChange: setMemeMode,
  };

  const depositField = {
    label: MENU_FIELD_LABELS.deposit,
    fromValue: depositFrom,
    toValue: depositTo,
    fromPlaceholder: MENU_FIELD_LABELS.depositFrom,
    toPlaceholder: MENU_FIELD_LABELS.depositTo,
    disabled: matchmaking.isSearching,
    onFromChange: handleDepositFromChange,
    onToChange: handleDepositToChange,
  };

  const statusBanner = panelError
    ? {
        tone: "error",
        message: panelError,
      }
    : matchmaking.errorMessage
    ? {
        tone: "error",
        message: matchmaking.errorMessage,
      }
    : matchmaking.statusMessage
    ? {
        tone: "info",
        message: matchmaking.statusMessage,
      }
    : null;

  useEffect(() => {
    if (!statusBanner?.message) {
      dismissNotification("main-menu-status");
      return;
    }

    showNotification({
      id: "main-menu-status",
      message: statusBanner.message,
      tone: statusBanner.tone,
      persist: true,
      duration: 0,
    });
  }, [
    dismissNotification,
    showNotification,
    statusBanner?.message,
    statusBanner?.tone,
  ]);

  useEffect(() => {
    return () => {
      dismissNotification("main-menu-status");
    };
  }, [dismissNotification]);

  const actions = {
    startLabel: matchmaking.isSearching
      ? MENU_ACTIONS.searchingLabel
      : MENU_ACTIONS.startGameLabel,
    startIcon: MENU_ACTIONS.startGameIcon,
    startDisabled:
      matchmaking.isSearching || inviteLobby.isCreatingInvite || isInitializing,
    onStart: handleStartMatchmaking,
    friendLabel: matchmaking.isSearching
      ? MENU_ACTIONS.leaveSearchLabel
      : inviteLobby.isCreatingInvite
      ? MENU_ACTIONS.creatingInviteLabel
      : MENU_ACTIONS.friendGameLabel,
    friendIcon: MENU_ACTIONS.friendGameIcon,
    friendDisabled: isInitializing || (!matchmaking.isSearching && inviteLobby.isCreatingInvite),
    onFriendPlay: matchmaking.isSearching
      ? () => {
          setPanelError("");
          void matchmaking.cancelSearch();
        }
      : inviteLobby.createInvite,
  };

  const customizeSections = CUSTOMIZE_SECTIONS.map((section) => {
    const itemsById = new Map(cards.map((item) => [item.id, item]));
    const quickAccessIds =
      section.id === "emoji"
        ? selectedEmojiQuickAccessIds
        : section.quickAccessIds;

    return {
      ...section,
      quickAccessItems: quickAccessIds
        .map((id) => itemsById.get(id))
        .filter(Boolean),
      ownedItems: section.ownedIds.map((id) => itemsById.get(id)).filter(Boolean),
      selectedItemIds:
        section.id === "emoji"
          ? selectedEmojiQuickAccessIds
          : section.id === "boards"
          ? [selectedBoardSkin]
          : section.id === "pieces"
          ? [selectedPieceSkin]
          : [],
      isOpen: Boolean(openCustomizeSections[section.id]),
      isExpanded: Boolean(expandedCustomizeSections[section.id]),
    };
  });

  return (
    <>
      <MainMenuPanelView
        style={style}
        tabs={MENU_TABS}
        activeTabId={activeTab}
        onTabSelect={handleTabSelect}
        cards={cards}
        activeCardId={activeCardId}
        onCardSelect={selectCard}
        modeField={modeField}
        memeField={memeField}
        depositField={depositField}
        customizeSections={customizeSections}
        onToggleCustomizeSection={toggleCustomizeSection}
        onToggleCustomizeExpanded={toggleCustomizeExpanded}
        actions={actions}
      />

      <InviteLobbyModal
        isOpen={inviteLobby.isInviteModalOpen}
        inviteLobby={inviteLobby.inviteLobby}
        onCopy={inviteLobby.copyInvite}
        onClose={inviteLobby.hideInviteModal}
        onEnterLobby={inviteLobby.enterLobby}
      />
    </>
  );
}
