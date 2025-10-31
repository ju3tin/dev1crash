const { Connection, PublicKey, SystemProgram } = window.solanaWeb3;
const { AnchorProvider, Program, web3 } = window.anchor;

const PROGRAM_ID = new PublicKey("4JnQm2avRVzUsB2yji4NWER4QVYoQdJtQ4Zy7njMk9Zs");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
let provider, program, wallet;

async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    showError("Please install Phantom Wallet");
    return;
  }
  if (!window.solanaWeb3 || !window.anchor) {
    showError("Required libraries (Solana Web3.js or Anchor) not loaded");
    return;
  }
  try {
    await window.solana.connect();
    wallet = window.solana;
    provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const idl = await Program.fetchIdl(PROGRAM_ID, provider);
    if (!idl) {
      showError("Failed to fetch program IDL");
      return;
    }
    program = new Program(idl, PROGRAM_ID, provider);
    document.getElementById("wallet-address").innerText = `Connected: ${wallet.publicKey.toString()}`;
    document.getElementById("connect-wallet").disabled = true;
    updateGameStatus();
  } catch (err) {
    showError("Failed to connect wallet: " + err.message);
  }
}

async function initializeGame() {
  if (!program) return showError("Wallet not connected");
  const maxPlayers = parseInt(document.getElementById("max-players").value);
  if (!maxPlayers || maxPlayers < 1 || maxPlayers > 255) return showError("Invalid max players");

  const game = web3.Keypair.generate();
  try {
    await program.methods
      .initializeGame(maxPlayers)
      .accounts({
        game: game.publicKey,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([game])
      .rpc();
    showError("Game initialized successfully");
    updateGameStatus();
  } catch (err) {
    showError("Failed to initialize game: " + err.message);
  }
}

async function placeBet() {
  if (!program) return showError("Wallet not connected");
  const amount = parseFloat(document.getElementById("bet-amount").value);
  if (!amount || amount <= 0) return showError("Invalid bet amount");

  const game = await findGamePda();
  const bet = await findBetPda(game, wallet.publicKey);
  const escrow = await findEscrowPda(game);

  try {
    await program.methods
      .placeBet(Math.floor(amount * 1e9)) // Convert SOL to lamports
      .accounts({
        game,
        bet,
        player: wallet.publicKey,
        escrow,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    showError("Bet placed successfully");
    updateGameStatus();
  } catch (err) {
    showError("Failed to place bet: " + err.message);
  }
}

async function cashOut() {
  if (!program) return showError("Wallet not connected");
  const multiplier = parseFloat(document.getElementById("cashout-multiplier").value);
  if (!multiplier || multiplier < 1) return showError("Invalid multiplier");

  const game = await findGamePda();
  const bet = await findBetPda(game, wallet.publicKey);
  const escrow = await findEscrowPda(game);

  try {
    await program.methods
      .cashOut(Math.floor(multiplier * 100)) // Convert to integer (e.g., 2.0 -> 200)
      .accounts({
        game,
        bet,
        player: wallet.publicKey,
        escrow,
        authority: wallet.publicKey,
      })
      .rpc();
    showError("Cashed out successfully");
    updateGameStatus();
  } catch (err) {
    showError("Failed to cash out: " + err.message);
  }
}

async function startGame() {
  if (!program) return showError("Wallet not connected");
  const crashPoint = parseFloat(document.getElementById("crash-point").value);
  if (!crashPoint || crashPoint < 1) return showError("Invalid crash point");

  const game = await findGamePda();
  try {
    await program.methods
      .startGame(Math.floor(crashPoint * 100))
      .accounts({
        game,
        authority: wallet.publicKey,
      })
      .rpc();
    showError("Game started successfully");
    animateCrash(crashPoint);
    updateGameStatus();
  } catch (err) {
    showError("Failed to start game: " + err.message);
  }
}

async function endGame() {
  if (!program) return showError("Wallet not connected");
  const game = await findGamePda();
  try {
    await program.methods
      .endGame()
      .accounts({
        game,
        authority: wallet.publicKey,
      })
      .rpc();
    showError("Game ended successfully");
    updateGameStatus();
  } catch (err) {
    showError("Failed to end game: " + err.message);
  }
}

async function findGamePda() {
  const [gamePda] = await PublicKey.findProgramAddress(
    [Buffer.from("game"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );
  return gamePda;
}

async function findBetPda(game, player) {
  const [betPda] = await PublicKey.findProgramAddress(
    [Buffer.from("bet"), game.toBuffer(), player.toBuffer()],
    PROGRAM_ID
  );
  return betPda;
}

async function findEscrowPda(game) {
  const [escrowPda] = await PublicKey.findProgramAddress(
    [Buffer.from("escrow"), game.toBuffer()],
    PROGRAM_ID
  );
  return escrowPda;
}

async function updateGameStatus() {
  if (!program) return;
  try {
    const game = await findGamePda();
    const gameState = await program.account.game.fetch(game);
    document.getElementById("game-active").innerText = `Active: ${gameState.isActive}`;
    document.getElementById("current-players").innerText = `Current Players: ${gameState.currentPlayers}/${gameState.maxPlayers}`;
    document.getElementById("current-multiplier").innerText = `Current Multiplier: ${(gameState.multiplier / 100).toFixed(2)}x`;

    const escrow = await findEscrowPda(game);
    const escrowState = await program.account.escrow.fetch(escrow);
    document.getElementById("escrow-balance").innerText = `Escrow Balance: ${(escrowState.escrowBalance / 1e9).toFixed(2)} SOL`;
  } catch (err) {
    showError("Failed to fetch game status: " + err.message);
  }
}

function animateCrash(crashPoint) {
  const crashDiv = document.getElementById("crash-animation");
  let multiplier = 1;
  crashDiv.innerText = `Multiplier: ${multiplier.toFixed(2)}x`;
  const interval = setInterval(() => {
    multiplier += 0.1;
    crashDiv.innerText = `Multiplier: ${multiplier.toFixed(2)}x`;
    crashDiv.style.background = `linear-gradient(to right, #4ade80 ${Math.min(multiplier * 10, 100)}%, #1f2937 0%)`;
    if (multiplier >= crashPoint) {
      clearInterval(interval);
      crashDiv.innerText = `Crashed at: ${multiplier.toFixed(2)}x`;
      crashDiv.style.background = `linear-gradient(to right, #ef4444 100%, #1f2937 0%)`;
    }
  }, 100);
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.innerText = message;
  setTimeout(() => (errorDiv.innerText = ""), 5000);
}

document.getElementById("connect-wallet").addEventListener("click", connectWallet);
document.getElementById("init-game").addEventListener("click", initializeGame);
document.getElementById("place-bet").addEventListener("click", placeBet);
document.getElementById("cash-out").addEventListener("click", cashOut);
document.getElementById("start-game").addEventListener("click", startGame);
document.getElementById("end-game").addEventListener("click", endGame);