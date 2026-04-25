import { createPortal } from "react-dom";

function formatInviteDeadline(expiresAt) {
  if (!expiresAt) {
    return "\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u043e";
  }

  const parsedDate = new Date(expiresAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u043e";
  }

  return parsedDate.toLocaleString("ru-RU");
}

export default function InviteLobbyModal({
  isOpen,
  inviteLobby,
  onCopy,
  onClose,
  onEnterLobby,
}) {
  if (!isOpen || !inviteLobby || typeof document === "undefined") {
    return null;
  }

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
        className="w-full max-w-[560px] rounded-[32px] border"
        style={{
          width: "100%",
          maxWidth: 560,
          position: "relative",
          padding: "20px",
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
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
        >
          {"\u2715"}
        </button>

        <div className="flex items-start justify-between gap-[10px]">
          <div>
            <div className="text-[28px] font-semibold" style={{ color: "var(--color-text)" }}>
              {"\u0421\u0441\u044b\u043b\u043a\u0430 \u0433\u043e\u0442\u043e\u0432\u0430"}
            </div>
            <div
              className="mt-2 text-[15px] leading-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              {inviteLobby.expired
                ? "\u0421\u0440\u043e\u043a \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441\u0441\u044b\u043b\u043a\u0438 \u0438\u0441\u0442\u0435\u043a. \u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043d\u043e\u0432\u043e\u0435 \u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435."
                : inviteLobby.statusMessage}
            </div>
          </div>
        </div>

        <div
          className="mt-6 rounded-[22px] border p-4"
          style={{
            borderColor: "var(--modal-chip-border)",
            background: "var(--modal-chip-bg)",
          }}
        >
          <div
            className="text-[12px] uppercase tracking-[0.2em]"
            style={{ color: "var(--color-accent)" }}
          >
            {"\u0421\u0441\u044b\u043b\u043a\u0430-\u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435"}
          </div>
          <div
            className="mt-3 break-all text-[14px] leading-6"
            style={{ color: "var(--color-text)" }}
          >
            {inviteLobby.inviteUrl}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={onCopy}
            disabled={inviteLobby.expired}
            className="rounded-[16px] border-none px-5 py-3 text-[14px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "var(--color-accent)",
              color: "var(--sidebar-primary-button-text)",
            }}
          >
            {inviteLobby.copied
              ? "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e"
              : "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443"}
          </button>

          {inviteLobby.readyToEnter ? (
            <button
              type="button"
              onClick={onEnterLobby}
              className="rounded-[16px] border-none px-5 py-3 text-[14px] font-medium text-white transition hover:brightness-105"
              style={{ background: "var(--color-accent-pink)" }}
            >
              {"\u0412\u043e\u0439\u0442\u0438 \u0432 \u043b\u043e\u0431\u0431\u0438"}
            </button>
          ) : null}

          <div className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {"\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043e"}{" "}
            {formatInviteDeadline(inviteLobby.expiresAt)}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
