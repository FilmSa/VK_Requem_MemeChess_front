import CurrencyBadge from "./Currency.jsx";
import { useCurrencyConvertModal } from "../../features/shop/useCurrencyConvertModal.js";
import { withAssetBase } from "../../shared/lib/assets.js";
import { buildAppHref } from "../../shared/router/buildAppHref.js";
import { useReliableNavigate } from "../../shared/router/useReliableNavigate.js";

const fallbackAvatar = withAssetBase("/images/default-avatar.png");
const crownsIcon = withAssetBase("/icons/crown.svg");
const ratingIcon = withAssetBase("/icons/rock.svg");

function buildCardStyle() {
  return {
    border: "1px solid var(--sidebar-card-border)",
    background: "var(--sidebar-card-background)",
    boxShadow: "var(--sidebar-card-shadow)",
    color: "var(--color-text)",
  };
}

function trimDecimal(value) {
  return Number(value.toFixed(value >= 10 ? 0 : 1))
    .toString()
    .replace(".", ",");
}

function formatCompactCurrency(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    return `${trimDecimal(value / 1_000_000_000)}ккк`;
  }

  if (absValue >= 1_000_000) {
    return `${trimDecimal(value / 1_000_000)}кк`;
  }

  if (absValue >= 1_000) {
    return `${trimDecimal(value / 1_000)}к`;
  }

  return new Intl.NumberFormat("ru-RU").format(value);
}

export default function SidebarProfileCard({
  user,
  isAuthenticated,
  onLogout,
  onPreloadProfile,
  onPreloadShop,
}) {
  const { openCurrencyConvertModal } = useCurrencyConvertModal();
  const reliableNavigate = useReliableNavigate();

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
        className="w-full overflow-hidden rounded-[24px] p-[16px]"
        style={buildCardStyle()}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] border border-dashed text-[22px] font-semibold"
            style={{
              borderColor: "var(--sidebar-guest-border)",
              background: "var(--sidebar-guest-background)",
              color: "var(--sidebar-guest-color)",
            }}
          >
            ?
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold">Гость</p>
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
            className="min-w-0 flex-1 rounded-[16px] px-[10px] py-[10px] text-center text-[13px] font-semibold no-underline transition duration-150 hover:-translate-y-[2px] hover:brightness-105 focus-visible:-translate-y-[2px]"
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

  async function navigateWithPreload(to, preload) {
    try {
      await preload?.();
    } catch {
      // Ignore preload failures and continue with navigation.
    }

    reliableNavigate(to);
  }

  return (
    <div
      className="w-full overflow-hidden rounded-[24px] p-[16px]"
      style={buildCardStyle()}
    >
      <div className="flex flex-col gap-[12px]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            void navigateWithPreload("/profile", onPreloadProfile);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              void navigateWithPreload("/profile", onPreloadProfile);
            }
          }}
          onMouseEnter={() => {
            void onPreloadProfile?.();
          }}
          onFocus={() => {
            void onPreloadProfile?.();
          }}
          className="flex min-w-0 items-center gap-3 no-underline transition-transform duration-150 hover:-translate-y-[2px] focus-visible:-translate-y-[2px]"
          style={{ background: "transparent", border: 0, padding: 0, textAlign: "left" }}
        >
          <img
            src={user.avatar_url || fallbackAvatar}
            alt={`Аватар ${user.username}`}
            className="h-[64px] w-[64px] shrink-0 rounded-[18px] object-cover"
            style={{
              border: "1px solid var(--sidebar-avatar-border)",
              boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
            }}
          />

          <div className="mt-[10px] flex h-[64px] min-w-0 flex-1 flex-col justify-between pl-[10px]">
            <p
              className="m-0 truncate text-[16px] font-semibold"
              style={{ color: "var(--color-text)", margin: 0 }}
            >
              {user.username}
            </p>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onLogout();
              }}
              className="flex h-[32px] w-fit items-center justify-center rounded-[12px] border px-[12px] text-[12px] font-semibold transition duration-150 hover:-translate-y-[2px] hover:brightness-110 focus-visible:-translate-y-[2px]"
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

        <div className="flex gap-[3px]">
          <div className="min-w-0 flex-1">
            <CurrencyBadge
              onClick={openCurrencyConvertModal}
              icon={crownsIcon}
              value={formatCompactCurrency(Number(user.shop_funds ?? 0))}
              background="linear-gradient(135deg, rgba(146, 60, 222, 0.98) 0%, rgba(82, 29, 155, 0.98) 100%)"
              borderColor="rgba(242, 182, 255, 0.52)"
              textColor="#fff4c7"
              className="py-[11px]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <CurrencyBadge
              onClick={() => {
                void navigateWithPreload("/shop", onPreloadShop);
              }}
              icon={ratingIcon}
              value={formatCompactCurrency(Number(user.game_funds ?? 0))}
              background="linear-gradient(135deg, rgba(92, 43, 182, 0.98) 0%, rgba(47, 20, 118, 0.98) 100%)"
              borderColor="rgba(176, 164, 255, 0.38)"
              textColor="#e8dbff"
              className="py-[11px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
