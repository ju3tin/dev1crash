"use client"
import type { Metadata } from 'next';
import { useState, useMemo, useEffect } from "react"
import Script from "next/script";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { AnchorProvider, Program, BN, Idl, web3 } from '@project-serum/anchor';
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CrashGame from "@/components/main3"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink } from "lucide-react"
import CoinMarketCapWidget from "@/components/Coinmaket"
// Remove the direct import and add proper typing
// import idl from "@/idl.json"

// Define the IDL structure properly
interface StakingProgramIDL {
  address: string
  metadata: {
    name: string
    version: string
    spec: string
  }
  version: string
  name: string
  instructions: any[]
  accounts: any[]
  types: any[]
  errors: any[]
}

// Import IDL as a module to avoid parsing issues
const getIDL = (): StakingProgramIDL => {
  return {
    address: programId.toBase58(),
    metadata: {
      name: "staking_program",
      version: "0.1.0",
      spec: "0.1.0"
    },
    version: "0.1.0",
    name: "staking_program",
    instructions: [
      {
        name: "initializePool",
        accounts: [
          { name: "pool", isMut: true, isSigner: false },
          { name: "authority", isMut: true, isSigner: true },
          { name: "systemProgram", isMut: false, isSigner: false },
        ],
        args: [{ name: "allowedMints", type: { vec: "publicKey" } }],
      },
      {
        name: "stake",
        accounts: [
          { name: "pool", isMut: true, isSigner: false },
          { name: "stakeAccount", isMut: true, isSigner: false },
          { name: "stakeVault", isMut: true, isSigner: false },
          { name: "userTokenAccount", isMut: true, isSigner: false },
          { name: "tokenMint", isMut: false, isSigner: false },
          { name: "user", isMut: true, isSigner: true },
          { name: "tokenProgram", isMut: false, isSigner: false },
          { name: "systemProgram", isMut: false, isSigner: false },
        ],
        args: [
          { name: "amount", type: "u64" },
          { name: "lockupPeriod", type: { defined: "LockupPeriod" } },
        ],
      },
      {
        name: "unstake",
        accounts: [
          { name: "pool", isMut: true, isSigner: false },
          { name: "stakeAccount", isMut: true, isSigner: false },
          { name: "stakeVault", isMut: true, isSigner: false },
          { name: "userTokenAccount", isMut: true, isSigner: false },
          { name: "user", isMut: true, isSigner: true },
          { name: "tokenProgram", isMut: false, isSigner: false },
        ],
        args: [],
      },
    ],
    accounts: [
      {
        name: "Pool",
        type: {
          kind: "struct",
          fields: [
            { name: "authority", type: "publicKey" },
            { name: "allowedMints", type: { vec: "publicKey" } },
            { name: "totalStaked", type: "u64" },
          ],
        },
      },
      {
        name: "StakeAccount",
        type: {
          kind: "struct",
          fields: [
            { name: "user", type: "publicKey" },
            { name: "pool", type: "publicKey" },
            { name: "tokenMint", type: "publicKey" },
            { name: "amount", type: "u64" },
            { name: "lockupPeriod", type: { defined: "LockupPeriod" } },
            { name: "stakeTime", type: "i64" },
            { name: "rewardClaimed", type: "bool" },
          ],
        },
      },
    ],
    types: [
      {
        name: "LockupPeriod",
        type: {
          kind: "enum",
          variants: [{ name: "OneMonth" }, { name: "ThreeMonths" }, { name: "SixMonths" }, { name: "OneYear" }],
        },
      },
    ],
    errors: [
      { code: 6000, name: "InvalidTokenMint", msg: "Invalid token mint" },
      { code: 6001, name: "InvalidAmount", msg: "Invalid amount" },
      { code: 6002, name: "InvalidUser", msg: "Invalid user" },
      { code: 6003, name: "LockupNotEnded", msg: "Lockup period has not ended" },
      { code: 6004, name: "RewardAlreadyClaimed", msg: "Reward already claimed" },
      { code: 6005, name: "Overflow", msg: "Arithmetic overflow" },
      { code: 6006, name: "Underflow", msg: "Arithmetic underflow" },
    ],
  }
}

// Your actual program ID
const programId = new PublicKey(process.env.PROGRAM_ID6 || '')

// Type the program properly
type StakingProgram = Program<StakingProgramIDL>

// Type the IDL properly
// type StakingProgram = Program<typeof idl>

export default function Home() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  const [mintAddress, setMintAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [lockupPeriod, setLockupPeriod] = useState("oneMonth")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userTokenAccount, setUserTokenAccount] = useState<PublicKey | null>(null)
  const [poolExists, setPoolExists] = useState(false)
  const [stakeAccountExists, setStakeAccountExists] = useState(false)
  const [stakeInfo, setStakeInfo] = useState<any>(null)

  useEffect(() => {
    console.log("Wallet:", wallet?.publicKey?.toBase58())
    console.log("Connection:", connection.rpcEndpoint)
  }, [wallet, connection])

  // Get user's associated token account
  useEffect(() => {
    const getUserTokenAccount = async () => {
      if (wallet && mintAddress) {
        try {
          const mintPubkey = new PublicKey(mintAddress)
          const ata = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey)
          setUserTokenAccount(ata)

          // Check if the token account exists
          const accountInfo = await connection.getAccountInfo(ata)
          if (!accountInfo) {
            setMessage(`Token account doesn't exist. You may need to create it first.`)
          }
        } catch (error) {
          console.error("Error getting user token account:", error)
          setUserTokenAccount(null)
        }
      }
    }

    getUserTokenAccount()
  }, [wallet, mintAddress, connection])

  const program = useMemo((): StakingProgram | null => {
    if (!wallet || !connection) {
      if (!wallet) {
        setMessage("Please connect your wallet")
      }
      return null
    }

    try {
      if (!wallet.publicKey) {
        setMessage("Wallet not properly connected")
        return null
      }

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      })

      const idl = getIDL()
      const programInstance = new Program(idl as Idl, programId, provider) as StakingProgram
      console.log("Program initialized successfully:", programInstance.programId.toBase58())
      setMessage("")
      return programInstance
    } catch (error) {
      console.error("Program initialization error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMessage(`Failed to initialize program: ${errorMessage}`)
      return null
    }
  }, [wallet, connection])

  // Check if pool exists
  useEffect(() => {
    const checkPoolExists = async () => {
      if (!program || !wallet) return

      try {
        const [poolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("pool"), wallet.publicKey.toBuffer()],
          programId,
        )

        const poolAccount = await program.account.pool.fetchNullable(poolPda)
        setPoolExists(!!poolAccount)

        if (poolAccount) {
          console.log("Pool found:", poolAccount)
        }
      } catch (error) {
        console.error("Error checking pool:", error)
        setPoolExists(false)
      }
    }

    checkPoolExists()
  }, [program, wallet])

  // Check if stake account exists
  useEffect(() => {
    const checkStakeAccount = async () => {
      if (!program || !wallet || !mintAddress) return

      try {
        const [poolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("pool"), wallet.publicKey.toBuffer()],
          programId,
        )

        const [stakeAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("stake"), wallet.publicKey.toBuffer(), poolPda.toBuffer()],
          programId,
        )

        const stakeAccount = await program.account.stakeAccount.fetchNullable(stakeAccountPda)
        setStakeAccountExists(!!stakeAccount)
        setStakeInfo(stakeAccount)

        if (stakeAccount) {
          console.log("Stake account found:", stakeAccount)
        }
      } catch (error) {
        console.error("Error checking stake account:", error)
        setStakeAccountExists(false)
        setStakeInfo(null)
      }
    }

    checkStakeAccount()
  }, [program, wallet, mintAddress])

  const initializePool = async () => {
    if (!program || !wallet) {
      setMessage("Please connect your wallet and ensure program is initialized")
      return
    }

    if (!mintAddress) {
      setMessage("Please enter a token mint address")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from("pool"), wallet.publicKey.toBuffer()], programId)

      const mintPubkey = new PublicKey(mintAddress)

      const tx = await program.methods
        .initializePool([mintPubkey])
        .accounts({
          pool: poolPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setMessage(`Pool initialized successfully! Transaction: ${tx}`)
      setPoolExists(true)
    } catch (error) {
      console.error("Initialize pool error:", error)
      setMessage(`Error initializing pool: ${error instanceof Error ? error.message : String(error)}`)
    }

    setIsLoading(false)
  }

  const stake = async () => {
    if (!program || !wallet) {
      setMessage("Please connect your wallet and ensure program is initialized")
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setMessage("Please enter a valid amount")
      return
    }

    if (!userTokenAccount) {
      setMessage("User token account not found. Please ensure you have the token in your wallet.")
      return
    }

    if (!poolExists) {
      setMessage("Pool doesn't exist. Please initialize the pool first.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from("pool"), wallet.publicKey.toBuffer()], programId)

      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), wallet.publicKey.toBuffer(), poolPda.toBuffer()],
        programId,
      )

      const [stakeVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), poolPda.toBuffer()], programId)

      const tokenMint = new PublicKey(mintAddress)

      // Convert lockup period to the correct enum format
      const lockupPeriodEnum = {
        oneMonth: { oneMonth: {} },
        threeMonths: { threeMonths: {} },
        sixMonths: { sixMonths: {} },
        oneYear: { oneYear: {} },
      }[lockupPeriod]

      const stakeAmount = new BN(amount)

      const tx = await program.methods
        .stake(stakeAmount, { [lockupPeriod.charAt(0).toUpperCase() + lockupPeriod.slice(1)]: {} })
        .accounts({
          pool: poolPda,
          stakeAccount: stakeAccountPda,
          stakeVault: stakeVaultPda,
          userTokenAccount,
          tokenMint,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setMessage(`Staked ${amount} tokens successfully! Transaction: ${tx}`)
      setAmount("")
      setStakeAccountExists(true)
    } catch (error) {
      console.error("Stake error:", error)
      setMessage(`Error staking: ${error instanceof Error ? error.message : String(error)}`)
    }

    setIsLoading(false)
  }

  const unstake = async () => {
    if (!program || !wallet) {
      setMessage("Please connect your wallet and ensure program is initialized")
      return
    }

    if (!userTokenAccount) {
      setMessage("User token account not found.")
      return
    }

    if (!stakeAccountExists) {
      setMessage("No stake account found. Please stake tokens first.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from("pool"), wallet.publicKey.toBuffer()], programId)

      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), wallet.publicKey.toBuffer(), poolPda.toBuffer()],
        programId,
      )

      const [stakeVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), poolPda.toBuffer()], programId)

      const tx = await program.methods
        .unstake()
        .accounts({
          pool: poolPda,
          stakeAccount: stakeAccountPda,
          stakeVault: stakeVaultPda,
          userTokenAccount,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      setMessage(`Unstaked successfully! Transaction: ${tx}`)
      setStakeAccountExists(false)
      setStakeInfo(null)
    } catch (error) {
      console.error("Unstake error:", error)
      setMessage(`Error unstaking: ${error instanceof Error ? error.message : String(error)}`)
    }

    setIsLoading(false)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getLockupEndTime = (stakeTime: number, lockupPeriod: any) => {
    const periods = {
      oneMonth: 30 * 24 * 60 * 60,
      threeMonths: 90 * 24 * 60 * 60,
      sixMonths: 180 * 24 * 60 * 60,
      oneYear: 365 * 24 * 60 * 60,
    }

    const periodKey = Object.keys(lockupPeriod)[0] as keyof typeof periods
    const endTime = stakeTime + periods[periodKey]
    return new Date(endTime * 1000).toLocaleString()
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
   
   
    <div className=" bg-gradient-to-br to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
        <CoinMarketCapWidget />
        {/* <CrashGame /> */}
        <iframe src="/addtoken01.html" height="100%"></iframe>
       {/* <div className="p-6 max-w-md mx-auto border rounded-2xl shadow-lg space-y-4">
   
<button id="connectButton">Connect Wallet</button><br />
    <p id="walletAddress"></p>
    
    <label htmlFor="amount">Amount of SOL to spend:</label>
    <input type="number" id="amount" step="0.01" min="0.01" placeholder="0.1" />
    
    <button id="buyButton" disabled>Buy $CHIPPY</button>
    <p id="status"></p>
</div>*/}
    <Script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js" strategy="beforeInteractive" />
			<Script src="/buychippy.js" strategy="beforeInteractive" />
	
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-gray-500">Token ID:</span>
            <code className="text-xs px-2 py-1 rounded">{programId.toBase58()}</code>
            <a
              href={`https://explorer.solana.com/address/${programId.toBase58()}?cluster=mainnet-beta`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="flex justify-center">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>

        {message && (
          <Alert className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription className={message.includes("Error") ? "text-red-800" : "text-green-800"}>
              {message}
              {message.includes("Transaction:") && (
                <div className="mt-2">
                  <a
                    href={`https://explorer.solana.com/tx/${message.split("Transaction: ")[1]}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                  >
                    View on Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className={poolExists ? "border-green-200 bg-green-50" : "border-gray-200"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pool Status</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${poolExists ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {poolExists ? "Initialized" : "Not Initialized"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={stakeAccountExists ? "border-blue-200 bg-blue-50" : "border-gray-200"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stake Status</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${stakeAccountExists ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {stakeAccountExists ? "Active" : "No Stakes"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stake Info Display */}
        {stakeInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Your Stake Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Amount Staked:</span>
                  <p className="text-blue-700">{stakeInfo.amount.toString()} tokens</p>
                </div>
                <div>
                  <span className="font-medium">Lockup Period:</span>
                  <p className="text-blue-700">{Object.keys(stakeInfo.lockupPeriod)[0]}</p>
                </div>
                <div>
                  <span className="font-medium">Stake Time:</span>
                  <p className="text-blue-700">{formatTimestamp(stakeInfo.stakeTime.toNumber())}</p>
                </div>
                <div>
                  <span className="font-medium">Lockup Ends:</span>
                  <p className="text-blue-700">
                    {getLockupEndTime(stakeInfo.stakeTime.toNumber(), stakeInfo.lockupPeriod)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Reward Claimed:</span>
                  <p className="text-blue-700">{stakeInfo.rewardClaimed ? "Yes" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Initialize Pool
                {poolExists && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Done</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mintAddress">Token Mint Address</Label>
                <Input
                  id="mintAddress"
                  type="text"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  placeholder="Enter token mint address"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use So11111111111111111111111111111111111111112 for wrapped SOL
                </p>
              </div>
              <Button
                onClick={initializePool}
                disabled={isLoading || !program || !mintAddress || poolExists}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : poolExists ? (
                  "Pool Already Initialized"
                ) : (
                  "Initialize Pool"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stake Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount to Stake</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in smallest unit"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">For SOL: 1 SOL = 1,000,000,000 lamports</p>
              </div>
              <div>
                <Label htmlFor="lockupPeriod">Lockup Period</Label>
                <Select value={lockupPeriod} onValueChange={setLockupPeriod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oneMonth">1 Month (5% APY)</SelectItem>
                    <SelectItem value="threeMonths">3 Months (15% APY)</SelectItem>
                    <SelectItem value="sixMonths">6 Months (20% APY)</SelectItem>
                    <SelectItem value="oneYear">1 Year (30% APY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={stake}
                disabled={isLoading || !program || !amount || !mintAddress || !poolExists}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Stake Tokens"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unstake Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={unstake}
                disabled={isLoading || !program || !stakeAccountExists}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Unstake Tokens"
                )}
              </Button>
              {!stakeAccountExists && <p className="text-xs text-gray-500 mt-2 text-center">No active stakes found</p>}
            </CardContent>
          </Card>
        </div>

        {wallet && (
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p>Connected Wallet: {wallet.publicKey.toBase58()}</p>
            {userTokenAccount && <p>User Token Account: {userTokenAccount.toBase58()}</p>}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
