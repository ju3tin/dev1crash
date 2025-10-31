"use client"

import { io, Socket } from "socket.io-client";


import { jwtDecode } from 'jwt-decode';

import { create } from "zustand";

//import {address1a} from "@/src/components/WalletConnection"
//import { useWalletContext } from "@/src/providers/WalletContextProvider";

//import Cors from "cors";

import { elapsedToMultiplier } from '@/lib/utils3';
import { Wallet } from "lucide-react";

import { address1a } from "@/components/WalletConnection";
//export let address1a: string = '';
//const { wallet1a } = useWalletContext();
export type GameStatus =
	'Unknown'
	| 'Waiting'
	| 'Running'
	| 'Stopped'
	| 'Crashed';

export type JwtToken = {
	exp: number;
	nbf: number;
	wallet: string;
}

export type Bet = {
	wallet: string;
	betAmount: string;
	currency: string;
	autoCashOut: string;
	cashOut: string;
	cashOutTime: Date;
	isCashedOut: boolean;
	winnings: string;
}

export type CrashedGame = {
	id: string;
	duration: number,
	multiplier: string;
	players: number;
	winners: number;
	startTime: number;
	hash: string;
}

export type GameStateData = {
	gameId: string|null,
	status: GameStatus;
	players: Bet[];
	waiting: Bet[];
	startTime: number;
	isConnected: boolean;
	isLoggedIn: boolean;
	isWaiting: boolean;
	isPlaying: boolean
	isCashedOut: boolean;
	timeRemaining: number;
	timeElapsed: number;
	multiplier: string;
	crashes: CrashedGame[];
	balances: Record<string, string>;
	wallet: string|null;
	errors: string[];
	errorCount: number;
	userWalletAddress: string;
	setUserWalletAddress: (address: string) => void;
}

export type GameActions = {
	authenticate: (message: string, signature: string) => void;
	switchWallet: (newWallet: string|null) => void;
	login: () => void;
	getNonce: () => Promise<string>;
	placeBet: (betAmount: string, autoCashOut: string, currency: string) => void;
	cashOut: () => void;
	cancelBet: () => void;
	setUserWalletAddress: (address: string) => void;
	// Send a PLACE_BET message to the crash WebSocket server
	sendPlaceBetWS: (walletAddress: string, amount: number, currency: string) => void;
	// Send a FINISH_BET message to the crash WebSocket server
	sendFinishBetWS: (walletAddress: string) => void;
}

export type GameState = GameStateData & { actions: GameActions };

const initialState : GameStateData = {
	gameId: null,
	status: 'Unknown',
	players: [],
	waiting: [],
	startTime: 0,
	isConnected: false,
	isLoggedIn: false,
	isWaiting: false,
	isPlaying: false,
	isCashedOut: false,
	timeRemaining: 0,
	timeElapsed: 0,
	multiplier: '0',
	crashes: [],
	balances: {},
	wallet: null,
	errors: [],
	errorCount: 0,
	userWalletAddress: '',
	setUserWalletAddress: () => {},
};

type GameWaitingEventParams = {
	startTime: number;
};

type GameRunningEventParams = {
	startTime: number;
};

type GameCrashedEventParams = {
	game: CrashedGame;
};

type BetListEventParams = {
	players: Bet[];
	waiting: Bet[];
};

type RecentGameListEventParams = {
	games: CrashedGame[];
};

type InitBalancesEventParams = {
	balances: Record<string, string>;
}

type UpdateBalancesEventParams = {
	currency: string;
	balance: string;
}

type PlayerWonEventParams = {
	wallet: string;
	multiplier: string;
}

type AuthenticateResponseParams = {
	success: boolean;
	token: string;
}

type LoginResponseParams = {
	success: boolean;
}

type PlaceBetResponseParams = {
	success: boolean;
}

type NonceResponse = {
	nonce: string;
}

export const useGameStore = create<GameState>((set, get) => {
	const socket4 = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
		withCredentials: true // Include cookies/auth headers if needed
	});

	const socket1 = new WebSocket(process.env.NEXT_PUBLIC_CRASH_SERVER!);



	let gameWaitTimer: ReturnType<typeof setInterval>|null = null;
	let gameRunTimer: ReturnType<typeof setInterval>|null = null;

	const gameWaiter = () => {
		const { startTime } = get();
		const timeRemaining = Math.round((startTime - new Date().getTime())/1000);

		if (timeRemaining <= 0) {
			set({ timeRemaining: 0 });

			if (gameWaitTimer) {
				clearInterval(gameWaitTimer);
				gameWaitTimer = null;
			}
		} else {
			set({ timeRemaining });
		}
	};

	const gameRunner = () => {
		const { startTime, status } = get();
		const timeElapsed = Math.round(new Date().getTime() - startTime);

		if (status != 'Running') {
			if (gameRunTimer) {
				clearInterval(gameRunTimer);
				gameRunTimer = null;
			}
		} else {
			set({
				timeElapsed,
				multiplier: elapsedToMultiplier(timeElapsed)
			});
		}
	};
//

socket1.onopen = () => {
	console.log('Connected to WebSocket server');
	set({ isConnected: true });
  };
  
  
  socket1.onmessage = (event) => {
	console.log('Message from server: ', event.data);
	const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
	//setMessage(event.data);

	// Add message to chat
	let roundStartTimestamp; // Store the current timestamp globally
	const timestamp = new Date().toLocaleTimeString();
	//setChatMessages(prev => [...prev, { text: event.data, timestamp }]);
	const message1 = JSON.parse(event.data);
	switch (message1.action) {

	  case 'ROUND_STARTED':
		roundStartTimestamp = new Date(); // Store the current timestamp globally
	   console.log('Round started at:', roundStartTimestamp.toLocaleTimeString()); // Log the timestamp
		


	   set({
		startTime: roundStartTimestamp.getTime(),
		status: 'Running'
	});

	if (gameWaitTimer) {
		clearInterval(gameWaitTimer);
		gameWaitTimer = null;
	}

	if (gameRunTimer) {
		clearInterval(gameRunTimer);
		gameRunTimer = null;
	}

	gameRunTimer = setInterval(gameRunner, 5);
		// Reset chart data when the round starts
	/*	setChartData({
		  datasets: [{
			label: '', // Remove dataset label
			data: [{ x: 0, y: 0 }],
			borderColor: '#FF2D00',
			tension: 0.4,
			pointRadius: 0,
		  }],
		});
		
	*/	
		// Store the round start timestamp in state if needed
	   // setRoundStartTimestamp(roundStartTimestamp); // Assuming you have a state for this
	 
		break;
		
		case 'ROUND_CRASHED':
			//  setDude34(message.totalMult);
		  /*  if(MessageLost.current){
			  MessageLost.current.style.opacity = "0"; // Set the message content
			}
			setIsButtonDisabled(false);
			setIsLineGraphVisible(false);
			setDude34(messageData.totalMult); // Set only the totalMult value
			
			if (roundCrash.current) {
			  roundCrash.current.style.opacity = "1"
			  roundCrash.current.style.display = "block";
			  roundCrash.current.style.color = "black";
			  roundCrash.current.innerHTML = `Round Crash At <br /> ${message1.totalMult}`;
			}*/
			console.log(`The game crashed at ${message1.multiplier}`)
			
	  
			  const dude444 = roundStartTimestamp;
			  const { crashes } = get();
	  
			  set({
				  status: 'Crashed',
				  /*crashes: [...(
					  crashes.length <= 30
						  ? crashes
						  : crashes.slice(0, 30)
				  ), params.game],
				  */timeElapsed: dude444 ? dude444 - 34 : 0,
			  });
	  
			  break
			  case 'ROUND_ENDS':
			console.log(`The game crashed at ${message1.multiplier}`)
				
			  break;
				
	  case 'CNT_MULTIPLY':
		// Handle CNT_MULTIPLY action
	console.log(`CNT_MULTIPLY action received with data: ${message1.data}`);
	
		// Reset chart data with x as numericValue and y as timeDiff
		break;
		case "WON":
		
	   //   if (multiplyStr){
		  //  multiplyStr.style.left = "-30%";
		  //  multiplyLbl.style.color = "#00C208";
	   //   }
		  
		 // multiplyLbl.textContent = "YOU ARE WON: " 
		 //                         + (Math.trunc(jsonMessage.bet) == jsonMessage.bet ? Math.trunc(jsonMessage.bet) : parseFloat(jsonMessage.bet).toFixed(3))   
		 //                         + " x " 
		 //                         + parseFloat(jsonMessage.mult).toFixed(3);
		  break;

		case "LOST":
		  break;
		case "PLAYER_BET":
			console.log(`Bet placed by ${message1.walletAddress} with amount ${message1.amount} and currency ${message1.currency} and balance ${message1.balance}`);
		  break;
	  case "SECOND_BEFORE_START":

	  const timeRemaining = message1.data;

	  if (timeRemaining <= 0) {
		set({ timeRemaining: 0 })
	} else {
		set({ timeRemaining });
	}

	  set({
		status: 'Waiting',
		startTime: roundStartTimestamp,
		timeElapsed: 0,
	},);
	

	

	if (gameWaitTimer) {
		clearInterval(gameWaitTimer);
		gameWaitTimer = null;
	}
console.log("theis is how many seconds left"+message1.data);
	gameWaitTimer = setInterval(gameWaiter, 1000);



		  break;
	  case 'BTN_BET_CLICKED':
		// Handle BTN_BET_CLICKED action
		console.log(`BTN_BET_CLICKED action received with bet: ${message1.bet}`);
		break;
		case 'BET_MADE':
			roundStartTimestamp = new Date(); // Store the current timestamp globally
			console.log('Round started at:', roundStartTimestamp.toLocaleTimeString()); // Log the timestamp
		break;
	  default:
		console.log(`Unknown action received: ${message1.action}`);
	}

 

	// When you receive a new timestamp
	const newTimestamp = new Date(); // Get the new timestamp
	if (roundStartTimestamp) { // Check if roundStartTimestamp is not null
	  const timeDifference = (newTimestamp.getTime() - roundStartTimestamp.getTime()) / 1000; // Calculate difference in seconds
	  console.log('Time since round started:', timeDifference, 'seconds');
	} else {
	  console.log('Round has not started yet.'); // Log if round has not started
	}

 

  };

  socket1.onclose = () => {
	console.log('Connection closed');
  };
  
  socket1.onerror = (error) => {
	console.error('WebSocket error:', error);
  };
  //
	socket4.on('connect', () => {
		console.log('Socket connected');

		const token = localStorage?.getItem('token') ?? null;

		if (token !== null)
			actions.login();

		set({ isConnected: true });
	});

	socket4.on('disconnect', () => {
		console.log('Socket disconnected');
		set({ isConnected: false });
	});

	socket4.on('GameWaiting', (params: GameWaitingEventParams) => {
		console.log('Game in waiting state')
		set({
			status: 'Waiting',
			startTime: params.startTime,
			timeElapsed: 0,
		});

		if (gameWaitTimer) {
			clearInterval(gameWaitTimer);
			gameWaitTimer = null;
		}

		gameWaitTimer = setInterval(gameWaiter, 1000);
	});

	socket4.on('GameRunning', (params: GameRunningEventParams) => {
		console.log('Game in running state')

		console.log("StartTime latency:", new Date().getTime() - params.startTime);

		set({
			startTime: params.startTime,
			status: 'Running'
		});

		if (gameWaitTimer) {
			clearInterval(gameWaitTimer);
			gameWaitTimer = null;
		}

		if (gameRunTimer) {
			clearInterval(gameRunTimer);
			gameRunTimer = null;
		}

		gameRunTimer = setInterval(gameRunner, 5);
	});

	socket4.on('GameCrashed', (params: GameCrashedEventParams) => {
		console.log('Game in crashed state')

		const { crashes } = get();

		set({
			status: 'Crashed',
			crashes: [...(
				crashes.length <= 30
					? crashes
					: crashes.slice(0, 30)
			), params.game],
			timeElapsed: params.game.duration,
		});

		if (gameWaitTimer) {
			clearInterval(gameWaitTimer);
			gameWaitTimer = null;
		}

		if (gameRunTimer) {
			clearInterval(gameRunTimer);
			gameRunTimer = null;
		}
	});

	socket4.on('BetList', (params: BetListEventParams) => {
		console.log('Received bet list')

		const { wallet } = get();
		const playing = params.players.find((player) => player.wallet == wallet);
		const waiting = params.waiting.find((player) => player.wallet == wallet);
		const playerInList = playing ?? waiting;

		set({
			players: params.players,
			waiting: params.waiting,
			isWaiting: !!waiting,
			isPlaying: !!playing,
			isCashedOut: !!playerInList?.isCashedOut,
		});
	});

	socket4.on('RecentGameList', (params: RecentGameListEventParams) => {
		console.log('Received recent game list')
		set({ crashes: params.games ?? [] });
	});

	socket4.on('PlayerWon', (params: PlayerWonEventParams) => {
		console.log('Received player won event')

		const { players, wallet } = get();
		const index = players.findIndex((player) => player.wallet == params.wallet);

		if (index != -1) {
			const newPlayers = [...players];

			newPlayers[index].isCashedOut = true;
			newPlayers[index].cashOut = params.multiplier;
			newPlayers[index].cashOutTime = new Date();

			if (wallet == params.wallet) {
				set({ players: newPlayers, isCashedOut: true });
			} else {
				set({ players: newPlayers });
			}
		}
	});

	socket4.on('InitBalances', (params: InitBalancesEventParams) => {
		console.log('Received balance list')
		set({ balances: params?.balances ?? {} });
	});

	socket4.on('UpdateBalance', (params: UpdateBalancesEventParams) => {
		console.log('Received balance update')
		set({
			balances: {
				...get().balances ?? {},
				[params.currency]: params.balance
			}
		});
	});

	const actions = {
		authenticate: (
			message: string,
			signature: string
		) => {
			console.log('Authenticating...');

			socket4.emit('authenticate', {
				message,
				signature
			}, (params: AuthenticateResponseParams) => {
				if (params?.success && params?.token) {
					console.log(`Token: ${params.token}`);
					localStorage.setItem('token', params.token);
					actions.login();
				}
			});
		},

		switchWallet: (newWallet: string|null) => {
			const { wallet } = get();

			if (wallet && wallet !== newWallet) {
				console.log('Wallet changed; logging out...');

				set({
					wallet: null,
					isLoggedIn: false
				});
			}
		},

		login: () => {
			console.log('Logging in with token...');

			const token = localStorage.getItem('token');

			if (token !== null) {
				const decoded: JwtToken = jwtDecode(token);

				if (!decoded.wallet)
					return;

				set({ wallet: decoded.wallet });

				socket4.emit('login', { token }, (params: LoginResponseParams) => {
					if (params?.success) {
						set({ isLoggedIn: true });
						
						// Send CREATE_USER message when successfully logged in
						const createUserMessage = {
							type: "CREATE_USER",
							username: decoded.wallet,
							walletAddress: decoded.wallet
						};
						
						// Send via WebSocket
						if (socket1 && socket1.readyState === WebSocket.OPEN) {
							socket1.send(JSON.stringify(createUserMessage));
							console.log('CREATE_USER message sent:', createUserMessage);
						} else {
							console.warn('WebSocket not available for CREATE_USER message');
						}
					} else {
						set({ isLoggedIn: false });
					}
				});
			}
		},

		getNonce: async (): Promise<string> => {
			const response = await fetch(process.env.NEXT_PUBLIC_REST_URL! + '/nonce');
			const result = await response.json() as NonceResponse;

			if (!result?.nonce)
				throw new Error('Failed to query nonce API');

			return result?.nonce;
		},

		placeBet: (
			betAmount: string,
			autoCashOut: string,
			currency: string
		) => {
			console.log(`Placing bet ${betAmount} with currency ${currency}, autoCashOut ${autoCashOut}, and userWalletAddress ${address1a}`);

			socket4.emit('placeBet', {
				betAmount,
				autoCashOut,
				currency
			}, (params: PlaceBetResponseParams) => {
				if (!params?.success) {
					const { errorCount, errors } = get();
					const error = 'Error placing bet';
					set({
						errors: [
							...(errors.length <= 5 ? errors : errors.slice(0, 5)),
							error
						],
						errorCount: errorCount + 1,
					});
				}
			});
		},

		sendPlaceBetWS: (
			walletAddress: string,
			amount: number,
			currency: string
		) => {
			try {
				const payload = {
					type: "PLACE_BET",
					walletAddress,
					amount,
					currency,
				};

				if (socket1 && socket1.readyState === WebSocket.OPEN) {
					socket1.send(JSON.stringify(payload));
					console.log('PLACE_BET message sent:', payload);
				} else {
					console.warn('WebSocket not open for PLACE_BET message');
				}
			} catch (err) {
				console.error('Failed to send PLACE_BET message', err);
			}
		},

		sendFinishBetWS: (walletAddress: string) => {
			try {
				const payload = {
					type: "FINISH_BET",
					walletAddress,
				};

				if (socket1 && socket1.readyState === WebSocket.OPEN) {
					socket1.send(JSON.stringify(payload));
					console.log('FINISH_BET message sent:', payload);
				} else {
					console.warn('WebSocket not open for FINISH_BET message');
				}
			} catch (err) {
				console.error('Failed to send FINISH_BET message', err);
			}
		},

		cashOut: () => {
			console.log(`Cashing out...`);
			socket4.emit('cashOut');
		},

		cancelBet: () => {
			console.log(`Cancelling bet...`);
			socket4.emit('cancelBet');
		},

		setUserWalletAddress: (address: string) => {
			set({ userWalletAddress: address });
		},
	};

	return {
		...initialState,
		actions
	};
});
