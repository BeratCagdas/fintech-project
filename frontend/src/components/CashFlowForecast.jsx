import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import './CashFlowForecast.css';
import ForecastWarnings from './ForecastWarnings';

const CashFlowForecast = ({onDataFetched}) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(6);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [scenarioData, setScenarioData] = useState(null);
  const [whatIfForm, setWhatIfForm] = useState({
    description: '',
    amount: '',
    type: 'expense',
    frequency: 'monthly'
  });

  useEffect(() => {
    fetchForecast();
  }, [selectedPeriod]);

const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/analytics/cash-flow/forecast?months=${selectedPeriod}`);
      
      const data = response.data; // Veriyi bir kere değişkene al

      // 1. Önce veriyi parent'a gönder (Varsa)
      // data.warnings boş bir array olsa bile 'true' dönebilir, uzunluğuna bakmak daha garantidir.
      if (onDataFetched && data.warnings && data.warnings.length >= 0) {
           onDataFetched(data.warnings);
      }
      
      // 2. Sonra kendi state'ini güncelle
      if (data.success) {
        setForecastData(data); // response.data yerine direkt data
      }

    } catch (error) {
      console.error('Forecast fetch error:', error);
    } finally {
      setLoading(false);
    }
};

  const handleWhatIf = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/analytics/cash-flow/what-if', {
        scenario: {
          description: whatIfForm.description,
          amount: parseFloat(whatIfForm.amount),
          type: whatIfForm.type,
          frequency: whatIfForm.frequency
        },
        months: selectedPeriod
      });

      if (response.data.success) {
        setScenarioData(response.data);
      }
    } catch (error) {
      console.error('What-if error:', error);
      alert('What-if analizi başarısız oldu');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(value);
  };

  const closeWhatIf = () => {
    setShowWhatIf(false);
    setScenarioData(null);
    setWhatIfForm({
      description: '',
      amount: '',
      type: 'expense',
      frequency: 'monthly'
    });
  };

  if (loading) {
    return (
      <div className="cash-flow-forecast">
        <div className="loading-spinner">
          <div>Nakit akışı tahmini yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!forecastData || !forecastData.success) {
    return (
      <div className="cash-flow-forecast">
        <div className="error-message">
          <p>⚠️ {forecastData?.message || 'Nakit akışı tahmini yüklenemedi'}</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>
            Tahmin yapabilmek için en az 1 aylık finansal veriye ihtiyaç var.
          </p>
        </div>
      </div>
    );
  }

  const { forecasts, warnings, summary, current_balance, historical_data } = forecastData;

  // Chart data hazırlığı
  const chartData = forecasts.map(f => ({
    month: f.month_name.substring(0, 3),
    income: f.predicted_income,
    expense: f.predicted_expense,
    balance: f.cumulative_balance,
    netFlow: f.net_cash_flow
  }));

  return (
    <div className="cash-flow-forecast">
      {/* Header */}
      <div className="forecast-header">
        <h2 className="forecast-title">💰 Nakit Akışı Tahmini</h2>
        <div className="forecast-controls">
          <div className="period-selector">
            {[3, 6, 12].map(months => (
              <button
                key={months}
                className={`period-btn ${selectedPeriod === months ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(months)}
              >
                {months} Ay
              </button>
            ))}
          </div>
          <button className="what-if-btn" onClick={() => setShowWhatIf(true)}>
            🔮 What-If Analizi
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="forecast-summary">
        <div className="summary-card">
          <div className="summary-label">Mevcut Bakiye</div>
          <div className="summary-value">{formatCurrency(current_balance)}</div>
          <div className="summary-trend">
            {current_balance > 0 ? '✓ Pozitif' : '⚠ Negatif'}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Tahmini Toplam Gelir</div>
          <div className="summary-value">{formatCurrency(summary.total_income)}</div>
          <div className={`summary-trend ${summary.income_trend === 'increasing' ? 'positive' : 'negative'}`}>
            {summary.income_trend === 'increasing' ? '↗ Artış' : summary.income_trend === 'decreasing' ? '↘ Azalış' : '→ Stabil'}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Tahmini Toplam Gider</div>
          <div className="summary-value">{formatCurrency(summary.total_expense)}</div>
          <div className={`summary-trend ${summary.expense_trend === 'decreasing' ? 'positive' : 'negative'}`}>
            {summary.expense_trend === 'increasing' ? '↗ Artış' : summary.expense_trend === 'decreasing' ? '↘ Azalış' : '→ Stabil'}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Tahmini Toplam Tasarruf</div>
          <div className="summary-value">{formatCurrency(summary.total_savings)}</div>
          <div className={`summary-trend ${summary.total_savings > 0 ? 'positive' : 'negative'}`}>
            %{summary.savings_rate.toFixed(1)} Tasarruf Oranı
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="forecast-warnings">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>⚠️ Uyarılar</h3>
          {warnings.map((warning, index) => (
            <div key={index} className={`warning-item ${warning.severity}`}>
              <div className="warning-message">{warning.message}</div>
              <div className="warning-month">
                {warning.month} - {formatCurrency(Math.abs(warning.amount))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance Trend Chart */}
      <div className="forecast-chart">
        <h3 className="chart-title">Kümülatif Bakiye Trendi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e0e0e0' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#667eea"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expense Chart */}
      <div className="forecast-chart">
        <h3 className="chart-title">Gelir vs Gider Karşılaştırması</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e0e0e0' }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Gelir" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Gider" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net Cash Flow Chart */}
      <div className="forecast-chart">
        <h3 className="chart-title">Net Nakit Akışı</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '10px', border: '1px solid #e0e0e0' }}
            />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Bar
              dataKey="netFlow"
              fill="#667eea"
              name="Net Akış"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Warnings */}
      {forecastData && forecastData.warnings && (
        <ForecastWarnings warnings={forecastData.warnings} />
      )}

      {/* What-If Modal */}
      {showWhatIf && (
        <div className="what-if-modal" onClick={closeWhatIf}>
          <div className="what-if-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔮 What-If Scenario Analizi</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Farklı senaryoların nakit akışınıza etkisini görün
            </p>

            <form onSubmit={handleWhatIf}>
              <div className="form-group">
                <label>Açıklama</label>
                <input
                  type="text"
                  placeholder="Örn: Yeni freelance projesi"
                  value={whatIfForm.description}
                  onChange={(e) => setWhatIfForm({ ...whatIfForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tutar (₺)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={whatIfForm.amount}
                  onChange={(e) => setWhatIfForm({ ...whatIfForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tür</label>
                <select
                  value={whatIfForm.type}
                  onChange={(e) => setWhatIfForm({ ...whatIfForm, type: e.target.value })}
                >
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sıklık</label>
                <select
                  value={whatIfForm.frequency}
                  onChange={(e) => setWhatIfForm({ ...whatIfForm, frequency: e.target.value })}
                >
                  <option value="once">Tek Seferlik</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>

              {scenarioData && (
                <div className="scenario-comparison">
                  <h3 className="comparison-title">📊 Karşılaştırma</h3>
                  <div className="comparison-row">
                    <span>Mevcut Senaryo:</span>
                    <strong>{formatCurrency(scenarioData.comparison.base_final_balance)}</strong>
                  </div>
                  <div className="comparison-row">
                    <span>Yeni Senaryo:</span>
                    <strong>{formatCurrency(scenarioData.comparison.scenario_final_balance)}</strong>
                  </div>
                  <div className="comparison-row" style={{
                    borderTop: '2px solid #667eea',
                    paddingTop: '1rem',
                    marginTop: '0.5rem',
                    color: scenarioData.comparison.impact === 'positive' ? '#10b981' : '#ef4444'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Fark:</span>
                    <strong style={{ fontSize: '1.2rem' }}>
                      {scenarioData.comparison.impact === 'positive' ? '+' : ''}
                      {formatCurrency(scenarioData.comparison.difference)}
                    </strong>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Hesapla
                </button>
                <button type="button" className="btn-secondary" onClick={closeWhatIf}>
                  Kapat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowForecast;
