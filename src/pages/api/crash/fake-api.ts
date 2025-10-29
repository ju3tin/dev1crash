import type { NextApiRequest, NextApiResponse } from "next";

// Fake crash game data structure
interface CrashGameData {
  gameId: string;
  multiplier: number;
  status: 'waiting' | 'running' | 'crashed';
  crashPoint: number;
  startTime: number;
  endTime?: number;
  countdown?: number;
  players: Array<{
    id: string;
    username: string;
    betAmount: number;
    cashOutMultiplier?: number;
    profit?: number;
  }>;
  history: Array<{
    gameId: string;
    crashPoint: number;
    duration: number;
    timestamp: number;
  }>;
}

// In-memory storage for fake data
let currentGame: CrashGameData | null = null;
let gameHistory: CrashGameData[] = [];
let gameCounter = 1;
let countdownTimer: NodeJS.Timeout | null = null;

// Generate random crash point (1.01x to 100x)
function generateCrashPoint(): number {
  const random = Math.random();
  if (random < 0.1) return Math.random() * 2 + 1.01; // 10% chance for 1.01-3x
  if (random < 0.3) return Math.random() * 5 + 1.01; // 20% chance for 1.01-6x
  if (random < 0.6) return Math.random() * 10 + 1.01; // 30% chance for 1.01-11x
  if (random < 0.85) return Math.random() * 20 + 1.01; // 25% chance for 1.01-21x
  return Math.random() * 80 + 1.01; // 15% chance for 1.01-81x
}

// Generate fake players
function generateFakePlayers(): CrashGameData['players'] {
  const playerCount = Math.floor(Math.random() * 20) + 5; // 5-25 players
  const players = [];
  
  for (let i = 0; i < playerCount; i++) {
    const betAmount = Math.floor(Math.random() * 1000) + 10; // $10-$1010
    const cashOutMultiplier = Math.random() < 0.7 ? Math.random() * 5 + 1.01 : undefined; // 70% cash out
    
    players.push({
      id: `player_${i + 1}`,
      username: `Player${i + 1}`,
      betAmount,
      cashOutMultiplier,
      profit: cashOutMultiplier ? (betAmount * cashOutMultiplier) - betAmount : -betAmount
    });
  }
  
  return players;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'start':
        return handleStartGame(req, res);
      case 'status':
        return handleGetStatus(req, res);
      case 'crash':
        return handleCrashGame(req, res);
      case 'history':
        return handleGetHistory(req, res);
      case 'place-bet':
        return handlePlaceBet(req, res);
      case 'cash-out':
        return handleCashOut(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Crash API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function handleStartGame(req: NextApiRequest, res: NextApiResponse) {
  if (currentGame && (currentGame.status === 'running' || currentGame.status === 'waiting')) {
    return res.status(400).json({ error: 'Game already scheduled or running' });
  }

  const gameId = `game_${gameCounter++}`;
  const crashPoint = generateCrashPoint();

  currentGame = {
    gameId,
    multiplier: 1.0,
    status: 'waiting',
    crashPoint,
    startTime: Date.now(),
    countdown: 10,
    players: generateFakePlayers(),
    history: []
  };

  // Start countdown before the game runs
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    if (!currentGame || currentGame.status !== 'waiting') {
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = null;
      return;
    }

    const remaining = (currentGame.countdown ?? 0) - 1;
    currentGame.countdown = remaining;

    if (remaining <= 0) {
      // Transition to running
      currentGame.status = 'running';
      currentGame.startTime = Date.now();
      currentGame.countdown = undefined;

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = null;

      // Simulate game progression
      const gameInterval = setInterval(() => {
        if (!currentGame || currentGame.status !== 'running') {
          clearInterval(gameInterval);
          return;
        }

        currentGame.multiplier += 0.01;
        currentGame.multiplier = Math.round(currentGame.multiplier * 100) / 100;

        if (currentGame.multiplier >= currentGame.crashPoint) {
          currentGame.status = 'crashed';
          currentGame.endTime = Date.now();
          gameHistory.push({ ...currentGame });
          clearInterval(gameInterval);
        }
      }, 100);
    }
  }, 1000);

  res.status(200).json({
    success: true,
    gameId,
    status: 'waiting',
    crashPoint,
    countdown: currentGame.countdown,
    message: 'Game scheduled. Countdown started.'
  });
}

function handleGetStatus(req: NextApiRequest, res: NextApiResponse) {
  if (!currentGame) {
    return res.status(200).json({
      status: 'waiting',
      multiplier: 1.0,
      message: 'No active game'
    });
  }

  res.status(200).json({
    gameId: currentGame.gameId,
    status: currentGame.status,
    multiplier: currentGame.multiplier,
    crashPoint: currentGame.crashPoint,
    startTime: currentGame.startTime,
    endTime: currentGame.endTime,
    countdown: currentGame.countdown,
    players: currentGame.players,
    duration: currentGame.endTime ? currentGame.endTime - currentGame.startTime : Date.now() - currentGame.startTime
  });
}

function handleCrashGame(req: NextApiRequest, res: NextApiResponse) {
  if (!currentGame || currentGame.status !== 'running') {
    return res.status(400).json({ error: 'No active game to crash' });
  }

  currentGame.status = 'crashed';
  currentGame.endTime = Date.now();
  gameHistory.push({ ...currentGame });

  res.status(200).json({
    success: true,
    gameId: currentGame.gameId,
    finalMultiplier: currentGame.multiplier,
    crashPoint: currentGame.crashPoint,
    duration: currentGame.endTime - currentGame.startTime,
    message: 'Game crashed'
  });
}

function handleGetHistory(req: NextApiRequest, res: NextApiResponse) {
  const limit = parseInt(req.query.limit as string) || 10;
  const recentHistory = gameHistory.slice(-limit).reverse();

  res.status(200).json({
    history: recentHistory,
    total: gameHistory.length
  });
}

function handlePlaceBet(req: NextApiRequest, res: NextApiResponse) {
  const { playerId, username, betAmount } = req.body;

  if (!currentGame || currentGame.status !== 'running') {
    return res.status(400).json({ error: 'No active game' });
  }

  if (!playerId || !username || !betAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newPlayer = {
    id: playerId,
    username,
    betAmount: parseFloat(betAmount),
    cashOutMultiplier: undefined,
    profit: undefined
  };

  currentGame.players.push(newPlayer);

  res.status(200).json({
    success: true,
    player: newPlayer,
    message: 'Bet placed successfully'
  });
}

function handleCashOut(req: NextApiRequest, res: NextApiResponse) {
  const { playerId } = req.body;

  if (!currentGame || currentGame.status !== 'running') {
    return res.status(400).json({ error: 'No active game' });
  }

  const player = currentGame.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if (player.cashOutMultiplier) {
    return res.status(400).json({ error: 'Player already cashed out' });
  }

  player.cashOutMultiplier = currentGame.multiplier;
  player.profit = (player.betAmount * currentGame.multiplier) - player.betAmount;

  res.status(200).json({
    success: true,
    player,
    message: 'Cashed out successfully'
  });
}
