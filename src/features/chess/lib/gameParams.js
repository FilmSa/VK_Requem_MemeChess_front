export function getGameParams() {
  const searchParams = new URLSearchParams(window.location.search);

  const gameId = searchParams.get("game") || "room-1";
  const userId = searchParams.get("user") || "1";

  const playerColor = userId === "1" ? "w" : "b";
  const boardOrientation = playerColor === "w" ? "white" : "black";

  return {
    gameId,
    userId,
    playerColor,
    boardOrientation,
  };
}