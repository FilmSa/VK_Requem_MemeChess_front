import { Link, useParams } from "react-router-dom";
import { useInviteAcceptance } from "../features/game/model/useInviteAcceptance.js";

export default function InvitePage() {
  const { token: inviteToken } = useParams();
  const { screenState, message } = useInviteAcceptance(inviteToken);

  return (
    <div className="auth-screen w-screen px-4 py-8">
      <div
        className="relative z-10 w-full max-w-[520px] rounded-[28px] border px-8 py-8"
        style={{
          borderColor: "var(--status-card-border)",
          background: "var(--status-card-background)",
          boxShadow: "var(--status-card-shadow)",
        }}
      >
        <div className="text-[30px] font-semibold">РџСЂРёРіР»Р°С€РµРЅРёРµ РІ РёРіСЂСѓ</div>
        <div
          className="mt-3 text-[16px] leading-7"
          style={{ color: "var(--color-text-muted)" }}
        >
          {message}
        </div>

        {screenState === "joining" ? (
          <div
            className="mt-6 h-[10px] overflow-hidden rounded-full"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full w-[45%] animate-pulse rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
          </div>
        ) : (
          <div className="mt-8 flex gap-4">
            <Link
              to="/"
              className="rounded-[16px] px-5 py-3 text-[15px] font-medium no-underline"
              style={{
                background: "var(--color-accent)",
                color: "#ffffff",
              }}
            >
              РќР° РіР»Р°РІРЅСѓСЋ
            </Link>
            <Link
              to="/login"
              className="rounded-[16px] border px-5 py-3 text-[15px] font-medium no-underline"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              Р’РѕР№С‚Рё
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
