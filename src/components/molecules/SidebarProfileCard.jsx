import { Link, useNavigate } from "react-router-dom";

const fallbackAvatar = "/images/default-avatar.png";

export default function SidebarProfileCard({
  user,
  isAuthenticated,
  onLogout,
}) {
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    function handleGuestClick() {
      navigate("/login");
    }

    function stopPropagation(event) {
      event.stopPropagation();
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleGuestClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleGuestClick();
          }
        }}
        className="w-[207px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,22,74,0.96)_0%,rgba(13,18,52,0.96)_100%)] p-[16px] shadow-[0_16px_36px_rgba(0,0,0,0.28)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-dashed border-[#58dfff]/45 bg-[#102149] text-[22px] font-semibold text-[#8eeeff]">
            ?
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold text-white">
              Гость
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.35] text-[#b7c7ea]">
              Войдите, чтобы открыть профиль и сохранить аккаунт.
            </p>
          </div>
        </div>

        <div className="mt-[14px] flex min-w-0 gap-[8px]">
          <Link
            to="/login"
            onClick={stopPropagation}
            className="min-w-0 flex-1 rounded-[16px] bg-[#2fc8e3] px-[10px] py-[10px] text-center text-[13px] font-semibold text-[#08112d] no-underline transition hover:brightness-105"
          >
            Войти
          </Link>
          <Link
            to="/register"
            onClick={stopPropagation}
            className="min-w-0 flex-1 rounded-[16px] border border-[#ff7ae1]/55 bg-[#3c1850] px-[10px] py-[10px] text-center text-[13px] font-semibold text-[#ffd4f5] no-underline transition hover:border-[#ff9deb]"
          >
            Регистрация
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[207px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,22,74,0.96)_0%,rgba(13,18,52,0.96)_100%)] p-[16px] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={user.avatar_url || fallbackAvatar}
          alt={`Аватар ${user.username}`}
          className="h-[52px] w-[52px] shrink-0 rounded-full border border-white/20 object-cover shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-[#fff] px-[20px]">
            {user.username}
          </p>
        </div>
      </div>

      <div className="mt-[14px] flex min-w-0 gap-[8px]">
        <Link
          to="/profile"
          className="min-w-0 flex-1 rounded-[16px] bg-[#2fc8e3] px-[10px] py-[10px] text-center text-[13px] font-semibold text-[#fff] no-underline transition hover:brightness-105"
        >
          Профиль
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="min-w-0 flex-1 rounded-[16px] border border-white/12 bg-[#1a1636] px-[10px] py-[10px] text-[13px] font-semibold text-[#f4f7ff] transition hover:border-[#58dfff]/35 hover:text-white"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
