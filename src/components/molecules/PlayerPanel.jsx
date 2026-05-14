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
  return (
    <div className="w-full flex items-center justify-between">
      <div className="mb-[-12px]">
        <UserInfo
          name={name}
          level={level}
          avatar={avatar}
          reaction={reaction}
          emojiVolume={emojiVolume}
          onEmojiVolumeChange={onEmojiVolumeChange}
          showEmojiVolumeControl={showEmojiVolumeControl}
        />
      </div>

      {showTimer ? (
        <Timer time={time} isActive={timerIsActive} tone={timerTone} />
      ) : null}
    </div>
  );
}
