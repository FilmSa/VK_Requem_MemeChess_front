import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth.js";
import { joinFriendInvite } from "../features/game/inviteApi.js";
import { savePlaySession } from "../features/game/playSession.js";

const containerClassName =
  "relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] px-4 py-8";

function resolveInviteError(error) {
  const status = error?.status ?? 0;

  if (status === 404) {
    return "Ссылка-приглашение недействительна.";
  }
  if (status === 410) {
    return "Срок действия ссылки-приглашения истёк.";
  }
  if (status === 409) {
    return error.message || "Эту ссылку больше нельзя использовать.";
  }

  return error?.message || "Не удалось подключиться по приглашению.";
}

export default function InvitePage() {
  const { token: inviteToken } = useParams();
  const navigate = useNavigate();
  const { token: authToken, isInitializing } = useAuth();

  const [screenState, setScreenState] = useState("joining");
  const [message, setMessage] = useState("Подготавливаем подключение...");

  useEffect(() => {
    if (isInitializing && authToken) {
      setScreenState("joining");
      setMessage("Проверяем вашу сессию...");
      return undefined;
    }

    if (!inviteToken) {
      setScreenState("error");
      setMessage("Ссылка-приглашение недействительна.");
      return undefined;
    }

    let cancelled = false;

    async function acceptInvite() {
      setScreenState("joining");
      setMessage(
        authToken
          ? "Подключаем вас к игре..."
          : "Создаём гостевую сессию и подключаем к игре..."
      );

      try {
        const response = await joinFriendInvite(inviteToken, authToken || "");
        if (cancelled) {
          return;
        }

        savePlaySession({
          gameId: response.gameId,
          inviteToken: response.inviteToken,
          sessionToken: response.sessionToken,
          player: response.player,
        });

        navigate(`/play?game=${encodeURIComponent(response.gameId)}`, {
          replace: true,
          state: {
            sessionToken: response.sessionToken,
            player: response.player,
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setScreenState("error");
        setMessage(resolveInviteError(error));
      }
    }

    acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [authToken, inviteToken, isInitializing, navigate]);

  return (
    <div className={containerClassName}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(114,86,190,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(114,86,190,0.14)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_78%,rgba(47,200,227,0.25),transparent_30%),radial-gradient(circle_at_50%_20%,rgba(255,0,200,0.18),transparent_24%)]" />

      <div className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#121533]/90 px-8 py-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
        <div className="text-[30px] font-semibold">Приглашение в игру</div>
        <div className="mt-3 text-[16px] leading-7 text-[#d5dcff]">
          {message}
        </div>

        {screenState === "joining" ? (
          <div className="mt-6 h-[10px] overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[45%] animate-pulse rounded-full bg-[#2fc8e3]" />
          </div>
        ) : (
          <div className="mt-8 flex gap-4">
            <Link
              to="/"
              className="rounded-[16px] bg-[#2fc8e3] px-5 py-3 text-[15px] font-medium text-[#06112c] no-underline"
            >
              На главную
            </Link>
            <Link
              to="/login"
              className="rounded-[16px] border border-white/15 px-5 py-3 text-[15px] font-medium text-white no-underline"
            >
              Войти
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
