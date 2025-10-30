"use client"

import { io, Socket } from "socket.io-client";
let reconnectInterval = 5000; // Interval to attempt reconnection in milliseconds


import { jwtDecode } from 'jwt-decode';

import { create } from "zustand";

//import {address1a} from "../../src/components/WalletConnection"
//import { useWalletContext } from "../../src/providers/WalletContextProvider";

//import Cors from "cors";

import { elapsedToMultiplier } from '../lib/utils3';
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
	placeBet: (betAmount: string, autoCashOut: string, currency: string, address1a: string) => void;
	cashOut: () => void;
	cancelBet: () => void;
	setUserWalletAddress: (address: string) => void;
}

export type GameState = GameStateData & { actions: GameActions, set: (state: Partial<GameStateData>) => void, get: () => GameStateData };

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
	let socket1: WebSocket | null = null;
    let reconnectInterval = 5000; // Reconnect interval in milliseconds
    let isReconnecting = false;

	const socket4 = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
		withCredentials: true // Include cookies/auth headers if needed
	});

	 socket1 = new WebSocket(process.env.NEXT_PUBLIC_CRASH_SERVER!);



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


const connectWebSocket = () => {
	if (isReconnecting) return; // Prevent multiple reconnection attempts
	isReconnecting = true;

	socket1 = new WebSocket(process.env.NEXT_PUBLIC_CRASH_SERVER!);

	socket1.onopen = () => {
		console.log('Connected to WebSocket server');
		set({ isConnected: true });
		isReconnecting = false; // Reset the reconnection flag
	};

	socket1.onmessage = (event) => {
		console.log('Message from server: ', event.data);
		const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

		// Process the message (same as in your existing code)
		handleMessage(messageData);
	};

	socket1.onclose = (event) => {
		console.warn('WebSocket connection closed:', event);
		set({ isConnected: false });

		// Reconnect after a delay
		console.log(`Attempting to reconnect in ${reconnectInterval / 1000} seconds...`);
		setTimeout(() => {
			connectWebSocket();
		}, reconnectInterval);
	};

	socket1.onerror = (error) => {
		console.error('WebSocket error:', error);

		// Close the socket to trigger the `onclose` event and reconnect
		if (socket1) {
			socket1.close();
		}
	};
};

// Function to handle incoming messages
const handleMessage = (message: any) => {
	const roundStartTimestamp = new Date();
	const { set, get } = useGameStore.getState(); // Ensure this is within the correct context

	switch (message.action) {
		case 'ROUND_STARTED':
			console.log('Round started at:', roundStartTimestamp.toLocaleTimeString());

			set({
				startTime: roundStartTimestamp.getTime(),
				status: 'Running'
			});

			// Clear and restart game timers
			clearTimers();
			gameRunTimer = setInterval(gameRunner, 5);
			break;
		case 'BET_PLACED':
			console.log(`bet made by ${message.walletAddress} with amount ${message.amount} and currency ${message.currency} and balance ${message.balance}`);
			
			// Check if player already exists in the list to avoid duplicates
			const existingPlayerIndex = get().players.findIndex(player => player.wallet === message.walletAddress);
			
			if (existingPlayerIndex === -1) {
				// Add new player to the list
				set({
					players: [...get().players, {
						wallet: message.walletAddress,
						betAmount: message.amount,
						currency: message.currency,
						autoCashOut: '0',
						cashOut: '0',
						cashOutTime: new Date(),
						isCashedOut: false,
						winnings: '0'
					}]
				});
			} else {
				// Update existing player's bet amount
				const updatedPlayers = [...get().players];
				updatedPlayers[existingPlayerIndex] = {
					...updatedPlayers[existingPlayerIndex],
					betAmount: message.amount,
					currency: message.currency
				};
				set({ players: updatedPlayers });
			}
			break;
		case 'ROUND_CRASHED':
			console.log(`The game crashed at ${message.multiplier}`);

			const { crashes } = get();

			set({
				status: 'Crashed',
				crashes: [...(
					crashes.length <= 30
						? crashes
						: crashes.slice(0, 30)
				), message.game],
				timeElapsed: roundStartTimestamp ? roundStartTimestamp.getTime() - 34 : 0,
			});

			clearTimers();
			break;

		case 'CASHOUT_SUCCESS':
			console.log(`🎉 CASHOUT_SUCCESS received for ${message.walletAddress} with winnings ${message.winnings} ${message.currency} at multiplier ${message.multiplier}`);
			
			// Find the player in the current players list
			const playerIndex = get().players.findIndex(player => player.wallet === message.walletAddress);
			
			if (playerIndex !== -1) {
				console.log(`📝 Updating player at index ${playerIndex} with cashout data`);
				
				// Update the player's cashout information
				const updatedPlayers = [...get().players];
				updatedPlayers[playerIndex] = {
					...updatedPlayers[playerIndex],
					isCashedOut: true,
					cashOut: message.multiplier,
					cashOutTime: new Date(),
					winnings: message.winnings.toString()
				};
				
				console.log(`✅ Updated player data:`, updatedPlayers[playerIndex]);
				
				// Update the players list
				set({ players: updatedPlayers });
				
				console.log(`🔄 Players list updated, total players: ${updatedPlayers.length}`);
				
				// Update balances if this is the current user
				if (message.walletAddress === get().userWalletAddress) {
					console.log(`💰 Updating balance for current user`);
					set({
						balances: {
							...get().balances,
							[message.currency]: message.balance.toString()
						}
					});
				}
			} else {
				console.warn(`⚠️ Player ${message.walletAddress} not found in current players list`);
			}
			break;

		case 'PLAYER_CASHED_OUT':
			console.log(`🎉 PLAYER_CASHED_OUT received for ${message.walletAddress} with winnings ${message.winnings} at multiplier ${message.multiplier}`);
			
			// Find the player in the current players list
			const cashedOutPlayerIndex = get().players.findIndex(player => player.wallet === message.walletAddress);
			
			if (cashedOutPlayerIndex !== -1) {
				console.log(`📝 Updating player at index ${cashedOutPlayerIndex} with cashout data`);
				
				// Update the player's cashout information
				const updatedPlayers = [...get().players];
				updatedPlayers[cashedOutPlayerIndex] = {
					...updatedPlayers[cashedOutPlayerIndex],
					isCashedOut: true,
					cashOut: message.multiplier,
					cashOutTime: new Date(),
					winnings: message.winnings.toString()
				};
				
				console.log(`✅ Updated player data:`, updatedPlayers[cashedOutPlayerIndex]);
				
				// Update the players list
				set({ players: updatedPlayers });
				
				console.log(`🔄 Players list updated, total players: ${updatedPlayers.length}`);
			} else {
				console.warn(`⚠️ Player ${message.walletAddress} not found in current players list`);
			}
			break;

		// Other cases...
		default:
			console.log(`Unknown action received: ${message.action}`);
	}
};

const clearTimers = () => {
	if (gameWaitTimer) {
		clearInterval(gameWaitTimer);
		gameWaitTimer = null;
	}

	if (gameRunTimer) {
		clearInterval(gameRunTimer);
		gameRunTimer = null;
	}
};

// Call `connectWebSocket` to establish the initial connection
connectWebSocket();



socket1.onopen = () => {
	console.log('Connected to WebSocket server');
	set({ isConnected: true });
  };
  
  
  socket1.onmessage = (event) => {
	console.log('Message from server: ', event.data);
	const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
	
	// Use the centralized message handler
	handleMessage(messageData);

	// Handle specific cases that need additional processing
	switch (messageData.action) {
		case 'CNT_MULTIPLY':
			console.log(`i spoke to the server Multiplier: ${messageData.multiplier}, Data: ${messageData.data}`);
			break;
			
		case 'SECOND_BEFORE_START':
			const timeRemaining = messageData.data;
			if (timeRemaining <= 0) {
				set({ timeRemaining: 0 });
			} else {
				set({ timeRemaining });
			}
			set({
				status: 'Waiting',
				startTime: new Date().getTime(),
				timeElapsed: 0,
			});
			
			if (gameWaitTimer) {
				clearInterval(gameWaitTimer);
				gameWaitTimer = null;
			}
			console.log("this is how many seconds left: " + messageData.data);
			gameWaitTimer = setInterval(gameWaiter, 1000);
			break;
			
		case 'BTN_BET_CLICKED':
			console.log(`BTN_BET_CLICKED action received with bet: ${messageData.bet}`);
			break;
			
		case 'PLAYER_BET':
			console.log(`Bet placed by ${messageData.walletAddress} with amount ${messageData.amount} and currency ${messageData.currency} and balance ${messageData.balance}`);
			
			// Check if player already exists in the list to avoid duplicates
			const existingPlayerIndex2 = get().players.findIndex(player => player.wallet === messageData.walletAddress);
			
			if (existingPlayerIndex2 === -1) {
				// Add new player to the list
				set({
					players: [...get().players, {
						wallet: messageData.walletAddress,
						betAmount: messageData.amount,
						currency: messageData.currency,
						autoCashOut: '0',
						cashOut: '0',
						cashOutTime: new Date(),
						isCashedOut: false,
						winnings: '0'
					}]
				});
			} else {
				// Update existing player's bet amount
				const updatedPlayers2 = [...get().players];
				updatedPlayers2[existingPlayerIndex2] = {
					...updatedPlayers2[existingPlayerIndex2],
					betAmount: messageData.amount,
					currency: messageData.currency
				};
				set({ players: updatedPlayers2 });
			}
			break;
			
		case 'WON':
		case 'LOST':
		case 'ROUND_ENDS':
			// These cases don't need special handling
			break;
			
		default:
			// Message already handled by handleMessage function
			break;
	}
  };

  socket1.onclose = () => {
	console.log('WebSocket connection closed:', event);
    console.log(`Attempting to reconnect in ${reconnectInterval / 1000} seconds...`);
    setTimeout(() => {
   //   connectWebSocket(); // Attempt to reconnect
    }, reconnectInterval);
  };
  
  socket1.onerror = (error) => {
	console.error('WebSocket error:', error);
  };
  //
	socket4.on('connect', () => {
		console.log('Socket connected');

	//	const token = localStorage?.getItem('token') ?? null;

	//	if (token !== null)
	//		actions.login();

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


    socket4.on('message', (message: string) => {
        try {
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.action === 'CNT_MULTIPLY') {
                const multiplier = parseFloat(parsedMessage.multiplier);
                const data = parseFloat(parsedMessage.data);

                console.log(`Multiplier: ${multiplier}, Data: ${data}`);

                // Update the state with the new multiplier
                set({
                  //  currentMultiplier: multiplier,
                  //  additionalData: data, // Example: storing extra data if needed
                });
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
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
			currency: string,
			address1a: string,
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
		actions,
		set,
		get
	};
});