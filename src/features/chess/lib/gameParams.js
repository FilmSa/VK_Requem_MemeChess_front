export function getGameParams() {
  const searchParams = new URLSearchParams(window.location.search);

  const gameId = searchParams.get("game") || "";
  const userId = searchParams.get("user") || "";
  const colorFromQuery = searchParams.get("color");
  const playerColor = colorFromQuery === "b" || userId === "2" ? "b" : "w";
  const boardOrientation = playerColor === "w" ? "white" : "black";

  return {
    gameId,
    userId,
    playerColor,
    boardOrientation,
  };
}
