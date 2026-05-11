import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PaginationDots from "../molecules/PaginationDots.jsx";
import ShopPriceButton from "../molecules/ShopPriceButton.jsx";
import SliderArrow from "../molecules/SliderArrow.jsx";
import ShopPreviewBoard from "./ShopPreviewBoard.jsx";
import { getCustomizationItem } from "../../shared/constants/customizationCatalog.js";

function BoardPreview({ skin, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-auto block aspect-square w-full max-w-[294px] overflow-hidden border border-black/20 bg-white/5 p-0 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
      style={{ borderRadius: "0px" }}
    >
      <img
        src={skin.previewImage}
        alt={skin.title}
        className="block h-full w-full object-fill"
      />
    </button>
  );
}

function SkinPreviewModal({ skin, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!skin) {
    return null;
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0, 0, 0, 0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          background: "var(--shop-modal-surface)",
          borderRadius: "18px",
          padding: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          maxWidth: "95vw",
          maxHeight: "95vh",
          overflow: "auto",
        }}
      >
        <div className="mb-[20px] pr-[40px] text-center">
          <div
            className="text-[18px] font-semibold tracking-[0.18em]"
            style={{ color: "var(--shop-modal-title)" }}
          >
            Предпросмотр скина
          </div>
        </div>

        <ShopPreviewBoard
          boardWidth={720}
          boardOrientation="white"
          pieceSkinId={skin.item.slug}
        />
      </div>
    </div>,
    document.body
  );
}

export default function ShopSkinsSection({
  items = [],
  onBuy,
  buyingSlug = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openedSkin, setOpenedSkin] = useState(null);

  const skins = useMemo(
    () =>
      items.map((entry) => {
        const catalogItem = getCustomizationItem(entry.item.slug);
        return {
          ...entry,
          title: entry.item.title || catalogItem?.title || entry.item.slug,
          heroImage: catalogItem?.shopHeroImage || catalogItem?.imageSrc || "",
          previewImage: catalogItem?.imageSrc || catalogItem?.shopHeroImage || "",
        };
      }),
    [items]
  );

  const activeSkin = skins[activeIndex] || null;

  useEffect(() => {
    if (activeIndex >= skins.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, skins.length]);

  function handlePrev() {
    setActiveIndex((prev) => (prev - 1 + skins.length) % skins.length);
  }

  function handleNext() {
    setActiveIndex((prev) => (prev + 1) % skins.length);
  }

  function handleOpenPreview() {
    if (activeSkin) {
      setOpenedSkin(activeSkin);
    }
  }

  function handleClosePreview() {
    setOpenedSkin(null);
  }

  if (!activeSkin) {
    return null;
  }

  return (
    <>
      <section className="relative h-[519px] w-[1323px]">
        <div className="grid h-[489px] w-[1323px] grid-cols-[47px_1191px_47px] items-center gap-x-[19px]">
          <SliderArrow
            direction="left"
            onClick={handlePrev}
            className="h-[121px] w-[47px] self-center"
          />

          <div
            className="h-[489px] w-[1191px] rounded-[40px_0_40px_0] px-[20px] py-[10px]"
            style={{
              background: "var(--shop-panel-bg)",
              boxShadow: "var(--shop-panel-shadow)",
            }}
          >
            <div className="grid h-full w-full grid-cols-[784px_312px] gap-[20px]">
              <div className="relative h-[469px] w-[784px] overflow-hidden rounded-[40px_0_40px_0]">
                <div className="h-full w-full">
                  <img
                    src={activeSkin.heroImage}
                    alt={activeSkin.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "var(--shop-panel-overlay)" }}
                />
              </div>

              <div className="flex h-[469px] w-[312px] flex-col items-center justify-between py-[10px]">
                <h3
                  className="w-full text-center text-[36px] font-medium leading-none"
                  style={{
                    color: "var(--shop-title)",
                    marginBlockStart: "20px",
                    marginBlockEnd: "0px",
                  }}
                >
                  {activeSkin.title}
                </h3>

                <div className="flex flex-1 items-center justify-center py-[14px]">
                  <BoardPreview skin={activeSkin} onOpen={handleOpenPreview} />
                </div>

                <ShopPriceButton
                  price={activeSkin.price}
                  label={activeSkin.owned ? "Куплено" : undefined}
                  onClick={activeSkin.owned ? undefined : () => onBuy?.(activeSkin)}
                  disabled={activeSkin.owned || buyingSlug === activeSkin.item.slug}
                  compact
                  className="h-[40px] w-[292px] text-[14px]"
                />
              </div>
            </div>
          </div>

          <SliderArrow
            direction="right"
            onClick={handleNext}
            className="h-[121px] w-[47px] self-center"
          />
        </div>

        <div className="absolute left-[66px] top-[504px] flex h-[15px] items-center">
          <PaginationDots total={skins.length} currentIndex={activeIndex} />
        </div>
      </section>

      <SkinPreviewModal skin={openedSkin} onClose={handleClosePreview} />
    </>
  );
}
