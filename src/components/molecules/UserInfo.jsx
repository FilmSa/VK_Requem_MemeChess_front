import Avatar from "../atoms/Avatar";
import Text from "../atoms/Text";

export default function UserInfo({ name, level, avatar }) {
  return (
    <div className="mb-[12px] flex items-center gap-[10px]">
      <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-white/20">
        <Avatar src={avatar} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col justify-center">
        <Text
          className="text-[14px] font-medium leading-[1.2] text-[#ffff]"
          style={{ fontFamily: '"Unbounded", sans-serif' }}
        >
          {name}
        </Text>

        {level ? (
          <Text
            className="text-[20px] font-medium leading-[1.2] text-[#ffd700]"
            style={{ fontFamily: '"Unbounded", sans-serif' }}
          >
            {level}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
