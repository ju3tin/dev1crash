"use client"

import type React from "react"

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WalletConnectionGuardProps {
  children: React.ReactNode
}

export function WalletConnectionGuard({ children }: WalletConnectionGuardProps) {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (connection) {
          // Test the connection
          await connection.getLatestBlockhash()
          setConnectionError(null)
        }
      } catch (error) {
        console.error("Connection error:", error)
        setConnectionError("Failed to connect to Solana network. Please check your internet connection.")
      }
    }

    checkConnection()
  }, [connection])

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Alert className="border-red-200 bg-red-50 max-w-md">
          <AlertDescription className="text-red-800">{connectionError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
