"use client";
import React, { useMemo, useEffect, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { Wallet } from "lucide-react";
import { useWalletStore } from "@/store/walletstore1";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Console } from "console";

function CustomWalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    mounted && <WalletMultiButton
      style={{ fontSize: "14px" }}
      className="custom-wallet-button"
      >
        <Wallet className="w-5 h-5 mr-2" />
        Select Wallet
      </WalletMultiButton>
    )
  
};

function Dude2(){
  console.log("do something");
}

function WalletButtonWrapper() {
  const { connected, publicKey } = useWallet();
  const setWalletAddress = useWalletStore((state) => state.setWalletAddress);

  // Function to check if user exists and create if needed
  const checkAndCreateUser = async (walletAddress: string) => {
    try {
      // Check if user exists
      const checkResponse = await fetch('/api/users/check-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResult.exists) {
        console.log('User not found, creating new user...');
        
        // Send websocket message to create user
        const websocketMessage = {
          type: "CREATE_USER",
          username: walletAddress,
          walletAddress: walletAddress
        };
        
        // Send via WebSocket if available
        if (typeof window !== 'undefined' && window.WebSocket) {
          try {
            const ws = new WebSocket(process.env.NEXT_PUBLIC_CRASH_SERVER || 'ws://localhost:8080');
            ws.onopen = () => {
              ws.send(JSON.stringify(websocketMessage));
              console.log('WebSocket message sent for user creation:', websocketMessage);
              ws.close();
            };
            ws.onerror = (error) => {
              console.error('WebSocket error:', error);
              // Fallback to API call
              createUserViaAPI(walletAddress);
            };
          } catch (wsError) {
            console.error('WebSocket connection failed, falling back to API:', wsError);
            // Fallback to API call
            createUserViaAPI(walletAddress);
          }
        } else {
          // Fallback to API call
          createUserViaAPI(walletAddress);
        }
      } else {
        console.log('User exists:', checkResult.user);
      }
    } catch (error) {
      console.error('Error checking/creating user:', error);
    }
  };

  const checkifadmin = async (walletAddress: string) => {
    try {
      const checkResponse = await fetch('/api/helius/checkAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('this is going to work'+walletAddress);
      const checkResult = await checkResponse.json();
      if (checkResult.isAdmin) {
        console.log('User is admin:', checkResult.user);
      } else {
        console.log('User is not admin:', checkResult.user);
      }
    } catch (error) {
      console.error('Error checking if user is admin:', error);
    }
  };

  // Fallback function to create user via API
  const createUserViaAPI = async (walletAddress: string) => {
    try {
      const createResponse = await fetch('/api/users/createuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletAddress,
          username: walletAddress // Use wallet address as username
        }),
      });

      const createResult = await createResponse.json();
      
      if (createResult.success) {
        console.log('User created successfully via API:', createResult.user);
      } else {
        console.error('Failed to create user via API:', createResult.error);
      }
    } catch (error) {
      console.error('Error creating user via API:', error);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      console.log("Connected wallet address:", address);
      setWalletAddress(address); // Store the address in Zustand
      checkifadmin(address);
      // Send CREATE_USER message for any connected wallet
      const createUserMessage = {
        type: "CREATE_USER",
        username: address,
        walletAddress: address
      };
      
      // Send via WebSocket
      if (typeof window !== 'undefined' && window.WebSocket) {
        try {
          const ws = new WebSocket(process.env.NEXT_PUBLIC_CRASH_SERVER || 'ws://localhost:8080');
          ws.onopen = () => {
            ws.send(JSON.stringify(createUserMessage));
            console.log('CREATE_USER message sent for connected wallet:', createUserMessage);
            ws.close();
          };
          ws.onerror = (error) => {
            console.error('WebSocket error sending CREATE_USER:', error);
          };
        } catch (wsError) {
          console.error('WebSocket connection failed for CREATE_USER:', wsError);
        }
      }
      
      // Check if user exists and create if needed
      checkAndCreateUser(address);
    
    } else {
      setWalletAddress(null); // Clear the address when disconnected
    }
  }, [connected, publicKey, setWalletAddress]);

  return connected ? <WalletMultiButton /> : <CustomWalletButton />;
}



// Export the provider so it can wrap the entire app
export function LoginWalletProvider({ children }: { children: React.ReactNode }) {
  const network = "https://rpc.test.honeycombprotocol.com";
  const endpoint = useMemo(() => network, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function LoginButton() {
  return <WalletButtonWrapper />;
  Dude2();
}

export default LoginButton;
 