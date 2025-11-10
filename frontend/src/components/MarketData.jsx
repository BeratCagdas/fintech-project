//*import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MarketData.css';
import { useState, useEffect } from 'react';
// Axios instance oluştur
const api = axios.create({
  timeout: 10000, // 10 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - İstek öncesi
api.interceptors.request.use(
  (config) => {
    console.log(`API İsteği: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Cevap sonrası
api.interceptors.response.use(
  (response) => {
    console.log(`API Cevabı: ${response.config.url} - Başarılı`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Sunucu hata kodu döndü
      console.error(`API Hatası: ${error.config.url} - ${error.response.status}`);
    } else if (error.request) {
      // İstek gönderildi ama cevap alınamadı
      console.error('Ağ Hatası: Sunucuya ulaşılamıyor');
    } else {
      // İstek hazırlanırken hata oluştu
      console.error('İstek Hatası:', error.message);
    }
    return Promise.reject(error);
  }
);

const MarketData = ({ 
  showCurrencies = true, 
  showCrypto = true, 
  showStocks = true,
  refreshInterval = 300000 // 5 dakika
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [cryptos, setCryptos] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Döviz kurlarını çek (ExchangeRate-API)
  const fetchCurrencies = async () => {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/TRY');
      const data = response.data;
      
      const currencyData = [
        { 
          code: 'USD', 
          name: 'Dolar', 
          buy: (1 / data.rates.USD).toFixed(4),
          sell: ((1 / data.rates.USD) * 1.005).toFixed(4), // %0.5 spread
          change: Math.random() * 2 - 1 // Mock değişim
        },
        { 
          code: 'EUR', 
          name: 'Euro', 
          buy: (1 / data.rates.EUR).toFixed(4),
          sell: ((1 / data.rates.EUR) * 1.005).toFixed(4),
          change: Math.random() * 2 - 1
        },
        { 
          code: 'GBP', 
          name: 'Sterlin', 
          buy: (1 / data.rates.GBP).toFixed(4),
          sell: ((1 / data.rates.GBP) * 1.005).toFixed(4),
          change: Math.random() * 2 - 1
        }
      ];
      
      setCurrencies(currencyData);
    } catch (err) {
      console.error('Döviz verileri alınamadı:', err.response?.data || err.message);
      throw new Error('Döviz kurları alınamadı');
    }
  };

  // Kripto paralarını çek (CoinGecko API)
  const fetchCryptos = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'bitcoin,ethereum,binancecoin',
            vs_currencies: 'try',
            include_24hr_change: true
          }
        }
      );
      const data = response.data;
      
      const cryptoData = [
        { 
          code: 'BTC', 
          name: 'Bitcoin', 
          price: data.bitcoin.try.toLocaleString('tr-TR', { minimumFractionDigits: 0 }),
          change: data.bitcoin.try_24h_change.toFixed(2)
        },
        { 
          code: 'ETH', 
          name: 'Ethereum', 
          price: data.ethereum.try.toLocaleString('tr-TR', { minimumFractionDigits: 0 }),
          change: data.ethereum.try_24h_change.toFixed(2)
        },
        { 
          code: 'BNB', 
          name: 'Binance Coin', 
          price: data.binancecoin.try.toLocaleString('tr-TR', { minimumFractionDigits: 0 }),
          change: data.binancecoin.try_24h_change.toFixed(2)
        }
      ];
      
      setCryptos(cryptoData);
    } catch (err) {
      console.error('Kripto verileri alınamadı:', err.response?.data || err.message);
      throw new Error('Kripto para verileri alınamadı');
    }
  };

  // Borsa endekslerini çek (Mock data - gerçek API entegrasyonu sonra)
  const fetchStocks = async () => {
    try {
      // TCMB veya başka bir kaynak entegre edilebilir
      const stockData = [
        { 
          code: 'XU100', 
          name: 'BIST 100', 
          value: '9,847.25',
          change: '+1.24'
        },
        { 
          code: 'XU030', 
          name: 'BIST 30', 
          value: '10,234.67',
          change: '+0.87'
        }
      ];
      
      setStocks(stockData);
    } catch (err) {
      console.error('Borsa verileri alınamadı:', err);
    }
  };

  // Tüm verileri çek
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = [];
      if (showCurrencies) promises.push(fetchCurrencies());
      if (showCrypto) promises.push(fetchCryptos());
      if (showStocks) promises.push(fetchStocks());
      
      await Promise.allSettled(promises); // Hataları toplu ele al
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Veriler yüklenirken bir hata oluştu.';
      setError(errorMessage);
      console.error('API Hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Otomatik yenileme
    const interval = setInterval(fetchAllData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [showCurrencies, showCrypto, showStocks, refreshInterval]);

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

  return (
    <div className="market-data-container">
      <div className="market-data-header">
        <h3>📊 Piyasa Verileri</h3>
        <div className="header-actions">
          {lastUpdate && (
            <span className="last-update">
              {lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
        {/* Döviz Kurları Card */}
        {showCurrencies && currencies.length > 0 && (
          <div className="compact-card currency-card">
            <div className="card-header">
              <span className="card-icon">💱</span>
              <span className="card-title">Döviz</span>
            </div>
            <div className="card-body">
              {currencies.map((currency) => (
                <div key={currency.code} className="data-row">
                  <div className="data-left">
                    <span className="data-code">{currency.code}</span>
                    <span className="data-name">{currency.name}</span>
                  </div>
                  <div className="data-right">
                    <span className="data-price">₺{currency.buy}</span>
                    <span className={`data-change ${currency.change >= 0 ? 'positive' : 'negative'}`}>
                      {currency.change >= 0 ? '↑' : '↓'} {Math.abs(currency.change).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kripto Paralar Card */}
        {showCrypto && cryptos.length > 0 && (
          <div className="compact-card crypto-card">
            <div className="card-header">
              <span className="card-icon">₿</span>
              <span className="card-title">Kripto</span>
            </div>
            <div className="card-body">
              {cryptos.map((crypto) => (
                <div key={crypto.code} className="data-row">
                  <div className="data-left">
                    <span className="data-code">{crypto.code}</span>
                    <span className="data-name">{crypto.name}</span>
                  </div>
                  <div className="data-right">
                    <span className="data-price">₺{crypto.price}</span>
                    <span className={`data-change ${crypto.change >= 0 ? 'positive' : 'negative'}`}>
                      {crypto.change >= 0 ? '↑' : '↓'} {Math.abs(crypto.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Borsa Endeksleri Card */}
        {showStocks && stocks.length > 0 && (
          <div className="compact-card stock-card">
            <div className="card-header">
              <span className="card-icon">📈</span>
              <span className="card-title">Borsa</span>
            </div>
            <div className="card-body">
              {stocks.map((stock) => (
                <div key={stock.code} className="data-row">
                  <div className="data-left">
                    <span className="data-code">{stock.code}</span>
                    <span className="data-name">{stock.name}</span>
                  </div>
                  <div className="data-right">
                    <span className="data-price">{stock.value}</span>
                    <span className={`data-change ${stock.change.includes('+') ? 'positive' : 'negative'}`}>
                      {stock.change.includes('+') ? '↑' : '↓'} {stock.change}%
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

export default MarketData; //