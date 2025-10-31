"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import axios from "axios"
import { useWalletStore } from "@/store/walletstore1"
import { format, isValid } from "date-fns"
import WalletLoginOverlay from "./WalletLoginOverlay"
type ChatMessage = {
  id: string
  sender: string
  message: string
  timestamp: Date
  isSystem?: boolean
}

type GameChatProps = {
  currentMultiplier: number
  gameState: "Waiting" | "Running" | "Crashed" | "Unknown" | "Stopped"
  crashPoint?: number
  onCrash?: () => void
}

const GameChat = ({ currentMultiplier, gameState, onCrash }: GameChatProps) => {
  // Use wallet store to check if user is logged in
  const { walletAddress } = useWalletStore()
  const [showWalletOverlay, setShowWalletOverlay] = useState(false)

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
  const [hasGameStarted, setHasGameStarted] = useState(false)

  // Check if wallet is connected using wallet store
  const isWalletValid = () => {
    return !!walletAddress
  }

  const toggleWalletOverlay = () => {
    setShowWalletOverlay(!showWalletOverlay)
  }

  // ✅ Safe time formatter
  const formatTime = (date: Date) => {
    if (!isValid(date)) return "--:--"
    return format(date, "hh:mm a")
  }

  // Wallet balance is no longer needed since we're using wallet store
  // The wallet store only tracks the wallet address, not balance

  // ✅ Fetch messages from API (replace instead of merge)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("/api/postmessage")
        const fetchedMessages = response.data || []

        const formattedMessages: ChatMessage[] = fetchedMessages.map((msg: any) => {
          const parsedDate = new Date(msg.time)
          return {
            id: msg._id?.toString() || Date.now().toString(),
            sender: (msg.user || "Unknown").slice(0, 10),
            message: msg.message,
            timestamp: isValid(parsedDate) ? parsedDate : new Date(),
            isSystem: msg.user === "System",
          }
        })

        setMessages(
          formattedMessages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          )
        )
      } catch (error: any) {
        console.error("Failed to fetch messages:", error.message || error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Handle game state messages
  useEffect(() => {
    if (gameState === "Running" && !hasGameStarted) {
      addSystemMessage("Game started! Good luck!")
      setHasGameStarted(true)

      setTimeout(() => {
        simulatePlayerMessages()
      }, 5000)
    } else if (gameState === "Crashed" && currentMultiplier && hasGameStarted) {
      addSystemMessage(`Game crashed at ${currentMultiplier}x!`)
      setHasGameStarted(false)
    }
  }, [gameState, currentMultiplier, hasGameStarted])

  // Add system message
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

  // Simulate random player messages
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

  // Handle sending new message (optimistic update)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() === "") return

    // Check wallet validity before proceeding - same as betbutton
    if (!isWalletValid()) {
      setShowWalletOverlay(true)
      return
    }

    const messageToSend = newMessage.trim()
    const timestamp = new Date()

    // ✅ Optimistic update
    const tempId = "local-" + Date.now()
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: walletAddress?.slice(0, 10) || "You",
        message: messageToSend,
        timestamp,
      },
    ])

    setNewMessage("")

    const data = {
      user: walletAddress || "Unknown",
      time: timestamp.toISOString(),
      message: messageToSend,
    }

    try {
      const response = await axios.post("/api/postmessage", data, {
        headers: { "Content-Type": "application/json" },
      })

      // ✅ Replace temp ID with real ID from server
      if (response.data?._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...msg, id: response.data._id } : msg))
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // ❌ Mark failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, message: msg.message + " (failed)" } : msg
        )
      )
    }
  }

  return (
    <Card className="bg-black border-black h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Game Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 h-[80%]">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700"
          style={{ height: "80%" }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-start">
                <span
                  className={`font-medium text-xs ${
                    msg.isSystem
                      ? "text-yellow-400"
                      : msg.sender === "You"
                      ? "text-green-400"
                      : "text-blue-400"
                  }`}
                >
                  {msg.sender}:
                </span>
                <span className="text-white text-xs ml-1 break-words">
                  {msg.message}
                </span>
              </div>
              <span className="text-gray-500 text-xs">{formatTime(msg.timestamp)}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center mt-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isWalletValid() ? "Type a message..." : "Connect wallet to chat..."}
            disabled={!isWalletValid()}
            className={`bg-gray-700 border-gray-600 text-white text-sm ${
              !isWalletValid() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!isWalletValid()}
            className={`ml-2 h-9 w-9 p-0 ${
              isWalletValid() 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      
      <WalletLoginOverlay
        isOpen={showWalletOverlay}
        onClose={toggleWalletOverlay}
        title="Wallet Connection Required"
        description="You must connect your wallet before you can send messages in the chat."
        action="send messages"
      />
    </Card>
  )
}

export default GameChat
