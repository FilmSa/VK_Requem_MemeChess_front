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
} from "../config/menuConfig.js";
import { useMainMenuPanelState } from "../model/useMainMenuPanelState.js";
import { useInviteLobby } from "../../game/model/useInviteLobby.js";

export default function MainMenuPanel({ style }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, isAuthenticated, isInitializing } = useAuth();

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

  const inviteLobby = useInviteLobby({
    token,
    userId: user?.id,
    isAuthenticated,
    isInitializing,
    onAuthRequired: () => navigate("/login", { state: { from: location } }),
    onGameReady: (gameId) =>
      navigate(`/play?game=${encodeURIComponent(gameId)}`),
  });

  const modeField = {
    label: MENU_FIELD_LABELS.mode,
    value: selectedMode,
    options: MODE_OPTIONS,
    isOpen: isModeOpen,
    onToggle: () => setIsModeOpen((value) => !value),
    onSelect: (option) => {
      setSelectedMode(option);
      setIsModeOpen(false);
    },
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
    onFromChange: setDepositFrom,
    onToChange: setDepositTo,
  };

  const actions = {
    startLabel: MENU_ACTIONS.startGameLabel,
    startIcon: MENU_ACTIONS.startGameIcon,
    startDisabled: false,
    onStart: () => navigate("/play"),
    friendLabel: inviteLobby.isCreatingInvite
      ? MENU_ACTIONS.creatingInviteLabel
      : MENU_ACTIONS.friendGameLabel,
    friendIcon: MENU_ACTIONS.friendGameIcon,
    friendDisabled: inviteLobby.isCreatingInvite || isInitializing,
    onFriendPlay: inviteLobby.createInvite,
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
        onTabSelect={selectTab}
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
        inviteError={inviteLobby.inviteError}
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
