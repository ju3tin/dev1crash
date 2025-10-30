"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fish } from "lucide-react"
//import BezierCurve from '@/components/labels12';
import GameChat from "@/components/game-chat3a"
import PathAnimation from '@/components/PathAnimation1';
import Betbutton from "@/components/betbutton1a"
import BetList from "@/components/BetList1"
import GameVisual from '@/components/visualization123';
import GameHistory from '@/components/gamehistory';
import Tabs from '@/components/tabs3';
import useSound from 'use-sound';
import { useGameStore, GameState } from '@/store/gameStore2';
import { toast } from 'react-toastify';
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
  'images/chip1.png',
  'images/chip2.png',
  'images/chip3.png',
];

interface ConfettiCanvasProps {
  triggerConfetti: boolean;
}

const ConfettiCanvas = ({ triggerConfetti }: ConfettiCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const isAnimatingRef = useRef<boolean>(false);

  useEffect(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

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
      const x = canvas.width / 2;
      const y = canvas.height;
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI;
          const speed = Math.random() * 8 + 6;
          particles.push({
              x,
              y,
              size: Math.random() * 20 + 10,
              speedX: speed * Math.cos(angle),
              speedY: -speed * Math.sin(angle),
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
          p.speedY += 0.15;
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.drawImage(p.image, -p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
      }

      particlesRef.current = particles.filter(p => p.y > -50 && p.x > -50 && p.x < canvas.width + 50);

      if (particlesRef.current.length > 0) {
          requestAnimationFrame(animate);
      } else {
          isAnimatingRef.current = false;
      }
  };

  useEffect(() => {
      if (triggerConfetti) {
          spawnConfetti(100);
      }
  }, [triggerConfetti]);

  return (
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }} />
  );
};

type CashoutEvent = {
  id: string
  multiplier: number
  amount: number
}

interface GameVisualProps {
  currentMultiplier: number;
  onCashout: (multiplier: number) => void;
  dude55: boolean;
  dude56: string;
  betAmount: string;
}

interface GameHistoryProps {
  dude55: boolean;
  buttonPressCount: number;
  currentMultiplier: number;
}

const CrashGame = () => {
  const gameState5 = useGameStore((gameState5: GameState) => gameState5);
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
  const [crashPoint, setCrashPoint] = useState(0);
  const [betAmount, setBetAmount] = useState("0.1");
  const [autoCashoutAt, setAutoCashoutAt] = useState("2");
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [userCashedOut, setUserCashedOut] = useState(false);
  const [userWinnings, setUserWinnings] = useState(0);
  const [pathProgress, setPathProgress] = useState(0);
  const [cashouts, setCashouts] = useState<CashoutEvent[]>([]);
  const [currency, setCurrency] = useState<string>("USD");
  const pressed = usePressedStore((state) => state.pressed);
  const [hasLogged, setHasLogged] = useState(false);
  const [previousTimeRemaining, setPreviousTimeRemaining] = useState<number | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const walletAddress = useWalletStore((state) => state.walletAddress) || "Unknown User";

  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentMultiplierRef = useRef<number>(1);

  const MAX_MULTIPLIER = 100;
  const GAME_DURATION_MS = 15000;

  useEffect(() => {
    if (pressed === 1 && !hasLogged) {
      console.log('Pressed is 1 24 hours in checked');
      setHasLogged(true);
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
        data: data
      };

      axios.request(config)
        .then((response) => {
          console.log(JSON.stringify(response.data));
          console.log('The 1st bet has been logged and the wallet address is ' + walletAddress);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [pressed, hasLogged]);

  useEffect(() => {
    if (gameState5.status === "Crashed" && hasLogged) {
      setHasLogged(false);
    }
  }, [gameState5.status, hasLogged]);

  useEffect(() => {
    if (isNaN(gameState5.timeRemaining)) {
      return;
    } else {
      setPreviousTimeRemaining(gameState5.timeRemaining);
    }
  }, [gameState5.timeRemaining]);

  useEffect(() => {
    setbuttonPressCount1(buttonPressCount);
    setbuttonClicked1(buttonClicked1);
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (gameState5.status === "Waiting") {
      setplaceBetCounter(0);
      setIsCashedOut(false);
    }
  }, [gameState5.status]);

  useEffect(() => {
    if (placeBetCounter >= 1) {
      console.log('im not winning');
    }
  }, [placeBetCounter]);

  useEffect(() => {
    currentMultiplierRef.current = currentMultiplier;
  }, [currentMultiplier]);

  const generateCrashPoint = () => {
    return 1 + Math.random() * 5;
  };

  const startGame = (betAmount: string) => {
    setBetAmount(betAmount);
    if (Number.parseFloat(betAmount) <= 0) {
      return;
    }

    setUserCashedOut(false);
    setUserWinnings(0);
    setCashouts([]);
    setCurrentMultiplier(1);
    currentMultiplierRef.current = 1;
    setPathProgress(0);
    setGameState("Running");
    startTimeRef.current = Date.now();
    animateGame();
  };

  const animateGame = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(1, elapsed / GAME_DURATION_MS);
    const t = progress;
    const multiplier = 1 + Math.pow(t, 2) * (crashPoint - 1);
    const formattedMultiplier = Number.parseFloat(multiplier.toFixed(2));

    setCurrentMultiplier(formattedMultiplier);
    currentMultiplierRef.current = formattedMultiplier;

    const newPathProgress = Math.min(1, (multiplier - 1) / (crashPoint - 1));
    setPathProgress(newPathProgress);

    if (multiplier >= Number.parseFloat(autoCashoutAt) && !userCashedOut) {
      cashout(formattedMultiplier);
    }

    if (multiplier >= crashPoint) {
      endGame(crashPoint);
      return;
    }

    animationRef.current = requestAnimationFrame(animateGame);
  };

  const endGame = (finalMultiplier: number) => {
    cancelAnimationFrame(animationRef.current);
    if (gameTimerRef.current) {
      clearTimeout(gameTimerRef.current);
      gameTimerRef.current = null;
    }

    setGameState("Crashed");
    setCurrentMultiplier(finalMultiplier);
    currentMultiplierRef.current = finalMultiplier;

    setTimeout(() => {
      setGameState("Waiting");
    }, 3000);
  };

  const ispressed = (isButtonPressed: boolean) => {
    setIsButtonPressed(isButtonPressed);
  };

  const handleCashout = (multiplier: number) => {
    console.log(`Current Multiplier: ${multiplier}`);
    setCurrentMultiplier(multiplier);
    setIsCashedOut(true);
    setTriggerConfetti(true); // Trigger confetti on cashout
    setTimeout(() => setTriggerConfetti(false), 100); // Reset trigger to allow future triggers
  };

  const resetGame = () => {
    setGameState("Waiting");
  };

  const addCashoutEvent = (id: string, multiplier: number, amount: string) => {
    setCashouts((prev) => [
      ...prev,
      {
        id,
        multiplier,
        amount: Number.parseFloat(amount),
      },
    ]);
  };

  const handleUserCashedOut = (hasUserCashedOut: boolean) => {
    console.log(`User has cashed out: ${hasUserCashedOut}`);
  };

  const dude11 = (currency: string) => {
    console.log(`users currency: ${currency}`);
  };

  const cashout = (exactMultiplier?: number) => {
    if (gameState5.status !== "Running" || userCashedOut) return;

    const cashoutMultiplier = exactMultiplier || currentMultiplierRef.current;
    play();
    setUserCashedOut(true);
    setTriggerConfetti(true); // Trigger confetti on cashout
    setTimeout(() => setTriggerConfetti(false), 100); // Reset trigger to allow future triggers
    const winnings = Number.parseFloat(betAmount) * cashoutMultiplier;
    setUserWinnings(winnings);
    addCashoutEvent("you", cashoutMultiplier, betAmount);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (gameTimerRef.current) {
        clearTimeout(gameTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState5.status === "Crashed") {
      console.log(`what is the life of a gangstar ${placeBetCounter}`);
      setGameHistory(prev => [gameState5.multiplier, ...prev].slice(0, 10));
    }
  }, [gameState5.status, gameState5.multiplier]);

  const getCurvePath = () => {
    const startX = 0;
    const startY = 100;
    const midX = 100;
    const midY = 50;
    const endX = 100;
    const endY = Math.max(0, 50 - (currentMultiplier - 1) * 10);
    const control1X = 50;
    const control1Y = 100;
    const control2X = 100;
    const control2Y = 75;

    return `M ${startX},${startY} C ${control1X},${control1Y} ${control2X},${control2Y} ${midX},${midY} L ${endX},${endY}`;
  };

  const getPointAtProgress = (progress: number) => {
    if (!pathRef.current) return { x: 0, y: 100 };
    const pathLength = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(progress * pathLength);
    return { x: point.x, y: point.y };
  };

  const getMultiplierProgress = (multiplier: number) => {
    return Math.min(1, (multiplier - 1) / (crashPoint - 1));
  };

  const getRocketPosition = () => {
    return getPointAtProgress(pathProgress);
  };

  const getRocketRotation = () => {
    if (!pathRef.current) return 0;
    const pathLength = pathRef.current.getTotalLength();
    const distance = pathProgress * pathLength;
    const pointBefore = pathRef.current.getPointAtLength(Math.max(0, distance - 1));
    const pointAfter = pathRef.current.getPointAtLength(Math.min(pathLength, distance + 1));
    const angle = Math.atan2(pointAfter.y - pointBefore.y, pointAfter.x - pointBefore.x);
    return angle * (180 / Math.PI) + 90;
  };

  const handleCurrencyChange = (currencyId: string) => {
    console.log(`Selected currency: ${currencyId}`);
    setCurrency(currencyId);
  };

  const handleButtonClicked = (buttonClicked: boolean) => {
    setbuttonClicked1(buttonClicked);
   // setTriggerConfetti(true); 
   // setTimeout(() => setTriggerConfetti(false), 100); // Reset trigger to allow future triggers
  };

  const placebet123 = (placeBetCounter: number) => {
    setplaceBetCounter(placeBetCounter);
  };

  const buttonPressCount2 = (buttonPressCount: number) => {
    setbuttonPressCount1(buttonPressCount);
  };

  const [isButtonPressed, setIsButtonPressed] = useState(false);

  const sendToCrashGame3 = (buttonPressCount: number) => {
    console.log(`Sending buttonPressCount to crash-game3: ${buttonPressCount}`);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {!isMobile && <div className="lg:col-span-3 h-[500px]">
          <GameChat currentMultiplier={gameState5.multiplier} gameState={gameState5.status} crashPoint={crashPoint} onCrash={resetGame} />
        </div>}
        <div className="lg:col-span-7">
          <Card className="bg-black border-black">
            <CardContent className="p-1">
              <div className="flex justify-between items-center mb-4">
                {!isMobile && <h2 className="text-2xl font-bold text-white">{gameState === "Crashed" ? "CRASHED!" : "Multiplier"}</h2>}
                <div className="text-3xl font-mono font-bold text-green-400">{gameState5.multiplier}x</div>
              </div>
            
             <PathAnimation 
              currentMultiplier={gameState5.multiplier}
              timer5={gameState5.timeRemaining}
              onCashout={handleCashout}
              dude55={isCashedOut}
              dude56={currency}
              betAmount={betAmount}
              Gametimeremaining={gameState5.timeRemaining}
              GameStatus={gameState5.status}
              tValues={[]}
             />
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
        <ConfettiCanvas triggerConfetti={triggerConfetti} />
      </div>
      {!isMobile && <BetList />}
      {isMobile && <Tabs gameState={gameState} crashPoint={crashPoint} onCrash={resetGame} />}
    </div>
  );
}

export default CrashGame;