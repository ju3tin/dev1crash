'use client';

interface Round {
  id: number;
  crashPoint: string;
  timestamp: string;
}

interface HistoryTableProps {
  rounds: Round[];
}

export default function HistoryTable({ rounds }: HistoryTableProps) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Round #</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Crash Point</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rounds.map((round) => {
              const crash = parseFloat(round.crashPoint);
              const isHigh = crash >= 2.0;
              const isBust = crash < 1.1;

              return (
                <tr key={round.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-mono">#{round.id}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        isBust
                          ? 'bg-red-900/50 text-red-300'
                          : isHigh
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-yellow-900/50 text-yellow-300'
                      }`}
                    >
                      {round.crashPoint}x
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{round.timestamp}</td>
                  <td className="px-6 py-4">
                    {isBust ? (
                      <span className="text-red-400">BUST</span>
                    ) : isHigh ? (
                      <span className="text-green-400">MOON</span>
                    ) : (
                      <span className="text-yellow-400">SAFE</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
