import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import classicIcon from "../../../icons/classic.svg";
import rapidIcon from "../../../icons/Rapid.svg";
import blitzIcon from "../../../icons/Blitz.svg";
import bulletIcon from "../../../icons/Bullet.svg";
import startGameIcon from "../../../icons/startgame.svg";
import friendGameIcon from "../../../icons/friendgame.svg";
import topTabIcon from "../../../icons/sword.svg";
import customizeTabIcon from "../../../icons/bak.svg";
import arrowIcon from "../../../icons/arrow.svg";
import { useAuth } from "../../features/auth/useAuth.js";
import { createFriendInvite } from "../../features/game/inviteApi.js";
import { API_BASE_URL } from "../../shared/config/api.js";
import { createGameSocket } from "../../shared/ws/gameSocket.js";

const panelStyle = {
  width: 500,
  height: 811,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderTopLeftRadius: 40,
  borderBottomRightRadius: 40,
  background: "#2a1e5d",
  boxShadow:
    "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25)",
  fontFamily: '"Unbounded", sans-serif',
};

const textWhite = { color: "#ffffff" };

const tabItems = [
  { id: "new", label: "Новая партия", icon: topTabIcon },
  { id: "customize", label: "Кастомизация", icon: customizeTabIcon },
];

const gameCards = [
  {
    id: "classic",
    title: "Классика",
    time: "30+0",
    icon: classicIcon,
    background: "linear-gradient(121.87deg, #b700ff 0%, #6e0099 100%)",
  },
  {
    id: "rapid",
    title: "Рапид",
    time: "15+0",
    icon: rapidIcon,
    background: "linear-gradient(121.87deg, #ff00c8 0%, #990078 100%)",
  },
  {
    id: "blitz",
    title: "Блиц",
    time: "3+2",
    icon: blitzIcon,
    background: "linear-gradient(121.87deg, #16ceef 0%, #1f9fb5 100%)",
  },
  {
    id: "bullet",
    title: "Пуля",
    time: "1+0",
    icon: bulletIcon,
    background:
      "linear-gradient(120.45deg, rgba(255,36,39,0.75) 0.4%, rgba(177,25,27,0.75) 76.72%, rgba(153,21,24,0.75) 100%)",
  },
];

const customizeCards = [
  {
    id: "skin-classic",
    title: "Классика",
    time: "скин",
    icon: classicIcon,
    background: "linear-gradient(121.87deg, #b700ff 0%, #6e0099 100%)",
  },
  {
    id: "skin-rapid",
    title: "Рапид",
    time: "скин",
    icon: rapidIcon,
    background: "linear-gradient(121.87deg, #ff00c8 0%, #990078 100%)",
  },
  {
    id: "skin-blitz",
    title: "Блиц",
    time: "скин",
    icon: blitzIcon,
    background: "linear-gradient(121.87deg, #16ceef 0%, #1f9fb5 100%)",
  },
  {
    id: "skin-bullet",
    title: "Пуля",
    time: "скин",
    icon: bulletIcon,
    background:
      "linear-gradient(120.45deg, rgba(255,36,39,0.75) 0.4%, rgba(177,25,27,0.75) 76.72%, rgba(153,21,24,0.75) 100%)",
  },
];

const modeOptions = ["Классика", "Шахматы 916", "Царь горы"];

function formatInviteDeadline(expiresAt) {
  if (!expiresAt) {
    return "неизвестно";
  }

  const parsedDate = new Date(expiresAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "неизвестно";
  }

  return parsedDate.toLocaleString("ru-RU");
}

function InviteLobbyModal({ isOpen, inviteLobby, onCopy, onClose }) {
  if (!isOpen || !inviteLobby || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(4, 8, 23, 0.85)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#151a43_0%,#0b0f2b_100%)] text-[#fff] shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
        style={{
          width: "100%",
          maxWidth: 560,
          position: "relative",
          padding: "20px",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Крестик */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
        >
          ✕
        </button>

        <div className="flex items-start justify-between gap-[10px]">
          <div>
            <div className="text-[28px] font-semibold text-[#fff]">
              Ссылка готова
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#c8d5ff]">
              {inviteLobby.expired
                ? "Срок действия ссылки истек. Создайте новое приглашение."
                : inviteLobby.statusMessage}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-[#2fc8e3]/20 bg-[#121945] p-4">
          <div className="text-[12px] uppercase tracking-[0.2em] text-[#7ed8ff]">
            Ссылка-приглашение
          </div>
          <div className="mt-3 break-all text-[14px] leading-6 text-[#fff]">
            {inviteLobby.inviteUrl}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={onCopy}
            disabled={inviteLobby.expired}
            className="rounded-[16px] border-none bg-[#2fc8e3] px-5 py-3 text-[14px] font-medium text-[#06112c] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inviteLobby.copied ? "Скопировано" : "Скопировать ссылку"}
          </button>

          <div className="text-[13px] text-[#b9c8ff]">
            Действует до {formatInviteDeadline(inviteLobby.expiresAt)}
          </div>
        </div>

        {inviteLobby.connectionError ? (
          <div className="mt-5 rounded-[16px] border border-[#ff8b8b]/25 bg-[#321826] px-4 py-3 text-[13px] leading-6 text-[#ffd5d5]">
            {inviteLobby.connectionError}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export default function MainMenuPanel({ style }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, isAuthenticated, isInitializing } = useAuth();

  const [activeTab, setActiveTab] = useState("new");
  const [activeCard, setActiveCard] = useState("rapid");
  const [selectedMode, setSelectedMode] = useState("Классика");
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [memeMode, setMemeMode] = useState(true);
  const [depositFrom, setDepositFrom] = useState("");
  const [depositTo, setDepositTo] = useState("");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLobby, setInviteLobby] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const waitingSocketRef = useRef(null);

  const cards = useMemo(
    () => (activeTab === "new" ? gameCards : customizeCards),
    [activeTab]
  );

  function closeInviteSocket() {
    waitingSocketRef.current?.close();
    waitingSocketRef.current = null;
  }

  function clearInviteLobby() {
    closeInviteSocket();
    setInviteLobby(null);
    setIsInviteModalOpen(false);
  }

  function hideInviteModal() {
    setIsInviteModalOpen(false);
  }

  useEffect(() => {
    if (!isInviteModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        hideInviteModal();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isInviteModalOpen]);

  useEffect(() => {
    if (!inviteLobby?.expiresAt) {
      return undefined;
    }

    const deadline = new Date(inviteLobby.expiresAt).getTime();
    if (Number.isNaN(deadline)) {
      return undefined;
    }

    const timeoutMs = deadline - Date.now();
    if (timeoutMs <= 0) {
      setInviteLobby((current) =>
        current ? { ...current, expired: true } : current
      );
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setInviteLobby((current) =>
        current ? { ...current, expired: true } : current
      );
    }, timeoutMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [inviteLobby?.expiresAt]);

  useEffect(() => {
    if (!inviteLobby?.gameId || !token || !user?.id) {
      return undefined;
    }

    const client = createGameSocket({
      baseHttpUrl: API_BASE_URL,
      token,
      gameId: inviteLobby.gameId,
      userId: user.id,
      onOpen: () => {
        setInviteLobby((current) =>
          current
            ? {
                ...current,
                connectionError: "",
                statusMessage: "Ждем, пока друг откроет ссылку-приглашение...",
              }
            : current
        );
      },
      onJoined: (state) => {
        setInviteLobby((current) =>
          current
            ? {
                ...current,
                roomStatus: state?.status || current.roomStatus,
              }
            : current
        );
      },
      onState: (state) => {
        const hasSecondPlayer = Boolean(state?.player2_id);

        setInviteLobby((current) =>
          current
            ? {
                ...current,
                roomStatus: state?.status || current.roomStatus,
                connectionError: "",
                statusMessage: hasSecondPlayer
                  ? state?.status === "active"
                    ? "Друг подключился. Открываем игру..."
                    : "Друг вошел. Завершаем подключение комнаты..."
                  : "Ждем, пока друг откроет ссылку-приглашение...",
              }
            : current
        );

        if (hasSecondPlayer && state?.status === "active") {
          closeInviteSocket();
          setInviteLobby(null);
          setIsInviteModalOpen(false);
          navigate(`/play?game=${encodeURIComponent(state.game_id)}`);
        }
      },
      onError: (error) => {
        setInviteLobby((current) =>
          current
            ? {
                ...current,
                connectionError:
                  error?.message || "Не удалось удержать соединение с лобби.",
              }
            : current
        );
      },
      onClose: () => {
        if (waitingSocketRef.current === client) {
          waitingSocketRef.current = null;
        }
      },
    });

    waitingSocketRef.current = client;

    return () => {
      if (waitingSocketRef.current === client) {
        waitingSocketRef.current = null;
      }
      client.close();
    };
  }, [inviteLobby?.gameId, navigate, token, user?.id]);

  async function handleCreateInvite() {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsCreatingInvite(true);
    setInviteError("");
    clearInviteLobby();

    try {
      const response = await createFriendInvite(token);
      setInviteLobby({
        gameId: response.gameId,
        inviteToken: response.inviteToken,
        inviteUrl: response.inviteUrl,
        expiresAt: response.expiresAt,
        copied: false,
        expired: false,
        roomStatus: response.status,
        statusMessage: "Подготавливаем лобби...",
        connectionError: "",
      });
      setIsInviteModalOpen(true);
    } catch (error) {
      setInviteError(error.message || "Не удалось создать ссылку-приглашение.");
      setIsInviteModalOpen(false);
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function handleCopyInvite() {
    if (!inviteLobby?.inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLobby.inviteUrl);
      setInviteLobby((current) =>
        current ? { ...current, copied: true } : current
      );
    } catch {
      setInviteLobby((current) =>
        current
          ? {
              ...current,
              connectionError: "Не удалось скопировать ссылку. Скопируйте ее вручную.",
            }
          : current
      );
    }
  }

  return (
    <>
      <section style={{ ...panelStyle, ...style }}>
        <div className="relative flex h-[74px] items-start">
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#201149]" />
          {tabItems.map((tab, index) => {
            const isActive = tab.id === activeTab;
            const isRightTab = index === 1;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsModeOpen(false);
                  setActiveCard(tab.id === "new" ? "rapid" : "skin-classic");
                }}
                className={`relative flex h-[74px] items-center justify-center gap-[10px] border-none px-[14px] ${
                  isRightTab ? "w-[250px] rounded-tl-[40px]" : "w-[250px]"
                }`}
                style={{
                  background: isActive ? "transparent" : "#0b0f2b",
                  boxShadow: isActive ? "none" : "inset 0 4px 4px rgba(0,0,0,0.25)",
                }}
              >
                <span style={{ ...textWhite, fontSize: 20, fontWeight: 400 }}>
                  {tab.label}
                </span>
                <img
                  src={tab.icon}
                  alt=""
                  className="object-contain brightness-0 invert"
                  style={{
                    width: isRightTab ? 24 : 30,
                    height: isRightTab ? 24 : 30,
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between p-[10px] pt-[18px]">
          <div className="grid h-[300px] grid-cols-2 gap-[10px] overflow-hidden rounded-br-[40px] rounded-tl-[40px] px-[10px] pb-[10px] pt-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)]">
            {cards.map((card, index) => {
              const isSelected = activeCard === card.id;
              const radiusClass =
                index === 0
                  ? "rounded-br-[35px] rounded-tl-[35px]"
                  : index === 1
                    ? "rounded-bl-[35px] rounded-tr-[35px]"
                    : index === 2
                      ? "rounded-bl-[35px] rounded-tr-[35px]"
                      : "rounded-br-[35px] rounded-tl-[35px]";

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveCard(card.id)}
                  className={`relative flex items-center justify-center overflow-hidden border-none p-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] ${radiusClass}`}
                  style={{
                    background: card.background,
                    boxShadow: isSelected
                      ? "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25), inset 0 0 0 4px #ffffff"
                      : "0 4px 4px rgba(0,0,0,0.25), inset 0 4px 4px rgba(0,0,0,0.25)",
                  }}
                >
                  <div className="flex w-full items-center justify-center gap-[10px]">
                    <div
                      className="w-[138px] text-left leading-[1.05]"
                      style={{ ...textWhite, fontSize: 31, fontWeight: 500 }}
                    >
                      <div>{card.title}</div>
                      <div>{card.time}</div>
                    </div>
                    <img
                      src={card.icon}
                      alt=""
                      className="object-contain"
                      style={{ width: 78, height: 78 }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-[10px] rounded-br-[40px] rounded-tl-[40px] bg-[#2a1e5d] px-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)]">
            <div className="relative flex items-center justify-between px-[10px] py-[8px]">
              <span style={{ ...textWhite, fontSize: 31, fontWeight: 500 }}>
                Режим:
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModeOpen((value) => !value)}
                  className="flex h-[61px] min-w-[225px] items-center justify-between rounded-[15px] border-none bg-[#0b0f2b] px-[16px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)]"
                >
                  <span style={{ ...textWhite, fontSize: 30, fontWeight: 500 }}>
                    {selectedMode}
                  </span>
                  <img
                    src={arrowIcon}
                    alt=""
                    className={`h-[50px] w-[50px] transition-transform ${
                      isModeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isModeOpen ? (
                  <div className="absolute right-0 top-[68px] z-20 flex min-w-full flex-col overflow-hidden rounded-[15px] bg-[#0b0f2b] shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                    {modeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedMode(option);
                          setIsModeOpen(false);
                        }}
                        className="border-none px-4 py-3 text-left"
                        style={{
                          ...textWhite,
                          fontSize: 20,
                          fontWeight: 500,
                          background:
                            option === selectedMode ? "#171a45" : "transparent",
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex h-[68px] items-center justify-between px-[10px] py-[8px]">
              <span style={{ ...textWhite, fontSize: 31, fontWeight: 500 }}>
                Мем-режим:
              </span>
              <button
                type="button"
                onClick={() => setMemeMode((value) => !value)}
                aria-pressed={memeMode}
                className="relative h-[36px] w-[72px] overflow-hidden rounded-[15px] border-none shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)]"
                style={{ background: "#0b0f2b" }}
              >
                <span
                  className="absolute top-[1px] h-[34px] w-[34px] rounded-[15px] transition-all duration-200"
                  style={{
                    left: memeMode ? 37 : 1,
                    background: memeMode ? "#10de17" : "#9ea3b2",
                  }}
                />
              </button>
            </div>

            <div className="flex h-[68px] items-center justify-between px-[10px] py-[8px]">
              <span style={{ ...textWhite, fontSize: 31, fontWeight: 500 }}>
                Депозит:
              </span>
              <div className="flex w-[210px] items-center justify-between py-[6px]">
                <input
                  type="text"
                  value={depositFrom}
                  onChange={(event) => setDepositFrom(event.target.value)}
                  placeholder="От"
                  className="h-[36px] w-[98px] rounded-bl-[15px] rounded-tl-[15px] rounded-tr-[15px] border-none bg-[#0b0f2b] px-[14px] outline-none shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] placeholder:text-[#a2a2a2]"
                  style={{ ...textWhite, fontSize: 20, fontWeight: 500 }}
                />
                <input
                  type="text"
                  value={depositTo}
                  onChange={(event) => setDepositTo(event.target.value)}
                  placeholder="До"
                  className="h-[36px] w-[98px] rounded-br-[15px] rounded-tl-[15px] rounded-tr-[15px] border-none bg-[#0b0f2b] px-[14px] outline-none shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] placeholder:text-[#a2a2a2]"
                  style={{ ...textWhite, fontSize: 20, fontWeight: 500 }}
                />
              </div>
            </div>
          </div>

          <div className="mt-[12px] flex flex-col gap-[10px]">
            <button
              type="button"
              onClick={() => navigate("/play")}
              className="flex items-center justify-between rounded-br-[20px] rounded-tl-[20px] border-none bg-[#2fc8e3] px-[20px] py-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)]"
            >
              <span
                style={{
                  ...textWhite,
                  fontFamily: '"Unbounded", sans-serif',
                  fontSize: 27,
                  fontWeight: 500,
                }}
              >
                Начать партию
              </span>
              <img
                src={startGameIcon}
                alt=""
                className="object-contain"
                style={{ width: 49, height: 49 }}
              />
            </button>

            <button
              type="button"
              onClick={handleCreateInvite}
              disabled={isCreatingInvite || isInitializing}
              className="flex items-center justify-between rounded-br-[20px] rounded-tl-[20px] border-none bg-[#ff00c8] px-[20px] py-[10px] shadow-[0_4px_4px_rgba(0,0,0,0.25),inset_0_4px_4px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                style={{
                  ...textWhite,
                  fontFamily: '"Unbounded", sans-serif',
                  fontSize: 27,
                  fontWeight: 500,
                }}
              >
                {isCreatingInvite ? "Создаем ссылку..." : "Сыграть с другом"}
              </span>
              <img
                src={friendGameIcon}
                alt=""
                className="object-contain"
                style={{ width: 49, height: 49 }}
              />
            </button>

            {inviteError ? (
              <div className="rounded-br-[20px] rounded-tl-[20px] border border-[#ff8cca]/40 bg-[#3b1744] px-[18px] py-[14px] text-[14px] text-[#ffd8f3]">
                {inviteError}
              </div>
            ) : null}

          </div>
        </div>
      </section>

      <InviteLobbyModal
        isOpen={isInviteModalOpen}
        inviteLobby={inviteLobby}
        onCopy={handleCopyInvite}
        onClose={hideInviteModal}
      />
    </>
  );
}
