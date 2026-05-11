import { useCallback, useMemo, useState } from "react";
import CurrencyConvertModal from "../../components/organisms/CurrencyConvertModal.jsx";
import { useAuth } from "../auth/useAuth.js";
import { useNotifications } from "../notifications/useNotifications.js";
import { convertToCrowns } from "./shopApi.js";
import { CurrencyConvertModalContext } from "./CurrencyConvertModalContext.js";

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("ru-RU").format(value);
}

export default function CurrencyConvertModalProvider({ children }) {
  const { user, token, refreshCurrency } = useAuth();
  const { showNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openModal = useCallback(() => {
    setErrorMessage("");
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setErrorMessage("");
  }, [isSubmitting]);

  const handleSubmit = useCallback(
    async (amount) => {
      if (!token || amount <= 0) {
        return;
      }

      const availableAmount = Math.max(Number(user?.game_funds ?? 0), 0);
      if (amount > availableAmount) {
        const message = `Недостаточно рейтинга для конвертации. Доступно: ${formatCurrency(availableAmount)}.`;
        setErrorMessage(message);
        showNotification({
          id: "sidebar-convert-error",
          title: "Ошибка конвертации",
          message,
          tone: "error",
          duration: 3500,
        });
        return;
      }

      setErrorMessage("");
      setIsSubmitting(true);

      try {
        await convertToCrowns(amount, token);
        await refreshCurrency?.(token);
        setIsOpen(false);
        showNotification({
          id: "sidebar-convert-success",
          message: `Конвертировано ${formatCurrency(amount)} рейтинга в короны.`,
          tone: "info",
          duration: 3500,
        });
      } catch (error) {
        setErrorMessage(
          error?.message || "Не удалось конвертировать рейтинг в короны."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshCurrency, showNotification, token, user?.game_funds]
  );

  const value = useMemo(
    () => ({
      openCurrencyConvertModal: openModal,
      closeCurrencyConvertModal: closeModal,
      isCurrencyConvertModalOpen: isOpen,
    }),
    [closeModal, isOpen, openModal]
  );

  return (
    <CurrencyConvertModalContext.Provider value={value}>
      {children}
      <CurrencyConvertModal
        isOpen={isOpen}
        maxAmount={Number(user?.game_funds ?? 0)}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </CurrencyConvertModalContext.Provider>
  );
}
