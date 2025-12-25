import React, { useState, useEffect } from 'react';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './WhatIfScenario.css';

const WhatIfScenario = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'results', 'saved'
  const [scenarioType, setScenarioType] = useState('job_change');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);

  // Scenario Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    income_change: 0,
    expense_change: 0,
    one_time_cost: 0,
    start_month: 1,
    duration_months: null,
    inflation_rate: 0,
    growth_rate: 0,
    debt_interest_rate: 0,
    investment_return_rate: 0
  });

  // Scenario Templates (Önceden tanımlanmış senaryolar)
  const scenarioTemplates = {
    job_change: {
      title: 'İş Değişikliği',
      icon: '💼',
      description: 'Maaş artışı, iş değişikliği veya terfi',
      defaultValues: {
        income_change: 5000,
        expense_change: 0,
        one_time_cost: 0,
        growth_rate: 5
      }
    },
    major_purchase: {
      title: 'Büyük Alım',
      icon: '🏠',
      description: 'Ev, araba veya büyük bir harcama',
      defaultValues: {
        income_change: 0,
        expense_change: 0,
        one_time_cost: 500000,
        debt_interest_rate: 1.5
      }
    },
    debt_payoff: {
      title: 'Borç Ödeme Planı',
      icon: '💳',
      description: 'Kredi kartı veya kredi borcunu kapatma',
      defaultValues: {
        income_change: 0,
        expense_change: 3000,
        one_time_cost: 0,
        duration_months: 12
      }
    },
    investment: {
      title: 'Yatırım Planı',
      icon: '📈',
      description: 'Aylık tasarruf ve yatırım',
      defaultValues: {
        income_change: -2000,
        expense_change: 0,
        one_time_cost: 0,
        investment_return_rate: 15
      }
    },
    lifestyle_change: {
      title: 'Yaşam Tarzı Değişikliği',
      icon: '✈️',
      description: 'Taşınma, evlilik, çocuk vb.',
      defaultValues: {
        income_change: 0,
        expense_change: 5000,
        one_time_cost: 50000,
        inflation_rate: 8
      }
    },
    custom: {
      title: 'Özel Senaryo',
      icon: '⚙️',
      description: 'Kendi senaryonuzu oluşturun',
      defaultValues: {}
    }
  };

  useEffect(() => {
    loadSavedScenarios();
  }, []);

  useEffect(() => {
    // Senaryo tipi değiştiğinde default değerleri yükle
    if (scenarioTemplates[scenarioType]) {
      setFormData({
        ...formData,
        ...scenarioTemplates[scenarioType].defaultValues
      });
    }
  }, [scenarioType]);

  const loadSavedScenarios = () => {
    const saved = localStorage.getItem('whatif_scenarios');
    if (saved) {
      setSavedScenarios(JSON.parse(saved));
    }
  };

  const saveScenario = (scenarioData) => {
    const newScenario = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...scenarioData
    };
    const updated = [...savedScenarios, newScenario];
    setSavedScenarios(updated);
    localStorage.setItem('whatif_scenarios', JSON.stringify(updated));
  };

  const deleteScenario = (id) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('whatif_scenarios', JSON.stringify(updated));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes('_rate') || name.includes('_change') || name.includes('cost') || name.includes('month')
        ? parseFloat(value) || 0
        : value
    });
  };

  const runScenario = async () => {
    if (!formData.title) {
      alert('Lütfen senaryo başlığı girin');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/api/analytics/cash-flow/what-if', {
        scenario: {
          scenario_type: scenarioType,
          title: formData.title,
          description: formData.description,
          income_change: formData.income_change,
          expense_change: formData.expense_change,
          one_time_cost: formData.one_time_cost,
          start_month: formData.start_month,
          duration_months: formData.duration_months || null,
          inflation_rate: formData.inflation_rate,
          growth_rate: formData.growth_rate,
          debt_interest_rate: formData.debt_interest_rate,
          investment_return_rate: formData.investment_return_rate
        },
        months: 12
      });

      if (response.data.success) {
        setResults(response.data);
        setActiveTab('results');
      } else {
        alert('Senaryo analizi başarısız: ' + response.data.message);
      }
    } catch (error) {
      console.error('What-if scenario error:', error);
      alert('Senaryo analizi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = () => {
    if (results) {
      saveScenario({
        ...formData,
        scenario_type: scenarioType,
        results: results
      });
      alert('Senaryo kaydedildi!');
      setActiveTab('saved');
    }
  };

  const loadSavedScenarioToForm = (scenario) => {
    setScenarioType(scenario.scenario_type);
    setFormData({
      title: scenario.title,
      description: scenario.description,
      income_change: scenario.income_change,
      expense_change: scenario.expense_change,
      one_time_cost: scenario.one_time_cost,
      start_month: scenario.start_month,
      duration_months: scenario.duration_months,
      inflation_rate: scenario.inflation_rate,
      growth_rate: scenario.growth_rate,
      debt_interest_rate: scenario.debt_interest_rate,
      investment_return_rate: scenario.investment_return_rate
    });
    if (scenario.results) {
      setResults(scenario.results);
    }
    setActiveTab('create');
  };

  const prepareChartData = () => {
    if (!results) return [];

    return results.base_forecast.map((base, idx) => ({
      month: base.month_name,
      'Mevcut Plan': base.cumulative_balance,
      'Senaryo Sonucu': results.scenario_forecast[idx].cumulative_balance
    }));
  };

  return (
    <div className="whatif-modal-overlay">
      <div className="whatif-modal-container">
        {/* Header */}
        <div className="whatif-modal-header">
          <h2>🔮 What-If Senaryo Analizi</h2>
          <button className="whatif-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="whatif-tabs">
          <button
            className={`whatif-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            📝 Senaryo Oluştur
          </button>
          <button
            className={`whatif-tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!results}
          >
            📊 Sonuçlar
          </button>
          <button
            className={`whatif-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            💾 Kayıtlı Senaryolar ({savedScenarios.length})
          </button>
        </div>

        {/* Content */}
        <div className="whatif-modal-body">
          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <div className="whatif-create-section">
              {/* Scenario Type Selection */}
              <div className="scenario-type-grid">
                {Object.entries(scenarioTemplates).map(([key, template]) => (
                  <div
                    key={key}
                    className={`scenario-type-card ${scenarioType === key ? 'active' : ''}`}
                    onClick={() => setScenarioType(key)}
                  >
                    <div className="scenario-type-icon">{template.icon}</div>
                    <div className="scenario-type-title">{template.title}</div>
                    <div className="scenario-type-desc">{template.description}</div>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="whatif-form">
                <div className="form-section">
                  <h3>Temel Bilgiler</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Senaryo Başlığı *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Örn: Yeni İşe Geçiş"
                      />
                    </div>
                    <div className="form-group">
                      <label>Açıklama</label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Kısa açıklama"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Finansal Değişiklikler</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Aylık Gelir Değişimi (₺)</label>
                      <input
                        type="number"
                        name="income_change"
                        value={formData.income_change}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                      <small>Pozitif: Gelir artışı, Negatif: Yatırım</small>
                    </div>
                    <div className="form-group">
                      <label>Aylık Gider Değişimi (₺)</label>
                      <input
                        type="number"
                        name="expense_change"
                        value={formData.expense_change}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                      <small>Pozitif: Gider artışı</small>
                    </div>
                    <div className="form-group">
                      <label>Tek Seferlik Maliyet (₺)</label>
                      <input
                        type="number"
                        name="one_time_cost"
                        value={formData.one_time_cost}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                      <small>İlk ayda yapılacak büyük harcama</small>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Zamanlama</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Başlangıç Ayı</label>
                      <select name="start_month" value={formData.start_month} onChange={handleInputChange}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                          <option key={m} value={m}>{m}. Ay</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Süre (Ay)</label>
                      <input
                        type="number"
                        name="duration_months"
                        value={formData.duration_months || ''}
                        onChange={handleInputChange}
                        placeholder="Sürekli"
                      />
                      <small>Boş bırakırsanız sürekli olur</small>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Gelişmiş Seçenekler</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Yıllık Enflasyon Oranı (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="inflation_rate"
                        value={formData.inflation_rate}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Yıllık Gelir Artış Oranı (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="growth_rate"
                        value={formData.growth_rate}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Borç Faiz Oranı (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="debt_interest_rate"
                        value={formData.debt_interest_rate}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Yatırım Getiri Oranı (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="investment_return_rate"
                        value={formData.investment_return_rate}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-run-scenario" onClick={runScenario} disabled={loading}>
                    {loading ? '⏳ Analiz Ediliyor...' : '▶️ Senaryoyu Çalıştır'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && results && (
            <div className="whatif-results-section">
              {/* Summary Cards */}
              <div className="results-summary-cards">
                <div className="summary-card positive">
                  <div className="summary-icon">💰</div>
                  <div className="summary-content">
                    <div className="summary-label">Son Bakiye Değişimi</div>
                    <div className="summary-value">
                      ₺{results.comparison.difference.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="summary-badge">{results.comparison.difference_percentage}%</div>
                  </div>
                </div>

                <div className="summary-card info">
                  <div className="summary-icon">📅</div>
                  <div className="summary-content">
                    <div className="summary-label">Risk Ayları</div>
                    <div className="summary-value">{results.comparison.risk_months} ay</div>
                    <div className="summary-desc">Negatif bakiye riski</div>
                  </div>
                </div>

                {results.comparison.payback_months && (
                  <div className="summary-card success">
                    <div className="summary-icon">⏱️</div>
                    <div className="summary-content">
                      <div className="summary-label">Geri Dönüş Süresi</div>
                      <div className="summary-value">{results.comparison.payback_months} ay</div>
                      <div className="summary-desc">Maliyet amorti süresi</div>
                    </div>
                  </div>
                )}

                {results.comparison.roi_percentage !== null && (
                  <div className="summary-card warning">
                    <div className="summary-icon">📈</div>
                    <div className="summary-content">
                      <div className="summary-label">Yatırım Getirisi (ROI)</div>
                      <div className="summary-value">{results.comparison.roi_percentage}%</div>
                      <div className="summary-desc">Toplam getiri</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="results-chart-container">
                <h3>Bakiye Karşılaştırması (12 Ay)</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Mevcut Plan" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Senaryo Sonucu" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Insights */}
              <div className="results-insights">
                <h3>💡 İçgörüler</h3>
                <div className="insights-list">
                  {results.insights.map((insight, idx) => (
                    <div key={idx} className={`insight-item ${insight.type}`}>
                      <div className="insight-icon">
                        {insight.type === 'positive' && '✅'}
                        {insight.type === 'negative' && '❌'}
                        {insight.type === 'warning' && '⚠️'}
                        {insight.type === 'info' && 'ℹ️'}
                      </div>
                      <div className="insight-message">{insight.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Comparison */}
              <div className="results-detailed-comparison">
                <h3>Detaylı Karşılaştırma</h3>
                <div className="comparison-table">
                  <div className="comparison-row">
                    <div className="comparison-label">Toplam Gelir Değişimi</div>
                    <div className="comparison-value positive">
                      ₺{results.comparison.total_income_change.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="comparison-row">
                    <div className="comparison-label">Toplam Gider Değişimi</div>
                    <div className="comparison-value negative">
                      ₺{results.comparison.total_expense_change.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="comparison-row">
                    <div className="comparison-label">Toplam Tasarruf Değişimi</div>
                    <div className={`comparison-value ${results.comparison.total_savings_change >= 0 ? 'positive' : 'negative'}`}>
                      ₺{results.comparison.total_savings_change.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="comparison-row">
                    <div className="comparison-label">En Düşük Bakiye</div>
                    <div className="comparison-value">
                      ₺{results.comparison.lowest_balance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="comparison-row">
                    <div className="comparison-label">En Yüksek Bakiye</div>
                    <div className="comparison-value positive">
                      ₺{results.comparison.highest_balance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="results-actions">
                <button className="btn-save-scenario" onClick={handleSaveResults}>
                  💾 Senaryoyu Kaydet
                </button>
                <button className="btn-new-scenario" onClick={() => setActiveTab('create')}>
                  ➕ Yeni Senaryo
                </button>
              </div>
            </div>
          )}

          {/* SAVED SCENARIOS TAB */}
          {activeTab === 'saved' && (
            <div className="whatif-saved-section">
              {savedScenarios.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📂</div>
                  <h3>Henüz kayıtlı senaryo yok</h3>
                  <p>Oluşturduğunuz senaryoları kaydedin ve daha sonra tekrar kullanın</p>
                  <button className="btn-create-first" onClick={() => setActiveTab('create')}>
                    İlk Senaryonuzu Oluşturun
                  </button>
                </div>
              ) : (
                <div className="saved-scenarios-grid">
                  {savedScenarios.map(scenario => (
                    <div key={scenario.id} className="saved-scenario-card">
                      <div className="saved-scenario-header">
                        <div className="saved-scenario-icon">
                          {scenarioTemplates[scenario.scenario_type]?.icon || '⚙️'}
                        </div>
                        <div className="saved-scenario-info">
                          <h4>{scenario.title}</h4>
                          <p>{scenario.description}</p>
                          <small>{new Date(scenario.created_at).toLocaleDateString('tr-TR')}</small>
                        </div>
                      </div>
                      <div className="saved-scenario-stats">
                        <div className="stat-item">
                          <span>Gelir:</span>
                          <strong>₺{scenario.income_change?.toLocaleString('tr-TR')}</strong>
                        </div>
                        <div className="stat-item">
                          <span>Gider:</span>
                          <strong>₺{scenario.expense_change?.toLocaleString('tr-TR')}</strong>
                        </div>
                      </div>
                      <div className="saved-scenario-actions">
                        <button
                          className="btn-load-scenario"
                          onClick={() => loadSavedScenarioToForm(scenario)}
                        >
                          📂 Yükle
                        </button>
                        <button
                          className="btn-delete-scenario"
                          onClick={() => deleteScenario(scenario.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfScenario;
