import { createPortal } from "react-dom";
import SwitchBase from "../atoms/SwitchBase.jsx";

const modalButtonClassName =
  "rounded-tl-[18px] rounded-br-[18px] rounded-tr-none rounded-bl-none transition p-2";

const actionButtonClassName =
  `${modalButtonClassName} border-none text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-60`;

function formatInviteDeadline(expiresAt) {
  if (!expiresAt) {
    return "неизвестно";
  }

  const parsedDate = new Date(expiresAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "неизвестно";
  }

  return parsedDate.toLocaleString("ru-RU");
}

function renderStatusText(inviteLobby) {
  if (!inviteLobby) {
    return "Создайте ссылку и отправьте ее другу. Режим партии возьмется из главного меню автоматически.";
  }

  if (inviteLobby.expired) {
    return "Срок действия ссылки истек. Создайте новое приглашение.";
  }

  return inviteLobby.statusMessage;
}

export default function InviteLobbyModal({
  isOpen,
  activePanel = "friend",
  onPanelChange,
  selectedGameModeLabel,
  selectedTimeControlLabel = "Бесконечное",
  isTimeControlEnabled = true,
  onTimeControlEnabledChange,
  inviteLobby,
  inviteError,
  isCreatingInvite,
  onCreateInvite,
  onCopy,
  onClose,
  onEnterLobby,
  robotDifficulty,
  robotDifficultyOptions = [],
  onRobotDifficultyChange,
  isClientBotEnabled = false,
  onClientBotModeChange,
  clientBotModeDisabled = false,
  clientBotModeHint = "",
  onClientBotModeDisabledClick,
  onCreateRobot,
  isCreatingRobot,
  robotError,
}) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const friendStatusText = renderStatusText(inviteLobby);
  const friendError = inviteError || inviteLobby?.connectionError || "";

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "var(--modal-backdrop)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] rounded-tl-[18px] rounded-br-[18px] border flex flex-col gap-[0px]"
        style={{
          width: "100%",
          maxWidth: 620,
          position: "relative",
          padding: "22px",
          borderColor: "var(--modal-border)",
          background: "var(--modal-surface)",
          color: "var(--color-text)",
          boxShadow: "var(--modal-shadow)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 12,
            border: "1px solid var(--modal-border)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--color-text)",
            fontSize: 18,
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          {"\u2715"}
        </button>

        <div className="pr-[48px] flex flex-col gap-[0px]">
          <div className="text-[30px] font-semibold">Играть</div>
          <div
            className="mt-2 text-[20px] leading-6"
            style={{ color: "var(--color-text-muted)" }}
          >
            Режим:{" "}
            <span style={{ color: "var(--color-accent)" }}>
              {selectedGameModeLabel || "Классика"}
            </span>
          </div>
          <div
            className="mt-2 text-[16px] leading-6"
            style={{ color: "var(--color-text-muted)" }}
          >
            Время:{" "}
            <span style={{ color: "var(--color-accent-pink)" }}>
              {isTimeControlEnabled ? selectedTimeControlLabel : "Без лимит"}
            </span>
          </div>
        </div>

        <div className="mt-[12px] grid grid-cols-2 gap-[0px]">
          <button
            type="button"
            onClick={() => onPanelChange?.("friend")}
            className={`${modalButtonClassName} border text-left`}
            style={{
              borderColor:
                activePanel === "friend"
                  ? "var(--color-accent)"
                  : "var(--modal-chip-border)",
              background:
                activePanel === "friend"
                  ? "rgba(0, 234, 255, 0.12)"
                  : "var(--modal-chip-bg)",
              color: "var(--color-text)",
              padding: 10,
            }}
          >
            <div className="text-[18px] font-semibold">С другом</div>
            <div
              className="mt-1 text-[12px] leading-5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Через ссылку-приглашение
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPanelChange?.("robot")}
            className={`${modalButtonClassName} border text-left`}
            style={{
              borderColor:
                activePanel === "robot"
                  ? "var(--color-accent-pink)"
                  : "var(--modal-chip-border)",
              background:
                activePanel === "robot"
                  ? "rgba(255, 0, 168, 0.12)"
                  : "var(--modal-chip-bg)",
              color: "var(--color-text)",
              padding: 15,
            }}
          >
            <div className="text-[18px] font-semibold">С ботом</div>
            <div
              className="mt-1 text-[12px] leading-5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Быстрый старт против движка
            </div>
          </button>
        </div>

        {activePanel === "friend" ? (
          <div className="mt-[12px]">
            <div
              className="mb-4 rounded-tl-[18px] rounded-br-[18px] border p-4"
              style={{
                borderColor: "var(--modal-chip-border)",
                background: "var(--modal-chip-bg)",
                padding: 8,
              }}
            >
              <label className="flex cursor-pointer items-center justify-between gap-[16px]">
                <div>
                  <div className="text-[18px] font-semibold">
                    Ограничение по времени
                  </div>
                  <div
                    className="mt-1 text-[16px] leading-5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {isTimeControlEnabled
                      ? `Партия будет создана с контролем ${selectedTimeControlLabel}.`
                      : "Ссылка создаст партию без таймера."}
                  </div>
                </div>
                <span className="shrink-0">
                  <SwitchBase
                    checked={isTimeControlEnabled}
                    aria-label="Переключить ограничение по времени"
                    onClick={() =>
                      onTimeControlEnabledChange?.(!isTimeControlEnabled)
                    }
                  />
                </span>
              </label>
            </div>

            <div
              className="rounded-tl-[18px] rounded-br-[18px] border p-4"
              style={{
                borderColor: "var(--modal-chip-border)",
                background: "var(--modal-chip-bg)",
                padding: 8,
              }}
            >
              <div
                className="text-[18px] uppercase tracking-[0.2em]"
                style={{ color: "var(--color-accent)" }}
              >
                Приглашение
              </div>
              <div
                className="mt-3 text-[16px] leading-6"
                style={{ color: "var(--color-text-muted)" }}
              >
                {friendStatusText}
              </div>
            </div>

            {inviteLobby ? (
              <div
                className="mt-4 rounded-tl-[18px] rounded-br-[18px] border p-4"
                style={{
                  borderColor: "var(--modal-chip-border)",
                  background: "var(--modal-chip-bg)",
                }}
              >
                <div
                  className="text-[12px] uppercase tracking-[0.2em]"
                  style={{ color: "var(--color-accent)" }}
                >
                  Ссылка-приглашение
                </div>
                <div
                  className="mt-3 break-all text-[14px] leading-6"
                  style={{ color: "var(--color-text)" }}
                >
                  {inviteLobby.inviteUrl}
                </div>
                <div
                  className="mt-3 text-[13px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Действует до {formatInviteDeadline(inviteLobby.expiresAt)}
                </div>
              </div>
            ) : null}

            {friendError ? (
              <div className="mt-4 text-[14px]" style={{ color: "#ff8a8a" }}>
                {friendError}
              </div>
            ) : null}

            <div className="mt-[12px] flex flex-wrap items-center gap-[12px]">
              <button
                type="button"
                onClick={onCreateInvite}
                disabled={isCreatingInvite}
                className={actionButtonClassName}
                style={{
                  padding: 8,
                  background: "var(--color-accent)",
                  color: "var(--sidebar-primary-button-text)",
                }}
              >
                {isCreatingInvite ? "Создаем ссылку..." : "Создать ссылку"}
              </button>

              {inviteLobby ? (
                <button
                  type="button"
                  onClick={onCopy}
                  disabled={inviteLobby.expired}
                  className={actionButtonClassName}
                  style={{
                    padding: 8,
                    background: " #ff00c8 0%",
                    color: "var(--color-text)",
                  }}
                >
                  {inviteLobby.copied ? "Скопировано" : "Скопировать ссылку"}
                </button>
              ) : null}

              {inviteLobby?.readyToEnter ? (
                <button
                  type="button"
                  onClick={onEnterLobby}
                  className={`${actionButtonClassName} text-white hover:brightness-105`}
                  style={{ background: "var(--color-accent-pink)" }}
                >
                  Войти в лобби
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-[12px] flex flex-col" style={{gap: 8,}}>
            <div
              className="rounded-tl-[18px] rounded-br-[18px] border p-4"
              style={{
                borderColor: "var(--modal-chip-border)",
                background: "var(--modal-chip-bg)",

              }}
            >
              <div
                className="text-[20px] uppercase tracking-[0.2em]"
                style={{
                  color: "var(--color-accent-pink)",
                  paddingTop: "12px",
                  paddingLeft: "8px",
                  paddingBottom: "12px",
                }}
              >
                Сложность
              </div>
              <div className="mt-4 grid gap-[0px]">
                {robotDifficultyOptions.map((option) => {
                  const isActive = option.id === robotDifficulty;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onRobotDifficultyChange?.(option.id)}
                      className={`${modalButtonClassName} border text-left`}
                      style={{
                        padding: "12px",
                        borderColor: isActive
                          ? "var(--color-accent-pink)"
                          : "rgba(0, 0, 0, 0)",
                        background: isActive
                          ? "rgba(255, 0, 168, 0.12)"
                          : "transparent",
                        color: "var(--color-text)",
                      }}
                    >
                      <div className="text-[16px] font-semibold">{option.label}</div>
                      <div
                        className="mt-1 text-[16px] leading-5"
                        style={{ color: "var(--color-text-muted)", gap: "20px" }}
                      >
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-4 rounded-tl-[18px] rounded-br-[18px] border p-4"
              style={{
                borderColor: "var(--modal-chip-border)",
                background: "var(--modal-chip-bg)",
                padding: 15,
              }}
            >
              <label
                className="flex cursor-pointer items-center justify-between gap-[16px]"
                style={{
                  opacity: clientBotModeDisabled ? 0.65 : 1,
                  cursor: clientBotModeDisabled ? "not-allowed" : "pointer",
                }}
                onClick={(event) => {
                  if (!clientBotModeDisabled) {
                    return;
                  }

                  event.preventDefault();
                  onClientBotModeDisabledClick?.();
                }}
              >
                <div>
                  <div className="text-[16px] font-semibold">
                    Считать ходы офлайн
                  </div>
                  <div
                    className="mt-1 text-[13px] leading-5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {clientBotModeHint ||
                      ""}
                  </div>
                </div>
                <span
                  className="shrink-0"
                  onClick={(event) => event.preventDefault()}
                >
                  <SwitchBase
                    checked={isClientBotEnabled}
                    disabled={clientBotModeDisabled}
                    aria-label="Переключить локальный расчет ходов"
                    className={clientBotModeDisabled ? "cursor-not-allowed opacity-70" : ""}
                    onClick={() => {
                      if (!clientBotModeDisabled) {
                        onClientBotModeChange?.(!isClientBotEnabled);
                      }
                    }}
                  />
                </span>
              </label>
            </div>

            {robotError ? (
              <div className="mt-4 text-[14px]" style={{ color: "#ff8a8a" }}>
                {robotError}
              </div>
            ) : null}

            <div className="mt-[12px] flex flex-wrap items-center gap-[12px]">
              <button
                type="button"
                onClick={onCreateRobot}
                disabled={isCreatingRobot}
                className={actionButtonClassName}
                style={{
                  background: "var(--color-accent-pink)",
                  color: "#ffffff",
                  padding: 8,
                }}
              >
                {isCreatingRobot ? "Запускаем партию..." : "Начать с ботом"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
