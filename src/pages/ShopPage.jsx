import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResponsivePanelFrame from "../components/atoms/ResponsivePanelFrame.jsx";
import PurchaseConfirmModal from "../components/organisms/PurchaseConfirmModal.jsx";
import ShopEmotionsSection from "../components/organisms/ShopEmotionsSection.jsx";
import ShopSkinsSection from "../components/organisms/ShopSkinsSection.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import { useInventory } from "../features/inventory/useInventory.js";
import { useNotifications } from "../features/notifications/useNotifications.js";
import { buyShopItem, getShopCatalog } from "../features/shop/shopApi.js";
import { withAssetBase } from "../shared/lib/assets.js";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import { useIsMobile } from "../shared/hooks/useMediaQuery.js";
import MobileBottomNav from "../shared/ui/organisms/MobileBottomNav.jsx";
import MobileCurrencyDisplay from "../shared/ui/atoms/MobileCurrencyDisplay.jsx";
import { getCustomizationItem } from "../shared/constants/customizationCatalog.js";

export default function ShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, refreshCurrency } = useAuth();
  const { refreshInventory } = useInventory();
  const { showNotification } = useNotifications();
  const [shopItems, setShopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseCandidate, setPurchaseCandidate] = useState(null);
  const [buyingSlug, setBuyingSlug] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadShopCatalog() {
      setIsLoading(true);
      setCatalogError("");

      try {
        const response = await getShopCatalog(token);
        if (!isCancelled) {
          setShopItems(response.items);
        }
      } catch (error) {
        if (!isCancelled) {
          setCatalogError(error?.message || "Не удалось загрузить каталог магазина.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadShopCatalog();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const pieceShopItems = useMemo(
    () => shopItems.filter((entry) => entry.item.type === "piece_skin"),
    [shopItems]
  );
  const emoteShopItems = useMemo(
    () => shopItems.filter((entry) => entry.item.type === "emote"),
    [shopItems]
  );

  function handleRequestBuy(entry) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    const slug = String(entry?.item?.slug || "").trim();
    if (!slug) {
      return;
    }

    setPurchaseError("");
    setPurchaseCandidate({
      slug,
      title: String(entry?.title || entry?.item?.title || slug).trim(),
      type: String(entry?.item?.type || "").trim(),
      price: Number(entry?.price ?? 0),
    });
  }

  function handleClosePurchaseModal() {
    if (buyingSlug) {
      return;
    }

    setPurchaseError("");
    setPurchaseCandidate(null);
  }

  async function handleConfirmBuy() {
    if (!purchaseCandidate?.slug) {
      return;
    }

    const { slug, title } = purchaseCandidate;
    setBuyingSlug(slug);
    setPurchaseError("");

    try {
      await buyShopItem(slug, token);
      await Promise.all([refreshCurrency?.(token), refreshInventory?.()]);

      const response = await getShopCatalog(token);
      setShopItems(response.items);
      setPurchaseCandidate(null);

      showNotification({
        id: `shop-buy-${slug}`,
        message: `Покупка «${title}» успешно завершена.`,
        tone: "info",
        duration: 3000,
      });
    } catch (error) {
      setPurchaseError(error?.message || "Не удалось купить предмет.");
    } finally {
      setBuyingSlug("");
    }
  }

  const isMobile = useIsMobile();
  const shopFunds = isAuthenticated ? isAuthenticated.shop_funds : 0;
  const gameFunds = isAuthenticated ? isAuthenticated.game_funds : 0;

  if (isMobile) {
    return (
      <div className="mobile-page">
        <div className="mobile-page__topbar">
          <div className="mobile-page__topbar-left">
            <span className="mobile-page__topbar-logo">Pawn Requiem</span>
            <span className="mobile-page__topbar-sub">Meme Chess</span>
          </div>
        </div>

        <MobileCurrencyDisplay shopFunds={shopFunds} gameFunds={gameFunds} />

        <div className="mobile-page__content">
          {catalogError ? (
            <p style={{ color: "#ff8a8a", fontSize: 14 }}>{catalogError}</p>
          ) : null}

          <div style={{ marginBottom: 16 }}>
            <h2 className="mobile-page__section-title">Скины</h2>
            <div className="mobile-shop-grid">
              {pieceShopItems.map((entry) => {
                const catalogItem = getCustomizationItem(entry.item.slug);
                const previewSrc = catalogItem?.shopHeroImage || catalogItem?.imageSrc || "";
                const title = entry.item.title || catalogItem?.title || entry.item.slug;
                return (
                  <div key={entry.item.slug} className="mobile-shop-grid-card">
                    <div className="mobile-shop-grid-card__preview">
                      {previewSrc ? (
                        <img src={previewSrc} alt={title} />
                      ) : (
                        <div style={{ padding: 16, fontSize: 12, color: "var(--color-text-muted)" }}>
                          {title}
                        </div>
                      )}
                    </div>
                    <div className="mobile-shop-grid-card__info">
                      <div className="mobile-shop-grid-card__title">{title}</div>
                      <button
                        type="button"
                        className={`mobile-shop-grid-card__price-btn ${entry.owned ? "mobile-shop-grid-card__price-btn--owned" : ""}`}
                        onClick={entry.owned ? undefined : () => handleRequestBuy(entry)}
                        disabled={entry.owned || buyingSlug === entry.item.slug}
                      >
                        {entry.owned ? "Куплено" : `${Number(entry.price ?? 0).toLocaleString("ru-RU")} `}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h2 className="mobile-page__section-title">Эмоции</h2>
            <div className="mobile-shop-grid">
              {emoteShopItems.map((entry) => {
                const catalogItem = getCustomizationItem(entry.item.slug);
                const videoSrc = entry.item.asset_url || catalogItem?.videoSrc || "";
                const title = entry.item.title || catalogItem?.title || entry.item.slug;
                return (
                  <div key={entry.item.slug} className="mobile-shop-grid-card">
                    <div className="mobile-shop-grid-card__preview">
                      {videoSrc ? (
                        <video src={videoSrc} muted autoPlay loop playsInline preload="metadata" />
                      ) : (
                        <div style={{ padding: 16, fontSize: 12, color: "var(--color-text-muted)" }}>
                          {title}
                        </div>
                      )}
                    </div>
                    <div className="mobile-shop-grid-card__info">
                      <div className="mobile-shop-grid-card__title">{title}</div>
                      <button
                        type="button"
                        className={`mobile-shop-grid-card__price-btn ${entry.owned ? "mobile-shop-grid-card__price-btn--owned" : ""}`}
                        onClick={entry.owned ? undefined : () => handleRequestBuy(entry)}
                        disabled={entry.owned || buyingSlug === entry.item.slug}
                      >
                        {entry.owned ? "Куплено" : `${Number(entry.price ?? 0).toLocaleString("ru-RU")} `}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <PurchaseConfirmModal
          isOpen={Boolean(purchaseCandidate)}
          item={purchaseCandidate}
          isSubmitting={Boolean(
            purchaseCandidate?.slug && buyingSlug === purchaseCandidate.slug
          )}
          errorMessage={purchaseError}
          onClose={handleClosePurchaseModal}
          onConfirm={handleConfirmBuy}
        />

        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <div className="flex h-full w-full overflow-hidden">
        <AppSidebar />

        <main className="flex h-full min-h-0 flex-1 overflow-hidden py-[12px] pl-[60px] pr-[12px]">
          <ResponsivePanelFrame
            baseWidth={1380}
            baseHeight={1070}
            horizontalAlign="left"
          >
            <div className="flex h-full w-full flex-col px-0 pb-[30px] pr-[30px] pt-0">
              <header className="flex flex-col items-start gap-0">
                <div className="flex items-center gap-[11px]">
                  <h1
                    className="m-0 text-[40px] font-normal leading-none"
                    style={{
                      color: "var(--menu-item-text)",
                      margin: 0,
                      marginBlockStart: "20px",
                      marginBlockEnd: "0px",
                    }}
                  >
                    Магазин
                  </h1>
                  <img
                    src={withAssetBase("/icons/cart.svg")}
                    alt="Корзина"
                    className="h-[49px] w-[49px]"
                  />
                </div>

                <h2
                  className="m-0 text-[36px] font-medium leading-none"
                  style={{
                    color: "var(--shop-title)",
                    margin: 0,
                    marginBlockStart: "20px",
                    marginBlockEnd: "0px",
                  }}
                >
                  Скины
                </h2>
              </header>

              {catalogError ? (
                <div className="mt-[14px] text-[14px]" style={{ color: "#ff8a8a" }}>
                  {catalogError}
                </div>
              ) : null}

              <div className="mt-[14px]">
                <ShopSkinsSection
                  items={pieceShopItems}
                  onBuy={handleRequestBuy}
                  buyingSlug={buyingSlug}
                  isLoading={isLoading}
                />
              </div>

              <h2
                className="m-0 mt-[18px] text-[36px] font-medium leading-none"
                style={{
                  color: "var(--shop-title)",
                  margin: 0,
                  marginBlockStart: "20px",
                  marginBlockEnd: "0px",
                }}
              >
                Эмоции
              </h2>

              <div className="mt-[14px]">
                <ShopEmotionsSection
                  items={emoteShopItems}
                  onBuy={handleRequestBuy}
                  buyingSlug={buyingSlug}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </ResponsivePanelFrame>
        </main>
      </div>

      <PurchaseConfirmModal
        isOpen={Boolean(purchaseCandidate)}
        item={purchaseCandidate}
        isSubmitting={Boolean(
          purchaseCandidate?.slug && buyingSlug === purchaseCandidate.slug
        )}
        errorMessage={purchaseError}
        onClose={handleClosePurchaseModal}
        onConfirm={handleConfirmBuy}
      />
    </div>
  );
}
