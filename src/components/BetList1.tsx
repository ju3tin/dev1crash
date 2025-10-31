"use client";

import Decimal from 'decimal.js';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Users, Clock, Trophy, Wifi, WifiOff } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
 
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { currencyById } from '@/lib/currencies';

import { Bet, useGameStore } from '@/store/gameStore1';

import { shortenWallet } from '@/lib/utils4';

export type BetListProps = {
}

type SortField = 'betAmount' | 'cashOut' | 'winnings' | 'wallet';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'cashedOut' | 'waiting' | 'playing';

const renderCashOut = (bet: Bet): string => {
	if (bet.cashOut != '0.00')
		return `${bet.cashOut}x`;

	if (bet.autoCashOut != '0.00')
		return `${bet.autoCashOut}x`;

	return '-';
}

const renderWinnings = (bet: Bet): string => {
	if (!bet.isCashedOut)
		return '-';

	return new Decimal(bet.betAmount).mul(bet.cashOut).toString();
}

const getSortIcon = (field: SortField, currentField: SortField, direction: SortDirection) => {
	if (field !== currentField) return <ArrowUpDown className="h-4 w-4" />;
	return direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
};

export type BetItemProps = {
	bet: Bet;
	isWaiting: boolean;
}

export function BetItem({ bet, isWaiting }: BetItemProps) {
	const getStatusBadge = () => {
		if (bet.isCashedOut) {
			return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><Trophy className="h-3 w-3 mr-1" />Won</Badge>;
		}
		if (isWaiting) {
			return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Waiting</Badge>;
		}
		return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Playing</Badge>;
	};

	return (
		<TableRow className="hover:bg-muted/50 transition-colors">
			<TableCell className="font-medium whitespace-nowrap">
				<div className="flex items-center gap-2">
					<span>{shortenWallet(bet.wallet ?? 'User')}</span>
					{getStatusBadge()}
				</div>
			</TableCell>
			<TableCell className="font-mono">
				{bet.betAmount}{" "}
				<span className="text-muted-foreground">
					{currencyById[bet.currency]?.units ?? bet.currency.toUpperCase()}
				</span>
			</TableCell>
			<TableCell className="font-mono">
				{bet.isCashedOut ? (
					<span className="text-green-600 font-semibold">{renderCashOut(bet)}</span>
				) : (
					<span className="text-muted-foreground">{renderCashOut(bet)}</span>
				)}
			</TableCell>
			<TableCell className="text-right font-mono">
				{bet.isCashedOut ? (
					<span className="text-green-600 font-semibold">
						{renderWinnings(bet)}{" "}
						<span className="text-muted-foreground">
							{currencyById[bet.currency]?.units ?? bet.currency.toUpperCase()}
						</span>
					</span>
				) : (
					<span className="text-muted-foreground">
						{renderWinnings(bet)}{" "}
						{currencyById[bet.currency]?.units ?? bet.currency.toUpperCase()}
					</span>
				)}
			</TableCell>
		</TableRow>
	);
}

export default function BetList({}: BetListProps) {
	const players = useGameStore((gameState) => gameState.players);
	const waiting = useGameStore((gameState) => gameState.waiting);
	const isConnected = useGameStore((gameState) => gameState.isConnected);
	
	const [sortField, setSortField] = useState<SortField>('betAmount');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const [filter, setFilter] = useState<FilterType>('all');
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	// Update last update time when data changes
	useEffect(() => {
		console.log('📊 BetList: Players or waiting data changed, updating timestamp');
		setLastUpdate(new Date());
	}, [players, waiting]);

	// Combine all bets with their status
	const allBets = useMemo(() => {
		const playingBets = players.map(bet => ({ ...bet, status: 'playing' as const }));
		const waitingBets = waiting.map(bet => ({ ...bet, status: 'waiting' as const }));
		return [...playingBets, ...waitingBets];
	}, [players, waiting]);

	// Filter bets based on selected filter
	const filteredBets = useMemo(() => {
		switch (filter) {
			case 'cashedOut':
				return allBets.filter(bet => bet.isCashedOut);
			case 'waiting':
				return allBets.filter(bet => bet.status === 'waiting');
			case 'playing':
				return allBets.filter(bet => bet.status === 'playing' && !bet.isCashedOut);
			default:
				return allBets;
		}
	}, [allBets, filter]);

	// Sort filtered bets
	const sortedBets = useMemo(() => {
		return [...filteredBets].sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			switch (sortField) {
				case 'betAmount':
					aValue = parseFloat(a.betAmount);
					bValue = parseFloat(b.betAmount);
					break;
				case 'cashOut':
					aValue = parseFloat(a.cashOut || '0');
					bValue = parseFloat(b.cashOut || '0');
					break;
				case 'winnings':
					aValue = a.isCashedOut ? parseFloat(new Decimal(a.betAmount).mul(a.cashOut).toString()) : 0;
					bValue = b.isCashedOut ? parseFloat(new Decimal(b.betAmount).mul(b.cashOut).toString()) : 0;
					break;
				case 'wallet':
					aValue = a.wallet.toLowerCase();
					bValue = b.wallet.toLowerCase();
					break;
				default:
					return 0;
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortDirection === 'asc' 
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			return sortDirection === 'asc' 
				? (aValue as number) - (bValue as number)
				: (bValue as number) - (aValue as number);
		});
	}, [filteredBets, sortField, sortDirection]);

	const handleSort = useCallback((field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('desc');
		}
	}, [sortField, sortDirection]);

	const stats = useMemo(() => {
		const totalBets = allBets.length;
		const totalVolume = allBets.reduce((sum, bet) => sum + parseFloat(bet.betAmount), 0);
		const winnersCount = allBets.filter(bet => bet.isCashedOut).length;
		const winRate = totalBets > 0 ? (winnersCount / totalBets) * 100 : 0;
		
		return { totalBets, totalVolume, winnersCount, winRate };
	}, [allBets]);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Bets ({stats.totalBets})
						<div className="flex items-center gap-1 ml-2">
							{isConnected ? (
								<Wifi className="h-4 w-4 text-green-500" />
							) : (
								<WifiOff className="h-4 w-4 text-red-500" />
							)}
							<span className="text-xs text-muted-foreground">
								{isConnected ? 'Live' : 'Offline'}
							</span>
						</div>
					</CardTitle>
					<div className="flex items-center gap-2">
						<Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
							<SelectTrigger className="w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Bets</SelectItem>
								<SelectItem value="playing">Playing</SelectItem>
								<SelectItem value="waiting">Waiting</SelectItem>
								<SelectItem value="cashedOut">Winners</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				
				{/* Stats Row */}
				<div className="flex gap-4 text-sm text-muted-foreground">
					<span>Volume: {stats.totalVolume.toFixed(2)} SOL</span>
					<span>Winners: {stats.winnersCount}</span>
					<span>Win Rate: {stats.winRate.toFixed(1)}%</span>
					<span className="ml-auto">
						Updated: {lastUpdate.toLocaleTimeString()}
					</span>
				</div>
			</CardHeader>

			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[200px]">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleSort('wallet')}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Player
									{getSortIcon('wallet', sortField, sortDirection)}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleSort('betAmount')}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Amount
									{getSortIcon('betAmount', sortField, sortDirection)}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleSort('cashOut')}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Cashout
									{getSortIcon('cashOut', sortField, sortDirection)}
								</Button>
							</TableHead>
							<TableHead className="text-right">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleSort('winnings')}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Winnings
									{getSortIcon('winnings', sortField, sortDirection)}
								</Button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedBets.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground py-8">
									No bets found
								</TableCell>
							</TableRow>
						) : (
							sortedBets.map((bet) => (
								<BetItem
									bet={bet}
									isWaiting={bet.status === 'waiting'}
									key={`${bet.wallet}_${bet.status}_${bet.betAmount}_${bet.isCashedOut}_${bet.cashOut}`}
								/>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
