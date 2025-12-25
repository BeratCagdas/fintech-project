import React, { useState, useEffect } from 'react';
import ForecastWarnings from './ForecastWarnings';
import axios from 'axios';

/**
 * KULLANIM ÖRNEĞİ
 *
 * Bu dosya ForecastWarnings komponentini nasıl kullanacağınızı gösterir.
 * CashFlowForecast veya benzeri bir sayfaya entegre edebilirsiniz.
 */

const ForecastWithWarnings = ({ userId }) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);

        // Analytics API'den forecast verisi çek
        const response = await axios.get(
          `http://localhost:8000/api/forecast/cash-flow/${userId}?months=12`
        );

        if (response.data.success) {
          setForecastData(response.data);
        }
      } catch (error) {
        console.error('Forecast yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchForecast();
    }
  }, [userId]);

  if (loading) {
    return <div>Tahminler yükleniyor...</div>;
  }

  if (!forecastData || !forecastData.warnings) {
    return <div>Tahmin verisi bulunamadı.</div>;
  }

  return (
    <div className="forecast-page">
      <h1>Nakit Akışı Tahmini</h1>

      {/* Diğer forecast grafikleri ve kartlar */}

      {/* Uyarılar Bölümü */}
      <ForecastWarnings warnings={forecastData.warnings} />

      {/* Özet İstatistikler */}
      <div className="forecast-summary">
        <h2>Özet</h2>
        <p>Toplam Gelir: ₺{forecastData.summary?.total_income?.toLocaleString()}</p>
        <p>Toplam Gider: ₺{forecastData.summary?.total_expense?.toLocaleString()}</p>
        <p>Tasarruf Oranı: %{forecastData.summary?.savings_rate}</p>
      </div>
    </div>
  );
};

export default ForecastWithWarnings;

/**
 * VEYA direkt olarak CashFlowForecast.jsx içinde:
 *
 * import ForecastWarnings from './ForecastWarnings';
 *
 * // Mevcut fetch fonksiyonunuzun içinde
 * const response = await fetch(...);
 * const data = await response.json();
 *
 * // Render içinde
 * return (
 *   <div>
 *     {data.warnings && <ForecastWarnings warnings={data.warnings} />}
 *   </div>
 * );
 */
