import UserInfo from "./UserInfo.jsx";
import Timer from "./Timer.jsx";

export default function PlayerPanel({
  name,
  level,
  avatar,
  time = "15:00",
  reaction,
}) {
  return (
    <div className="w-full flex items-center justify-between">
      <div className="mb-[-12px]">
        <UserInfo name={name} level={level} avatar={avatar} reaction={reaction} />
      </div>

      <Timer time={time} />
    </div>
  );
}
