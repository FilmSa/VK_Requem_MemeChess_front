import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ShopPreviewBoard from "./ShopPreviewBoard.jsx";

const skins = [
  {
    id: 1,
    title: "ChessFrame",
    price: 2500,
    heroImage: "/images/image.jpg",
    previewImage: "/images/Board.png",
  },
  {
    id: 2,
    title: "Dark Legion",
    price: 2800,
    heroImage: "/images/shop/dark-legion-hero.jpg",
    previewImage: "/images/shop/dark-legion-preview.jpg",
  },
  {
    id: 3,
    title: "Void Kings",
    price: 3100,
    heroImage: "/images/shop/void-kings-hero.jpg",
    previewImage: "/images/shop/void-kings-preview.jpg",
  },
];

function PriceButton({ price }) {
  return (
    <button
      type="button"
      className="
        w-full h-[42px]
        rounded-[8px]
        bg-[#19d9ff]
        text-[#03132d]
        font-bold
        text-[24px]
        leading-none
        flex items-center justify-center gap-[12px]
      "
    >
      <img src="/icons/crown.svg" alt="crown" className="w-[22px] h-[22px]" />
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
      className="
        w-[47px] h-[126px]
        flex items-center justify-center
        shrink-0
        border-0 outline-none p-0
      "
      style={{
        background: "linear-gradient(159deg, #160936 0%, #0a183c 159%)",
      }}
    >
      <img
        src={iconSrc}
        alt={direction}
        className="w-[60px] h-[60px]"
      />
    </button>
  );
}

function PaginationDots({ total, currentIndex }) {
  return (
    <div className="flex gap-[10px] mt-[16px]">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`w-[30px] h-[12px] rounded-[2px] ${
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
      className="block w-[294px] h-[294px] object-fill cursor-pointer"
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
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "38px",
            height: "38px",
            borderRadius: "999px",
            background: "#fff",
            color: "#000",
            fontSize: "24px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          ×
        </button>

        <div className="text-center mb-[20px] pr-[40px]">
          <div className="text-white font-black text-[42px] leading-[0.95]">
            {skin.title.toUpperCase()}
          </div>
          <div className="text-[#67e7ff] text-[18px] tracking-[0.18em] font-semibold">
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
        <div className="flex items-start gap-[12px] mb-[10px]">
          <div className="text-[#67e7ff] text-[34px] font-medium leading-[1.05]">
            <div className="flex items-center gap-[12px]">
              <span>Магазин</span>
              <img
                src="/icons/cart.svg"
                alt="cart"
                className="w-[32px] h-[32px]"
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
            <div
              className="
                w-[1191px] h-[489px]
                bg-[#0b0f2b]
                flex gap-[20px]
                px-[20px] py-[10px]
                overflow-hidden
                rounded-tl-[40px] rounded-tr-[0px]
                rounded-br-[40px] rounded-bl-[0px]
              "
            >
              <div className="relative flex-1 h-full">
                <img
                  src={activeSkin.heroImage}
                  alt={activeSkin.title}
                  className="w-full h-full object-cover rounded-tl-[40px] rounded-tr-[0px]
                rounded-br-[40px] rounded-bl-[0px]"
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,40,0)_55%,rgba(4,10,40,0.55)_100%)]" />

                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 text-center">
                  
                </div>
              </div>

              <div
                className="
                  w-[355px] h-[469px]
                  shrink-0
                  rounded-tl-[0px] rounded-tr-[0px]
                  rounded-br-[40px] rounded-bl-[0px]
                  px-[20px] pt-[18px] pb-[16px]
                  flex flex-col items-center h-full
                  gap-[20px]
                "
              >
                <div className="w-full text-[#57dfff] text-[36px] font-semibold leading-none mb-[18px] text-center">
                  {activeSkin.title}
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <BoardPreview skin={activeSkin} onOpen={handleOpenPreview} />
                </div>

                <div className="mt-auto w-full">
                  <PriceButton price={activeSkin.price} />
                </div>
              </div>
                          </div>

            <PaginationDots
              total={skins.length}
              currentIndex={activeIndex}
            />
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