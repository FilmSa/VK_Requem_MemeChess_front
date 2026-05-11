import { ApiError, apiFetch } from "../../shared/api/client.js";
import {
  normalizeBoardSkinSlug,
  normalizeEmoteSlug,
  normalizePieceSkinSlug,
} from "../../shared/constants/customizationCatalog.js";

function normalizeInventoryItem(item) {
  if (!item) {
    return null;
  }

  return {
    ...item,
    type: item.type === "sticker" ? "emote" : item.type,
    title: item.title || "",
    asset_url: item.asset_url || "",
    meta: item.meta && typeof item.meta === "object" ? item.meta : {},
    created_at: item.created_at || "",
  };
}

function normalizeSelection(selection) {
  return {
    pieceSkinSlug:
      normalizePieceSkinSlug(selection?.piece_skin_slug) || null,
    boardSkinSlug:
      normalizeBoardSkinSlug(selection?.board_skin_slug) || null,
    emoteSlugs: Array.isArray(selection?.emote_slugs)
      ? selection.emote_slugs.map((value) => normalizeEmoteSlug(value)).filter(Boolean)
      : Array.isArray(selection?.sticker_slugs)
      ? selection.sticker_slugs.map((value) => normalizeEmoteSlug(value)).filter(Boolean)
      : [],
  };
}

function normalizeInventoryResponse(response) {
  return {
    owned: Array.isArray(response?.owned)
      ? response.owned.map((item) => normalizeInventoryItem(item)).filter(Boolean)
      : [],
    selected: normalizeSelection(response?.selected),
  };
}

function buildError(error, fallbackMessage) {
  if (error instanceof ApiError) {
    return error;
  }

  return new Error(fallbackMessage);
}

export async function getInventoryCatalog() {
  try {
    const response = await apiFetch("/api/v1/inventory/catalog");
    return {
      items: Array.isArray(response?.items)
        ? response.items.map((item) => normalizeInventoryItem(item)).filter(Boolean)
        : [],
    };
  } catch (error) {
    throw buildError(error, "Не удалось загрузить каталог инвентаря.");
  }
}

export async function getMyInventory(token) {
  try {
    const response = await apiFetch("/api/v1/inventory/me", {
      method: "GET",
      token,
    });

    return normalizeInventoryResponse(response);
  } catch (error) {
    throw buildError(error, "Не удалось загрузить инвентарь.");
  }
}

export async function updateMySelection(selection, token) {
  try {
    const response = await apiFetch("/api/v1/inventory/me/selection", {
      method: "PUT",
      token,
      body: {
        piece_skin_slug: selection?.pieceSkinSlug || null,
        board_skin_slug: selection?.boardSkinSlug || null,
        emote_slugs: Array.isArray(selection?.emoteSlugs)
          ? selection.emoteSlugs.map((value) => normalizeEmoteSlug(value)).filter(Boolean)
          : [],
      },
    });

    return normalizeSelection(response?.selected);
  } catch (error) {
    throw buildError(error, "Не удалось сохранить выбранные предметы.");
  }
}
