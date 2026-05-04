import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { joinFriendInvite } from "../inviteApi.js";
import { savePlaySession } from "../playSession.js";

function resolveInviteError(error) {
  const status = error?.status ?? 0;

  if (status === 404) {
    return "Ссылка-приглашение недействительна.";
  }
  if (status === 410) {
    return "Срок действия ссылки-приглашения истек.";
  }
  if (status === 409) {
    return error.message || "Эту ссылку больше нельзя использовать.";
  }

  return error?.message || "Не удалось подключиться по приглашению.";
}

export function useInviteAcceptance(inviteToken) {
  const navigate = useNavigate();
  const { token: authToken, isInitializing } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isInitializing && authToken) {
      return undefined;
    }

    if (!inviteToken) {
      return undefined;
    }

    let cancelled = false;

    async function acceptInvite() {
      try {
        const response = await joinFriendInvite(inviteToken, authToken || "");
        if (cancelled) {
          return;
        }

        savePlaySession({
          gameId: response.gameId,
          inviteToken: response.inviteToken,
          match: {
            gameMode: response.gameMode,
            timeControlId: response.timeControlId,
          },
          sessionToken: response.sessionToken,
          player: response.player,
        });

        navigate(`/play?game=${encodeURIComponent(response.gameId)}`, {
          replace: true,
          state: {
            match: {
              gameMode: response.gameMode,
              timeControlId: response.timeControlId,
            },
            sessionToken: response.sessionToken,
            player: response.player,
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(resolveInviteError(error));
      }
    }

    acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [authToken, inviteToken, isInitializing, navigate]);

  const screenState = errorMessage || !inviteToken ? "error" : "joining";
  const message = errorMessage
    ? errorMessage
    : !inviteToken
      ? "Ссылка-приглашение недействительна."
      : isInitializing && authToken
        ? "Проверяем вашу активную сессию..."
        : authToken
          ? "Подключаем вас к игре..."
          : "Создаем гостевую сессию и подключаем к игре...";

  return {
    screenState,
    message,
  };
}
