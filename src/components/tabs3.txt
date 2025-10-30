'use client';

import { useState } from "react";
import Decimal from 'decimal.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import BetList from "./BetList"; // Import your existing BetList
import ChatRoom from "./game-chat3"; // Create a ChatRoom component

type BetsAndChatProps = {
	gameState: "Waiting" | "Running" | "Crashed" | "Unknown" | "Stopped";
	crashPoint: number;
	onCrash: () => void;
}

export default function BetsAndChat({ gameState, crashPoint, onCrash }: BetsAndChatProps) {
	const [activeTab, setActiveTab] = useState("bets");

	return (
		<Card>
			<CardHeader>
				<CardTitle>Bets & Chat</CardTitle>
			</CardHeader>

			<CardContent>
				{/* Tabs Navigation */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="flex space-x-2">
						<TabsTrigger value="bets">Bets</TabsTrigger>
						<TabsTrigger value="chat">Chatroom</TabsTrigger>
					</TabsList>

					{/* Tab Content */}
					<TabsContent value="bets">
						<BetList />
					</TabsContent>
					<TabsContent value="chat">
						<ChatRoom gameState={gameState} crashPoint={crashPoint} onCrash={onCrash} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
