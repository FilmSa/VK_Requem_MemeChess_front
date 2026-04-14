import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ShopPreviewBoard from "./ShopPreviewBoard.jsx";

const skins = [
  {
    id: 1,
    title: "Шахматная рамка",
    price: 2500,
    heroImage: "/images/image.jpg",
    previewImage: "/images/Board.png",
  },
  {
    id: 2,
    title: "Тёмный легион",
    price: 2800,
    heroImage: "/images/image.jpg",
    previewImage: "/images/Board.png",
  },
  {
    id: 3,
    title: "Короли пустоты",
    price: 3100,
    heroImage: "/images/image.jpg",
    previewImage: "/images/Board.png",
  },
];

function PriceButton({ price }) {
  return (
    <button
      type="button"
      className="flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[8px] bg-[#19d9ff] text-[24px] font-bold leading-none text-[#A346CE]"
    >
      <img src="/icons/crown.svg" alt="корона" className="h-[22px] w-[22px]" />
      <span>{price}</span>
    </button>
  );
}

function SliderArrow({ direction = "left", onClick }) {
  const iconSrc =
    direction === "left" ? "/icons/left.svg" : "/icons/right.svg";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[126px] w-[47px] shrink-0 items-center justify-center border-0 p-0 outline-none"
      style={{
        background: "linear-gradient(159deg, #160936 0%, #0a183c 159%)",
      }}
    >
      <img
        src={iconSrc}
        alt={direction === "left" ? "Назад" : "Вперёд"}
        className="h-[60px] w-[60px]"
      />
    </button>
  );
}

function PaginationDots({ total, currentIndex }) {
  return (
    <div className="mt-[16px] flex gap-[10px]">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-[12px] w-[30px] rounded-[2px] ${
            index === currentIndex ? "bg-[#cbc0f7]" : "bg-[#7a6db1]"
          }`}
        />
      ))}
    </div>
  );
}

function BoardPreview({ skin, onOpen }) {
  return (
    <img
      src={skin.previewImage}
      alt={skin.title}
      onClick={onOpen}
      className="block h-[294px] w-[294px] cursor-pointer object-fill"
    />
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
          background: "#050b31",
          borderRadius: "18px",
          padding: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          maxWidth: "95vw",
          maxHeight: "95vh",
          overflow: "auto",
        }}
      >
        <div className="mb-[20px] pr-[40px] text-center">
          <div className="text-[18px] font-semibold tracking-[0.18em] text-[#67e7ff]">
            Предпросмотр скина
          </div>
        </div>

        <ShopPreviewBoard boardWidth={720} boardOrientation="white" />
      </div>
    </div>,
    document.body
  );
}

export default function ShopSkinsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openedSkin, setOpenedSkin] = useState(null);

  const activeSkin = skins[activeIndex];

  function handlePrev() {
    setActiveIndex((prev) => (prev - 1 + skins.length) % skins.length);
  }

  function handleNext() {
    setActiveIndex((prev) => (prev + 1) % skins.length);
  }

  function handleOpenPreview() {
    setOpenedSkin(activeSkin);
  }

  function handleClosePreview() {
    setOpenedSkin(null);
  }

  return (
    <>
      <section className="ml-[0px]">
        <div className="mb-[10px] flex items-start gap-[12px]">
          <div className="text-[34px] font-medium leading-[1.05] text-[#67e7ff]">
            <div className="flex items-center gap-[12px]">
              <span>Магазин</span>
              <img
                src="/icons/cart.svg"
                alt="корзина"
                className="h-[32px] w-[32px]"
              />
            </div>
            <div>Скины</div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="mr-[19px] shrink-0">
            <SliderArrow direction="left" onClick={handlePrev} />
          </div>

          <div className="shrink-0">
            <div className="h-[489px] w-[1191px] overflow-hidden rounded-tl-[40px] rounded-tr-[0px] rounded-br-[40px] rounded-bl-[0px] bg-[#0b0f2b] px-[20px] py-[10px]">
              <div className="flex gap-[20px]">
                <div className="relative h-full flex-1">
                  <img
                    src={activeSkin.heroImage}
                    alt={activeSkin.title}
                    className="h-full w-full rounded-tl-[40px] rounded-tr-[0px] rounded-br-[40px] rounded-bl-[0px] object-cover"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,40,0)_55%,rgba(4,10,40,0.55)_100%)]" />

                  <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 text-center" />
                </div>

                <div className="flex h-[469px] w-[355px] shrink-0 flex-col items-center gap-[20px] rounded-tl-[0px] rounded-tr-[0px] rounded-br-[40px] rounded-bl-[0px] px-[20px] pb-[16px] pt-[18px]">
                  <div className="mb-[18px] w-full text-center text-[36px] font-semibold leading-none text-[#57dfff]">
                    {activeSkin.title}
                  </div>

                  <div className="flex flex-1 items-center justify-center">
                    <BoardPreview skin={activeSkin} onOpen={handleOpenPreview} />
                  </div>

                  <div className="mt-auto w-full">
                    <PriceButton price={activeSkin.price} />
                  </div>
                </div>
              </div>
            </div>

            <PaginationDots total={skins.length} currentIndex={activeIndex} />
          </div>

          <div className="ml-[19px] shrink-0">
            <SliderArrow direction="right" onClick={handleNext} />
          </div>
        </div>
      </section>

      <SkinPreviewModal skin={openedSkin} onClose={handleClosePreview} />
    </>
  );
}
