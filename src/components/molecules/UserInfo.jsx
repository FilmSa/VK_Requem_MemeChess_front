import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Avatar from "../atoms/Avatar";
import Text from "../atoms/Text";

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

export default function UserInfo({ name, level, avatar, reaction }) {
  const infoRef = useRef(null);

  return (
    <div
      ref={infoRef}
      className="relative z-[100] mb-[12px] flex items-center gap-[10px] overflow-visible"
    >
      <div
        className="relative h-[54px] w-[54px] shrink-0 overflow-visible rounded-full"
        style={{ background: "var(--player-panel-avatar-bg)" }}
      >
        <Avatar src={avatar} className="h-full w-full object-cover" />
      </div>

      <ReactionOverlay anchorRef={infoRef} reaction={reaction} />

      <div className="flex flex-col justify-center">
        <Text
          className="text-[14px] font-medium leading-[1.2] text-white"
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
    </div>
  );
}
