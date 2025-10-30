import React from "react";
import Image from 'next/image'; // Import the Image component


export default function solana() {
  return (
    <main className="main-container">
      <h1 className="headline">Solana Blockchain Overview</h1>

      <section className="info-section">
        <h2>What is Solana?</h2>
        <Image
            width={100}
            height={100}
          src="/images/solanalogo.svg" 
          alt="Solana Logo" 
          className="section-image"
        />
        <p>
          Solana is a high-performance, decentralized blockchain platform designed for building decentralized applications (dApps) and cryptocurrencies.
          It is known for its scalability, speed, and low transaction costs, making it one of the top blockchain platforms in the world.
        </p>

        <h2>Core Features</h2>
        <ul>
          <li><strong>High Throughput:</strong> Solana can handle thousands of transactions per second (TPS), making it one of the fastest blockchains in the market.</li>
          <li><strong>Low Transaction Costs:</strong> Transaction fees on Solana are extremely low, often costing only a fraction of a cent.</li>
          <li><strong>Decentralized:</strong> Solana maintains a high degree of decentralization through its Proof of History (PoH) and Proof of Stake (PoS) consensus mechanisms.</li>
        </ul>

        <h2>Consensus Mechanism - Proof of History (PoH)</h2>
        <Image
            width={100}
            height={100}
          src="/images/proof.jpg"
          alt="Proof of History"
          className="section-image"
        />
        <p>
          Solana utilizes a unique consensus mechanism called Proof of History (PoH), which creates a historical record proving that an event has occurred at a specific time.
          This method helps optimize the blockchain&apos;s speed and scalability by reducing the time required for transaction validation.
        </p>

        <h2>Solana&apos;s Native Token - SOL</h2>
        <Image 
            width={100}
            height={100}
          src="/images/solanalogo.svg" 
          alt="Solana SOL Logo" 
          className="section-image"
        />
        <p>
          The native cryptocurrency of the Solana network is called <strong>SOL</strong>. It is used for:
          <ul>
            <li>Paying transaction fees.</li>
            <li>Staking to participate in network validation and earning rewards.</li>
            <li>Governance, allowing SOL token holders to participate in decision-making processes.</li>
          </ul>
        </p>

        <h2>Smart Contracts and dApps on Solana</h2>
        <p>
          Solana enables developers to create decentralized applications (dApps) using smart contracts built in languages like <strong>Rust</strong> and <strong>C</strong>.
          The blockchain&apos;s speed and low transaction costs make it an attractive platform for DeFi projects, NFTs, and various dApp ecosystems.
        </p>

        <h2>Solana Ecosystem</h2>
        <Image 
            width={100}
            height={100}
          src="/images/eco.jpg" 
          alt="Solana Ecosystem"
          className="section-image"
        />
        <p>
          The Solana ecosystem is growing rapidly, with many key components like:
          <ul>
            <li><strong>DeFi Platforms:</strong> Serum (DEX), Raydium (AMM), and Solend (lending protocol).</li>
            <li><strong>NFT Marketplaces:</strong> Magic Eden, Solanart, and Metaplex.</li>
            <li><strong>Stablecoins:</strong> USDC, USDT, and more.</li>
          </ul>
        </p>

        <h2>Security and Decentralization</h2>
        <p>
          Solana maintains security through a robust validator network and slashing conditions for malicious validators. The decentralized nature of the network ensures its trustworthiness.
        </p>

        <h2>Challenges of Solana</h2>
        <p>
          Despite its advantages, Solana faces some challenges:
          <ul>
            <li><strong>Network Outages:</strong> Solana has experienced occasional network disruptions due to high traffic or bugs.</li>
            <li><strong>Centralization Concerns:</strong> A smaller validator set can raise concerns about the level of decentralization compared to other blockchains.</li>
          </ul>
        </p>

        <h2>Comparison with Other Blockchains</h2>
        <p>
          Solana is often compared to other major blockchains like Ethereum, Binance Smart Chain, and Bitcoin. While Ethereum offers a rich ecosystem, Solana stands out due to its high throughput and lower fees.
        </p>

        <h2>Future of Solana</h2>
        <p>
          Solana is rapidly growing in the blockchain space. With improvements in scalability, ongoing development, and a thriving ecosystem, Solana aims to become a dominant platform for decentralized applications and services.
        </p>
      </section>
    </main>
)}