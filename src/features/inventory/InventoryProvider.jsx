import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth.js";
import {
  DEFAULT_BOARD_SKIN_SLUG,
  DEFAULT_PIECE_SKIN_SLUG,
} from "../../shared/constants/customizationCatalog.js";
import {
  DEFAULT_EMOJI_QUICK_ACCESS_IDS,
} from "../../shared/constants/emojiPreviewMedia.js";
import { persistBoardSkin } from "../../shared/lib/boardSkin.js";
import {
  persistEmojiQuickAccess,
} from "../../shared/lib/emojiQuickAccess.js";
import { persistPieceSkin } from "../../shared/lib/pieceSkin.js";
import * as inventoryApi from "./inventoryApi.js";
import { InventoryContext } from "./InventoryContext.js";

export default function InventoryProvider({ children }) {
  const { token, user, isAuthenticated } = useAuth();
  const [catalogItems, setCatalogItems] = useState([]);
  const [inventoryState, setInventoryState] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const lastSyncedSelectionRef = useRef("");

  const syncSelectionToLocalCache = useCallback(
    (selection) => {
      if (!selection || !user?.id) {
        return;
      }

      persistPieceSkin(selection.pieceSkinSlug || DEFAULT_PIECE_SKIN_SLUG);
      persistBoardSkin(selection.boardSkinSlug || DEFAULT_BOARD_SKIN_SLUG);
      persistEmojiQuickAccess(user.id, selection.emoteSlugs || []);
    },
    [user?.id]
  );

  const refreshCatalog = useCallback(async () => {
    setIsCatalogLoading(true);

    try {
      const response = await inventoryApi.getInventoryCatalog();
      setCatalogItems(response.items);
      return response.items;
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setInventoryState(null);
      return null;
    }

    setIsInventoryLoading(true);

    try {
      const response = await inventoryApi.getMyInventory(token);
      setInventoryState(response);
      syncSelectionToLocalCache(response.selected);
      return response;
    } finally {
      setIsInventoryLoading(false);
    }
  }, [isAuthenticated, syncSelectionToLocalCache, token]);

  const updateSelection = useCallback(
    async (partialSelection) => {
      if (!token || !isAuthenticated) {
        return null;
      }

      const currentSelection = inventoryState?.selected || {
        pieceSkinSlug: DEFAULT_PIECE_SKIN_SLUG,
        boardSkinSlug: DEFAULT_BOARD_SKIN_SLUG,
        emoteSlugs: DEFAULT_EMOJI_QUICK_ACCESS_IDS,
      };

      const nextSelection = {
        pieceSkinSlug:
          partialSelection?.pieceSkinSlug ?? currentSelection.pieceSkinSlug ?? null,
        boardSkinSlug:
          partialSelection?.boardSkinSlug ?? currentSelection.boardSkinSlug ?? null,
        emoteSlugs: Array.isArray(partialSelection?.emoteSlugs)
          ? partialSelection.emoteSlugs
          : currentSelection.emoteSlugs || [],
      };

      const savedSelection = await inventoryApi.updateMySelection(
        nextSelection,
        token
      );

      setInventoryState((currentState) => ({
        owned: currentState?.owned || [],
        selected: savedSelection,
      }));
      syncSelectionToLocalCache(savedSelection);

      return savedSelection;
    },
    [inventoryState?.selected, isAuthenticated, syncSelectionToLocalCache, token]
  );

  useEffect(() => {
    void refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setInventoryState(null);
      return;
    }

    void refreshInventory().catch(() => {});
  }, [isAuthenticated, refreshInventory, token]);

  useEffect(() => {
    if (!inventoryState?.selected || !user?.id) {
      return;
    }

    const nextSignature = JSON.stringify({
      userId: user.id,
      selection: inventoryState.selected,
    });
    if (lastSyncedSelectionRef.current === nextSignature) {
      return;
    }

    lastSyncedSelectionRef.current = nextSignature;
    syncSelectionToLocalCache(inventoryState.selected);
  }, [inventoryState?.selected, syncSelectionToLocalCache, user?.id]);

  const value = useMemo(
    () => ({
      catalogItems,
      inventory: inventoryState,
      ownedItems: inventoryState?.owned || [],
      selected: inventoryState?.selected || null,
      isCatalogLoading,
      isInventoryLoading,
      refreshCatalog,
      refreshInventory,
      updateSelection,
    }),
    [
      catalogItems,
      inventoryState,
      isCatalogLoading,
      isInventoryLoading,
      refreshCatalog,
      refreshInventory,
      updateSelection,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}
