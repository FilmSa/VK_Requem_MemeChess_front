import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App/App.jsx";
import AuthProvider from "./features/auth/AuthProvider.jsx";
import InventoryProvider from "./features/inventory/InventoryProvider.jsx";
import NotificationProvider from "./features/notifications/NotificationProvider.jsx";
import CurrencyConvertModalProvider from "./features/shop/CurrencyConvertModalProvider.jsx";
import ThemeProvider from "./features/theme/ThemeProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <CurrencyConvertModalProvider>
            <InventoryProvider>
              <App />
            </InventoryProvider>
          </CurrencyConvertModalProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            void caches.delete(key);
          });
        });
      }

      return;
    }

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}
