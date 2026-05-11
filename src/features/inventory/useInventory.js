import { useContext } from "react";
import { InventoryContext } from "./InventoryContext.js";

export function useInventory() {
  const value = useContext(InventoryContext);

  if (!value) {
    throw new Error("useInventory must be used inside InventoryProvider.");
  }

  return value;
}
