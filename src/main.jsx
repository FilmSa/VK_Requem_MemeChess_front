import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App/App.jsx";
import AuthProvider from "./features/auth/AuthProvider.jsx";
import NotificationProvider from "./features/notifications/NotificationProvider.jsx";
import ThemeProvider from "./features/theme/ThemeProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}
