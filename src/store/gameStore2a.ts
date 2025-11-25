"use client"

import { io } from "socket.io-client";

import { jwtDecode } from 'jwt-decode';

import { create } from "zustand";

import { elapsedToMultiplier } from '@/lib/utils1';

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
	time: number;
}

export type GameStateData = {
	gameId: string|null,
	status: GameStatus;
	players: Bet[];
	waiting: Bet[];
	address1a: string;
	startTime: number;
	isConnected: boolean;
	isLoggedIn: boolean;
	isWaiting: boolean;
	isPlaying: boolean
	isCashedOut: boolean;
	timeRemaining: number;
	timeElapsed: number;
	multiplier: number;
	crashes: CrashedGame[];
	balances: Record<string, string>;
	wallet: string|null;
	errors: string[];
	errorCount: number;
	data2?: string | number;
	crashPoint?: number;
	isCrashed: boolean;

	crashData?: {
		multiplier: string;
		time: number;
	};
}

export type GameActions = {
	authenticate: (message: string, signature: string) => void;
	switchWallet: (newWallet: string|null) => void;
	login: () => void;
	getNonce: () => Promise<string>;
	placeBet: (
		betAmount: string,
		autoCashOut: string,
		currency: string,
		address1a: string,
		walletAddress: string
	) => void;
	cashOut: () => void;
	cancelBet: () => void;
	setUserWalletAddress: (address: string) => void;
	// Send a FINISH_BET message to the crash WebSocket server
	sendFinishBetWS: (walletAddress: string) => void;
}

export interface GameState {
	gameState: {
		action: string;
		status: string;
	};
	gameId: string|null;
	status: GameStatus;
	players: Bet[];
	waiting: Bet[];
	address1a: string;
	startTime: number;
	isConnected: boolean;
	isLoggedIn: boolean;
	isWaiting: boolean;
	isPlaying: boolean;
	isCashedOut: boolean;
	timeRemaining: number;
	timeElapsed: number;
	multiplier: number;
	crashes: CrashedGame[];
	balances: Record<string, string>;
	wallet: string|null;
	errors: string[];
	errorCount: number;
	data2?: string | number;
	crashPoint?: number;
	isCrashed: boolean;

	crashData?: {
		multiplier: string;
		time: number;
	};
	actions: GameActions;
	userWalletAddress: string;
}

const initialState : GameStateData = {
	gameId: null,
	status: 'Unknown',
	players: [],
	waiting: [],
	address1a: '',
	startTime: 0,
	isConnected: false,
	isLoggedIn: false,
	isWaiting: false,
	isPlaying: false,
	isCashedOut: false,
	timeRemaining: 0,
	timeElapsed: 0,
	multiplier: 0,
	crashes: [],
	balances: {},
	wallet: null,
	errors: [],
	errorCount: 0,
	isCrashed: false
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
	multiplier: number;
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

interface ServerMessage {
	action:
	'COUNTDOWN' 
	| 'CNT_MULTIPLY' 
	| 'SECOND_BEFORE_START'
	| 'ROUND_CRASHED';
	time?: number;
	multiplier?: string;
	data?: string;
}

export const useGameStore = create<GameState>((set, get) => {
	const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
		withCredentials: true
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
		//		multiplier: elapsedToMultiplier(timeElapsed)
			});
		}
	};

	socket1.onopen = () => {
		console.log('Shit is connected');
		set({ isConnected: true });
	  };
	  
	
	  socket1.onmessage = (event) => {
		console.log('Message from server: ', event.data);
		const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
		const message1 = messageData;
	
		// Add message to chat
		let roundStartTimestamp; // Store the current timestamp globally
		const timestamp = new Date().toLocaleTimeString();
		//setChatMessages(prev => [...prev, { text: event.data, timestamp }]);
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
	
			case 'CNT_MULTIPLY':
				console.log(`Multiplier: ${message1.multiplier}, Data: ${message1.data}, Time: ${message1.time}`);
				
				set({
					multiplier: message1.multiplier,
					timeElapsed: message1.time,
				});
				break;
			
			case 'ROUND_CRASHED':
				console.log(`The game crashed at ${message1.multiplier}`)
				
		  
				  const dude444 = roundStartTimestamp;
				  const { crashes } = get();
		  
				  set({
					multiplier: Number(messageData.multiplier),
					  status: 'Crashed',
					  crashes: [...(
						  crashes.length <= 30
							  ? crashes
							  : crashes.slice(0, 30)
					  ), 
					//  params.game
				
					],
					data2: messageData.data,
					  timeElapsed: dude444 ? dude444 - 34 : 0,
				  });
		  
				  break
				  case 'ROUND_ENDS':
				console.log(`The game crashed at ${message1.multiplier}`)
					
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
			console.log(`Bet made by, ${message1.player}, ${message1.bet} ${message1.currency}`);
			
			// Create new bet object
			const newBet: Bet = {
				wallet: message1.player,
				betAmount: message1.bet,
				currency: message1.currency,
				autoCashOut: '0', // Default values since they're not in the message
				cashOut: '0',
				cashOutTime: new Date(),
				isCashedOut: false,
				winnings: '0'
			};

			// Add to players list
			set(state => ({
				players: [...state.players, newBet]
			}));
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
	  

	socket.on('connect', () => {
		console.log('Socket connected bitches');

		//const token = localStorage?.getItem('token') ?? null;

		//if (token !== null)
		//	actions.login();

		set({ isConnected: true });
	});

	socket.on('disconnect', () => {
		console.log('Socket disconnected');
		set({ isConnected: false });
	});

	socket.on('GameWaiting', (params: GameWaitingEventParams) => {
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

	socket.on('GameRunning', (params: GameRunningEventParams) => {
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

	socket.on('GameCrashed', (params: GameCrashedEventParams) => {
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

	socket.on('BetList', (params: BetListEventParams) => {
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

	socket.on('RecentGameList', (params: RecentGameListEventParams) => {
		console.log('Received recent game list')
		set({ crashes: params.games ?? [] });
	});

	socket.on('PlayerWon', (params: PlayerWonEventParams) => {
		console.log('Received player won event')

		const { players, wallet } = get();
		const index = players.findIndex((player) => player.wallet == params.wallet);

		if (index != -1) {
			const newPlayers = [...players];

			newPlayers[index].isCashedOut = true;
			newPlayers[index].cashOut = params.multiplier.toString();
			newPlayers[index].cashOutTime = new Date();

			if (wallet == params.wallet) {
				set({ players: newPlayers, isCashedOut: true });
			} else {
				set({ players: newPlayers });
			}
		}
	});

	socket.on('InitBalances', (params: InitBalancesEventParams) => {
		console.log('Received balance list')
		set({ balances: params?.balances ?? {} });
	});

	socket.on('UpdateBalance', (params: UpdateBalancesEventParams) => {
		console.log('Received balance update')
		set({
			balances: {
				...get().balances ?? {},
				[params.currency]: params.balance
			}
		});
	});

	socket.on('COUNTDOWN', (data) => {
		try {
			console.log('Countdown data:', data);
			// Handle countdown data here
		} catch (error) {
			console.error('Error processing countdown:', error);
		}
	});

	socket.on('message', (message) => {
		try {
			console.log('Message received:', message);
			if (message.data) {  // If using data property
				console.log('Data:', message.data);
			}
		} catch (error) {
			console.error('Error processing message:', error);
		}
	});

	
	const actions = {
		authenticate: (
			message: string,
			signature: string
		) => {
			console.log('Authenticating...');

			socket.emit('authenticate', {
				message,
				signature
			}, (params: AuthenticateResponseParams) => {
				if (params?.success && params?.token) {
					console.log(`Token: ${params.token}`);
				//	localStorage.setItem('token', params.token);
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

			//const token = localStorage.getItem('token');

			//if (token !== null) {
			//	const decoded: JwtToken = jwtDecode(token);

			//	if (!decoded.wallet)
			//		return;

			//	set({ wallet: decoded.wallet });

			//	socket.emit('login', { token }, (params: LoginResponseParams) => {
			//		if (params?.success)
			//			set({ isLoggedIn: true });
			//		else
			//			set({ isLoggedIn: false });
			//	});
			//}
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
			currency: string,
			address1a: string,
			walletAddress: string
		) => {
			console.log(`Placing bet ${betAmount} with currency ${currency}, autoCashOut ${autoCashOut}, and userWalletAddress ${address1a} and walletAddress ${walletAddress}`);

			
			const betMessage = JSON.stringify({
				action: "BTN_BET_CLICKED",
				userWalletAddress: address1a,
				walletAddress: walletAddress,
				bet: betAmount,
				currency: currency,
				autoCashOut: autoCashOut
			});
			socket1.send(betMessage);
			console.log("Bet sent:", betMessage);
		

			socket.emit('placeBet', {
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
			socket.emit('cashOut');
		},

		cancelBet: () => {
			console.log(`Cancelling bet...`);
			socket.emit('cancelBet');
		},

		setUserWalletAddress: (address: string) => {
			console.log(`Setting user wallet address to: ${address}`);
			set({ address1a: address });
		},
	};

	return {
		...initialState,
		actions,
		userWalletAddress: '',
		setUserWalletAddress: (address: string) => set({ userWalletAddress: address }),
		gameState: {
			action: '',
			status: '',
		},
	};
});
