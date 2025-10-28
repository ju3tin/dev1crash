export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">FAQ</h1>
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">How does Crash work?</h3>
          <p className="text-gray-300">Place a bet with a target multiplier. If the crash point is higher, you win!</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Is it fair?</h3>
          <p className="text-gray-300">Yes! Uses on-chain PRNG. Upgrade to Chainlink VRF for true randomness.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">How to withdraw?</h3>
          <p className="text-gray-300">Use the withdraw button after winning.</p>
        </div>
      </div>
    </div>
  );
}
