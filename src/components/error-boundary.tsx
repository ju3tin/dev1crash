"use client"

import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Wallet connection error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-semibold">Wallet Connection Error</p>
                  <p className="text-sm">
                    {this.state.error?.message || "An error occurred while connecting to your wallet."}
                  </p>
                  <p className="text-sm">
                    Please make sure you have a Solana wallet (like Phantom) installed and try refreshing the page.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} className="w-full mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
