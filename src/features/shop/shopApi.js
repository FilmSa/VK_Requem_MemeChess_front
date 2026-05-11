import { ApiError, apiFetch } from "../../shared/api/client.js";
import {
  normalizeBoardSkinSlug,
  normalizeEmoteSlug,
  normalizePieceSkinSlug,
} from "../../shared/constants/customizationCatalog.js";

function normalizeItem(item) {
  if (!item) {
    return null;
  }

  const normalizedType = item.type === "sticker" ? "emote" : item.type;
  const normalizedSlug =
    normalizedType === "piece_skin"
      ? normalizePieceSkinSlug(item.slug)
      : normalizedType === "board_skin"
      ? normalizeBoardSkinSlug(item.slug)
      : normalizeEmoteSlug(item.slug);

  return {
    ...item,
    slug: normalizedSlug || item.slug || "",
    type: normalizedType,
    title: item.title || "",
    asset_url: item.asset_url || "",
    meta: item.meta && typeof item.meta === "object" ? item.meta : {},
    created_at: item.created_at || "",
  };
}

function normalizeCurrency(response) {
  return {
    shopFunds: Number(response?.shop_funds ?? 0),
    gameFunds: Number(response?.game_funds ?? 0),
  };
}

function buildError(error, fallbackMessage) {
  if (error instanceof ApiError) {
    return error;
  }

  return new Error(fallbackMessage);
}

export async function getShopCatalog(token) {
  try {
    const response = await apiFetch("/api/v1/shop/catalog", {
      method: "GET",
      token,
    });

    return {
      items: Array.isArray(response?.items)
        ? response.items
            .map((entry) => {
              const normalizedItem = normalizeItem(entry?.item);
              if (!normalizedItem) {
                return null;
              }

              return {
                item: normalizedItem,
                price: Number(entry?.price ?? 0),
                owned: Boolean(entry?.owned),
                isActive: entry?.is_active !== false,
              };
            })
            .filter(Boolean)
        : [],
    };
  } catch (error) {
    throw buildError(error, "Не удалось загрузить каталог магазина.");
  }
}

export async function convertToCrowns(amount, token) {
  try {
    const response = await apiFetch("/api/v1/shop/convert", {
      method: "POST",
      token,
      body: { amount: Number(amount) || 0 },
    });

    return normalizeCurrency(response);
  } catch (error) {
    throw buildError(error, "Не удалось конвертировать рейтинг в короны.");
  }
}

export async function buyShopItem(slug, token) {
  try {
    const response = await apiFetch("/api/v1/shop/buy", {
      method: "POST",
      token,
      body: { slug },
    });

    return normalizeCurrency(response);
  } catch (error) {
    throw buildError(error, "Не удалось купить предмет.");
  }
}
