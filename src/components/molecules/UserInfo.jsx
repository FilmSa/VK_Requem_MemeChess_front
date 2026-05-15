import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import Avatar from "../atoms/Avatar";
import Text from "../atoms/Text";

function VolumeIcon({ muted = false }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10h4l5-4v12l-5-4H4z"
        fill={muted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)"}
      />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="rgba(255,120,120,0.92)"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M16 9.2c1.2.8 1.9 1.95 1.9 2.8 0 .85-.7 2-1.9 2.8"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.9 6.8c2.1 1.6 3.1 3.37 3.1 5.2s-1 3.6-3.1 5.2"
            stroke="rgba(30,224,255,0.9)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function ReactionOverlay({ anchorRef, reaction }) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!reaction || !anchorRef.current) {
      return undefined;
    }

    function updatePosition() {
      if (!anchorRef.current) {
        return;
      }

      const rect = anchorRef.current.getBoundingClientRect();
      const overlaySize = 84;
      const top = Math.max(12, rect.top - 10);
      const left = rect.left + rect.width - overlaySize * 0.18;

      setPosition({
        top,
        left,
        width: overlaySize,
        height: overlaySize,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, reaction]);

  if (!reaction || !position || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed overflow-hidden rounded-[18px] border border-white/15 bg-[#0b102d] p-[4px] shadow-[0_16px_36px_rgba(0,0,0,0.42)]"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        zIndex: 99999,
        animation: `emoji-drop ${
          reaction.durationMs || 2400
        }ms ease-out forwards`,
      }}
    >
      {reaction.videoSrc ? (
        <video
          src={reaction.videoSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
          className="h-full w-full rounded-[14px] object-cover"
        />
      ) : reaction.imageSrc ? (
        <img
          src={reaction.imageSrc}
          alt={reaction.title}
          className="h-full w-full rounded-[14px] object-cover"
        />
      ) : null}
    </div>,
    document.body
  );
}

export default function UserInfo({
  name,
  level,
  avatar,
  reaction,
  profileHref = "",
  emojiVolume = 0.5,
  onEmojiVolumeChange,
  showEmojiVolumeControl = false,
  emojiVolumeButtonRef = null,
  emojiVolumePopupWidth = null,
}) {
  const infoRef = useRef(null);
  const location = useLocation();
  const clampedEmojiVolume = Math.min(1, Math.max(0, Number(emojiVolume) || 0));
  const emojiVolumePercent = Math.round(clampedEmojiVolume * 100);
  const emojiSliderFill = `${emojiVolumePercent}%`;
  const shouldShowEmojiVolumeControl =
    showEmojiVolumeControl && location.pathname !== "/";
  const IdentityWrapper = profileHref ? Link : "div";

  return (
    <div
      ref={infoRef}
      className="relative z-[100] mb-[12px] flex items-center gap-[10px] overflow-visible"
    >
      <ReactionOverlay anchorRef={infoRef} reaction={reaction} />

      <IdentityWrapper
        {...(profileHref ? { to: profileHref } : {})}
        className="flex min-w-0 flex-1 items-center gap-[10px] no-underline"
        style={profileHref ? { cursor: "pointer" } : undefined}
      >
        <div
          className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[18px]"
          style={{ background: "var(--player-panel-avatar-bg)" }}
        >
          <Avatar
            src={avatar}
            className="h-full w-full rounded-[18px] object-cover"
          />
        </div>

        <div className="min-w-0 flex flex-1 flex-col justify-center">
          <Text
            className="min-w-0 truncate text-[14px] font-medium leading-[1.2] text-white"
            style={{
              fontFamily: '"Unbounded", sans-serif',
              color: "var(--player-panel-name)",
            }}
          >
            {name}
          </Text>

          {level ? (
            <Text
              className="text-[20px] font-medium leading-[1.2]"
              style={{
                fontFamily: '"Unbounded", sans-serif',
                color: "var(--player-panel-level)",
              }}
            >
              {level}
            </Text>
          ) : null}
        </div>
      </IdentityWrapper>

      {shouldShowEmojiVolumeControl ? (
        <div className="group relative flex items-center">
          <button
            ref={emojiVolumeButtonRef}
            type="button"
            className="flex items-center justify-center border-none bg-transparent p-0 outline-none transition focus:outline-none"
            style={{
              background: "transparent",
              outline: "none",
              boxShadow: "none",
            }}
            title="Громкость эмодзи"
          >
            <VolumeIcon muted={clampedEmojiVolume <= 0.001} />
          </button>

          <div
            className="pointer-events-none absolute left-full top-1/2 z-[120] ml-[8px] min-w-0 -translate-y-1/2 opacity-0 transition duration-150 delay-[250ms] group-hover:pointer-events-auto group-hover:opacity-100 group-hover:delay-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:delay-0"
            style={
              emojiVolumePopupWidth
                ? { width: `${emojiVolumePopupWidth}px` }
                : undefined
            }
          >
            <div className="flex w-full min-w-0 items-center gap-[10px] overflow-hidden rounded-tl-[14px] rounded-br-[14px] bg-[#11172f]/95 px-[12px] py-[10px] shadow-[0_14px_32px_rgba(0,0,0,0.38)] backdrop-blur">
              <span
                className="min-w-0 max-w-[45%] truncate text-[10px] uppercase tracking-[0.12em]"
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: '"Unbounded", sans-serif',
                }}
              >
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={clampedEmojiVolume}
                onChange={(event) =>
                  onEmojiVolumeChange?.(event.target.valueAsNumber)
                }
                aria-label="Громкость эмодзи"
                className="h-[4px] min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-transparent"
                style={{
                  background: `linear-gradient(90deg, rgba(30,224,255,0.92) 0%, rgba(30,224,255,0.92) ${emojiSliderFill}, rgba(255,255,255,0.14) ${emojiSliderFill}, rgba(255,255,255,0.14) 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
