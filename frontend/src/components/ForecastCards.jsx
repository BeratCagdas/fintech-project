import React, { useState, useEffect } from 'react';
import api from '../api';
import './ForecastCards.css';

const ForecastCards = ({ onWarnings }) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics/cash-flow/forecast?months=6');

      if (response.data.success) {
        setForecastData(response.data);
        // Uyarıları parent'a gönder (Dashboard notification için)
        if (onWarnings && response.data.warnings) {
          onWarnings(response.data.warnings);
        }
      }
    } catch (error) {
      console.error('Forecast fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="forecast-loading">
        <div className="loading-spinner-small"></div>
      </div>
    );
  }

  if (!forecastData || !forecastData.success) {
    return null; // Sessizce başarısız ol, hata gösterme
  }

  const { summary } = forecastData;

  return (
    <div className="forecast-cards-grid">
      <div className="forecast-card forecast-income">
        <div className="forecast-card-icon">💰</div>
        <div className="forecast-card-label">Tahmini Toplam Gelir (6 Ay)</div>
        <div className="forecast-card-value">
          ₺{summary.total_income.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </div>
        <div className={`forecast-card-trend ${summary.income_trend === 'increasing' ? 'positive' : summary.income_trend === 'decreasing' ? 'negative' : 'neutral'}`}>
          {summary.income_trend === 'increasing' ? '↗ Artış Trendi' : summary.income_trend === 'decreasing' ? '↘ Azalış Trendi' : '→ Stabil'}
        </div>
      </div>

      <div className="forecast-card forecast-expense">
        <div className="forecast-card-icon">💸</div>
        <div className="forecast-card-label">Tahmini Toplam Gider (6 Ay)</div>
        <div className="forecast-card-value">
          ₺{summary.total_expense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </div>
        <div className={`forecast-card-trend ${summary.expense_trend === 'decreasing' ? 'positive' : summary.expense_trend === 'increasing' ? 'negative' : 'neutral'}`}>
          {summary.expense_trend === 'increasing' ? '↗ Artış Trendi' : summary.expense_trend === 'decreasing' ? '↘ Azalış Trendi' : '→ Stabil'}
        </div>
      </div>

      <div className="forecast-card forecast-savings">
        <div className="forecast-card-icon">🏦</div>
        <div className="forecast-card-label">Tahmini Toplam Tasarruf (6 Ay)</div>
        <div className="forecast-card-value" style={{ color: summary.total_savings >= 0 ? '#10b981' : '#ef4444' }}>
          ₺{summary.total_savings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </div>
        <div className={`forecast-card-trend ${summary.total_savings >= 0 ? 'positive' : 'negative'}`}>
          %{summary.savings_rate.toFixed(1)} Tasarruf Oranı
        </div>
      </div>
    </div>
  );
};

export default ForecastCards;
