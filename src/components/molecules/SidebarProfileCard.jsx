import ThemeSwitch from "../atoms/ThemeSwitch.jsx";
import { useTheme } from "../../features/theme/useTheme.js";
import { withAssetBase } from "../../shared/lib/assets.js";
import { buildAppHref } from "../../shared/router/buildAppHref.js";

const fallbackAvatar = withAssetBase("/images/default-avatar.png");

function buildCardStyle() {
  return {
    border: "1px solid var(--sidebar-card-border)",
    background: "var(--sidebar-card-background)",
    boxShadow: "var(--sidebar-card-shadow)",
    color: "var(--color-text)",
  };
}

export default function SidebarProfileCard({
  user,
  isAuthenticated,
  onLogout,
}) {
  const { isLightTheme, toggleTheme } = useTheme();

  if (!isAuthenticated || !user) {
    function handleGuestClick() {
      window.location.assign(buildAppHref("/login"));
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
        className="w-[207px] overflow-hidden rounded-[24px] p-[16px]"
        style={buildCardStyle()}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-dashed text-[22px] font-semibold"
            style={{
              borderColor: "var(--sidebar-guest-border)",
              background: "var(--sidebar-guest-background)",
              color: "var(--sidebar-guest-color)",
            }}
          >
            ?
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[17px] font-semibold">Гость</p>
              <ThemeSwitch checked={isLightTheme} onToggle={toggleTheme} />
            </div>
            <p
              className="mt-1 line-clamp-2 text-[12px] leading-[1.35]"
              style={{ color: "var(--color-text-muted)" }}
            >
              Войдите, чтобы открыть профиль и сохранить аккаунт.
            </p>
          </div>
        </div>

        <div className="mt-[14px] flex min-w-0 gap-[8px]">
          <a
            href={buildAppHref("/login")}
            onClick={stopPropagation}
            className="min-w-0 flex-1 rounded-[16px] px-[10px] py-[10px] text-center text-[13px] font-semibold no-underline transition hover:brightness-105"
            style={{
              background: "var(--sidebar-primary-button-bg)",
              color: "var(--sidebar-primary-button-text)",
            }}
          >
            Войти
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[207px] overflow-hidden rounded-[24px] p-[16px]"
      style={buildCardStyle()}
    >
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={user.avatar_url || fallbackAvatar}
          alt={`Аватар ${user.username}`}
          className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
          style={{
            border: "1px solid var(--sidebar-avatar-border)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate px-[6px] text-[16px] font-semibold">
              {user.username}
            </p>
          </div>
          <ThemeSwitch checked={isLightTheme} onToggle={toggleTheme} />
        </div>
      </div>

      <div className="mt-[14px] flex min-w-0 gap-[8px]">
        <a
          href={buildAppHref("/profile")}
          className="min-w-0 flex-1 rounded-[16px] px-[10px] py-[10px] text-center text-[13px] font-semibold no-underline transition hover:brightness-105"
          style={{
            background: "var(--sidebar-primary-button-bg)",
            color: "var(--sidebar-primary-button-text)",
          }}
        >
          Профиль
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="min-w-0 flex-1 rounded-[16px] border px-[10px] py-[10px] text-[13px] font-semibold transition"
          style={{
            borderColor: "var(--sidebar-secondary-button-border)",
            background: "var(--sidebar-secondary-button-bg)",
            color: "var(--sidebar-secondary-button-text)",
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
