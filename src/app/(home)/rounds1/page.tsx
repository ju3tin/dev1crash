'use client';
import React, { useEffect, useState } from 'react';

interface Round {
  _id: string;
  roundNumber: number;
  crashMultiplier: number;
  startTime: string;
}

export default function GameRounds() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRounds = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rounds?page=${page}&limit=10`);
      const data = await res.json();
      setRounds(data.rounds);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds(page);
  }, [page]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Game Rounds</h1>

      {loading ? (
        <p>Loading rounds...</p>
      ) : (
        <>
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2"  style={{color: "black"}}>ID</th>
                <th className="border px-4 py-2"  style={{color: "black"}}>Round</th>
                <th className="border px-4 py-2"  style={{color: "black"}}>Multiplier</th>
                <th className="border px-4 py-2"  style={{color: "black"}}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round._id}>
                  <td className="border px-4 py-2" style={{color: "white"}}>{round._id}</td>
                  <td className="border px-4 py-2" style={{color: "white"}}>{round.roundNumber}</td>
                  <td className="border px-4 py-2" style={{color: "white"}}>{round.crashMultiplier}</td>
                  <td className="border px-4 py-2" style={{color: "white"}}>{new Date(round.startTime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 border rounded"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="px-4 py-2 border rounded"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
