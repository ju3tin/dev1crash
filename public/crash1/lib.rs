use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("8mHkAFaTNxkAjYFq2RdZHy1SxofZrqEMkNQKufhNradY");

#[program]
pub mod crash_game {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.total_games = 0;
        config.total_volume = 0;
        config.is_initialized = true;
        Ok(())
    }

    pub fn create_user(ctx: Context<CreateUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.user = ctx.accounts.user_wallet.key();
        user.balance = 0;
        user.total_deposited = 0;
        user.total_withdrawn = 0;
        user.total_winnings = 0;
        user.games_won = 0;
        user.games_lost = 0;
        user.has_active_bet = false;
        user.active_bet_amount = 0;
        user.last_deposit = 0;
        user.last_withdrawal = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount >= 1_000, ErrorCode::MinimumDeposit);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user_wallet.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let user = &mut ctx.accounts.user;
        user.balance += amount;
        user.total_deposited += amount;
        user.last_deposit = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let user = &mut ctx.accounts.user;
        require!(user.balance >= amount, ErrorCode::InsufficientBalance);
        require!(!user.has_active_bet, ErrorCode::ActiveBetExists);

        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user_wallet.to_account_info().try_borrow_mut_lamports()? += amount;

        user.balance -= amount;
        user.total_withdrawn += amount;
        user.last_withdrawal = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn create_game(ctx: Context<CreateGame>, multiplier: u64, game_name: String) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let signer = &ctx.accounts.signer;
        require!(signer.key() == config.admin, ErrorCode::Unauthorized);
        require!(multiplier >= 100 && multiplier <= 10_000, ErrorCode::InvalidMultiplier);
        require!(game_name.len() <= 32, ErrorCode::NameTooLong);

        let game = &mut ctx.accounts.game_state;
        game.multiplier = multiplier;
        game.active = true;
        game.game_id = game.key();
        game.created_at = Clock::get()?.unix_timestamp;
        game.resolved_at = 0;
        game.total_bets = 0;
        game.total_volume = 0;
        game.game_name = game_name;
        game.admin = signer.key();
        game.crashed = false;

        config.total_games += 1;

        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, user_pubkey: Pubkey, bet_amount: u64) -> Result<()> {
        let config = &ctx.accounts.config;
        let signer = &ctx.accounts.signer;
        require!(signer.key() == config.admin, ErrorCode::Unauthorized);
        require!(ctx.accounts.game_state.active, ErrorCode::GameNotActive);
        require!(bet_amount >= 1_000, ErrorCode::MinimumBet);

        let user = &mut ctx.accounts.user_balance;
        require!(user.balance >= bet_amount, ErrorCode::InsufficientBalance);
        require!(!user.has_active_bet, ErrorCode::ActiveBetExists);

        user.balance -= bet_amount;
        user.has_active_bet = true;
        user.active_bet_amount = bet_amount;

        let game = &mut ctx.accounts.game_state;
        game.total_bets += 1;
        game.total_volume += bet_amount;

        let bet = &mut ctx.accounts.bet;
        bet.user = user_pubkey;
        bet.amount = bet_amount;
        bet.active = true;
        bet.game_id = game.game_id;
        bet.placed_at = Clock::get()?.unix_timestamp;
        bet.resolved_at = 0;
        bet.multiplier = game.multiplier;
        bet.crashed = false;

        Ok(())
    }

    pub fn resolve_game(ctx: Context<ResolveGame>, crashed: bool) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let signer = &ctx.accounts.signer;
        require!(signer.key() == config.admin, ErrorCode::Unauthorized);
        require!(ctx.accounts.game_state.active, ErrorCode::GameNotActive);

        let game = &mut ctx.accounts.game_state;
        let bet = &mut ctx.accounts.bet;
        let user = &mut ctx.accounts.user_balance;

        if bet.active {
            if !crashed {
                let payout = bet.amount * game.multiplier / 100;
                user.balance += payout + bet.amount;
                user.total_winnings += payout;
                user.games_won += 1;
            } else {
                user.games_lost += 1;
            }

            user.has_active_bet = false;
            user.active_bet_amount = 0;

            bet.active = false;
            bet.resolved_at = Clock::get()?.unix_timestamp;
            bet.crashed = crashed;
        }

        game.active = false;
        game.resolved_at = Clock::get()?.unix_timestamp;
        game.crashed = crashed;

        config.total_volume += game.total_volume;

        Ok(())
    }
}

// ==================== ACCOUNTS ====================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 32 + 8 + 8 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = user_wallet,
        space = 8 + 32 + 8*7 + 1 + 8 + 8 + 8,
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
    #[account(
        mut,
        seeds = [b"vault", user_wallet.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Account<'info, UserBalance>,
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", user_wallet.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 8 + 1 + 32 + 8 + 8 + 8 + 8 + 32 + 32 + 1,
        seeds = [b"game_state", signer.key().as_ref()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(mut, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user_pubkey: Pubkey)]
pub struct PlaceBet<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 32 + 8 + 1 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"bet", user_pubkey.as_ref(), game_state.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut, seeds = [b"user_balance", user_pubkey.as_ref()], bump)]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut, seeds = [b"game_state", game_state.admin.as_ref()], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(mut, seeds = [b"game_state", game_state.admin.as_ref()], bump)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ==================== STATE ====================

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub total_games: u64,
    pub total_volume: u64,
    pub is_initialized: bool,
}

#[account]
pub struct UserBalance {
    pub user: Pubkey,
    pub balance: u64,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub total_winnings: u64,
    pub games_won: u64,
    pub games_lost: u64,
    pub has_active_bet: bool,
    pub active_bet_amount: u64,
    pub last_deposit: i64,
    pub last_withdrawal: i64,
}

#[account]
pub struct GameState {
    pub multiplier: u64,
    pub active: bool,
    pub game_id: Pubkey,
    pub created_at: i64,
    pub resolved_at: i64,
    pub total_bets: u64,
    pub total_volume: u64,
    pub game_name: String,
    pub admin: Pubkey,
    pub crashed: bool,
}

#[account]
pub struct Bet {
    pub user: Pubkey,
    pub amount: u64,
    pub active: bool,
    pub game_id: Pubkey,
    pub placed_at: i64,
    pub resolved_at: i64,
    pub multiplier: u64,
    pub crashed: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Invalid multiplier")]
    InvalidMultiplier,
    #[msg("Game not active")]
    GameNotActive,
    #[msg("Amount must be > 0")]
    InvalidAmount,
    #[msg("Minimum deposit: 0.000001 SOL")]
    MinimumDeposit,
    #[msg("Minimum bet: 0.000001 SOL")]
    MinimumBet,
    #[msg("User has active bet")]
    ActiveBetExists,
    #[msg("Name too long")]
    NameTooLong,
}