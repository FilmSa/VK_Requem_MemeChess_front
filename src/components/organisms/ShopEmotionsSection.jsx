import { useEffect, useMemo, useState } from "react";
import MediaPreviewCard from "../molecules/MediaPreviewCard.jsx";
import PaginationDots from "../molecules/PaginationDots.jsx";
import ShopPriceButton from "../molecules/ShopPriceButton.jsx";
import SliderArrow from "../molecules/SliderArrow.jsx";
import { getCustomizationItem } from "../../shared/constants/customizationCatalog.js";

const EMOTIONS_PER_PAGE = 4;

function getCircularSlice(items, startIndex, count) {
  if (!items.length || count <= 0) {
    return [];
  }

  return Array.from({ length: Math.min(count, items.length) }, (_, offset) => {
    const index = (startIndex + offset) % items.length;
    return items[index];
  });
}

function EmotionCard({ item, onBuy, isBuying }) {
  const catalogItem = getCustomizationItem(item.item.slug);
  const videoSrc = item.item.asset_url || catalogItem?.videoSrc || "";
  const title = item.item.title || catalogItem?.title || item.item.slug;

  return (
    <article
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[16px] border"
      style={{
        borderColor: "rgba(82, 111, 182, 0.42)",
        background: "rgba(7, 12, 41, 0.92)",
        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)",
      }}
    >
      <div
        className="relative flex-1 overflow-hidden rounded-t-[15px]"
        style={{ background: "#111935" }}
      >
        <MediaPreviewCard
          title={title}
          videoSrc={videoSrc}
          previewTime={catalogItem?.previewTime ?? 0.05}
          cornerStyle="diagonal"
          className="h-full w-full rounded-none"
        />
      </div>

      <div className="flex justify-center px-[10px] pb-[10px] pt-[10px]">
        <div className="w-full max-w-[260px]">
          <ShopPriceButton
            price={item.price}
            label={item.owned ? "Куплено" : undefined}
            onClick={item.owned ? undefined : () => onBuy?.(item)}
            disabled={item.owned || isBuying}
            compact
            className="h-[28px] text-[12px]"
          />
        </div>
      </div>
    </article>
  );
}

export default function ShopEmotionsSection({
  items = [],
  onBuy,
  buyingSlug = "",
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const emotionCards = useMemo(() => items, [items]);
  const pageCount = Math.max(
    1,
    Math.ceil(emotionCards.length / EMOTIONS_PER_PAGE)
  );
  const visibleCards = getCircularSlice(
    emotionCards,
    pageIndex * EMOTIONS_PER_PAGE,
    EMOTIONS_PER_PAGE
  );

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(0);
    }
  }, [pageCount, pageIndex]);

  function handlePrev() {
    setPageIndex((currentPage) => (currentPage - 1 + pageCount) % pageCount);
  }

  function handleNext() {
    setPageIndex((currentPage) => (currentPage + 1) % pageCount);
  }

  return (
    <section className="relative h-[290px] w-[1323px]">
      <div className="grid h-[260px] w-[1323px] grid-cols-[47px_1191px_47px] items-center gap-x-[19px]">
        <SliderArrow
          direction="left"
          onClick={handlePrev}
          className="h-[121px] w-[47px] self-center"
        />

        <div className="grid h-[260px] w-[1191px] grid-cols-4 gap-[16px]">
          {visibleCards.map((item) => (
            <EmotionCard
              key={item.item.slug}
              item={item}
              onBuy={onBuy}
              isBuying={buyingSlug === item.item.slug}
            />
          ))}
        </div>

        <SliderArrow
          direction="right"
          onClick={handleNext}
          className="h-[121px] w-[47px] self-center"
        />
      </div>

      <div className="absolute left-[66px] top-[275px] flex h-[15px] items-center">
        <PaginationDots total={pageCount} currentIndex={pageIndex} />
      </div>
    </section>
  );
}
