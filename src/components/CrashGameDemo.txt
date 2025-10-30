// components/CrashGameDemo.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore3, GameState, Player } from '@/store/gameStore3';
import { crashApi, gameUtils } from '@/utils/crashApi';

export default function CrashGameDemo() {
  const {
    currentGame,
    gameHistory,
    startGame,
    crashGame,
    placeBet,
    cashOut,
    fetchGameStatus,
    fetchGameHistory,
    getTotalPlayers,
    getTotalBets,
    getActivePlayers,
  } = useGameStore3();

  const [playerId] = useState(`player_${Math.random().toString(36).substr(2, 9)}`);
  const [username, setUsername] = useState('DemoPlayer');
  const [betAmount, setBetAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchGameStatus();
    fetchGameHistory(5);
  }, [fetchGameStatus, fetchGameHistory]);

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      await startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrashGame = async () => {
    setIsLoading(true);
    try {
      await crashGame();
    } catch (error) {
      console.error('Failed to crash game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!currentGame || currentGame.status !== GameState.RUNNING) {
      alert('No active game to place bet in');
      return;
    }

    setIsLoading(true);
    try {
      await placeBet(playerId, username, betAmount);
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashOut = async () => {
    if (!currentGame || currentGame.status !== GameState.RUNNING) {
      alert('No active game to cash out from');
      return;
    }

    setIsLoading(true);
    try {
      await cashOut(playerId);
    } catch (error) {
      console.error('Failed to cash out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlayer = currentGame?.players.find(p => p.id === playerId);
  const canCashOut = currentPlayer && gameUtils.canCashOut(currentPlayer);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Crash Game Demo</h1>
      
      {/* Game Status */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Game Status</h2>
        {currentGame ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400">Game ID</p>
              <p className="font-mono text-sm">{currentGame.gameId}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className={`font-semibold ${
                currentGame.status === GameState.RUNNING ? 'text-green-400' :
                currentGame.status === GameState.CRASHED ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {currentGame.status.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Multiplier</p>
              <p className="text-2xl font-bold text-green-400">
                {gameUtils.formatMultiplier(currentGame.multiplier)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Crash Point</p>
              <p className="font-semibold">{gameUtils.formatMultiplier(currentGame.crashPoint)}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No active game</p>
        )}
      </div>

      {/* Game Controls */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleStartGame}
            disabled={isLoading || (currentGame?.status === GameState.RUNNING)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
          >
            {isLoading ? 'Loading...' : 'Start Game'}
          </button>
          
          <button
            onClick={handleCrashGame}
            disabled={isLoading || !currentGame || currentGame.status !== GameState.RUNNING}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
          >
            {isLoading ? 'Loading...' : 'Crash Game'}
          </button>
        </div>
      </div>

      {/* Player Actions */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Player Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <button
            onClick={handlePlaceBet}
            disabled={isLoading || !currentGame || currentGame.status !== GameState.RUNNING}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
          >
            {isLoading ? 'Loading...' : 'Place Bet'}
          </button>
          
          <button
            onClick={handleCashOut}
            disabled={isLoading || !canCashOut}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
          >
            {isLoading ? 'Loading...' : 'Cash Out'}
          </button>
        </div>
      </div>

      {/* Current Player Status */}
      {currentPlayer && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400">Bet Amount</p>
              <p className="font-semibold">{gameUtils.formatCurrency(currentPlayer.betAmount)}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className={`font-semibold ${
                gameUtils.getPlayerStatus(currentPlayer) === 'cashed_out' ? 'text-green-400' :
                gameUtils.getPlayerStatus(currentPlayer) === 'active' ? 'text-blue-400' :
                'text-red-400'
              }`}>
                {gameUtils.getPlayerStatus(currentPlayer).toUpperCase()}
              </p>
            </div>
            {currentPlayer.cashOutMultiplier && (
              <>
                <div>
                  <p className="text-gray-400">Cash Out At</p>
                  <p className="font-semibold">{gameUtils.formatMultiplier(currentPlayer.cashOutMultiplier)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Profit</p>
                  <p className={`font-semibold ${currentPlayer.profit && currentPlayer.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {currentPlayer.profit ? gameUtils.formatCurrency(currentPlayer.profit) : 'N/A'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Game Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400">Total Players</p>
            <p className="text-2xl font-bold">{getTotalPlayers()}</p>
          </div>
          <div>
            <p className="text-gray-400">Total Bets</p>
            <p className="text-2xl font-bold">{gameUtils.formatCurrency(getTotalBets())}</p>
          </div>
          <div>
            <p className="text-gray-400">Active Players</p>
            <p className="text-2xl font-bold">{getActivePlayers().length}</p>
          </div>
        </div>
      </div>

      {/* Game History */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
        {gameHistory.length > 0 ? (
          <div className="space-y-2">
            {gameHistory.map((game, index) => (
              <div key={game.gameId} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                <div>
                  <span className="font-mono text-sm">{game.gameId}</span>
                  <span className="ml-2 text-gray-400">
                    {new Date(game.startTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-400">
                    Crashed at {gameUtils.formatMultiplier(game.crashPoint)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {gameUtils.getGameDuration(game.startTime, game.endTime)}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No game history available</p>
        )}
      </div>
    </div>
  );
}
