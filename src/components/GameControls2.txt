"use client";

import { useState, useEffect, useRef } from "react";
import React from "react";
import ReactDOM from "react-dom";
import QRCode from "react-qr-code";
import JSConfetti from 'js-confetti';
import { FaWallet } from 'react-icons/fa'; // Using FontAwesome for example
import {Tabs, Tab, CardBody} from "@nextui-org/react";

import copy from "copy-to-clipboard";
//import { toast } from "react-toastify";
import Image from 'next/image'

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/uis/card";
import { toast } from "sonner";
import { Checkbox } from "@nextui-org/checkbox";
import { useGameStore, GameState } from "../store/gameStore2";
import { useEffectEvent } from "../hooks/useEffectEvent";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Input } from "@/components/uis/input";	
import { Button } from "@/components/uis/button";
import { Label } from "@/components/uis/label";
import { currencies } from "../lib/currencies";
import CurrencyList from "./CurrencyList";
import styles from "../styles/components/GameControls2.module.css";
import WalletLoginOverlay from './WalletLoginOverlay';

export default function GameControls() {
	const textRef = useRef();
	
	const [copied, setCopied] = useState(false);
	const textToCopy = "This is the text to copy!";
  
	const handleCopy = () => {
		navigator.clipboard
		  .writeText(textToCopy)
		  .then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
		  })
		  .catch((err) => {
			console.error("Failed to copy text: ", err);
		  });
	  };
	
	
	const { publicKey } = useWallet();
	const { connection } = useConnection();
	const walletAddress = publicKey?.toBase58() || '';
	const [overlayVisible, setOverlayVisible] = useState(false);
	const [walletOverlayVisible, setWalletOverlayVisible] = useState(false);
	const [betgreaterthan0, setBetgreaterthan0] = useState(false);
	const [demoamountgreaterthan0, setDemoamountgreaterthan0] = useState(false);
	const [walletBalance, setWalletBalance] = useState<number | null>(null);
	const [demoAmount, setDemoAmount] = useState<string>("0");
	const [betAmount, setBetAmount] = useState<string>("0");
	const [autoCashOut, setAutoCashOut] = useState<string>("0");
	const [currency, setCurrency] = useState<string>(currencies[0].id);
	const [isAutoCashOutDisabled, setIsAutoCashOutDisabled] = useState(true);
	const [address1a, setAddress1a] = useState<string>('');

	const isWaiting = useGameStore((game: GameState) => game.isWaiting);
	const isPlaying = useGameStore((game: GameState) => game.isPlaying);
	const isCashedOut = useGameStore((game: GameState) => game.isCashedOut);
	const gameStatus = useGameStore((game: GameState) => game.status);
	const isConnected = useGameStore((game: GameState) => game.isConnected);
	const isLoggedIn = useGameStore((game: GameState) => game.isLoggedIn);
	const balances = useGameStore((game: GameState) => game.balances);
	const errors = useGameStore((game: GameState) => game.errors);
	const errorCount = useGameStore((game: GameState) => game.errorCount);

	const { placeBet, cancelBet, cashOut, setUserWalletAddress } = useGameStore(
		(game: GameState) => game.actions
	);

	const haveValidBet =
		/^[0-9]+(\.?[0-9])*$/.test(betAmount) && parseFloat(betAmount);

	const handleChangeBetAmount = (amount: string) => {
		setBetAmount(amount);
	};
	
	const handleChangeDemoAmount = (amount: string) => {
		setDemoAmount(amount);
	}

	const handleChangeAutoCashOut = (amount: string) => {
		setAutoCashOut(amount);
	};

	const handleCheckboxChange = (checked: boolean) => {
		setIsAutoCashOutDisabled(checked);
		if (checked) {
			setAutoCashOut("0"); // Optionally reset autoCashOut when disabling
		}
	};

	const jsConfetti = useRef<JSConfetti>();

	useEffect(() => {
		jsConfetti.current = new JSConfetti()
	// load conconfetti with images ch1ppy123ax
		const img = new window.Image()
		img.src = '/images/star.png'
	
		img.onload = () => {
			jsConfetti.current?.addConfetti({
			images: [img],
			confettiNumber: 50,
			confettiRadius: 30,
		  })
		}}
	)

	useEffect(() => {


		
		jsConfetti.current = new JSConfetti();
	}, []);

	const handleButtonClick = () => {
		if (isWaiting) {
			cancelBet();
			return;
		}

		if (isPlaying && !isCashedOut) {
			cashOut();
		} else {
			console.log("Using wallet address:", walletAddress); // Debug log
			setUserWalletAddress(walletAddress);
			if (currency === currencies[2].id && parseFloat(demoAmount) <= 0) { // Assuming currencies[1] corresponds to ID 2
				red2();
				console.log("bitch 123.");
				return; // Exit the function if the bet amount is invalid
			//	setDemoAmount((prevAmount) => (parseFloat(prevAmount) - parseFloat(betAmount)).toString());

			}
			if (parseFloat(betAmount) <= 0) {
				red1();
				console.log("Bet amount must be greater than 0.");
				return; // Exit the function if the bet amount is invalid
			}
			if (currency === currencies[2].id) { // Assuming currencies[1] corresponds to ID 2
				setDemoAmount((prevAmount) => (parseFloat(prevAmount) - parseFloat(betAmount)).toString());
			}
		
			placeBet(betAmount, autoCashOut, currency, walletAddress, walletAddress);
			jsConfetti.current?.addConfetti();
		}
	};

	const isButtonDisabled: boolean = !isConnected || (gameStatus == "Running" && !isPlaying)/* || (gameStatus == "Running" && isPlaying && !isCashedOut)*/;
	//const isButtonDisabled: boolean = !isConnected;

	const getButtonText = (): string => {
		if (!isConnected) return "Connecting...";
		if (isWaiting) return "Cancel bet";

		if (gameStatus == "Running") {
			if (isPlaying && !isCashedOut) {
				return "Cash out";
			} else {
				//return "Place bet (next round)";
				return "Bet (next round)";

			}
		} else {
			return "Place bet";
		}
	};

	const showErrorToast = useEffectEvent(() => {
		if (errors.length > 0) toast("⚠️ " + errors[errors.length - 1]);
	});
	// Check if wallet is valid (not null and has at least 3 figures/0.001 SOL)
	const isWalletValid = () => {
		return publicKey && walletBalance;
	};

	// Get wallet balance when publicKey changes
	useEffect(() => {
		const getWalletBalance = async () => {
			if (publicKey && connection) {
				try {
					const balance = await connection.getBalance(publicKey);
					setWalletBalance(balance / 1000000000); // Convert lamports to SOL
				} catch (error) {
					console.error('Error fetching wallet balance:', error);
					setWalletBalance(null);
				}
			} else {
				setWalletBalance(null);
			}
		};

		getWalletBalance();
	}, [publicKey, connection]);

	const toggleOverlay = () => {
		// Check if wallet is connected before allowing access to deposit overlay
		if (!isWalletValid()) {
			setWalletOverlayVisible(true);
			return;
		}
		setOverlayVisible(!overlayVisible);
	};

	const toggleWalletOverlay = () => {
		setWalletOverlayVisible(!walletOverlayVisible);
	};
	  
	const red1 = () => {
		setBetgreaterthan0(!betgreaterthan0);
	//	console.log("red1");
	};
	const red2 = () => {
	setDemoamountgreaterthan0(!demoamountgreaterthan0);
	//	console.log("red1");
	};
	useEffect(() => {
		showErrorToast();
	}, [errorCount, showErrorToast]);



	
	
	return (
		<Card>
		 {/* Button to trigger overlay
		 <Button onClick={toggleOverlay} className="show-overlay-btn">
		 Show Message Board
	   </Button> */}
 
	   {/* Overlay */}
	   {overlayVisible && (
		 <div className="overlay">
		   <div className="message-board-container">
			 <div className="message-form">
			   
			 <Tabs aria-label="Options">
        <Tab key="Sol" title="Sol">
		<Tabs aria-label="Options">
        <Tab key="Chippydeposit" title="Deposit">
		  <Card>
	  
<div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
  <QRCode
    size={256}
    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    value='fuck you'
    viewBox={`0 0 256 256`}
  />
        <p>{textToCopy}</p>
      <a href="#" onClick={(e) => { e.preventDefault(); handleCopy(); }}>
        {copied ? "Copied!" : "Copy to Clipboard"}
      </a>
</div>

          </Card>
		  </Tab>
		  <Tab key="ChippyWithdraw" title="Withdraw">
		  <Card>
		  Enter a wallet address on the Solana network. Your withdrawal will be processed INSANTLY.
<div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
 <Label>Amount</Label>
 <input type="text" id="username" 
        placeholder="SOL" />
 <Label>Wallet Address for Withdrawal</Label>
 <input type="text" id="username" 
        placeholder="Wallet Address" />

<Button>Withdrawal</Button>
 
</div>
          </Card>
		  </Tab>
		  </Tabs>
        </Tab>
        <Tab key="Chippy" title="Chippy">
		<Tabs aria-label="Options">
        <Tab key="Chippydeposit" title="Deposit">
		  <Card>
		  
		  <div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
  <QRCode
    size={256}
    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    value='fuck you'
    viewBox={`0 0 256 256`}
  />
        <p>{textToCopy}</p>
      <a href="#" onClick={(e) => { e.preventDefault(); handleCopy(); }}>
        {copied ? "Copied!" : "Copy to Clipboard"}
      </a>
</div>
          </Card>
		  </Tab>
		  <Tab key="ChippyWithdraw" title="Withdraw">
		  <Card>
		  Enter a wallet address on the Solana network. Your withdrawal will be processed INSANTLY.
<div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
<Label>Amount</Label>
 <input type="text" id="username" 
        placeholder="SOL" />
 <Label>Wallet Address for Withdrawal</Label>
 <input type="text" id="username" 
        placeholder="Wallet Address" />

<Button>Withdrawal</Button>
</div>
          </Card>
		  </Tab>
		  </Tabs>
        </Tab>
        <Tab key="Demo" title="Demo">
<Card>
	<Label>Demo Amount {demoAmount}</Label>
	</Card>          
		  <Card>
Use demo currency to play our games without any risk. If you run out of demo credits, you can reset your demo balance anytime by clicking the button below. Have fun and enjoy your experience!
		  <Button
		  onClick={() => handleChangeDemoAmount('100')}
		  >
		  <FaWallet className={styles.walletIcon} /> {/* Icon from FontAwesome */}
			Reset Demo Balance		
		  </Button>
          </Card>
        </Tab>
      </Tabs>
			 
			 </div>
 
			
 
			 <button onClick={toggleOverlay} className="close-overlay-btn">
			   Close
			 </button>
		   </div>
		 </div>
	   )}

{demoamountgreaterthan0 && (
		<div className="overlay">
		<div className="message-board-container">
		<div className="message-form">
		<p>Demo amount must be greater than 0.</p>
		</div>
		<button onClick={red2} className="close-overlay-btn">
			   Close
			 </button>
		</div>
		</div>
	)}


	   {betgreaterthan0 && (
		<div className="overlay">
			 <div className="message-board-container">
			 <div className="message-form">
		<p>Bet amount must be greater than 0.</p>
		</div>
		<button onClick={red1} className="close-overlay-btn">
			   Close
			 </button>
		</div>
		</div>
	   )}

	   <WalletLoginOverlay
		isOpen={walletOverlayVisible}
		onClose={toggleWalletOverlay}
		title="Wallet Connection Required"
		description="You must connect your wallet before you can make deposits or place bets."
		action="make deposits or place bets"
	   />
	
			<CardHeader>
				<CardTitle>Place your bets!</CardTitle>
			</CardHeader>

			<CardContent>
				<div className={styles.inputGroup}>
					<Label>Demo Amount</Label>
					<Input
						placeholder="Demo amount"
						type="number"
						min="0"
						value={demoAmount}
						disabled
					/>
				</div>
				<div className={styles.inputGroup}>
					<Label>Bet Amount</Label>
					<Input
						placeholder="Bet amount"
						type="number"
						min="0"
						step="0.01"
						onChange={(e) => handleChangeBetAmount(e.target.value)}
						value={betAmount}
					/>
				</div>
				<Label>Auto Cashout</Label>
				<Checkbox
					isSelected={isAutoCashOutDisabled}
					onChange={(e) => handleCheckboxChange(e.target.checked)}
				>
					Disable Auto Cashout
				</Checkbox>
				<Input
					placeholder="Auto cashout"
					type="number"
					min="0"
					step="0.01"
					onChange={(e) => handleChangeAutoCashOut(e.target.value)}
					value={autoCashOut}
					disabled={isAutoCashOutDisabled}
				/>
				<Label>Currency</Label>
				<CurrencyList 
					balances={balances} 
					onCurrencyChange={setCurrency}
				/>
			</CardContent>

			<CardFooter>
				<Button onClick={handleButtonClick} disabled={isButtonDisabled} className={styles.BetButton}>
					{getButtonText()}
				</Button>
				<div>
				<Button  onClick={toggleOverlay} className={styles.BetButton}>
				<FaWallet className={styles.walletIcon} /> {/* Icon from FontAwesome */}
					{isWalletValid() ? 'Deposit Chippy' : 'Connect Wallet to Deposit'}</Button></div>
			</CardFooter>
		</Card>
	);
}
