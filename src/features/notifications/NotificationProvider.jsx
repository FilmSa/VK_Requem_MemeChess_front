import { useCallback, useMemo, useRef, useState } from "react";
import { NotificationContext } from "./NotificationContext.js";
import NotificationViewport from "./NotificationViewport.jsx";

function buildNotificationId() {
  return `notification-${crypto.randomUUID()}`;
}

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());

  const dismissNotification = useCallback((id) => {
    if (!id) {
      return;
    }

    if (timersRef.current.has(id)) {
      window.clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }, []);

  const showNotification = useCallback(
    ({
      id,
      title = "",
      message,
      tone = "info",
      duration = 4500,
      persist = false,
    }) => {
      if (!message) {
        if (id) {
          dismissNotification(id);
        }
        return "";
      }

      const notificationId = id || buildNotificationId();

      if (timersRef.current.has(notificationId)) {
        window.clearTimeout(timersRef.current.get(notificationId));
        timersRef.current.delete(notificationId);
      }

      setNotifications((current) => {
        const nextNotification = {
          id: notificationId,
          title,
          message,
          tone,
        };
        const existingIndex = current.findIndex(
          (notification) => notification.id === notificationId
        );

        if (existingIndex === -1) {
          return [...current, nextNotification];
        }

        const nextNotifications = [...current];
        nextNotifications[existingIndex] = nextNotification;
        return nextNotifications;
      });

      if (!persist && duration > 0) {
        const timerId = window.setTimeout(() => {
          dismissNotification(notificationId);
        }, duration);

        timersRef.current.set(notificationId, timerId);
      }

      return notificationId;
    },
    [dismissNotification]
  );

  const value = useMemo(
    () => ({
      notifications,
      showNotification,
      dismissNotification,
    }),
    [dismissNotification, notifications, showNotification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationViewport
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
}
