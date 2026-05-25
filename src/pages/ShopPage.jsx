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

  if (isMobile) {
    return (
      <div className="mobile-page">
        <div className="mobile-page__topbar">
          <div className="mobile-page__topbar-left">
            <span className="mobile-page__topbar-logo">Pawn Requiem</span>
            <span className="mobile-page__topbar-sub">Meme Chess</span>
          </div>
        </div>

        <div className="mobile-page__currency-row">
          <div className="mobile-page__currency-pill mobile-page__currency-pill--gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>360</span>
          </div>
          <div className="mobile-page__currency-pill mobile-page__currency-pill--purple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>3228</span>
          </div>
        </div>

        <div className="mobile-page__content">
          {catalogError ? (
            <p style={{ color: "#ff8a8a", fontSize: 14 }}>{catalogError}</p>
          ) : null}

          <div style={{ marginBottom: 16 }}>
            <h2 className="mobile-page__section-title">Скины</h2>
            <ShopSkinsSection
              items={pieceShopItems}
              onBuy={handleRequestBuy}
              buyingSlug={buyingSlug}
              isLoading={isLoading}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h2 className="mobile-page__section-title">Эмоции</h2>
            <ShopEmotionsSection
              items={emoteShopItems}
              onBuy={handleRequestBuy}
              buyingSlug={buyingSlug}
              isLoading={isLoading}
            />
          </div>
        </div>

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
