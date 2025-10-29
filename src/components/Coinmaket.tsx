import { useEffect } from 'react';

const CoinMarketCapWidget = () => {
  // Dynamically load the CoinMarketCap script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://files.coinmarketcap.com/static/widget/currency.js';
    script.async = true;
    script.onload = () => {
      console.log('CoinMarketCap widget script loaded successfully!');
    };
    document.body.appendChild(script);

    // Clean up the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <div
        className="coinmarketcap-currency-widget"
        data-currencyid="31832" // Replace with your currency ID
        data-base="USD"
        data-secondary=""
        data-ticker="true"
        data-rank="true"
        data-marketcap="true"
        data-volume="true"
        data-statsticker="true"
        data-stats="USD"
      />
    </div>
  );
};

export default CoinMarketCapWidget;