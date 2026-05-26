import { useIsMobile } from "../shared/hooks/useMediaQuery.js";
import MobileBottomNav from "../shared/ui/organisms/MobileBottomNav.jsx";
import { withAssetBase } from "../shared/lib/assets.js";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import { useAuth } from "../features/auth/useAuth.js";

export default function FavoritesPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const shopFunds = user?.shop_funds ?? 0;
  const gameFunds = user?.game_funds ?? 0;

  if (isMobile) {
    return (
      <div className="mobile-page">
        <div className="mobile-page__topbar">
          <div className="mobile-page__topbar-left">
            <span className="mobile-page__topbar-logo">Pawn Requiem</span>
            <span className="mobile-page__topbar-sub">Meme Chess</span>
          </div>
        </div>
        <div className="mobile-page__currency-row">
          <div className="mobile-page__currency-pill mobile-page__currency-pill--gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>{shopFunds}</span>
          </div>
          <div className="mobile-page__currency-pill mobile-page__currency-pill--purple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>{gameFunds}</span>
          </div>
        </div>
        <div className="mobile-page__content">
          <h1 className="mobile-page-title">Избранное</h1>
          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Этот раздел пока пуст. Добавляйте сюда любимые наборы фигур, доски и эмоции из магазина.
          </p>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <div className="app-page__grid">
        <AppSidebar />
        <main className="flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden px-[clamp(20px,3vw,60px)] py-[clamp(16px,2.2vh,24px)]">
          <div
            className="w-full max-w-[620px] rounded-[28px] border px-8 py-8 text-center"
            style={{
              borderColor: "var(--status-card-border)",
              background: "var(--status-card-background)",
              boxShadow: "var(--status-card-shadow)",
            }}
          >
            <h1 className="text-[30px] font-semibold" style={{ margin: 0 }}>Избранное</h1>
            <p className="mt-4 text-[16px] leading-7" style={{ color: "var(--color-text-muted)" }}>
              Этот раздел пока пуст.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}