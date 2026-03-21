import UserInfo from "./UserInfo";
import Timer from "./Timer";

export default function PlayerPanel({ name, level, avatar, time = "15:00" }) {
  return (
    <div className="w-full flex items-center justify-between">
      <div className="mb-[-12px]">
        <UserInfo name={name} level={level} avatar={avatar} />
      </div>

      <Timer time={time} />
    </div>
  );
}