import React, { useState, useEffect } from "react";
import api from "../api/axios"; // ✅ Global axios instance
import "./MarketData.css";

const MarketData = ({
  showCurrencies = true,
  showCrypto = true,
  showStocks = true,
  refreshInterval = 300000, // 5 dakika
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [cryptos, setCryptos] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 🪙 Döviz kurları
  const fetchCurrencies = async () => {
    try {
      const response = await api.get("https://api.exchangerate-api.com/v4/latest/TRY");
      const data = response.data;

      const currencyData = [
        {
          code: "USD",
          name: "Dolar",
          buy: (1 / data.rates.USD).toFixed(4),
          sell: ((1 / data.rates.USD) * 1.005).toFixed(4),
          change: Math.random() * 2 - 1, // Sahte değişim (mock)
        },
        {
          code: "EUR",
          name: "Euro",
          buy: (1 / data.rates.EUR).toFixed(4),
          sell: ((1 / data.rates.EUR) * 1.005).toFixed(4),
          change: Math.random() * 2 - 1,
        },
        {
          code: "GBP",
          name: "Sterlin",
          buy: (1 / data.rates.GBP).toFixed(4),
          sell: ((1 / data.rates.GBP) * 1.005).toFixed(4),
          change: Math.random() * 2 - 1,
        },
      ];

      setCurrencies(currencyData);
    } catch (err) {
      console.error("Döviz verileri alınamadı:", err.message);
      throw new Error("Döviz kurları alınamadı");
    }
  };

  // 💰 Kripto paralar
  const fetchCryptos = async () => {
    try {
      const response = await api.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids: "bitcoin,ethereum,binancecoin",
          vs_currencies: "try",
          include_24hr_change: true,
        },
      });

      const data = response.data;
      const cryptoData = [
        {
          code: "BTC",
          name: "Bitcoin",
          price: data.bitcoin.try.toLocaleString("tr-TR", { minimumFractionDigits: 0 }),
          change: data.bitcoin.try_24h_change.toFixed(2),
        },
        {
          code: "ETH",
          name: "Ethereum",
          price: data.ethereum.try.toLocaleString("tr-TR", { minimumFractionDigits: 0 }),
          change: data.ethereum.try_24h_change.toFixed(2),
        },
        {
          code: "BNB",
          name: "Binance Coin",
          price: data.binancecoin.try.toLocaleString("tr-TR", { minimumFractionDigits: 0 }),
          change: data.binancecoin.try_24h_change.toFixed(2),
        },
      ];

      setCryptos(cryptoData);
    } catch (err) {
      console.error("Kripto verileri alınamadı:", err.message);
      throw new Error("Kripto para verileri alınamadı");
    }
  };

  // 📈 Borsa endeksleri (şimdilik mock)
  const fetchStocks = async () => {
    try {
      const stockData = [
        { code: "XU100", name: "BIST 100", value: "9,847.25", change: "+1.24" },
        { code: "XU030", name: "BIST 30", value: "10,234.67", change: "+0.87" },
      ];
      setStocks(stockData);
    } catch (err) {
      console.error("Borsa verileri alınamadı:", err);
    }
  };

  // 🔁 Tüm verileri çek
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = [];
      if (showCurrencies) promises.push(fetchCurrencies());
      if (showCrypto) promises.push(fetchCryptos());
      if (showStocks) promises.push(fetchStocks());

      await Promise.allSettled(promises);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || "Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [showCurrencies, showCrypto, showStocks, refreshInterval]);

  // 🌀 Yüklenme
  if (loading && !lastUpdate) {
    return (
      <div className="market-data-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Piyasa verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ⚠️ Hata
  if (error) {
    return (
      <div className="market-data-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchAllData}>Tekrar Dene</button>
        </div>
      </div>
    );
  }

  // ✅ Normal görünüm
  return (
    <div className="market-data-container">
      <div className="market-data-header">
        <h3>📊 Piyasa Verileri</h3>
        <div className="header-actions">
          {lastUpdate && (
            <span className="last-update">
              {lastUpdate.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            className="refresh-btn"
            onClick={fetchAllData}
            disabled={loading}
            title="Verileri Yenile"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="market-cards-grid">
        {/* Dövizler */}
        {showCurrencies && currencies.length > 0 && (
          <div className="compact-card currency-card">
            <div className="card-header">
              <span className="card-icon">💱</span>
              <span className="card-title">Döviz</span>
            </div>
            <div className="card-body">
              {currencies.map((c) => (
                <div key={c.code} className="data-row">
                  <div className="data-left">
                    <span className="data-code">{c.code}</span>
                    <span className="data-name">{c.name}</span>
                  </div>
                  <div className="data-right">
                    <span className="data-price">₺{c.buy}</span>
                    <span className={`data-change ${c.change >= 0 ? "positive" : "negative"}`}>
                      {c.change >= 0 ? "↑" : "↓"} {Math.abs(c.change).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kriptolar */}
        {showCrypto && cryptos.length > 0 && (
          <div className="compact-card crypto-card">
            <div className="card-header">
              <span className="card-icon">₿</span>
              <span className="card-title">Kripto</span>
            </div>
            <div className="card-body">
              {cryptos.map((c) => (
                <div key={c.code} className="data-row">
                  <div className="data-left">
                    <span className="data-code">{c.code}</span>
                    <span className="data-name">{c.name}</span>
                  </div>
                  <div className="data-right">
                    <span className="data-price">₺{c.price}</span>
                    <span className={`data-change ${c.change >= 0 ? "positive" : "negative"}`}>
                      {c.change >= 0 ? "↑" : "↓"} {Math.abs(c.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Borsa */}
        {showStocks && stocks.length > 0 && (
          <div className="compact-card stock-card">
            <div className="card-header">
              <span className="card-icon">📈</span>
              <span className="card-title">Borsa</span>
            </div>
            <div className="card-body">
              {stocks.map((s) => (
                <div key={s.code} className="data-row">
                  <div className="data-left">
                    <span className="data-code">{s.code}</span>
                    <span className="data-name">{s.name}</span>
                  </div>
                  <div className="data-right">
                    <span className="data-price">{s.value}</span>
                    <span className={`data-change ${s.change.includes("+") ? "positive" : "negative"}`}>
                      {s.change.includes("+") ? "↑" : "↓"} {s.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketData;
