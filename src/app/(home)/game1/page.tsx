"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fish } from "lucide-react"
import GameChat from "@/components/game-chat3a"
import Betbutton from "@/components/betbutton1a"
import BetList from "@/components/BetList1"
import GameVisual from '@/components/visualization123a';
import GameHistory from '@/components/gamehistory1';
import Tabs from '@/components/tabs3';
import useSound from 'use-sound';
import { useGameStore3, GameState } from '@/store/gameStore3';
import { toast } from 'react-toastify'; // Ensure you have the toast library
import { currencyById } from '@/lib/currencies';
import { usePressedStore } from '@/store/ispressed';
import axios from 'axios';
import { useWalletStore } from '@/store/walletStore';


// Type for cashout events
type CashoutEvent = {
  id: string
  multiplier: number
  amount: number
}

interface GameVisualProps {
  currentMultiplier: number;
  onCashout: (multiplier: number) => void;
  dude55: boolean;
  dude56: string; // Ensure this is a string
  betAmount: string;
}

interface GameHistoryProps {
  dude55: boolean;
  buttonPressCount: number;
  currentMultiplier: number;
}

const CrashGame = () => {
  // Game state from GameStore3
  const {
    currentGame,
    startGame: startGameFromStore,
    crashGame: crashGameFromStore,
    placeBet: placeBetFromStore,
    cashOut: cashOutFromStore,
    fetchGameStatus,
    getTotalPlayers,
    getTotalBets,
    getActivePlayers,
  } = useGameStore3();

  const gameState5 = currentGame?.status || GameState.WAITING;
  const multiplier = currentGame?.multiplier || 1.0;

 // const gameState5 = useGameStore((gameState5: GameState) => gameState5);
  const [isCashedOut, setIsCashedOut] = useState(false);
const [newCount, setNewCount] = useState(0);
  const [play, { sound }] = useSound('/sounds/cheering.mp3');
  const [play1] = useSound('/sounds/cheering.mp3');
  const [buttonClicked1, setbuttonClicked1] = useState(true);
  const [placeBetCounter, setplaceBetCounter] = useState(0);
  const [buttonPressCount, setbuttonPressCount1] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [gameState, setGameState] = useState(gameState5);
  const [crashPoint, setCrashPoint] = useState(0)
  
  // Update crash point from GameStore3
  useEffect(() => {
    if (currentGame?.crashPoint) {
      setCrashPoint(currentGame.crashPoint)
    }
  }, [currentGame?.crashPoint])

  // Fetch game status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGameStatus()
    }, 100) // Poll every 100ms

    return () => clearInterval(interval)
  }, [fetchGameStatus])

  // Fetch game history on mount
  useEffect(() => {
    const { fetchGameHistory } = useGameStore3.getState()
    fetchGameHistory(10) // Get last 10 games
  }, [])
  const [betAmount, setBetAmount] = useState("0.1")
  const [autoCashoutAt, setAutoCashoutAt] = useState("2")
  const [username, setUsername] = useState("Player1")
  // Use GameStore3 game history instead of local state
  const { gameHistory: storeGameHistory } = useGameStore3();
  const [userCashedOut, setUserCashedOut] = useState(false)
  const [userWinnings, setUserWinnings] = useState(0)
  const [pathProgress, setPathProgress] = useState(0)
  const [cashouts, setCashouts] = useState<CashoutEvent[]>([])
  const [currency, setCurrency] = useState<string>("USD"); // or whatever default value you want
  const pressed = usePressedStore((state) => state.pressed);
  const [hasLogged, setHasLogged] = useState(false);
  // Animation refs
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const currentMultiplierRef = useRef<number>(1)

  // Constants
  const MAX_MULTIPLIER = 100
  const GAME_DURATION_MS = 15000 // 15 seconds max game duration

    // New state for previous time remaining
    const [previousTimeRemaining, setPreviousTimeRemaining] = useState<number | null>(null);

    const walletAddress = useWalletStore((state) => state.walletAddress) || "Unknown User";
  
    useEffect(() => {
    
      if (pressed === 1 && !hasLogged) {
        console.log('Pressed is 1 24 hours in checked');
        setHasLogged(true); // Prevent future logs
// set bet 1st

let data = JSON.stringify({
  "walletAddress": walletAddress,
  "betAmount": betAmount,
  "autoCashout": true,
  "currency": currency
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: '/api/1stpostbet',
  headers: { 
    'Content-Type': 'application/json'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
  console.log('The 1st bet has been logged and the wallet address is '+walletAddress)
})
.catch((error) => {
  console.log(error);
});


// end of set bet 1st

      }
    }, [pressed, hasLogged]);
  
useEffect(() =>{
  if(gameState5 === GameState.CRASHED && hasLogged){
    setHasLogged(false)
  }
},[gameState5, hasLogged])
    
    // Update previous time remaining whenever gameState5 changes
    useEffect(() => {
      // This effect can be used for other game state changes if needed
    }, [gameState5]);

  useEffect(() => {
    setbuttonPressCount1(buttonPressCount);
    setbuttonClicked1(buttonClicked1);
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 768);

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() =>{
    if(gameState5 == GameState.CRASHED ){
      setplaceBetCounter(0);
      setIsCashedOut(false);
    }
  })
useEffect(() =>{
  if(placeBetCounter >= 1 ){
    console.log('im not winning') 
  }
}
)
  

  // Update ref when state changes
  useEffect(() => {
    currentMultiplierRef.current = multiplier
  }, [multiplier])

  // Generate a crash point
  const generateCrashPoint = () => {
    // Random number between 1 and MAX_MULTIPLIER
    // This is a simplified version - in a real game, you'd use a provably fair algorithm
    return 1 + Math.random() * 5 // Crash between 1x and 6x for testing
  }

  // Start a new game using GameStore3
  const startGame = async (betAmount: string) => {
    setBetAmount(betAmount)
    if (Number.parseFloat(betAmount) <= 0) {
      return
    }

    setUserCashedOut(false)
    setUserWinnings(0)
    setCashouts([])

    // Use GameStore3 to start the game
    await startGameFromStore()
    
    // Place bet for current user
    await placeBetFromStore(walletAddress, username, Number.parseFloat(betAmount))
  }



  // Auto cashout check using GameStore3 data
  useEffect(() => {
    if (gameState5 === GameState.RUNNING && multiplier >= Number.parseFloat(autoCashoutAt) && !userCashedOut) {
      cashout(multiplier)
    }
  }, [multiplier, autoCashoutAt, userCashedOut, gameState5])

  // Game state changes are now handled by GameStore3

  const ispressed = (isButtonPressed: boolean) => {
    setIsButtonPressed(isButtonPressed)
  }

  const handleCashout = (multiplier: number) => {
    console.log(`Current Multiplier: ${multiplier} wtf ${fucku}`); // Log the received multiplier
    setIsCashedOut(true);

    // Additional cashout logic...
  };

  // Map enum status to the string variants expected by UI components
  const gameStatusToString = (status: GameState): "Waiting" | "Running" | "Crashed" | "Unknown" | "Stopped" => {
    switch (status) {
      case GameState.WAITING:
        return "Waiting";
      case GameState.RUNNING:
        return "Running";
      case GameState.CRASHED:
        return "Crashed";
      case GameState.STOPPED:
        return "Stopped";
      default:
        return "Unknown";
    }
  };

  // Reset game to idle state
  const resetGame = () => {
    setGameState(GameState.WAITING)
  }

  // Add a cashout event
  const addCashoutEvent = (id: string, multiplier: number, amount: string) => {
    // Add to cashouts
    setCashouts((prev) => [
      ...prev,
      {
        id,
        multiplier,
        amount: Number.parseFloat(amount),
      },
    ])
  }

  const handleUserCashedOut = (hasUserCashedOut: boolean) => {
    // Your logic here, e.g., updating state or performing an action
    console.log(`User has cashed out: ${hasUserCashedOut} ${fucku}` );
};
const fucku = (currency: string) => {
  console.log(`users fucking thing123 ${currency}`)
}
  // Cash out current bet using GameStore3
  const cashout = async (exactMultiplier?: number) => {
    if (gameState5 !== GameState.RUNNING || userCashedOut) return

    // Use GameStore3 to cash out
    await cashOutFromStore(walletAddress)
    
    const cashoutMultiplier = exactMultiplier || multiplier
    play();
    setUserCashedOut(true)
    const winnings = Number.parseFloat(betAmount) * cashoutMultiplier
    setUserWinnings(winnings)

    // Add cashout dot for the user
    addCashoutEvent("you", cashoutMultiplier, betAmount)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current)
      if (gameTimerRef.current) {
        clearTimeout(gameTimerRef.current)
      }
    }
  }, [])

  // Game history is now managed by GameStore3

  // Calculate the curve path based on current multiplier
  const getCurvePath = () => {
    // Start point at bottom left
    const startX = 0
    const startY = 100

    // Middle point at middle right
    const midX = 100
    const midY = 50

    // End point - moves upward based on multiplier
    // As multiplier increases, the end point moves higher
    const endX = 100
    const endY = Math.max(0, 50 - (multiplier - 1) * 10)

    // For a curve that goes from bottom left to middle right, then curves upward,
    // we'll use a cubic bezier curve (C command in SVG path)
    // We need two control points for a cubic bezier
    const control1X = 50 // First control point, halfway horizontally
    const control1Y = 100 // Keep it at the bottom for a flat initial segment

    const control2X = 100 // Second control point, at the right edge
    const control2Y = 75 // Slightly above the middle point for a smooth curve

    return `M ${startX},${startY} C ${control1X},${control1Y} ${control2X},${control2Y} ${midX},${midY} L ${endX},${endY}`
  }

  // Get point at a specific progress along the path
  const getPointAtProgress = (progress: number) => {
    if (!pathRef.current) return { x: 0, y: 100 }

    const pathLength = pathRef.current.getTotalLength()
    const point = pathRef.current.getPointAtLength(progress * pathLength)
    return { x: point.x, y: point.y }
  }

  // Calculate multiplier progress
  const getMultiplierProgress = (multiplier: number) => {
    return Math.min(1, (multiplier - 1) / (crashPoint - 1))
  }

  // Get rocket position along the path
  const getRocketPosition = () => {
    return getPointAtProgress(pathProgress)
  }

  // Get rocket rotation based on position on the path
  const getRocketRotation = () => {
    if (!pathRef.current) return 0

    const pathLength = pathRef.current.getTotalLength()
    const distance = pathProgress * pathLength

    // Get points slightly before and after current position to determine direction
    const pointBefore = pathRef.current.getPointAtLength(Math.max(0, distance - 1))
    const pointAfter = pathRef.current.getPointAtLength(Math.min(pathLength, distance + 1))

    // Calculate angle based on direction
    const angle = Math.atan2(pointAfter.y - pointBefore.y, pointAfter.x - pointBefore.x)

    // Convert to degrees and adjust (0 degrees is right, 90 is down)
    return angle * (180 / Math.PI) + 90
  }

  const handleCurrencyChange = (currencyId: string) => {
    console.log(`Selected currency: ${currencyId}`);
    setCurrency(currencyId);
  };

  const handleButtonClicked = (buttonClicked: boolean) => {
    setbuttonClicked1(buttonClicked);
  };

const placebet123 = (placeBetCounter: number) => {
  setplaceBetCounter(placeBetCounter);
}

  const buttonPressCount2 = (buttonPressCount: number) => {
setbuttonPressCount1(buttonPressCount)
  }

  const [isButtonPressed, setIsButtonPressed] = useState(false);

  const sendToCrashGame3 = (buttonPressCount: number) => {
    console.log(`Sending buttonPressCount to crash-game3: ${buttonPressCount}`);
    // Add your logic to send the buttonPressCount to crash-game3 here
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat - Left Side */}
       

        {!isMobile &&  <div className="lg:col-span-3 h-[500px]">
          <GameChat currentMultiplier={multiplier} gameState={gameState5.toString() as "Waiting" | "Running" | "Crashed" | "Unknown" | "Stopped"} crashPoint={crashPoint} onCrash={resetGame} />
        </div>}
        {/* Game Display - Middle */}
        <div className="lg:col-span-7">
          <Card className="bg-black border-black">
            <CardContent className="p-1">
              <div className="flex justify-between items-center mb-4">

                {!isMobile && <h2 className="text-2xl font-bold text-white">{gameState5 === GameState.CRASHED ? "CRASHED!" : "Multiplier"}</h2>}
                <div className="text-3xl font-mono font-bold text-green-400">{multiplier}x</div>
              </div>

              {/* Game visualization */}
              <GameVisual 
              betAmount={betAmount} 
              dude56={currency} 
              dude55={isCashedOut} 
              onCashout={handleCashout} 
              GameStatus={gameStatusToString(gameState5)}
              Gametimeremaining={currentGame?.countdown || 0}
              currentMultiplier={multiplier} 
              tValues={[/*
              { number: 1.25, color: "gold", svg: "/demo.svg" },
              { number: 2.5, color: "green", svg: "/31832.png" },
              { number: 3.85, color: "purple", svg: "/sol.svg" },
              */]}/>

              {/* Game history */}
             <GameHistory
               pressed={pressed} 
               gameState={gameStatusToString(gameState5)} 
               dude55={isCashedOut} 
               isButtonPressed={isButtonPressed}
               buttonPressCount={buttonPressCount}
               currentMultiplier={multiplier}
               dude45={userCashedOut}
               dude56a={isButtonPressed}
               dude56b={buttonPressCount}
               buttonPressCount2={buttonPressCount}
               gameHistory={storeGameHistory}
             />
             
             {/* Game Statistics from GameStore3 */}
             <div className="mt-4 p-4 bg-gray-800 rounded-lg">
               <h3 className="text-white font-semibold mb-2">Game Stats</h3>
               <div className="grid grid-cols-3 gap-4 text-sm">
                 <div>
                   <p className="text-gray-400">Total Players</p>
                   <p className="text-white font-bold">{getTotalPlayers()}</p>
                 </div>
                 <div>
                   <p className="text-gray-400">Total Bets</p>
                   <p className="text-white font-bold">${getTotalBets().toFixed(2)}</p>
                 </div>
                 <div>
                   <p className="text-gray-400">Active Players</p>
                   <p className="text-white font-bold">{getActivePlayers().length}</p>
                 </div>
               </div>
             </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting controls - Right Side */}
       <Betbutton
        isButtonPressed={isButtonPressed}
         gametime={0}
         gameState={gameStatusToString(gameState5)}
         currentMultiplier={multiplier}
         onStartGame={startGame}
         onCashout={handleCashout}
         userCashedOut={userCashedOut}
         cashouts={cashouts}
         multiplier={multiplier}
         dude45={handleUserCashedOut}
         dude56={handleCurrencyChange}
         dude56a={handleButtonClicked}
         dude56b={buttonPressCount2}
         sendToCrashGame3={sendToCrashGame3}
         placeBetCounter={placebet123}
       />

      

      </div>
      {!isMobile && <BetList />}
      {isMobile && <Tabs gameState={gameStatusToString(gameState5)} crashPoint={crashPoint} onCrash={resetGame} />}
    </div>
  )
}

export default CrashGame