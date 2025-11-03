use anchor_lang::prelude::*;

declare_id!("8ZRvQgFfGCc9BoRbzFmrzWHh5YzZxzoMfwiiAZJfdzU5");

#[program]
pub mod crash_game {
    use super::*;

    // =================================================
    // 1. INITIALIZE
    // =================================================
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.vault = ctx.accounts.vault.key();
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
        let user = &mut ctx.accounts.user;
        require!(amount > 0, ErrorCode::InvalidAmount);

        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.user_wallet.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        user.balance += amount;
        Ok(())
    }

    // =================================================
    // 4. WITHDRAW
    // =================================================
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let user = &mut ctx.accounts.user;
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(user.balance >= amount, ErrorCode::InsufficientBalance);

        **ctx.accounts.vault.to_account_info().lamports.borrow_mut() -= amount;
        **ctx.accounts.user_wallet.to_account_info().lamports.borrow_mut() += amount;

        user.balance -= amount;
        Ok(())
    }

    // =================================================
    // 5. CREATE GAME — UNIQUE PDA PER GAME
    // =================================================
    pub fn create_game(
        ctx: Context<CreateGame>,
        multiplier: u64,
        game_name: String,
    ) -> Result<()> {
        require!(multiplier >= 100 && multiplier <= 10000, ErrorCode::InvalidMultiplier);
        require!(!game_name.is_empty(), ErrorCode::InvalidGameName);

        // Get the key BEFORE creating mutable borrow
        let game_key = ctx.accounts.game_state.key();
        let clock = Clock::get()?;
        
        let game = &mut ctx.accounts.game_state;

        game.multiplier = multiplier;
        game.active = true;
        game.created_at = clock.unix_timestamp;
        game.resolved_at = 0;
        game.total_bets = 0;
        game.total_volume = 0;
        game.game_name = game_name;
        game.admin = ctx.accounts.signer.key();
        game.crashed = false;
        game.game_id = game_key; // Use the key we got earlier

        Ok(())
    }

    // =================================================
    // 6. PLACE BET
    // =================================================
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let bet = &mut ctx.accounts.bet;
        let user = &mut ctx.accounts.user_balance;
        let game = &mut ctx.accounts.game_state;

        require!(game.active, ErrorCode::GameNotActive);
        require!(user.balance >= amount, ErrorCode::InsufficientBalance);

        // Deduct from user
        user.balance -= amount;
        user.has_active_bet = true;

        // Record bet
        bet.user = ctx.accounts.user_balance.key();
        bet.amount = amount;
        bet.active = true;
        bet.game_id = game.game_id;

        // Update game stats
        game.total_bets += 1;
        game.total_volume += amount;

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

        // Pay winners if not crashed
        if !crashed {
            for acc in ctx.remaining_accounts.iter() {
                if let Ok(mut bet) = Bet::try_from_slice(&acc.data.borrow()) {
                    if bet.active && bet.game_id == game.game_id {
                        let payout = bet.amount
                            .checked_mul(game.multiplier)
                            .ok_or(ErrorCode::MathOverflow)?
                            .checked_div(100)
                            .ok_or(ErrorCode::MathOverflow)?;

                        **ctx.accounts.vault.to_account_info().lamports.borrow_mut() -= payout;
                        **acc.to_account_info().lamports.borrow_mut() += payout;

                        bet.active = false;
                    }
                }
            }
        } else {
            // Just deactivate all bets
            for acc in ctx.remaining_accounts.iter() {
                if let Ok(mut bet) = Bet::try_from_slice(&acc.data.borrow()) {
                    if bet.active && bet.game_id == game.game_id {
                        bet.active = false;
                    }
                }
            }
        }

        Ok(())
    }

    // =================================================
    // 8. ADMIN WITHDRAW
    // =================================================
    pub fn admin_withdraw(ctx: Context<AdminWithdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        let config = &ctx.accounts.config;
        require_keys_eq!(ctx.accounts.signer.key(), config.admin, ErrorCode::Unauthorized);

        **ctx.accounts.vault.to_account_info().lamports.borrow_mut() -= amount;
        **ctx.accounts.signer.to_account_info().lamports.borrow_mut() += amount;

        Ok(())
    }

    // =================================================
    // 9. ADMIN DEPOSIT BOUNTY
    // =================================================
    pub fn admin_deposit_bounty(ctx: Context<AdminDepositBounty>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        let config = &ctx.accounts.config;
        require_keys_eq!(ctx.accounts.signer.key(), config.admin, ErrorCode::Unauthorized);

        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.signer.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        Ok(())
    }
}

// =================================================
// ACCOUNT STRUCTS
// =================================================
#[account]
pub struct Config {
    pub admin: Pubkey,
    pub vault: Pubkey,
}

#[account]
pub struct UserBalance {
    pub balance: u64,
    pub has_active_bet: bool,
}

#[account]
#[derive(Default)]
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
    pub game_id: Pubkey, // PDA of this game
}

#[account]
pub struct Bet {
    pub user: Pubkey,
    pub amount: u64,
    pub active: bool,
    pub game_id: Pubkey,
}

// =================================================
// CONTEXTS
// =================================================
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 32,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
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
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Account<'info, UserBalance>,
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

// UNIQUE PDA PER GAME — USING u32 TIMESTAMP
#[derive(Accounts)]
#[instruction(multiplier: u64, game_name: String)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 1 + 8 + 8 + 8 + 8 + 4 + game_name.len() + 32 + 1 + 32,
        seeds = [b"game", &(Clock::get()?.unix_timestamp as u32).to_le_bytes()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 8 + 1 + 32,
        seeds = [b"bet", user_balance.key().as_ref(), game_state.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(mut)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminDepositBounty<'info> {
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
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
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
}