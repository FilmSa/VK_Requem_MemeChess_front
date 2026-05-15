import { ApiError, apiFetch } from "../../shared/api/client.js";
import {
  normalizeBoardSkinSlug,
  normalizeEmoteSlug,
  normalizePieceSkinSlug,
} from "../../shared/constants/customizationCatalog.js";

const SHOP_CATALOG_CACHE_TTL_MS = 60 * 1000;
const shopCatalogCache = new Map();

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

function buildShopCatalogCacheKey(token) {
  return token ? `auth:${token}` : "guest";
}

function cloneShopCatalogPayload(payload) {
  return {
    items: Array.isArray(payload?.items) ? [...payload.items] : [],
  };
}

function normalizeShopCatalogResponse(response) {
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
}

function readCachedShopCatalog(key) {
  const cacheEntry = shopCatalogCache.get(key);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.value && cacheEntry.expiresAt > Date.now()) {
    return cloneShopCatalogPayload(cacheEntry.value);
  }

  return null;
}

export function invalidateShopCatalogCache(token) {
  if (typeof token === "string") {
    shopCatalogCache.delete(buildShopCatalogCacheKey(token));
    return;
  }

  shopCatalogCache.clear();
}

export async function getShopCatalog(token, options = {}) {
  const { forceRefresh = false } = options;
  const cacheKey = buildShopCatalogCacheKey(token);
  const existingEntry = shopCatalogCache.get(cacheKey);

  if (!forceRefresh) {
    const cachedCatalog = readCachedShopCatalog(cacheKey);
    if (cachedCatalog) {
      return cachedCatalog;
    }
  }

  if (!forceRefresh && existingEntry?.promise) {
    const payload = await existingEntry.promise;
    return cloneShopCatalogPayload(payload);
  }

  const requestPromise = (async () => {
    try {
      const response = await apiFetch("/api/v1/shop/catalog", {
        method: "GET",
        token,
      });

      const normalizedPayload = normalizeShopCatalogResponse(response);
      shopCatalogCache.set(cacheKey, {
        value: normalizedPayload,
        expiresAt: Date.now() + SHOP_CATALOG_CACHE_TTL_MS,
        promise: null,
      });

      return normalizedPayload;
    } catch (error) {
      if (shopCatalogCache.get(cacheKey)?.promise === requestPromise) {
        shopCatalogCache.delete(cacheKey);
      }

      throw buildError(
        error,
        "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєР°С‚Р°Р»РѕРі РјР°РіР°Р·РёРЅР°."
      );
    } finally {
      const activeEntry = shopCatalogCache.get(cacheKey);
      if (activeEntry?.promise === requestPromise) {
        shopCatalogCache.set(cacheKey, {
          value: activeEntry.value || null,
          expiresAt: activeEntry.expiresAt || 0,
          promise: null,
        });
      }
    }
  })();

  shopCatalogCache.set(cacheKey, {
    value: existingEntry?.value || null,
    expiresAt: existingEntry?.expiresAt || 0,
    promise: requestPromise,
  });

  const payload = await requestPromise;
  return cloneShopCatalogPayload(payload);
}

export async function preloadShopCatalog(token) {
  try {
    await getShopCatalog(token);
  } catch {
    // Ignore warm-up failures and let the actual page request retry.
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
    throw buildError(
      error,
      "РќРµ СѓРґР°Р»РѕСЃСЊ РєРѕРЅРІРµСЂС‚РёСЂРѕРІР°С‚СЊ СЂРµР№С‚РёРЅРі РІ РєРѕСЂРѕРЅС‹."
    );
  }
}

export async function buyShopItem(slug, token) {
  try {
    const response = await apiFetch("/api/v1/shop/buy", {
      method: "POST",
      token,
      body: { slug },
    });

    invalidateShopCatalogCache(token);
    return normalizeCurrency(response);
  } catch (error) {
    throw buildError(error, "РќРµ СѓРґР°Р»РѕСЃСЊ РєСѓРїРёС‚СЊ РїСЂРµРґРјРµС‚.");
  }
}
