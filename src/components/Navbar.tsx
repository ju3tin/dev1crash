import { NavLink } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  return (
    <nav className="bg-black/50 backdrop-blur-md p-4 sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex gap-6">
          <NavLink to="/" className="text-xl font-bold text-white hover:text-purple-400">
            CRASH GAME
          </NavLink>
          <NavLink to="/game" className="text-white hover:text-purple-400">Game</NavLink>
          <NavLink to="/admin" className="text-white hover:text-purple-400">Admin</NavLink>
          <NavLink to="/history" className="text-white hover:text-purple-400">History</NavLink>
          <NavLink to="/faq" className="text-white hover:text-purple-400">FAQ</NavLink>
        </div>
        <WalletMultiButton />
      </div>
    </nav>
  );
}