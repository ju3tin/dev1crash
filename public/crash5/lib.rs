use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("HuPikJUsvgtEpAs1xvnvMxdDToELwnEfVwornFCedbWu");

// =================================================
// 1. ALL ACCOUNT CONTEXTS (MUST COME FIRST!)
// =================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 32 + 32 + 2,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 1,
        seeds = [b"game_index"],
        bump
    )]
    pub game_index: Account<'info, GameIndex>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = user_wallet,
        space = 8 + 8 + 1,
        seeds = [b"user_balance", user_wallet.key().as_ref()],
        bump
    )]
    pub user: Account<'info, UserBalance>,

    #[account(mut)]
    pub user_wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Account<'info, UserBalance>,

    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Account<'info, UserBalance>,

    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(multiplier: u64, game_name: String, created_at: u32)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 1 + 8 + 8 + 8 + 8 + 32 + 4 + 32 + 1 + 32, // fixed size
        seeds = [b"game", &created_at.to_le_bytes()],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    #[account(mut, seeds = [b"game_index"], bump = game_index.bump)]
    pub game_index: Account<'info, GameIndex>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub chunk: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = user_wallet,
        space = 8 + 32 + 8 + 1 + 32 + 8 + 1,
        seeds = [b"bet", user_balance.key().as_ref(), game_state.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub user_balance: Account<'info, UserBalance>,

    #[account(mut)]
    pub game_state: Account<'info, GameState>,

    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(mut)]
    pub game_state: Account<'info, GameState>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub user_balance: Account<'info, UserBalance>,

    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminDepositBounty<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetTax<'info> {
    #[account(mut, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminWithdrawTreasury<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetBalances<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,

    /// CHECK: Address validated by config
    #[account(address = config.vault)]
    pub vault: AccountInfo<'info>,

    /// CHECK: Address validated by config
    #[account(address = config.treasury)]
    pub treasury: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ListGames<'info> {
    #[account(seeds = [b"game_index"], bump)]
    pub game_index: Account<'info, GameIndex>,
}

#[derive(Accounts)]
#[instruction(created_at: u32)]
pub struct GetGameByTimestamp<'info> {
    #[account(
        seeds = [b"game", &created_at.to_le_bytes()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
}

// =================================================
// 2. ACCOUNT STRUCTS
// =================================================

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub vault: Pubkey,
    pub treasury: Pubkey,
    pub tax_bps: u16,
}

#[account]
pub struct UserBalance {
    pub balance: u64,
    pub has_active_bet: bool,
}

#[account]
pub struct GameState {
    pub multiplier: u64,
    pub active: bool,
    pub created_at: i64,
    pub resolved_at: i64,
    pub total_bets: u64,
    pub total_volume: u64,
    pub game_name: String,
    pub admin: Pubkey,
    pub crashed: bool,
    pub game_id: Pubkey,
}

#[account]
pub struct Bet {
    pub user: Pubkey,
    pub amount: u64,
    pub active: bool,
    pub game_id: Pubkey,
    pub payout_amount: u64,
    pub claimed: bool,
}

#[account]
pub struct GameIndex {
    pub total_games: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GameEntry {
    pub game_pda: Pubkey,
    pub created_at: u32,
}

#[account]
pub struct GameIndexChunk {
    pub chunk_id: u64,
    pub entries: Vec<GameEntry>,
}

pub const MAX_ENTRIES_PER_CHUNK: usize = 200;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GameListItem {
    pub game_pda: Pubkey,
    pub created_at: u32,
    pub game_name: String,
    pub multiplier: u64,
    pub active: bool,
    pub crashed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Balances {
    pub vault_lamports: u64,
    pub treasury_lamports: u64,
}

// =================================================
// 3. PROGRAM INSTRUCTIONS (NOW WORKS!)
// =================================================

#[program]
pub mod crash_game {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        admin: Pubkey,
        treasury: Pubkey,
        tax_bps: u16,
    ) -> Result<()> {
        // ... your existing code
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.vault = ctx.accounts.vault.key();
        config.treasury = treasury;
        config.tax_bps = tax_bps;

        let index = &mut ctx.accounts.game_index;
        index.total_games = 0;
        index.bump = ctx.bumps.game_index;

        Ok(())
    }

    // ... rest of your instructions (create_user, deposit, etc.)

    pub fn get_balances(ctx: Context<GetBalances>) -> Result<Balances> {
        Ok(Balances {
            vault_lamports: ctx.accounts.vault.lamports(),
            treasury_lamports: ctx.accounts.treasury.lamports(),
        })
    }

    // ... all other functions
}

// =================================================
// 4. HELPERS & ERRORS
// =================================================

fn system_transfer<'a>(
    from: &impl ToAccountInfo<'a>,
    to: &impl ToAccountInfo<'a>,
    amount: u64,
    system_program: &Program<'a, System>,
) -> Result<()> {
    let cpi_accounts = Transfer {
        from: from.to_account_info(),
        to: to.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(system_program.to_account_info(), cpi_accounts);
    transfer(cpi_ctx, amount)
}

fn checked_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or(ErrorCode::MathOverflow.into())
}

fn checked_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or(ErrorCode::MathOverflow.into())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Game is not active")]
    GameNotActive,
    #[msg("Invalid multiplier (1.00x - 100.00x)")]
    InvalidMultiplier,
    #[msg("Invalid game name")]
    InvalidGameName,
    #[msg("Game name too long (max 32 chars)")]
    GameNameTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid PDA")]
    InvalidPda,
    #[msg("Invalid chunk")]
    InvalidChunk,
    #[msg("Bet is still active")]
    BetStillActive,
    #[msg("Payout already claimed")]
    AlreadyClaimed,
    #[msg("No payout available")]
    NoPayout,
    #[msg("Tax cannot exceed 10%")]
    TaxTooHigh,
    #[msg("User already has an active bet")]
    ActiveBetExists,
}