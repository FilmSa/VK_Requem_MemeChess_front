import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InviteLobbyModal from "../../../components/organisms/InviteLobbyModal.jsx";
import MainMenuPanelView from "../../../components/organisms/MainMenuPanel.jsx";
import { useAuth } from "../../auth/useAuth.js";
import {
  BOT_DIFFICULTY_OPTIONS,
  CUSTOMIZE_SECTIONS,
  MENU_ACTIONS,
  MENU_FIELD_LABELS,
  MENU_TABS,
  MODE_OPTIONS,
  resolveMatchmakingGameMode,
  resolveSelectedTimeControl,
  resolveTimeControlLabel,
  TIME_CONTROL_UNLIMITED,
} from "../config/menuConfig.js";
import { useMainMenuPanelState } from "../model/useMainMenuPanelState.js";
import { useInviteLobby } from "../../game/model/useInviteLobby.js";
import { useMatchmaking } from "../../game/model/useMatchmaking.js";
import { createRobotGame } from "../../game/gameApi.js";
import { savePlaySession } from "../../game/playSession.js";
import { useNotifications } from "../../notifications/useNotifications.js";

function parseStakeValue(value) {
  const parsedValue = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function buildLocalBotPlayerProfile(user) {
  if (user?.id) {
    return user;
  }

  return {
    id: "local-player",
    username: "Игрок",
    avatar_url: "",
  };
}

export default function MainMenuPanel({ style }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationFallbackTimeoutRef = useRef(null);
  const inviteGameModeRef = useRef("classic");
  const inviteTimeControlRef = useRef(TIME_CONTROL_UNLIMITED);
  const {
    token,
    user,
    isAuthenticated,
    isInitializing,
    refreshCurrency,
  } = useAuth();
  const { showNotification, dismissNotification } = useNotifications();
  const [panelError, setPanelError] = useState("");
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [playModalPanel, setPlayModalPanel] = useState("friend");
  const [robotDifficulty, setRobotDifficulty] = useState(
    BOT_DIFFICULTY_OPTIONS[0]?.id || "easy"
  );
  const [isClientBotEnabled, setIsClientBotEnabled] = useState(false);
  const [robotError, setRobotError] = useState("");
  const [isCreatingRobot, setIsCreatingRobot] = useState(false);
  const [isInviteTimeControlEnabled, setIsInviteTimeControlEnabled] =
    useState(true);

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

  const selectedGameMode = resolveMatchmakingGameMode(selectedMode);
  const selectedTimeControl = resolveSelectedTimeControl(activeCardId);
  const canUseClientBot = selectedGameMode === "classic";
  const clientBotHint = canUseClientBot
    ? "Партия и расчеты бота пойдут локально и будут доступны офлайн после первой загрузки приложения."
    : 'Клиентский бот сейчас доступен только для режима "Классика", чтобы не ломать правила других режимов.';

  const notifyUnsupportedOfflineBotMode = useCallback(() => {
    const message =
      selectedGameMode === "evolution"
        ? 'Офлайн-бот для режима "Эволюция" пока недоступен.'
        : selectedGameMode === "fischer"
        ? 'Офлайн-бот для режима "Фишер" пока недоступен.'
        : 'Этот режим пока нельзя запустить с офлайн-ботом.';

    setRobotError(message);
    showNotification({
      id: "offline-bot-mode-error",
      message,
      tone: "error",
      duration: 4500,
    });
  }, [selectedGameMode, showNotification]);

  const handleAuthRequired = () =>
    navigate("/login", { state: { from: location } });

  const inviteLobby = useInviteLobby({
    token,
    userId: user?.id,
    isAuthenticated,
    isInitializing,
    onAuthRequired: handleAuthRequired,
    onGameReady: (gameId) => {
      const match = {
        gameMode: inviteGameModeRef.current || selectedGameMode,
        timeControlId: inviteTimeControlRef.current || TIME_CONTROL_UNLIMITED,
      };

      savePlaySession({
        gameId,
        match,
        sessionToken: token,
        player: user,
      });

      setIsPlayModalOpen(false);
      navigateToPlay(gameId, {
        match,
        sessionToken: token,
        player: user,
      });
    },
  });

  useEffect(() => {
    if (inviteLobby.inviteLobby?.gameMode) {
      inviteGameModeRef.current = inviteLobby.inviteLobby.gameMode;
    }
    if (inviteLobby.inviteLobby?.timeControlId) {
      inviteTimeControlRef.current = inviteLobby.inviteLobby.timeControlId;
    }
  }, [inviteLobby.inviteLobby?.gameMode, inviteLobby.inviteLobby?.timeControlId]);

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
        timeControlId: result.timeControlId || selectedTimeControl.id,
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
      gameMode: selectedGameMode,
      timeControlId: selectedTimeControl.id,
      minStake,
      maxStake,
    });
  }

  function handleOpenPlayModal() {
    setPanelError("");
    setRobotError("");
    setPlayModalPanel("friend");
    setIsInviteTimeControlEnabled(true);
    setIsPlayModalOpen(true);
  }

  function handleClosePlayModal() {
    setIsPlayModalOpen(false);
    setRobotError("");
    setIsClientBotEnabled(false);
    setIsInviteTimeControlEnabled(true);
    inviteLobby.clearInviteLobby();
  }

  function handleClientBotModeChange(nextValue) {
    if (nextValue && !canUseClientBot) {
      notifyUnsupportedOfflineBotMode();
      return;
    }

    setRobotError("");
    setIsClientBotEnabled(nextValue);
  }

  function handleCreateInvite() {
    setRobotError("");
    setPlayModalPanel("friend");
    inviteGameModeRef.current = selectedGameMode;
    inviteTimeControlRef.current = isInviteTimeControlEnabled
      ? selectedTimeControl.id
      : TIME_CONTROL_UNLIMITED;
    void inviteLobby.createInvite({
      gameMode: selectedGameMode,
      timeControlId: inviteTimeControlRef.current,
    });
  }

  async function handleCreateRobot() {
    if (isClientBotEnabled) {
      if (!canUseClientBot) {
        notifyUnsupportedOfflineBotMode();
        return;
      }

      const gameId = `local-bot-${crypto.randomUUID()}`;
      const player = buildLocalBotPlayerProfile(user);
      const match = {
        gameMode: selectedGameMode,
        timeControlId: TIME_CONTROL_UNLIMITED,
      };

      savePlaySession({
        gameId,
        match,
        player,
        localBotConfig: {
          enabled: true,
          computeMode: "client",
          gameMode: selectedGameMode,
          difficulty: robotDifficulty,
        },
      });

      setIsPlayModalOpen(false);
      navigateToPlay(gameId, {
        match,
        player,
        localBotConfig: {
          enabled: true,
          computeMode: "client",
          gameMode: selectedGameMode,
          difficulty: robotDifficulty,
        },
      });
      return;
    }

    if (isInitializing) {
      return;
    }

    if (!isAuthenticated) {
      handleAuthRequired();
      return;
    }

    setRobotError("");
    setIsCreatingRobot(true);

    try {
      const response = await createRobotGame(
        {
          gameMode: selectedGameMode,
          difficulty: robotDifficulty,
        },
        token
      );

      const match = {
        gameMode: response.gameMode,
        timeControlId: TIME_CONTROL_UNLIMITED,
      };

      savePlaySession({
        gameId: response.gameId,
        match,
        sessionToken: token,
        player: user,
      });

      setIsPlayModalOpen(false);
      navigateToPlay(response.gameId, {
        match,
        sessionToken: token,
        player: user,
      });
    } catch (error) {
      setRobotError(
        error?.message || "Не удалось создать игру с роботом."
      );
    } finally {
      setIsCreatingRobot(false);
    }
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

  useEffect(() => {
    if (canUseClientBot) {
      return;
    }

    setIsClientBotEnabled(false);
  }, [canUseClientBot]);

  const actions = {
    startLabel: matchmaking.isSearching
      ? MENU_ACTIONS.searchingLabel
      : MENU_ACTIONS.startGameLabel,
    startIcon: MENU_ACTIONS.startGameIcon,
    startDisabled:
      matchmaking.isSearching ||
      inviteLobby.isCreatingInvite ||
      isCreatingRobot ||
      isInitializing,
    onStart: handleStartMatchmaking,
    friendLabel: matchmaking.isSearching
      ? MENU_ACTIONS.leaveSearchLabel
      : MENU_ACTIONS.friendGameLabel,
    friendIcon: MENU_ACTIONS.friendGameIcon,
    friendDisabled: isInitializing || isCreatingRobot,
    onFriendPlay: matchmaking.isSearching
      ? () => {
          setPanelError("");
          void matchmaking.cancelSearch();
        }
      : handleOpenPlayModal,
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
        isOpen={isPlayModalOpen}
        activePanel={playModalPanel}
        onPanelChange={setPlayModalPanel}
        selectedGameModeLabel={selectedMode}
        selectedTimeControlLabel={resolveTimeControlLabel(selectedTimeControl.id)}
        isTimeControlEnabled={isInviteTimeControlEnabled}
        onTimeControlEnabledChange={setIsInviteTimeControlEnabled}
        inviteLobby={inviteLobby.inviteLobby}
        inviteError={inviteLobby.inviteError}
        isCreatingInvite={inviteLobby.isCreatingInvite}
        onCreateInvite={handleCreateInvite}
        onCopy={inviteLobby.copyInvite}
        onClose={handleClosePlayModal}
        onEnterLobby={inviteLobby.enterLobby}
        robotDifficulty={robotDifficulty}
        robotDifficultyOptions={BOT_DIFFICULTY_OPTIONS}
        onRobotDifficultyChange={setRobotDifficulty}
        isClientBotEnabled={isClientBotEnabled}
        onClientBotModeChange={handleClientBotModeChange}
        clientBotModeDisabled={!canUseClientBot}
        clientBotModeHint={clientBotHint}
        onClientBotModeDisabledClick={notifyUnsupportedOfflineBotMode}
        onCreateRobot={handleCreateRobot}
        isCreatingRobot={isCreatingRobot}
        robotError={robotError}
      />
    </>
  );
}
