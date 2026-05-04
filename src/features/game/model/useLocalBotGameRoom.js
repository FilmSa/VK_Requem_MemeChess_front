import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { readPlaySession } from "../playSession.js";
import {
  readLocalBotGameState,
  saveLocalBotGameState,
} from "../localBotStorage.js";
import { createClientBotClient } from "../bot/clientBotClient.js";

const LOCAL_BOT_USER_ID = "local-bot";
const LOCAL_GUEST_USER_ID = "local-player";
const LOCAL_BOT_NAME = "MemeBot";
const LOCAL_PLAYER_NAME = "Игрок";
const BOT_THINK_DELAY_MS = 280;

function normalizeBotDifficulty(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }
  return "easy";
}

function normalizeLocalBotConfig(config) {
  if (!config || typeof config !== "object") {
    return null;
  }

  if (!config.enabled || config.computeMode !== "client") {
    return null;
  }

  const gameMode = String(config.gameMode || "classic").trim().toLowerCase();
  if (gameMode !== "classic") {
    return null;
  }

  return {
    enabled: true,
    computeMode: "client",
    gameMode,
    difficulty: normalizeBotDifficulty(config.difficulty),
  };
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  return {
    id: String(profile.id || "").trim(),
    username: String(profile.username || "").trim(),
    avatar_url: String(profile.avatar_url || "").trim(),
  };
}

function buildLocalPlayerProfile(profile) {
  const normalizedProfile = normalizeProfile(profile);
  if (normalizedProfile?.id) {
    return normalizedProfile;
  }

  return {
    id: LOCAL_GUEST_USER_ID,
    username: LOCAL_PLAYER_NAME,
    avatar_url: "",
  };
}

function createLocalBotProfile() {
  return {
    id: LOCAL_BOT_USER_ID,
    username: LOCAL_BOT_NAME,
    avatar_url: "",
  };
}

function resolveGameModeLabel(gameMode) {
  switch (gameMode) {
    case "classic":
      return "Классика";
    case "fischer":
      return "Фишер";
    case "evolution":
      return "Эволюция";
    default:
      return "Классика";
  }
}

function serializeMove({ from, to, promotion }) {
  const source = String(from || "").trim().toLowerCase();
  const target = String(to || "").trim().toLowerCase();
  const normalizedPromotion =
    typeof promotion === "string" && /^[qrbn]$/i.test(promotion.trim())
      ? promotion.trim().toLowerCase()
      : "";

  if (!/^[a-h][1-8]$/.test(source) || !/^[a-h][1-8]$/.test(target)) {
    return "";
  }

  return `${source}${target}${normalizedPromotion}`;
}

function parseUciMove(move) {
  const normalized = String(move || "").trim().toLowerCase();
  const match = normalized.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);

  if (!match) {
    return null;
  }

  return {
    from: match[1],
    to: match[2],
    promotion: match[3] || undefined,
  };
}

function normalizeMovePayload(move) {
  if (typeof move === "string") {
    const normalized = move.trim().toLowerCase();
    return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(normalized) ? normalized : "";
  }

  if (!move || typeof move !== "object") {
    return "";
  }

  return serializeMove(move);
}

function buildLegalMoves(chess) {
  return chess.moves({ verbose: true }).map((move) => serializeMove(move)).filter(Boolean);
}

function resolveFinishedState(chess, lastMoverId, player1Id, player2Id) {
  if (chess.isCheckmate()) {
    return {
      status: "finished",
      winner_id: lastMoverId,
      finished_reason: "checkmate",
      current_turn_user_id: chess.turn() === "w" ? player1Id : player2Id,
    };
  }

  if (chess.isStalemate()) {
    return {
      status: "finished",
      winner_id: "",
      finished_reason: "stalemate",
      current_turn_user_id: "",
    };
  }

  if (chess.isInsufficientMaterial()) {
    return {
      status: "finished",
      winner_id: "",
      finished_reason: "insufficient_material",
      current_turn_user_id: "",
    };
  }

  if (chess.isThreefoldRepetition()) {
    return {
      status: "finished",
      winner_id: "",
      finished_reason: "threefold_repetition",
      current_turn_user_id: "",
    };
  }

  if (chess.isDraw()) {
    return {
      status: "finished",
      winner_id: "",
      finished_reason: "draw",
      current_turn_user_id: "",
    };
  }

  return {
    status: "active",
    winner_id: "",
    finished_reason: "",
    current_turn_user_id: chess.turn() === "w" ? player1Id : player2Id,
  };
}

function buildMoveEntry(move, userId, number, chess) {
  return {
    number,
    user_id: userId,
    move: serializeMove(move),
    fen: chess.fen(),
    is_capture: Boolean(move.captured),
    is_check: chess.inCheck(),
    is_checkmate: chess.isCheckmate(),
  };
}

function createInitialRoomState({ gameId, playerProfile, difficulty }) {
  const chess = new Chess();

  return {
    game_id: gameId,
    game_mode: "classic",
    time_control_id: "unlimited",
    time_control_label: "",
    time_control_base_ms: 0,
    time_control_increment_ms: 0,
    player1_remaining_ms: 0,
    player2_remaining_ms: 0,
    current_turn_started_at: "",
    player1_id: playerProfile.id,
    player2_id: LOCAL_BOT_USER_ID,
    player1_connected: true,
    player2_connected: true,
    status: "active",
    current_turn_user_id: playerProfile.id,
    bet_amount: 0,
    draw_offered_by: "",
    initial_fen: chess.fen(),
    fen: chess.fen(),
    last_move: "",
    winner_id: "",
    finished_reason: "",
    bot_game: true,
    bot_difficulty: difficulty,
    legal_moves: buildLegalMoves(chess),
    moves: [],
  };
}

function applySerializedMove(roomState, serializedMove, actorId) {
  if (!roomState || !serializedMove) {
    return null;
  }

  if (roomState.status !== "active" || roomState.current_turn_user_id !== actorId) {
    return null;
  }

  const chess = new Chess(roomState.fen || roomState.initial_fen);
  const moveRequest = parseUciMove(serializedMove);
  const moveResult = moveRequest ? chess.move(moveRequest) : null;

  if (!moveResult) {
    return null;
  }

  const nextMoves = [...(roomState.moves || [])];
  nextMoves.push(buildMoveEntry(moveResult, actorId, nextMoves.length + 1, chess));

  const finishedState = resolveFinishedState(
    chess,
    actorId,
    roomState.player1_id,
    roomState.player2_id
  );

  return {
    ...roomState,
    status: finishedState.status,
    current_turn_user_id: finishedState.current_turn_user_id,
    fen: chess.fen(),
    last_move: serializeMove(moveResult),
    winner_id: finishedState.winner_id,
    finished_reason: finishedState.finished_reason,
    draw_offered_by: "",
    legal_moves:
      finishedState.status === "active" ? buildLegalMoves(chess) : [],
    moves: nextMoves,
  };
}

function buildResignedState(roomState, resigningUserId) {
  if (!roomState || roomState.status !== "active") {
    return roomState;
  }

  const winnerId =
    resigningUserId === roomState.player1_id
      ? roomState.player2_id
      : roomState.player1_id;

  return {
    ...roomState,
    status: "finished",
    current_turn_user_id: "",
    winner_id: winnerId,
    finished_reason: "resign",
    draw_offered_by: "",
    legal_moves: [],
  };
}

export function useLocalBotGameRoom(gameId) {
  const storedSession = useMemo(() => readPlaySession(gameId), [gameId]);
  const localBotConfig = useMemo(
    () => normalizeLocalBotConfig(storedSession?.localBotConfig),
    [storedSession]
  );
  const playerProfile = useMemo(
    () => buildLocalPlayerProfile(storedSession?.player),
    [storedSession]
  );
  const botProfile = useMemo(() => createLocalBotProfile(), []);
  const isLocalBotGame = Boolean(gameId && localBotConfig?.enabled);
  const [socketError, setSocketError] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const botClientRef = useRef(null);
  const activeBotTurnKeyRef = useRef("");
  const [roomState, setRoomState] = useState(() => {
    if (!isLocalBotGame) {
      return null;
    }

    return (
      readLocalBotGameState(gameId) ||
      createInitialRoomState({
        gameId,
        playerProfile,
        difficulty: localBotConfig?.difficulty || "easy",
      })
    );
  });

  useEffect(() => {
    if (!isLocalBotGame) {
      setRoomState(null);
      setSocketError("");
      return;
    }

    setRoomState(
      readLocalBotGameState(gameId) ||
        createInitialRoomState({
          gameId,
          playerProfile,
          difficulty: localBotConfig?.difficulty || "easy",
        })
    );
  }, [gameId, isLocalBotGame, localBotConfig?.difficulty, playerProfile]);

  useEffect(() => {
    if (!isLocalBotGame || !roomState) {
      return;
    }

    saveLocalBotGameState(gameId, roomState);
  }, [gameId, isLocalBotGame, roomState]);

  useEffect(() => {
    if (!isLocalBotGame) {
      return undefined;
    }

    const client = createClientBotClient();
    botClientRef.current = client;

    return () => {
      botClientRef.current = null;
      client.terminate();
    };
  }, [isLocalBotGame]);

  useEffect(() => {
    if (!isLocalBotGame || !roomState) {
      activeBotTurnKeyRef.current = "";
      setIsBotThinking(false);
      return undefined;
    }

    if (
      roomState.status !== "active" ||
      roomState.current_turn_user_id !== roomState.player2_id
    ) {
      activeBotTurnKeyRef.current = "";
      setIsBotThinking(false);
      return undefined;
    }

    const botTurnKey = `${roomState.game_id}:${roomState.fen}:${roomState.moves?.length || 0}`;
    if (activeBotTurnKeyRef.current === botTurnKey) {
      return undefined;
    }

    activeBotTurnKeyRef.current = botTurnKey;
    let cancelled = false;

    const timerId = window.setTimeout(async () => {
      setIsBotThinking(true);

      try {
        const botResult = await botClientRef.current?.computeBestMove({
          fen: roomState.fen,
          difficulty: roomState.bot_difficulty || "easy",
        });

        if (cancelled || !botResult?.move) {
          return;
        }

        setRoomState((currentRoomState) => {
          if (
            !currentRoomState ||
            currentRoomState.status !== "active" ||
            currentRoomState.current_turn_user_id !== currentRoomState.player2_id ||
            currentRoomState.fen !== roomState.fen
          ) {
            return currentRoomState;
          }

          const nextRoomState = applySerializedMove(
            currentRoomState,
            botResult.move,
            currentRoomState.player2_id
          );

          return nextRoomState || currentRoomState;
        });
      } catch (error) {
        if (!cancelled) {
          setSocketError(
            error instanceof Error
              ? error.message
              : "Не удалось посчитать ход локального бота."
          );
        }
      } finally {
        if (!cancelled) {
          setIsBotThinking(false);
        }
      }
    }, BOT_THINK_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [isLocalBotGame, roomState]);

  const sendMove = useCallback(
    (move) => {
      if (!isLocalBotGame || !roomState) {
        return false;
      }

      const serializedMove = normalizeMovePayload(move);
      if (!serializedMove) {
        return false;
      }

      const nextRoomState = applySerializedMove(
        roomState,
        serializedMove,
        roomState.player1_id
      );

      if (!nextRoomState) {
        return false;
      }

      setSocketError("");
      setRoomState(nextRoomState);
      return true;
    },
    [isLocalBotGame, roomState]
  );

  const sendResign = useCallback(() => {
    if (!isLocalBotGame || !roomState || roomState.status !== "active") {
      return false;
    }

    setRoomState(buildResignedState(roomState, roomState.player1_id));
    return true;
  }, [isLocalBotGame, roomState]);

  const matchGameMode = roomState?.game_mode || localBotConfig?.gameMode || "classic";
  const opponentName = isBotThinking
    ? `${botProfile.username} думает...`
    : botProfile.username;

  return {
    roomState,
    socketError,
    isLocalBotGame,
    isOnlineGame: false,
    isWaitingForAuthBootstrap: false,
    hasOnlineAccess: false,
    hasRoomAccess: Boolean(roomState),
    playerColor: "w",
    currentUserId: roomState?.player1_id || playerProfile.id,
    opponentUserId: roomState?.player2_id || botProfile.id,
    currentUserProfile: playerProfile,
    opponentProfile: botProfile,
    currentUserName: playerProfile.username || LOCAL_PLAYER_NAME,
    opponentName,
    matchStake: 0,
    matchGameMode,
    matchGameModeLabel: resolveGameModeLabel(matchGameMode),
    matchGameCurrencyLabel: "Локальный бот",
    isBotGame: true,
    isBotThinking,
    applyRoomState: setRoomState,
    sendMove,
    sendEmoji: () => false,
    sendResign,
    sendDrawOffer: () => false,
    sendDrawAccept: () => false,
    sendDrawDecline: () => false,
  };
}
