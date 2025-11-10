use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("8g9EesTi6VgFFPS41musSS31t8ihU9wpRcFrqRnqcXZd");

#[program]
pub mod crash_game {
    use super::*;

    // =================================================
    // 1. INITIALIZE (config + index)
    // =================================================
    pub fn initialize(
        ctx: Context<Initialize>,
        admin: Pubkey,
        treasury: Pubkey,
        tax_bps: u16,
    ) -> Result<()> {
        require!(tax_bps <= 1000, ErrorCode::TaxTooHigh);

        // ---- Config ----
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.vault = ctx.accounts.vault.key();
        config.treasury = treasury;
        config.tax_bps = tax_bps;

        // ---- Game Index (singleton) ----
        let index = &mut ctx.accounts.game_index;
        index.total_games = 0;
        index.bump = ctx.bumps.game_index;

        Ok(())
    }

    // =================================================
    // 2. CREATE USER
    // =================================================
    pub fn create_user(ctx: Context<CreateUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.balance = 0;
        user.has_active_bet = false;
        Ok(())
    }

    // =================================================
    // 3. DEPOSIT
    // =================================================
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        system_transfer(
            &ctx.accounts.user_wallet,
            &ctx.accounts.vault,
            amount,
            &ctx.accounts.system_program,
        )?;

        ctx.accounts.user.balance = checked_add(ctx.accounts.user.balance, amount)?;
        Ok(())
    }

    // =================================================
    // 4. WITHDRAW
    // =================================================
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let user = &mut ctx.accounts.user;
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(user.balance >= amount, ErrorCode::InsufficientBalance);
        require!(!user.has_active_bet, ErrorCode::ActiveBetExists);

        system_transfer(
            &ctx.accounts.vault,
            &ctx.accounts.user_wallet,
            amount,
            &ctx.accounts.system_program,
        )?;

        user.balance = checked_sub(user.balance, amount)?;
        Ok(())
    }

    // =================================================
    // 5. CREATE GAME (writes to index)
    // =================================================
    pub fn create_game(
        ctx: Context<CreateGame>,
        multiplier: u64,
        game_name: String,
        created_at: u32,
    ) -> Result<()> {
        require!(multiplier >= 100 && multiplier <= 10_000, ErrorCode::InvalidMultiplier);
        require!(!game_name.is_empty(), ErrorCode::InvalidGameName);
        require!(game_name.len() <= 32, ErrorCode::GameNameTooLong);

        // ---- PDA validation ----
        let (expected_pda, expected_bump) = Pubkey::find_program_address(
            &[b"game", &created_at.to_le_bytes()],
            ctx.program_id,
        );
        require_keys_eq!(ctx.accounts.game_state.key(), expected_pda, ErrorCode::InvalidPda);
        require_eq!(ctx.bumps.game_state, expected_bump, ErrorCode::InvalidPda);

        // ---- Initialise GameState ----
        let game = &mut ctx.accounts.game_state;
        game.multiplier = multiplier;
        game.active = true;
        game.created_at = created_at as i64;
        game.resolved_at = 0;
        game.total_bets = 0;
        game.total_volume = 0;
        game.game_name = game_name.clone();
        game.admin = ctx.accounts.signer.key();
        game.crashed = false;
        game.game_id = game.key();

        // -------------------- INDEX UPDATE --------------------
        let index = &mut ctx.accounts.game_index;
        let chunk_id = index.total_games / MAX_ENTRIES_PER_CHUNK as u64;
        let entry = GameEntry {
            game_pda: game.key(),
            created_at,
        };

        // Load / init chunk
        let chunk_acc = &ctx.accounts.chunk;
        let mut chunk = if chunk_acc.data_is_empty() {
            GameIndexChunk {
                chunk_id,
                entries: Vec::with_capacity(MAX_ENTRIES_PER_CHUNK),
            }
        } else {
            GameIndexChunk::try_from_slice(&chunk_acc.data.borrow())?
        };
        require_eq!(chunk.chunk_id, chunk_id, ErrorCode::InvalidChunk);
        chunk.entries.push(entry);
        chunk.serialize(&mut &mut chunk_acc.data.borrow_mut()[..])?;

        index.total_games = checked_add(index.total_games, 1)?;
        // ----------------------------------------------------------------

        Ok(())
    }

    // =================================================
    // 6. PLACE BET (with tax) — FIXED payer
    // =================================================
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let bet = &mut ctx.accounts.bet;
        let user = &mut ctx.accounts.user_balance;
        let game = &mut ctx.accounts.game_state;
        let config = &ctx.accounts.config;

        require!(game.active, ErrorCode::GameNotActive);
        require!(user.balance >= amount, ErrorCode::InsufficientBalance);
        require!(!user.has_active_bet, ErrorCode::ActiveBetExists);

        // ---- TAX ----
        let tax_bps = config.tax_bps as u64;
        let tax = amount
            .checked_mul(tax_bps)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10_000)
            .ok_or(ErrorCode::MathOverflow)?;
        let bet_after_tax = amount.checked_sub(tax).ok_or(ErrorCode::MathOverflow)?;

        // ---- Transfer full amount to vault ----
        system_transfer(
            &ctx.accounts.user_wallet,
            &ctx.accounts.vault,
            amount,
            &ctx.accounts.system_program,
        )?;

        // ---- Move tax to treasury ----
        if tax > 0 {
            system_transfer(
                &ctx.accounts.vault,
                &ctx.accounts.treasury,
                tax,
                &ctx.accounts.system_program,
            )?;
        }

        // ---- Update user & bet (net amount) ----
        user.balance = checked_sub(user.balance, amount)?;
        user.has_active_bet = true;

        bet.user = user.key();
        bet.amount = bet_after_tax;
        bet.active = true;
        bet.game_id = game.game_id;
        bet.payout_amount = 0;
        bet.claimed = false;

        game.total_bets = checked_add(game.total_bets, 1)?;
        game.total_volume = checked_add(game.total_volume, bet_after_tax)?;

        Ok(())
    }

    // =================================================
    // 7. RESOLVE GAME
    // =================================================
    pub fn resolve_game(ctx: Context<ResolveGame>, crashed: bool) -> Result<()> {
        let game = &mut ctx.accounts.game_state;
        require!(game.active, ErrorCode::GameNotActive);

        game.active = false;
        game.crashed = crashed;
        game.resolved_at = Clock::get()?.unix_timestamp;

        if !crashed {
            for bet_acc in ctx.remaining_accounts.iter() {
                let mut data = bet_acc.try_borrow_mut_data()?;
                if data.len() < std::mem::size_of::<Bet>() { continue; }
                let mut bet = match Bet::try_deserialize(&mut &data[..]) {
                    Ok(b) => b,
                    Err(_) => continue,
                };
                if bet.active && bet.game_id == game.game_id {
                    let payout = bet.amount
                        .checked_mul(game.multiplier)
                        .ok_or(ErrorCode::MathOverflow)?
                        .checked_div(100)
                        .ok_or(ErrorCode::MathOverflow)?;
                    bet.active = false;
                    bet.payout_amount = payout;
                    bet.serialize(&mut &mut data[..])?;
                }
            }
        } else {
            for bet_acc in ctx.remaining_accounts.iter() {
                let mut data = bet_acc.try_borrow_mut_data()?;
                if data.len() < std::mem::size_of::<Bet>() { continue; }
                let mut bet = match Bet::try_deserialize(&mut &data[..]) {
                    Ok(b) => b,
                    Err(_) => continue,
                };
                if bet.active && bet.game_id == game.game_id {
                    bet.active = false;
                    bet.payout_amount = 0;
                    bet.serialize(&mut &mut data[..])?;
                }
            }
        }
        Ok(())
    }

    // =================================================
    // 8. CLAIM PAYOUT
    // =================================================
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let user = &mut ctx.accounts.user_balance;

        require!(!bet.active, ErrorCode::BetStillActive);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        require!(bet.payout_amount > 0, ErrorCode::NoPayout);
        require_keys_eq!(bet.user, user.key(), ErrorCode::Unauthorized);

        user.balance = checked_add(user.balance, bet.payout_amount)?;
        user.has_active_bet = false;
        bet.claimed = true;

        Ok(())
    }

    // =================================================
    // 9. ADMIN WITHDRAW (game vault)
    // =================================================
    pub fn admin_withdraw(ctx: Context<AdminWithdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require_keys_eq!(ctx.accounts.signer.key(), ctx.accounts.config.admin, ErrorCode::Unauthorized);

        system_transfer(
            &ctx.accounts.vault,
            &ctx.accounts.signer,
            amount,
            &ctx.accounts.system_program,
        )?;
        Ok(())
    }

    // =================================================
    // 10. ADMIN DEPOSIT BOUNTY
    // =================================================
    pub fn admin_deposit_bounty(ctx: Context<AdminDepositBounty>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require_keys_eq!(ctx.accounts.signer.key(), ctx.accounts.config.admin, ErrorCode::Unauthorized);

        system_transfer(
            &ctx.accounts.signer,
            &ctx.accounts.vault,
            amount,
            &ctx.accounts.system_program,
        )?;
        Ok(())
    }

    // =================================================
    // 11. ADMIN SET TAX
    // =================================================
    pub fn set_tax(ctx: Context<SetTax>, tax_bps: u16) -> Result<()> {
        require_keys_eq!(ctx.accounts.signer.key(), ctx.accounts.config.admin, ErrorCode::Unauthorized);
        require!(tax_bps <= 1000, ErrorCode::TaxTooHigh);
        ctx.accounts.config.tax_bps = tax_bps;
        Ok(())
    }

    // =================================================
    // 12. ADMIN WITHDRAW TREASURY
    // =================================================
    pub fn admin_withdraw_treasury(ctx: Context<AdminWithdrawTreasury>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require_keys_eq!(ctx.accounts.signer.key(), ctx.accounts.config.admin, ErrorCode::Unauthorized);

        system_transfer(
            &ctx.accounts.treasury,
            &ctx.accounts.signer,
            amount,
            &ctx.accounts.system_program,
        )?;
        Ok(())
    }

    // =================================================
    // 13. LIST GAMES (paginated)
    // =================================================
    pub fn list_games(
        ctx: Context<ListGames>,
        offset: u64,
        limit: u8,
    ) -> Result<Vec<GameListItem>> {
        let index = &ctx.accounts.game_index;
        let mut out = Vec::with_capacity(limit as usize);
        let mut remaining = limit as usize;
        let mut cur = offset;

        while remaining > 0 && cur < index.total_games {
            let chunk_id = cur / MAX_ENTRIES_PER_CHUNK as u64;
            let idx_in_chunk = (cur % MAX_ENTRIES_PER_CHUNK as u64) as usize;

            let chunk_acc = &ctx.remaining_accounts[chunk_id as usize];
            let chunk = GameIndexChunk::try_from_slice(&chunk_acc.data.borrow())?;
            let entry = chunk.entries[idx_in_chunk];

            let game_acc = &ctx.remaining_accounts[ctx.remaining_accounts.len() / 2 + chunk_id as usize];
            let game = GameState::try_from_slice(&game_acc.data.borrow())?;

            out.push(GameListItem {
                game_pda: entry.game_pda,
                created_at: entry.created_at,
                game_name: game.game_name.clone(),
                multiplier: game.multiplier,
                active: game.active,
                crashed: game.crashed,
            });

            remaining -= 1;
            cur += 1;
        }
        Ok(out)
    }

    // =================================================
    // 14. GET GAME BY TIMESTAMP
    // =================================================
      pub fn get_game_by_timestamp(
        ctx: Context<GetGameByTimestamp>,
        _created_at: u32,
    ) -> Result<GameState> {
        Ok((*ctx.accounts.game_state).clone())
    }
}

// =================================================
// ACCOUNT STRUCTS
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

// ----------------- INDEX -----------------
#[account]
pub struct GameIndex {
    pub total_games: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
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

// =================================================
// CONTEXTS
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
        space = 8 + 8 + 1 + 8 + 8 + 8 + 8 + 4 + 32 + 32 + 1 + 32,
        seeds = [b"game", &created_at.to_le_bytes()],
        bump
    )]
    pub game_state: Account<'info, GameState>,

    #[account(mut, seeds = [b"game_index"], bump)]
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
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminDepositBounty<'info> {
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
// HELPERS
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

// =================================================
// ERROR CODES
// =================================================
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