'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import QRCode from "react-qr-code";
import { Fish } from "lucide-react"
//import BezierCurve from '@/components/labels12';
import GameChat from "@/components/game-chat3a"
import PathAnimation from '@/components/PathAnimation1';
import Betbutton from "@/components/betbutton1b"
import BetList from "@/components/BetList1"
import GameVisual from '@/components/visualization123';
import GameHistory from '@/components/gamehistory';
import Tabs from '@/components/tabs3';
import useSound from 'use-sound';
import { useGameStore, GameState } from '@/store/gameStore2a';
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

import { useProgram } from '@/lib/anchor7';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import Navbar from '@/components/Navbar1';
import { motion } from 'framer-motion';
import {
  AlertCircle, Trophy, Zap, DollarSign, Users, Clock, X,
  Wallet, Send, ArrowDown, ArrowUp, RefreshCw, CheckCircle
} from 'lucide-react';

const PROGRAM_ID = new PublicKey("C3aRucgPgxHHD5nrT4busuTTnVmF55gqJwAccQwr8Qi4");

export default function GamePage() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayTab, setOverlayTab] = useState<'sol' | 'chippy' | 'demo'>('sol');
  const [overlaySubTab, setOverlaySubTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [overlayCopyStatus, setOverlayCopyStatus] = useState<'idle' | 'copied'>('idle');
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
  if (!overlayOpen) {
    console.log('Overlay is now CLOSED');
    // You can add any other logic here
  }
}, [overlayOpen]);

  useEffect(() => {
    if (overlayOpen) {
      setOverlayTab('sol');
      setOverlaySubTab('deposit');
    }
  }, [overlayOpen]);

  useEffect(() => {
    if (overlayOpen) {
      setOverlayCopyStatus('idle');
    }
  }, [overlayTab, overlaySubTab, overlayOpen]);

  const handleOverlayChange = useCallback((visible: boolean) => {
    setOverlayOpen(visible);
  }, []);

  const closeOverlay = useCallback(() => {
    handleOverlayChange(false);
  }, [handleOverlayChange]);

  const handleCopyOverlayAddress = useCallback(() => {
    const address =
      overlayTab === 'sol'
        ? 'DEPOSIT_SOL_ADDRESS'
        : 'DEPOSIT_CHIPPY_ADDRESS';

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API unavailable');
      return;
    }

    navigator.clipboard
      .writeText(address)
      .then(() => setOverlayCopyStatus('copied'))
      .catch((err) => {
        console.error('Failed to copy address', err);
        setOverlayCopyStatus('idle');
      });
  }, [overlayTab]);

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
      console.log(`what is the life of a gangstar ${placeBetCounter} Im not leaving yet ${overlayOpen}`);
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

  const program = useProgram();
  const { connection } = useConnection();
  const { publicKey: wallet, connected, sendTransaction } = useWallet();

  // === STATE ===
  const [config, setConfig] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<any>(null);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [activeBets, setActiveBets] = useState<any[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [multiplier, setMultiplier] = useState(100);
  const [isAnimating, setIsAnimating] = useState(false);

  // === INPUTS ===
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [targetMult, setTargetMult] = useState('2.5');
  const [gameName, setGameName] = useState('Crash #1');
  const [betUser, setBetUser] = useState('');          // admin optional pubkey
  const [betAmt, setBetAmt] = useState('');
  const [crashNow, setCrashNow] = useState(false);
  const [adminWithdrawAmt, setAdminWithdrawAmt] = useState('');
  const [bountyAmt, setBountyAmt] = useState('');
  // NEW INPUTS FOR MISSING INSTRUCTIONS
  const [adminSetAdmin, setAdminSetAdmin] = useState('');
  const [adminSetFeeBps, setAdminSetFeeBps] = useState('');
  const [adminPause, setAdminPause] = useState(false);
  const [adminResume, setAdminResume] = useState(false);

  // === PDAs ===
  const configPda = program ? PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID)[0] : null;
  const userPda = program && wallet ? PublicKey.findProgramAddressSync([Buffer.from('user_balance'), wallet.toBytes()], PROGRAM_ID)[0] : null;
  const vaultPda = program ? PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID)[0] : null;

  // === HELPERS ===
  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  // === DATA LOADING ===
  const loadAll = useCallback(async () => {
    if (!program || !wallet || !connected) return;
    await Promise.all([loadConfig(), loadUserBalance(), loadAllGames()]);
  }, [program, wallet, connected]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 5000);
    return () => clearInterval(id);
  }, [loadAll]);

  const loadConfig = async () => {
    if (!configPda || !program) return;
    try {
      const data = await program.account.config.fetch(configPda);
      setConfig(data);
      setIsAdmin(data.admin.toBase58() === wallet?.toBase58());
    } catch { }
  };

  const loadUserBalance = async () => {
    if (!userPda || !program) return;
    const info = await connection.getAccountInfo(userPda);
    if (!info) { setUserBalance(null); return; }
    try { setUserBalance(await program.account.userBalance.fetch(userPda)); }
    catch { setUserBalance(null); }
  };

  const loadAllGames = async () => {
    if (!program) return;
    try {
      const games = await program.account.gameState.all();
      const sorted = games.map(g => g.account).sort((a, b) => Number(b.createdAt.sub(a.createdAt)));
      setAllGames(sorted);
      const active = sorted.find(g => g.active);
      setCurrentGame(active || null);
      if (active) {
        startAnimation(Number(active.multiplier.toString()) / 100);
        loadActiveBets(active.gameId);
        if (wallet) loadMyBets(active.gameId);
      } else {
        setMultiplier(100);
        setIsAnimating(false);
      }
    } catch (e) { console.error(e); }
  };

  const loadActiveBets = async (gameId: PublicKey) => {
    if (!program) return;
    try {
      const bets = await program.account.bet.all();
      const active = bets
        .filter(b => b.account.gameId.toBase58() === gameId.toBase58() && b.account.active)
        .map(b => b.account);
      setActiveBets(active);
    } catch { }
  };

  const loadMyBets = async (gameId: PublicKey) => {
    if (!program || !wallet) return;
    try {
      const bets = await program.account.bet.all();
      const my = bets
        .filter(b => b.account.user.toBase58() === wallet.toBase58() && b.account.gameId.toBase58() === gameId.toBase58())
        .map(b => b.account);
      setMyBets(my);
    } catch { }
  };

  const startAnimation = (target: number) => {
    setMultiplier(100);
    setIsAnimating(true);
    const int = setInterval(() => {
      setMultiplier(prev => {
        if (prev >= target * 100) {
          clearInterval(int);
          setIsAnimating(false);
          return target * 100;
        }
        return prev + Math.floor(Math.random() * 35);
      });
    }, 80);
  };

  // ==============================================================
  // === ON-CHAIN INSTRUCTIONS (EXISTING + NEW) ===
  // ==============================================================

  

  const createUser = async () => {
    if (!program || !wallet || !userPda) return;
    setLoading(true);
    try {
      const tx = await program.methods.createUser()
        .accounts({ user: userPda, userWallet: wallet, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'User created!');
      setTimeout(loadUserBalance, 3000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const deposit = async () => {
    if (!program || !wallet || !userPda || !vaultPda || !depositAmt) return;
    const lamports = Math.floor(parseFloat(depositAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods.deposit(new BN(lamports))
        .accounts({ user: userPda, userWallet: wallet, vault: vaultPda, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Deposited!');
      setDepositAmt('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  const withdraw = async () => {
    if (!program || !wallet || !userPda || !vaultPda || !withdrawAmt) return;
    const lamports = Math.floor(parseFloat(withdrawAmt) * LAMPORTS_PER_SOL);
    if (lamports < 1000) return showStatus('error', 'Min: 0.000001 SOL');
    setLoading(true);
    try {
      const tx = await program.methods.withdraw(new BN(lamports))
        .accounts({ user: userPda, userWallet: wallet, vault: vaultPda, systemProgram: SystemProgram.programId })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Withdrawn!');
      setWithdrawAmt('');
      setTimeout(loadUserBalance, 4000);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  

  

  

  const claimPayout = async (bet: any) => {
    if (!program || !wallet || !userPda) return;
    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), bet.user.toBytes(), bet.gameId.toBytes()], PROGRAM_ID
    );

    setLoading(true);
    try {
      const tx = await program.methods.claimPayout()
        .accounts({ bet: betPda, userBalance: userPda, signer: wallet })
        .transaction();
      await sendTransaction(tx, connection);
      showStatus('success', 'Payout claimed!');
      loadUserBalance();
      loadMyBets(bet.gameId);
    } catch (e: any) { showStatus('error', e.message); }
    finally { setLoading(false); }
  };

  

  

  // ------------------- NEW ADMIN FUNCTIONS -------------------

  

  // ==============================================================
  // === UI RENDERING ===
  // ==============================================================

  return (
    <>

     
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
          userBalance={userBalance} // Added this line
          onOverlayChange={handleOverlayChange}
        />
        <ConfettiCanvas triggerConfetti={triggerConfetti} />
      </div>
      {!isMobile && <BetList />}
      {isMobile && <Tabs gameState={gameState} crashPoint={crashPoint} onCrash={resetGame} />}
    </div>
      {overlayOpen && (
        <div className="fixed inset-0 z-[1000]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeOverlay}
            role="presentation"
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center p-6">
            <div className="max-w-2xl w-full rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Wallet Options</h2>
                <Button
                  variant="ghost"
                  className="text-neutral-300 hover:text-white hover:bg-white/10"
                  onClick={closeOverlay}
                >
                  Close
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                {(['sol', 'chippy', 'demo'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOverlayTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      overlayTab === tab
                        ? 'bg-green-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab === 'sol' ? 'Sol' : tab === 'chippy' ? 'Chippy' : 'Demo'}
                  </button>
                ))}
              </div>

              {(overlayTab === 'sol' || overlayTab === 'chippy') && (
                <div className="flex gap-3">
                  {(['deposit', 'withdraw'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setOverlaySubTab(tab)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        overlaySubTab === tab
                          ? 'bg-green-500 text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {tab === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-2xl bg-black/40 border border-white/10 p-6 space-y-6">
                {overlayTab === 'demo' && (
                  <div className="space-y-4 text-neutral-200">
                    <h3 className="text-xl font-semibold text-white">Demo Balance</h3>
                    <p className="text-sm text-neutral-300">
                      Use demo currency to try the game without any real funds. Reset your demo balance from the bet panel whenever you need more credits.
                    </p>
                    <Button
                      className="bg-green-600 hover:bg-green-500 text-black font-semibold"
                      onClick={closeOverlay}
                    >
                      Return to Game
                    </Button>
                  </div>
                )}

                {(overlayTab === 'sol' || overlayTab === 'chippy') && overlaySubTab === 'deposit' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">
                      {overlayTab === 'sol' ? 'Deposit SOL' : 'Deposit CHIPPY'}
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-black p-4 rounded-2xl">
                        {overlayTab === 'sol' ? (
                         <>
                          <input type="number" step="0.000001" min="0.000001"
                          placeholder="Deposit (SOL)" value={depositAmt}
                          onChange={e => setDepositAmt(e.target.value)}
                          className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <button onClick={deposit} disabled={loading || !depositAmt}
                          className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                          <ArrowDown className="w-5 h-5" />
                          {loading ? '...' : 'DEPOSIT'}
                        </button>
                         
                         </>
                        ) : (
                          <>
                          <input type="number" step="0.000001" min="0.000001"
                          placeholder="Deposit (CHIPPY)" value={depositAmt}
                          onChange={e => setDepositAmt(e.target.value)}
                          className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <button onClick={deposit} disabled={loading || !depositAmt}
                          className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                          <ArrowDown className="w-5 h-5" />
                          {loading ? '...' : 'DEPOSIT'}
                        </button>
                         
                         </>
                        )
                        }
                      
                      </div>
                      <p className="text-sm text-neutral-300 text-center break-all">
                        {overlayTab === 'sol' ? 'DEPOSIT_SOL_ADDRESS' : 'DEPOSIT_CHIPPY_ADDRESS'}
                      </p>
                      <Button
                        onClick={handleCopyOverlayAddress}
                        className="bg-green-600 hover:bg-green-500 text-black font-semibold"
                      >
                        {overlayCopyStatus === 'copied' ? 'Copied!' : 'Copy Address'}
                      </Button>
                      <p className="text-xs text-neutral-400 text-center">
                        Send only {overlayTab === 'sol' ? 'SOL' : 'CHIPPY'} to this address. Transfers are credited after confirmation on the blockchain.
                      </p>
                    </div>
                  </div>
                )}

                {(overlayTab === 'sol') && overlaySubTab === 'withdraw' && (
                    
                    <>
                    <input type="number" step="0.000001" min="0.000001"
                    placeholder="Withdraw (SOL)" value={withdrawAmt}
                    onChange={e => setWithdrawAmt(e.target.value)}
                    className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button onClick={withdraw} disabled={loading || !withdrawAmt}
                    className="w-full p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                    <ArrowUp className="w-5 h-5" />
                    {loading ? '...' : 'WITHDRAW'}
                  </button>
                  </>
                )}
                  {(overlayTab === 'chippy') && overlaySubTab === 'withdraw' && (

                    <>
                    <input type="number" step="0.000001" min="0.000001"
                    placeholder="Withdraw (CHIPPY)" value={withdrawAmt}
                    onChange={e => setWithdrawAmt(e.target.value)}
                    className="w-full p-4 bg-white/10 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button onClick={withdraw} disabled={loading || !withdrawAmt}
                    className="w-full p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                    <ArrowUp className="w-5 h-5" />
                    {loading ? '...' : 'WITHDRAW'}
                  </button>
                  </>
                  )}
                  {/* toast errors and replies from the server */}
                   {status && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className={`fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 flex items-center gap-3 p-5 rounded-2xl text-xl font-bold ${status.type === 'error' ? 'bg-red-900/70 text-red-300' : 'bg-green-900/70 text-green-300'} backdrop-blur shadow-2xl`}>
                  {status.type === 'error' ? <X className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                  {status.msg}
                </motion.div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}