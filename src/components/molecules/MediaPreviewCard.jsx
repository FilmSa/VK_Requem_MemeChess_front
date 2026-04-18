import { useRef } from "react";

export default function MediaPreviewCard({
  title,
  imageSrc,
  videoSrc,
  onClick,
  className = "",
  isSelected = false,
  cornerStyle = "rounded",
  ariaPressed,
}) {
  const videoRef = useRef(null);

  const radiusStyle =
    cornerStyle === "diagonal"
      ? {
          borderTopLeftRadius: 20,
          borderBottomRightRadius: 20,
        }
      : {
          borderRadius: 20,
        };

  function playVideo(videoElement = videoRef.current) {
    if (!videoElement) return;

    const playAttempt = videoElement.play();
    if (playAttempt?.catch) {
      playAttempt.catch(() => {});
    }
  }

  function pauseVideo(videoElement = videoRef.current) {
    if (!videoElement) return;
    videoElement.pause();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      onMouseEnter={() => playVideo()}
      onMouseLeave={() => pauseVideo()}
      onFocus={() => playVideo()}
      onBlur={() => pauseVideo()}
      className={className}
      title={title}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "150 / 92",
        overflow: "hidden",
        border: "none",
        padding: 0,
        background: "#0B0F2B",
        boxShadow: isSelected
          ? "0 0 0 2px #FFFFFF"
          : "0 4px 4px rgba(0, 0, 0, 0.25)",
        ...radiusStyle,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: "#0B0F2B",
          ...radiusStyle,
        }}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
              objectPosition: "center",
              background: "#0B0F2B",
            }}
          />
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : null}
      </div>
    </button>
  );
}