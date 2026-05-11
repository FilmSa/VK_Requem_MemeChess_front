import { useContext } from "react";
import { CurrencyConvertModalContext } from "./CurrencyConvertModalContext.js";

export function useCurrencyConvertModal() {
  const value = useContext(CurrencyConvertModalContext);

  if (!value) {
    throw new Error(
      "useCurrencyConvertModal must be used inside CurrencyConvertModalProvider."
    );
  }

  return value;
}
