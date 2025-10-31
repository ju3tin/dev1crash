use anchor_lang::prelude::*;

declare_id!("Bwvm9EaPpRkYEFVmwxC5PaWxR2pfpsyi8MvRLx34XYfK");

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

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(amount >= 1000, ErrorCode::MinimumDeposit); // Minimum 0.000001 SOL

        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.user_balance.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        let user_balance = &mut ctx.accounts.user_balance;
        user_balance.user = ctx.accounts.user.key();
        user_balance.balance += amount;
        user_balance.total_deposited += amount;
        user_balance.last_deposit = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let user_balance = &mut ctx.accounts.user_balance;
        require!(user_balance.balance >= amount, ErrorCode::InsufficientBalance);
        require!(!user_balance.has_active_bet, ErrorCode::ActiveBetExists);

        **user_balance.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;

        user_balance.balance -= amount;
        user_balance.total_withdrawn += amount;
        user_balance.last_withdrawal = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn create_game(ctx: Context<CreateGame>, multiplier: u64, game_name: String) -> Result<()> {
        require!(ctx.accounts.signer.key() == ctx.accounts.config.admin, ErrorCode::Unauthorized);
        require!(multiplier >= 100, ErrorCode::InvalidMultiplier);
        require!(multiplier <= 10000, ErrorCode::MultiplierTooHigh);
        require!(game_name.len() <= 32, ErrorCode::NameTooLong);

        let config = &mut ctx.accounts.config;
        config.total_games += 1;

        let game_state = &mut ctx.accounts.game_state;
        let game_state_key = game_state.key();
        game_state.multiplier = multiplier;
        game_state.active = true;
        game_state.game_id = game_state_key;
        game_state.created_at = Clock::get()?.unix_timestamp;
        game_state.total_bets = 0;
        game_state.total_volume = 0;
        game_state.game_name = game_name; // Fixed typo
        game_state.admin = ctx.accounts.signer.key();
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, user: Pubkey, bet_amount: u64) -> Result<()> {
        require!(ctx.accounts.signer.key() == ctx.accounts.config.admin, ErrorCode::Unauthorized);
        require!(ctx.accounts.game_state.active, ErrorCode::GameNotActive);
        require!(bet_amount > 0, ErrorCode::InvalidBetAmount);
        require!(bet_amount >= 1000, ErrorCode::MinimumBet);

        let game_state = &mut ctx.accounts.game_state;
        let user_balance = &mut ctx.accounts.user_balance;
        require!(user_balance.balance >= bet_amount, ErrorCode::InsufficientBalance);
        require!(!user_balance.has_active_bet, ErrorCode::ActiveBetExists);

        user_balance.balance -= bet_amount;
        user_balance.has_active_bet = true;
        user_balance.active_bet_amount = bet_amount;

        game_state.total_bets += 1;
        game_state.total_volume += bet_amount;

        let bet = &mut ctx.accounts.bet;
        bet.user = user;
        bet.amount = bet_amount;
        bet.active = true;
        bet.game_id = game_state.game_id;
        bet.placed_at = Clock::get()?.unix_timestamp;
        bet.multiplier = game_state.multiplier;
        Ok(())
    }

    pub fn resolve_game(ctx: Context<ResolveGame>, crashed: bool) -> Result<()> {
        require!(ctx.accounts.signer.key() == ctx.accounts.config.admin, ErrorCode::Unauthorized);
        let game_state = &mut ctx.accounts.game_state;
        require!(game_state.active, ErrorCode::GameNotActive);

        let bet = &mut ctx.accounts.bet;
        let user_balance = &mut ctx.accounts.user_balance;

        if bet.active {
            if !crashed {
                let payout = bet.amount * game_state.multiplier / 100;
                user_balance.balance += payout + bet.amount;
                user_balance.total_winnings += payout;
                user_balance.games_won += 1;
            } else {
                user_balance.games_lost += 1;
            }

            user_balance.has_active_bet = false;
            user_balance.active_bet_amount = 0;
            bet.active = false;
            bet.resolved_at = Clock::get()?.unix_timestamp;
            bet.crashed = crashed;
        }

        game_state.active = false;
        game_state.resolved_at = Clock::get()?.unix_timestamp;
        game_state.crashed = crashed;

        let config = &mut ctx.accounts.config;
        config.total_volume += game_state.total_volume;
        Ok(())
    }

    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        require!(ctx.accounts.signer.key() == ctx.accounts.config.admin, ErrorCode::Unauthorized);
        let config = &mut ctx.accounts.config;
        config.admin = new_admin;
        Ok(())
    }

    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        require!(ctx.accounts.signer.key() == ctx.accounts.config.admin, ErrorCode::Unauthorized);

        let user_balance = &mut ctx.accounts.user_balance;
        let balance = user_balance.balance;

        if balance > 0 {
            **user_balance.to_account_info().try_borrow_mut_lamports()? -= balance;
            **ctx.accounts.admin.to_account_info().try_borrow_mut_lamports()? += balance;
            user_balance.balance = 0;
        }
        Ok(())
    }
}

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
pub struct Deposit<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8 + 8,
        seeds = [b"user_balance", user.key().as_ref()],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"user_balance", user.key().as_ref()],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 8 + 1 + 32 + 8 + 8 + 8 + 4 + 32 + 32 + 1,
        seeds = [b"game_state", signer.key().as_ref()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(
        mut,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct PlaceBet<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 32 + 8 + 1 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"bet", user.as_ref(), game_state.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(
        mut,
        seeds = [b"user_balance", user.as_ref()],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(
        mut,
        seeds = [b"game_state", game_state.admin.as_ref()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(
        mut,
        seeds = [b"game_state", game_state.admin.as_ref()],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub user_balance: Account<'info, UserBalance>,
    #[account(
        mut,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        mut,
        seeds = [b"user_balance", user_balance.user.as_ref()],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

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
    #[msg("Unauthorized: Only admin can perform this action")]
    Unauthorized,
    #[msg("Insufficient balance for this operation")]
    InsufficientBalance,
    #[msg("Multiplier must be at least 1.0x (100)")]
    InvalidMultiplier,
    #[msg("Multiplier cannot exceed 100x (10000)")]
    MultiplierTooHigh,
    #[msg("No active game")]
    GameNotActive,
    #[msg("Bet amount must be greater than 0")]
    InvalidBetAmount,
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Minimum deposit is 0.000001 SOL")]
    MinimumDeposit,
    #[msg("Minimum bet is 0.000001 SOL")]
    MinimumBet,
    #[msg("User has an active bet")]
    ActiveBetExists,
    #[msg("Game name too long")]
    NameTooLong,
}
