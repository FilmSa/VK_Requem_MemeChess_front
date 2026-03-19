import Avatar from "../atoms/Avatar";
import Text from "../atoms/Text";

export default function UserInfo({ name, level, avatar }) {
  return (
    <div className="flex items-center gap-[10px] mb-[12px]">
      <div className="w-[54px] h-[54px] rounded-full overflow-hidden shrink-0 bg-white/20">
        <Avatar src={avatar} className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col justify-center">
        <Text
          className="font-medium text-[14px] leading-[1.2] text-[#ffff]"
          style={{ fontFamily: '"Unbounded", sans-serif' }}
        >
          {name}
        </Text>

        <Text
          className="font-medium text-[20px] leading-[1.2] text-[#ffd700]"
          style={{ fontFamily: '"Unbounded", sans-serif' }}
        >
          {level}
        </Text>
      </div>
    </div>
  );
}