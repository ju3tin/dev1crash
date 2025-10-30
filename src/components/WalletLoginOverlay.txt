"use client";

import React from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FaWallet, FaExclamationTriangle } from "react-icons/fa";

interface WalletLoginOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  action?: string;
}

const WalletLoginOverlay: React.FC<WalletLoginOverlayProps> = ({
  isOpen,
  onClose,
  title = "Wallet Connection Required",
  description = "You must connect your wallet before you can access this feature.",
  action = "deposit or place bets"
}) => {
  const { publicKey, connected } = useWallet();

  // Close overlay when wallet is connected
  React.useEffect(() => {
    if (connected && publicKey && isOpen) {
      onClose();
    }
  }, [connected, publicKey, isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-2 border-white text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FaExclamationTriangle className="text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <FaWallet className="text-blue-500 text-xl" />
            <div>
              <p className="text-white font-medium">Connect Your Wallet</p>
              <p className="text-gray-400 text-sm">
                Connect your Solana wallet to {action}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Supported wallets: Phantom, Solflare, Torus, Ledger
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletLoginOverlay;
