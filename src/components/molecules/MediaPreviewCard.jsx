import { useEffect, useRef } from "react";

export default function MediaPreviewCard({
  title,
  imageSrc,
  videoSrc,
  onClick,
  disabled = false,
  className = "",
  isSelected = false,
  cornerStyle = "rounded",
  ariaPressed,
  previewTime = 0.05,
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

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoSrc) {
      return undefined;
    }

    function showPreviewFrame() {
      if (Number.isFinite(previewTime) && previewTime > 0) {
        try {
          videoElement.currentTime = previewTime;
        } catch {
          videoElement.currentTime = 0;
        }
      } else {
        videoElement.currentTime = 0;
      }

      videoElement.pause();
      videoElement.muted = true;
    }

    function handleLoadedData() {
      showPreviewFrame();
    }

    videoElement.addEventListener("loadeddata", handleLoadedData);

    return () => {
      videoElement.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [previewTime, videoSrc]);

  function playVideo(videoElement = videoRef.current) {
    if (!videoElement || disabled || !videoSrc) {
      return;
    }

    videoElement.currentTime = 0;
    videoElement.muted = true;
    const playAttempt = videoElement.play();
    if (playAttempt?.catch) {
      playAttempt.catch(() => {});
    }
  }

  function pauseVideo(videoElement = videoRef.current) {
    if (!videoElement || !videoSrc) {
      return;
    }

    videoElement.pause();
    videoElement.muted = true;

    try {
      videoElement.currentTime = previewTime > 0 ? previewTime : 0;
    } catch {
      videoElement.currentTime = 0;
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
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
            preload="auto"
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
