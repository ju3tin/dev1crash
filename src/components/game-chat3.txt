"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

type ChatMessage = {
  id: string
  sender: string
  message: string
  timestamp: Date
  isSystem?: boolean
}

type GameChatProps = {
  gameState: "Waiting" | "Running" | "Crashed" | "Unknown" | "Stopped";
  crashPoint?: number
  onCrash?: () => void
}

const GameChat = ({ gameState, crashPoint, onCrash }: GameChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "System",
      message: "Welcome to the Crash Game! Place your bets and have fun!",
      timestamp: new Date(),
      isSystem: true,
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Add system messages when game state changes
  useEffect(() => {
    if (gameState === "Running") {
      addSystemMessage("Game started! Good luck!")
      simulatePlayerMessages()
    } else if (gameState === "Crashed" && crashPoint) {
      addSystemMessage(`Game crashed at ${crashPoint.toFixed(2)}x!`)

      // Call onCrash callback after a delay
      if (onCrash) {
        setTimeout(onCrash, 500)
      }
    }
  }, [gameState, crashPoint])

  // Add a system message
  const addSystemMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "System",
        message,
        timestamp: new Date(),
        isSystem: true,
      },
    ])
  }

  // Simulate other players sending messages
  const simulatePlayerMessages = () => {
    const playerMessages = [
      "Good luck everyone!",
      "I'm going for 5x this time",
      "Let's go!",
      "I feel lucky today",
      "Hoping for a big win",
      "Not crashing early please",
      "Cash out early, stay safe",
      "This is going to be a big one",
      "I'm feeling a crash coming",
      "Don't be greedy!",
    ]

    const playerNames = [
      "CryptoKing",
      "MoonHodler",
      "SolanaWhale",
      "DiamondHands",
      "RocketRider",
      "LuckyPlayer",
      "BetMaster",
      "ChipStacker",
      "RiskTaker",
      "CoinFlip",
    ]

 // Send 1-3 messages during the game
 const numMessages = 1 + Math.floor(Math.random() * 3)

 for (let i = 0; i < numMessages; i++) {
   const delay = 1000 + Math.random() * 8000

   setTimeout(() => {
     if (gameState === "Running") {
       const randomPlayer = playerNames[Math.floor(Math.random() * playerNames.length)]
       const randomMessage = playerMessages[Math.floor(Math.random() * playerMessages.length)]

       setMessages((prev) => [
         ...prev,
         {
           id: Date.now().toString() + i,
           sender: randomPlayer,
           message: randomMessage,
           timestamp: new Date(),
         },
       ])
     }
   }, delay)
 }
}

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (newMessage.trim() === "") return

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        message: newMessage.trim(),
        timestamp: new Date(),
      },
    ])

    setNewMessage("")
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="bg-black border-black h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Game Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 h-full">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700"
          style={{ height: "100%" }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-start">
                <span
                  className={`font-medium text-xs ${
                    msg.isSystem ? "text-yellow-400" : msg.sender === "You" ? "text-green-400" : "text-blue-400"
                  }`}
                >
                  {msg.sender}:
                </span>
                <span className="text-white text-xs ml-1 break-words">{msg.message}</span>
              </div>
              <span className="text-gray-500 text-xs">{formatTime(msg.timestamp)}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center mt-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="bg-gray-700 border-gray-600 text-white text-sm"
          />
          <Button type="submit" size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default GameChat

