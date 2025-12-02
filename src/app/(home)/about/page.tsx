"use client";
export default function Roadmap() {
    return (
        <>
<div className="video-wrapper">
  <video autoPlay muted loop playsInline className="bg-video">
    <source src="/images/container01.mp4" type="video/mp4" />
  </video>
<div id="container12" className="container default pt-4">
    <div className="wrapper1">
    <img src="/images/image03.png" alt="Untitled" />
        <div className="inner">
      <h1 className='text-3xl font-semibold capitalize'>About</h1>
      <h2 id="text09" className="dude" style={{opacity: 1, transform: "none"}}>CHIPPY ON SOLANA IS THE FRIENDLY FISH AND CHIPS YOU ALWAYS NEEDED. IT IS THE BEST COMBO IN ALL THE SOL SEA. JOIN OUR COMMUNITY TO FIND OTHER FISHY FRIENDS!</h2>
      <p>
      <ul className="socialList">
        <li>
          <a href="https://twitter.com/FishnChipsSOL" className="thumbnail n01">
            <span className="frame"><img src="/images/aa7bc757.png" alt="Untitled" /></span>
          </a>
        </li>
        <li>
          <a href="https://t.me/fishnchipssol" className="thumbnail n01">
            <span className="frame"><img src="/images/c7f40097.png" alt="Untitled" /></span>
          </a>
        </li>
        <li>
          <a href="https://solscan.io/token/Bz7Nx1F3Mti1BVS7ZAVDLSKGEaejufxvX2DPdjpf8PqT" className="thumbnail n01">
            <span className="frame"><img src="/images/43bb0dd1.png" alt="Untitled" /></span>
          </a>
        </li>
        <li>
          <a href="https://www.dextools.io/app/en/token/chippy?t=1764592782335" className="thumbnail n01">
            <span className="frame"><img src="/images/6cb17d91.png" alt="Untitled" /></span>
          </a>
        </li>
        <li>
          <a href="https://birdeye.so/solana/token/Bz7Nx1F3Mti1BVS7ZAVDLSKGEaejufxvX2DPdjpf8PqT" className="thumbnail n01">
            <span className="frame"><img src="/images/61a9adf4.png" alt="Untitled" /></span>
          </a>
        </li>
        <li>
          <a href="https://jup.ag/swap/SOL-Bz7Nx1F3Mti1BVS7ZAVDLSKGEaejufxvX2DPdjpf8PqT" className="thumbnail n01">
            <span className="frame"><img src="/images/af144825.png" alt="Untitled" /></span>
          </a>
        </li>
      </ul>
       </p>
        </div>
    </div>
</div>
</div>
<style jsx>{`
        .socialList {
          display: flex;
          gap: 12px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
          .video-wrapper {
  position: relative;
}

.bg-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

        .socialList li {
          display: flex;
        }
          .dude{     
    text-align: center;
    color: #FFFFFF;
    font-family: 'Bangers', cursive;
    letter-spacing: 0.15rem;
    width: calc(100% + 0.15rem);
    font-size: 2.375em;
    line-height: 0.875;
    font-weight: 400;
    text-shadow: 0.177rem 0.177rem 0.125rem #000000;
          }
      `}</style>
      </>
)}