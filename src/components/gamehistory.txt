"use client";

import { useEffect, useState, useRef } from 'react';
import { usePressedStore } from '../store/ispressed';
import { CrashGameData } from '../store/gameStore3';

interface GameHistoryProps {
  dude45: boolean;
  dude55: boolean;
  buttonPressCount: number;
  currentMultiplier: number;
  gameState: string;
  dude56a: boolean;
  dude56b: number;
  buttonPressCount2: number;
  isButtonPressed: boolean;
  pressed: number;
  gameHistory?: CrashGameData[];
}

interface HistoryEntry {
  multiplier: number;
  isButtonPressed: boolean;
  buttonPressCount: number;
  dudeClicked: boolean;
  dude45: boolean;
  dude55: boolean;
  dude56a: boolean;
  buttonPressCount2: number;
  dude56b: number;
  pressed: number;
}

const GameHistory: React.FC<GameHistoryProps> = ({ buttonPressCount2, gameState, dude55, currentMultiplier, isButtonPressed, buttonPressCount, dude56b, dude56a, dude45 }) => {
  const [gameHistory, setGameHistory] = useState<HistoryEntry[]>([]);
  const pressed = usePressedStore((state) => state.pressed);
  const lastGameState = useRef<string>("");

  useEffect(() => {
    if (gameState === "Crashed" && lastGameState.current !== "Crashed") {
      lastGameState.current = "Crashed";
      const newEntry: HistoryEntry = {
        multiplier: currentMultiplier,
        dudeClicked: dude55,
        dude45: dude45,
        buttonPressCount2: buttonPressCount2,
        dude56a: dude56a,
        dude56b: dude56b,
        dude55: dude55,
        isButtonPressed: isButtonPressed,
        buttonPressCount: buttonPressCount,
        pressed: pressed,
      };
      console.log(buttonPressCount2, buttonPressCount, dude55, dude56b + " data for button pressed");
      setGameHistory(prev => [newEntry, ...prev].slice(0, 10)); // Keep only the last 10 entries
    } else if (gameState !== "Crashed") {
      lastGameState.current = gameState;
    }
  }, [gameState, currentMultiplier, dude55, buttonPressCount, dude45, dude56b, dude56a, isButtonPressed, buttonPressCount2, pressed]);

  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {gameHistory.length > 0 ? (
        gameHistory.map((entry, index) => {
          let bgColor = '';
          let textColor = '';

          if (entry.dudeClicked === true) {
            bgColor = 'bg-green-900/50';
            textColor = 'text-green-400';
          } else if (entry.pressed === 0) {
            bgColor = 'bg-yellow-900/50';
            textColor = 'text-yellow-400';
          } else {
            bgColor = 'bg-red-900/50';
            textColor = 'text-red-400';
          }
          
          

          return (
            <div
              key={index}
              className={`px-2 py-1 rounded text-xs font-mono ${bgColor} ${textColor}`}
            >
              {entry.multiplier.toFixed(2)}x
            </div>
          );
        })
      ) : (
        <p className="text-gray-500 text-sm">No game history yet</p>
      )}
    </div>
  );
};

export default GameHistory;
