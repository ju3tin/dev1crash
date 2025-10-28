import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <h1 className="text-6xl font-bold mb-6">CRASH GAME</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Deposit SOL, place a bet, and cash out before the crash!
      </p>
      <Link href="/game" className="px-8 py-4 bg-purple-600 rounded-lg text-xl font-bold hover:bg-purple-700">
        Play Now
      </Link>
    </div>
  );
}