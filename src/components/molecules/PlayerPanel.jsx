import { useLayoutEffect, useRef, useState } from "react";
import UserInfo from "./UserInfo.jsx";
import Timer from "./Timer.jsx";

export default function PlayerPanel({
  name,
  level,
  avatar,
  time = "15:00",
  reaction,
  showTimer = true,
  timerIsActive = false,
  timerTone = "idle",
  emojiVolume = 0.5,
  onEmojiVolumeChange,
  showEmojiVolumeControl = false,
}) {
  const panelRef = useRef(null);
  const timerRef = useRef(null);
  const emojiVolumeButtonRef = useRef(null);
  const [emojiVolumePopupWidth, setEmojiVolumePopupWidth] = useState(null);

  useLayoutEffect(() => {
    if (!showEmojiVolumeControl) {
      setEmojiVolumePopupWidth(null);
      return undefined;
    }

    function updateEmojiPopupWidth() {
      const buttonRect = emojiVolumeButtonRef.current?.getBoundingClientRect();
      const timerRect = timerRef.current?.getBoundingClientRect();

      if (!buttonRect || !timerRect) {
        setEmojiVolumePopupWidth(null);
        return;
      }

      const nextWidth = Math.max(0, Math.round(timerRect.left - buttonRect.right - 20));
      setEmojiVolumePopupWidth(nextWidth);
    }

    updateEmojiPopupWidth();

    const resizeObserver = new ResizeObserver(updateEmojiPopupWidth);

    if (panelRef.current) {
      resizeObserver.observe(panelRef.current);
    }

    if (timerRef.current) {
      resizeObserver.observe(timerRef.current);
    }

    if (emojiVolumeButtonRef.current) {
      resizeObserver.observe(emojiVolumeButtonRef.current);
    }

    window.addEventListener("resize", updateEmojiPopupWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateEmojiPopupWidth);
    };
  }, [showEmojiVolumeControl, time, name]);

  return (
    <div ref={panelRef} className="w-full flex items-center justify-between">
      <div className="mb-[-12px]">
        <UserInfo
          name={name}
          level={level}
          avatar={avatar}
          reaction={reaction}
          emojiVolume={emojiVolume}
          onEmojiVolumeChange={onEmojiVolumeChange}
          showEmojiVolumeControl={showEmojiVolumeControl}
          emojiVolumeButtonRef={emojiVolumeButtonRef}
          emojiVolumePopupWidth={emojiVolumePopupWidth}
        />
      </div>

      {showTimer ? (
        <div ref={timerRef}>
          <Timer time={time} isActive={timerIsActive} tone={timerTone} />
        </div>
      ) : null}
    </div>
  );
}
