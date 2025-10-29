// lib/gameState.ts

type GameStatus = "waiting" | "running" | "crashed";

let multiplier = 1.0;
let status: GameStatus = "waiting";
let interval: NodeJS.Timeout | null = null;
let crashPoint = 0;

export function startGame() {
  if (status === "running") return;

  multiplier = 1.0;
  status = "running";
  crashPoint = Math.min(Math.random() * 99.0 + 0.5, 99.99); // Random crash point up to 99.99

  interval = setInterval(() => {
    multiplier += 0.05;
    multiplier = parseFloat(multiplier.toFixed(2));

    if (multiplier >= crashPoint || multiplier >= 99.99) {
      crashGame();
    }
  }, 100);
}

export function stopGame() {
  if (interval) clearInterval(interval);
  interval = null;
  status = "waiting";
  multiplier = 1.0;
}

export function crashGame() {
  if (interval) clearInterval(interval);
  interval = null;
  status = "crashed";
}

export function getGameState() {
  return { multiplier, status };
}
