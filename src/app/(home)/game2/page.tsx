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
import GameVisual from '@/components/visualization123';
import GameHistory from '@/components/gamehistory';
import Tabs from '@/components/tabs3';
import useSound from 'use-sound';
import { useGameStore, GameState } from '@/store/gameStore2';
import { toast } from 'react-toastify'; // Ensure you have the toast library
import { currencyById } from '@/lib/currencies';
import { usePressedStore } from '@/store/ispressed';
import axios from 'axios';
import { useWalletStore } from '@/store/walletStore';

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  image: HTMLImageElement;
}

const confettiImages = [
  'images/chip.jpg',
  'images/chip.jpg',
  'images/chip.jpg',
];

const ConfettiCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const isAnimatingRef = useRef<boolean>(false); // Track animation state

  useEffect(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Load images
      let imagesLoaded = 0;
      confettiImages.forEach((src) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
              imagesLoaded++;
              if (imagesLoaded === confettiImages.length) {
                  loadedImagesRef.current = confettiImages.map(url => {
                      const image = new Image();
                      image.src = url;
                      return image;
                  });
              }
          };
      });

      const handleResize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const spawnConfetti = (count = 100) => {
      const canvas = canvasRef.current!;
      const particles = particlesRef.current;
      const images = loadedImagesRef.current;
      const x = canvas.width / 2; // Middle of the screen
      const y = canvas.height; // Bottom of the screen
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI; // Full 180-degree spread upward
          const speed = Math.random() * 8 + 6; // Increased speed for firework effect
          particles.push({
              x,
              y,
              size: Math.random() * 20 + 10,
              speedX: speed * Math.cos(angle), // Spread left and right
              speedY: -speed * Math.sin(angle), // Negative to move upward
              rotation: Math.random() * 360,
              rotationSpeed: Math.random() * 10 - 5,
              image: images[Math.floor(Math.random() * images.length)],
          });
      }
      if (!isAnimatingRef.current) {
          isAnimatingRef.current = true;
          animate();
      }
  };

  const animate = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const particles = particlesRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
          p.x += p.speedX;
          p.y += p.speedY;
          p.speedY += 0.15; // Slightly stronger gravity for a natural arc
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.drawImage(p.image, -p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
      }

      // Remove offscreen particles
      particlesRef.current = particles.filter(p => p.y > -50 && p.x > -50 && p.x < canvas.width + 50);

      if (particlesRef.current.length > 0) {
          requestAnimationFrame(animate);
      } else {
          isAnimatingRef.current = false; // Stop animation when no particles remain
      }
  };

  const handleButtonClick = () => {
      spawnConfetti(100);
  };

  return (
      <>
          <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }} />
          <button
              onClick={handleButtonClick}
              style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  zIndex: 10000,
              }}
          >
              Launch Confetti 🎉
          </button>
      </>
  );
};


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
  GameStatus: string;
  Gametimeremaining: number;
  timer5: number;
  tValues: any[];
}

interface GameHistoryProps {
  dude55: boolean;
  buttonPressCount: number;
  currentMultiplier: number;
}

const CrashGame = () => {
  // Game state
  const gameState5 = useGameStore((gameState5: GameState) => gameState5);
  const { sendFinishBetWS } = useGameStore((state) => state.actions);
  const [isCashedOut, setIsCashedOut] = useState(false);
const [newCount, setNewCount] = useState(0);
  const [play, { sound }] = useSound('/sounds/cheering.mp3');
  const [play1] = useSound('/sounds/cheering.mp3');
  const [buttonClicked1, setbuttonClicked1] = useState(true);
  const [placeBetCounter, setplaceBetCounter] = useState(0);
  const [buttonPressCount, setbuttonPressCount1] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [gameState, setGameState] = useState(gameState5.status);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0)
  const [betAmount, setBetAmount] = useState("0.1")
  const [autoCashoutAt, setAutoCashoutAt] = useState("2")
  const [gameHistory, setGameHistory] = useState<number[]>([])
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
  if(gameState5.status === "Crashed" && hasLogged){
    setHasLogged(false)
  }
},[gameState5.status, hasLogged])
    
    // Update previous time remaining whenever gameState5.timeRemaining changes
    useEffect(() => {
      if (isNaN(gameState5.timeRemaining)) {
        // If timeRemaining is NaN, keep the previous value
        return;
      } else {
        // Otherwise, update previousTimeRemaining with the current timeRemaining
        setPreviousTimeRemaining(gameState5.timeRemaining);
      }
    }, [gameState5.timeRemaining]);

  useEffect(() => {
    setbuttonPressCount1(buttonPressCount);
    setbuttonClicked1(buttonClicked1);
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 768);

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() =>{
    if(gameState5.status == "Waiting"){
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
    currentMultiplierRef.current = currentMultiplier
  }, [currentMultiplier])

  // Generate a crash point
  const generateCrashPoint = () => {
    // Random number between 1 and MAX_MULTIPLIER
    // This is a simplified version - in a real game, you'd use a provably fair algorithm
    return 1 + Math.random() * 5 // Crash between 1x and 6x for testing
  }

  // Start a new game
  const startGame = (betAmount: string) => {
    setBetAmount(betAmount)
    if (Number.parseFloat(betAmount) <= 0) {
      return
    }

    setUserCashedOut(false)
    setUserWinnings(0)
    setCashouts([])

    // Generate crash point
   // const newCrashPoint = generateCrashPoint()
   // setCrashPoint(newCrashPoint)

    // Reset multiplier and start game
    setCurrentMultiplier(1)
    currentMultiplierRef.current = 1
    setPathProgress(0)
    setGameState("Running")
    startTimeRef.current = Date.now()

    // Start animation loop
    animateGame()


  }



  // Animate the game
  const animateGame = () => {
    const elapsed = Date.now() - startTimeRef.current
    const progress = Math.min(1, elapsed / GAME_DURATION_MS)

    // Calculate current multiplier using bezier curve for smoother acceleration
    // This creates an exponential growth curve
    const t = progress
    const multiplier = 1 + Math.pow(t, 2) * (crashPoint - 1)
    const formattedMultiplier = Number.parseFloat(multiplier.toFixed(2))

    setCurrentMultiplier(formattedMultiplier)
    currentMultiplierRef.current = formattedMultiplier

    // Calculate path progress based on multiplier
    const newPathProgress = Math.min(1, (multiplier - 1) / (crashPoint - 1))
    setPathProgress(newPathProgress)

    // Check for auto cashout
    if (multiplier >= Number.parseFloat(autoCashoutAt) && !userCashedOut) {
      cashout(formattedMultiplier)
    }

    // Check if we've reached the crash point
    if (multiplier >= crashPoint) {
      endGame(crashPoint)
      return
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(animateGame)
  }

  // End the game
  const endGame = (finalMultiplier: number) => {
    // Cancel animation and timer
    cancelAnimationFrame(animationRef.current)
    if (gameTimerRef.current) {
      clearTimeout(gameTimerRef.current)
      gameTimerRef.current = null
    }

    // Update game state
    setGameState("Crashed")
    setCurrentMultiplier(finalMultiplier)
    currentMultiplierRef.current = finalMultiplier

    // Add to history
   
    // Reset after a delay
    setTimeout(() => {
      setGameState("Waiting")
    }, 3000)
  }

  const ispressed = (isButtonPressed: boolean) => {
    setIsButtonPressed(isButtonPressed)
  }

  const handleCashout = (multiplier: number) => {
   
    console.log(`Current Multiplier: ${multiplier} wtf ${dude11}`); // Log the received multiplier
    setCurrentMultiplier(multiplier); // Update the current multiplier state
    setIsCashedOut(true);
    

    // Additional cashout logic...
  };

  // Reset game to idle state
  const resetGame = () => {
    setGameState("Waiting")
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
    console.log(`User has cashed out: ${hasUserCashedOut} ${dude11}` );
};
const dude11 = (currency: string) => {
  console.log(`users fucking thing123 ${currency}`)
}
  // Cash out current bet
  const cashout = (exactMultiplier?: number) => {
    if (gameState5.status !== "Running" || userCashedOut) return

    // Send FINISH_BET message to server
    if (walletAddress && walletAddress !== "Unknown User") {
      sendFinishBetWS(walletAddress);
    }

    // Use the exact multiplier passed in, or the current multiplier ref value
    // This ensures we use the most up-to-date multiplier value
    const cashoutMultiplier = exactMultiplier || currentMultiplierRef.current
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

  useEffect(() => {
    if (gameState5.status === "Crashed") {
      console.log(`what is the life of a gangstar ${placeBetCounter}`)
      setGameHistory(prev => [gameState5.multiplier, ...prev].slice(0, 10)) // Keep last 10 crashes
    }
  }, [gameState5.status, gameState5.multiplier])

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
    const endY = Math.max(0, 50 - (currentMultiplier - 1) * 10)

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
          <GameChat currentMultiplier={gameState5.multiplier} gameState={gameState5.status} crashPoint={crashPoint} onCrash={resetGame} />
        </div>}
        {/* Game Display - Middle */}
        <div className="lg:col-span-7">
          <Card className="bg-black border-black">
            <CardContent className="p-1">
              <div className="flex justify-between items-center mb-4">

                {!isMobile && <h2 className="text-2xl font-bold text-white">{gameState === "Crashed" ? "CRASHED!" : "Multiplier"}</h2>}
                <div className="text-3xl font-mono font-bold text-green-400">{gameState5.multiplier}x</div>
              </div>

              {/* Game visualization */}
              <GameVisual 
              betAmount={betAmount} 
              dude56={currency} 
              dude55={isCashedOut} 
              onCashout={handleCashout} 
              GameStatus={gameState5.status}
              Gametimeremaining={gameState5.timeRemaining}
              timer5={gameState5.timeRemaining}
              currentMultiplier={gameState5.multiplier} 
              tValues={[/*
              { number: 1.25/gameState5.multiplier, color: "gold", svg: "/demo.svg" },
              { number: 2.5/gameState5.multiplier, color: "green", svg: "/31832.png" },
              { number: 3.85/gameState5.multiplier, color: "purple", svg: "/sol.svg" },
              */]}/>

              {/* Game history */}
             <GameHistory
               pressed={pressed} 
               gameState={gameState5.status} 
               dude55={isCashedOut} 
               isButtonPressed={isButtonPressed}
               buttonPressCount={buttonPressCount}
               currentMultiplier={gameState5.multiplier}
               dude45={userCashedOut}
               dude56a={isButtonPressed}
               dude56b={buttonPressCount}
               buttonPressCount2={buttonPressCount}
             />
            </CardContent>
          </Card>
        </div>

        {/* Betting controls - Right Side */}
       <Betbutton
        isButtonPressed={isButtonPressed}
         gametime={gameState5.timeRemaining}
         gameState={gameState5.status}
         currentMultiplier={gameState5.multiplier}
         onStartGame={startGame}
         onCashout={handleCashout}
         userCashedOut={userCashedOut}
         cashouts={cashouts}
         multiplier={gameState5.multiplier}
         dude45={handleUserCashedOut}
         dude56={handleCurrencyChange}
         dude56a={handleButtonClicked}
         dude56b={buttonPressCount2}
         sendToCrashGame3={sendToCrashGame3}
         placeBetCounter={placebet123}
       />
<ConfettiCanvas />
      

      </div>
      {!isMobile && <BetList />}
      {isMobile && <Tabs gameState={gameState} crashPoint={crashPoint} onCrash={resetGame} />}
    </div>
  )
}

export default CrashGame