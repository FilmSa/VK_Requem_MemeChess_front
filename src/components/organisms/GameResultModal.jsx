import { DEFAULT_AVATAR } from "../../features/chess/lib/boardConfig.js";

const FRAME_WIDTH = 622;
const FRAME_HEIGHT = 518;
const MODAL_WIDTH_FROM_BOARD_RATIO = 0.83;
const MODAL_OVERLAY_PADDING = 18;
const PLAYER_LEFT = 24;
const PLAYER_TOP = 182;
const PLAYER_WIDTH = 188;
const CENTER_WIDTH = 92;
const CENTER_LEFT = Math.round((FRAME_WIDTH - CENTER_WIDTH) / 2);
const RIGHT_PLAYER_LEFT = FRAME_WIDTH - PLAYER_LEFT - PLAYER_WIDTH;
const BUTTON_ROW_LEFT = PLAYER_LEFT;
const BUTTON_ROW_BOTTOM = 21;
const BUTTON_GAP = 14;

const OUTCOME_STYLES = {
  win: {
    title: "#a9bcff",
    subtitle: "#ffffff",
    icon: "/icons/sword.svg",
    iconWidth: 78,
    iconHeight: 92,
    primaryButton: "linear-gradient(180deg, #34d4f3 0%, #2a9fcf 100%)",
    panelBorder: "rgba(166, 186, 255, 0.18)",
    solidBackground:
      "linear-gradient(180deg, rgba(85, 166, 255, 0.38) 0%, rgba(85, 166, 255, 0.12) 22%, rgba(32, 58, 146, 0.14) 38%, rgba(15, 19, 67, 0) 58%), linear-gradient(180deg, #3d4f93 0%, #24124f 34%, #161447 68%, #0f1343 100%)",
  },
  loss: {
    title: "#ff9ea7",
    subtitle: "#ffffff",
    icon: "/icons/cher.svg",
    iconWidth: 100,
    iconHeight: 100,
    primaryButton: "linear-gradient(180deg, #e93445 0%, #a01c24 100%)",
    panelBorder: "rgba(255, 158, 167, 0.18)",
    solidBackground: "linear-gradient(180deg, #4e0e32 0%, #121445 100%)",
  },
  draw: {
    title: "#fff0a4",
    subtitle: "#ffffff",
    icon: "/icons/Shield.svg",
    iconWidth: 78,
    iconHeight: 92,
    primaryButton: "linear-gradient(180deg, #e9c700 0%, #c7a400 100%)",
    panelBorder: "rgba(255, 240, 164, 0.18)",
    solidBackground: "linear-gradient(180deg, #2b2d1a 0%, #121445 100%)",
  },
};

function getPlayerName(profile, fallbackLabel) {
  return String(profile?.name || profile?.username || fallbackLabel || "").trim() || "Player";
}

function getModalScale(boardSize) {
  const numericBoardSize = Number(boardSize);

  if (!Number.isFinite(numericBoardSize) || numericBoardSize <= 0) {
    return 1;
  }

  const safeBoardSize = Math.max(numericBoardSize - MODAL_OVERLAY_PADDING * 2, 0);
  const scaleFromBoardWidth =
    (numericBoardSize * MODAL_WIDTH_FROM_BOARD_RATIO) / FRAME_WIDTH;
  const scaleFromAvailableWidth = safeBoardSize / FRAME_WIDTH;
  const scaleFromAvailableHeight = safeBoardSize / FRAME_HEIGHT;

  return Math.max(
    Math.min(scaleFromBoardWidth, scaleFromAvailableWidth, scaleFromAvailableHeight),
    0.1
  );
}

function PlayerBlock({
  profile,
  fallbackLabel,
  showCrown = false,
}) {
  const playerName = getPlayerName(profile, fallbackLabel);
  const avatarSrc = String(profile?.avatar_url || DEFAULT_AVATAR).trim();
  const avatarAlt = `Аватар игрока ${playerName}`;

  return (
    <div style={{ width: PLAYER_WIDTH }}>
      <div style={{ position: "relative", width: PLAYER_WIDTH }}>
        {showCrown ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: -34,
              zIndex: 2,
              width: 48,
              height: 48,
              transform: "translateX(-50%)",
              backgroundColor: "#ffd400",
              WebkitMaskImage: "url('/icons/crown.svg')",
              maskImage: "url('/icons/crown.svg')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              filter: "drop-shadow(0 6px 18px rgba(255, 212, 0, 0.35))",
            }}
          />
        ) : null}

        <div
          style={{
            width: PLAYER_WIDTH,
            height: PLAYER_WIDTH,
            overflow: "hidden",
            borderRadius: 30,
          }}
        >
          <img
            src={avatarSrc}
            alt={avatarAlt}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 500,
          textAlign: "center",
          color: "#ffffff",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {playerName}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  background,
  shadow,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: 48,
        padding: 10,
        border: 0,
        borderRadius: 18,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        background,
        boxShadow: shadow,
        color: "#ffffff",
        fontSize: 16,
        lineHeight: 1,
        fontWeight: 500,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function GameResultModal({
  isOpen,
  outcome = "draw",
  title = "Партия завершена",
  subtitle = "",
  reasonLabel = "",
  score = "",
  currentPlayer = null,
  opponentPlayer = null,
  boardSize = null,
  primaryActionLabel = "На главную",
  onPrimaryAction,
  secondaryActionLabel = "Посмотреть доску",
  onSecondaryAction,
}) {
  if (!isOpen) {
    return null;
  }

  const palette = OUTCOME_STYLES[outcome] || OUTCOME_STYLES.draw;
  const centerText = reasonLabel || subtitle || score || "";
  const currentPlayerWon = outcome === "win";
  const opponentPlayerWon = outcome === "loss";
  const scale = getModalScale(boardSize);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2147483647,
        padding: 18,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="game-result-modal__launch"
          style={{
            position: "relative",
            width: FRAME_WIDTH * scale,
            height: FRAME_HEIGHT * scale,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              style={{
                position: "relative",
                width: FRAME_WIDTH,
                height: FRAME_HEIGHT,
                overflow: "hidden",
                borderRadius: 28,
                border: `1px solid ${palette.panelBorder}`,
                background: palette.solidBackground,
                boxShadow: "0 24px 70px rgba(0, 0, 0, 0.42)",
                color: "#ffffff",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 34,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: palette.title,
                    fontSize: 60,
                    lineHeight: 0.94,
                    fontWeight: 500,
                  }}
                >
                  {title}
                </div>
                {centerText ? (
                  <div
                    style={{
                      marginTop: 12,
                      color: palette.subtitle,
                      fontSize: 30,
                      lineHeight: 1,
                      fontWeight: 500,
                    }}
                  >
                    {centerText}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: PLAYER_LEFT,
                  top: PLAYER_TOP,
                }}
              >
                <PlayerBlock
                  profile={currentPlayer}
                  fallbackLabel="Player1"
                  showCrown={currentPlayerWon}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  left: CENTER_LEFT,
                  top: PLAYER_TOP + 2,
                  width: CENTER_WIDTH,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <img
                  src={palette.icon}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: Math.round(palette.iconWidth * 0.84),
                    height: Math.round(palette.iconHeight * 0.84),
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    marginTop: 14,
                    color: "#f2ece7",
                    fontSize: 68,
                    lineHeight: 1,
                    fontWeight: 400,
                  }}
                >
                  VS
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: RIGHT_PLAYER_LEFT,
                  top: PLAYER_TOP,
                }}
              >
                <PlayerBlock
                  profile={opponentPlayer}
                  fallbackLabel="Player2"
                  showCrown={opponentPlayerWon}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  left: BUTTON_ROW_LEFT,
                  bottom: BUTTON_ROW_BOTTOM,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: BUTTON_GAP,
                }}
              >
                <ActionButton
                  background="linear-gradient(180deg, #6e52ff 0%, #4931bf 100%)"
                  shadow="0 10px 22px rgba(35, 21, 91, 0.38)"
                  onClick={onPrimaryAction}
                >
                  {primaryActionLabel}
                </ActionButton>
                <ActionButton
                  background={palette.primaryButton}
                  shadow="0 10px 24px rgba(0, 0, 0, 0.26)"
                  onClick={onSecondaryAction}
                >
                  {secondaryActionLabel}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
