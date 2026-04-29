function NotificationCard({ notification, onDismiss }) {
  const tone = notification.tone || "info";
  const accentColor =
    tone === "error"
      ? "var(--notification-error-accent)"
      : tone === "success"
      ? "var(--notification-success-accent)"
      : "var(--notification-info-accent)";

  return (
    <div
      className="pointer-events-auto relative w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-[20px] border px-[16px] py-[14px] shadow-[var(--notification-shadow)] backdrop-blur-[18px]"
      style={{
        borderColor: "var(--notification-border)",
        background: "var(--notification-surface)",
        color: "var(--notification-text)",
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-[4px]"
        style={{ background: accentColor }}
      />
      <div className="flex items-start gap-[12px] pl-[4px]">
        <div
          className="mt-[2px] h-[10px] w-[10px] flex-shrink-0 rounded-full"
          style={{ background: accentColor }}
        />
        <div className="min-w-0 flex-1">
          {notification.title ? (
            <div
              className="text-[13px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--notification-title)" }}
            >
              {notification.title}
            </div>
          ) : null}
          <div className="text-[14px] leading-[1.5]">{notification.message}</div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          className="h-[28px] w-[28px] flex-shrink-0 rounded-full border text-[14px] leading-none transition-opacity hover:opacity-80"
          style={{
            borderColor: "var(--notification-dismiss-border)",
            color: "var(--notification-dismiss-text)",
            background: "transparent",
          }}
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function NotificationViewport({
  notifications = [],
  onDismiss,
}) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-[20px] right-[20px] z-[120] flex max-h-[calc(100vh-40px)] flex-col items-end gap-[12px]">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
