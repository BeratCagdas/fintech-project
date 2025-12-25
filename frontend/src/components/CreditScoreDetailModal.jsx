// frontend/src/components/CreditScoreDetailModal.jsx

import React, { useState, useEffect } from 'react';
import api from '../api';
import './CreditScoreDetailModal.css';

const CreditScoreDetailModal = ({ isOpen, onClose}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, breakdown, recommendations

  useEffect(() => {
    if (isOpen) {
      fetchExplanation();
    }
  }, [isOpen]);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/analytics/credit-score/explain');
      
      if (response.data.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('❌ Açıklama yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="credit-modal-overlay" onClick={onClose}>
      <div className="credit-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="credit-modal-header">
          <h2>📊 Credit Score Detaylı Analiz</h2>
          <button className="credit-modal-close" onClick={onClose}>X</button>
        </div>

        {loading ? (
          <div className="credit-modal-loading">
            <div className="credit-loading-spinner">📊</div>
            <p>Analiz yapılıyor...</p>
          </div>
        ) : !data ? (
          <div className="credit-modal-error">
            <p>❌ Veri yüklenemedi</p>
            <button onClick={fetchExplanation} className="credit-retry-btn">
              🔄 Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="credit-modal-tabs">
              <button 
                className={`credit-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📈 Genel Bakış
              </button>
              <button 
                className={`credit-tab-button ${activeTab === 'breakdown' ? 'active' : ''}`}
                onClick={() => setActiveTab('breakdown')}
              >
                🔍 Detaylı Analiz
              </button>
              <button 
                className={`credit-tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                💡 Öneriler
              </button>
            </div>

            {/* Content */}
            <div className="credit-modal-body">
              {activeTab === 'overview' && (
                <OverviewTab data={data} />
              )}
              
              {activeTab === 'breakdown' && (
                <BreakdownTab data={data} />
              )}
              
              {activeTab === 'recommendations' && (
                <RecommendationsTab data={data} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ data }) => {
  const { current, score_change, card_impact, debt_impact } = data;

  return (
    <div className="credit-overview-tab">
      {/* Score Change Card */}
      <div className="credit-score-change-card">
        <div className="credit-score-comparison">
          <div className="credit-score-item previous">
            <span className="credit-score-label">Geçen Ay</span>
            <span className="credit-score-value">{score_change.previous_score}</span>
          </div>
          
          <div className="credit-score-arrow">
            <span className="credit-arrow-icon">{score_change.emoji}</span>
            <span className="credit-change-value" style={{ color: getChangeColor(score_change.direction) }}>
              {score_change.change > 0 ? '+' : ''}{score_change.change}
            </span>
          </div>
          
          <div className="credit-score-item current">
            <span className="credit-score-label">Bu Ay</span>
            <span className="credit-score-value">{score_change.current_score}</span>
          </div>
        </div>
        
        <p className="credit-score-message">{score_change.message}</p>
        
        {score_change.risk_change && (
          <div className="credit-risk-change">
            <span className="credit-risk-from">{score_change.risk_change.from}</span>
            <span className="credit-risk-arrow">→</span>
            <span className="credit-risk-to">{score_change.risk_change.to}</span>
            {score_change.risk_change.improved ? (
              <span className="credit-risk-status improved">✅ İyileşme</span>
            ) : (
              <span className="credit-risk-status worsened">⚠️ Kötüleşme</span>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="credit-quick-stats">
        <div className="credit-stat-card">
          <div className="credit-stat-icon">💳</div>
          <div className="credit-stat-content">
            <span className="credit-stat-label">Kredi Kartı Kullanımı</span>
            <span className="credit-stat-value">{current.metrics.credit_utilization.toFixed(0)}%</span>
            <span className="credit-stat-status" style={{ color: current.metrics.credit_utilization > 30 ? '#ef4444' : '#10b981' }}>
              {current.metrics.credit_utilization > 30 ? 'Yüksek ⚠️' : 'İdeal ✅'}
            </span>
          </div>
        </div>

        <div className="credit-stat-card">
          <div className="credit-stat-icon">📊</div>
          <div className="credit-stat-content">
            <span className="credit-stat-label">Borç/Gelir Oranı</span>
            <span className="credit-stat-value">{current.metrics.debt_to_income.toFixed(0)}%</span>
            <span className="credit-stat-status" style={{ color: current.metrics.debt_to_income > 35 ? '#ef4444' : '#10b981' }}>
              {current.metrics.debt_to_income > 35 ? 'Risk ⚠️' : 'Sağlıklı ✅'}
            </span>
          </div>
        </div>

        <div className="credit-stat-card">
          <div className="credit-stat-icon">✅</div>
          <div className="credit-stat-content">
            <span className="credit-stat-label">Zamanında Ödeme</span>
            <span className="credit-stat-value">{current.metrics.on_time_payment_rate.toFixed(0)}%</span>
            <span className="credit-stat-status" style={{ color: current.metrics.on_time_payment_rate < 100 ? '#f59e0b' : '#10b981' }}>
              {current.metrics.on_time_payment_rate < 100 ? 'Geliştir' : 'Mükemmel'}
            </span>
          </div>
        </div>
      </div>

      {/* Cards Impact */}
      {card_impact.length > 0 && (
        <div className="credit-impact-section">
          <h3>💳 Kredi Kartları Etkisi</h3>
          <div className="credit-impact-list">
            {card_impact.slice(0, 3).map((card, index) => (
              <div key={index} className="credit-impact-item" style={{ borderLeft: `4px solid ${getImpactColor(card.impact_score)}` }}>
                <div className="credit-impact-header">
                  <span className="credit-impact-name">{card.bank_name}</span>
                  <span className="credit-impact-score" style={{ color: getImpactColor(card.impact_score) }}>
                    {card.impact_score > 0 ? '+' : ''}{card.impact_score}
                  </span>
                </div>
                <div className="credit-impact-details">
                  <span>Kullanım: %{card.utilization.toFixed(0)}</span>
                  <span>Limit: ₺{card.limit.toLocaleString('tr-TR')}</span>
                </div>
                <p className="credit-impact-text">{card.impact_text}</p>
                <p className="credit-impact-recommendation">💡 {card.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debts Impact */}
      {debt_impact.length > 0 && (
        <div className="credit-impact-section">
          <h3>💰 Borçlar Etkisi</h3>
          <div className="credit-impact-list">
            {debt_impact.slice(0, 3).map((debt, index) => (
              <div key={index} className="credit-impact-item" style={{ borderLeft: `4px solid ${getImpactColor(debt.impact_score)}` }}>
                <div className="credit-impact-header">
                  <span className="credit-impact-name">{debt.name}</span>
                  <span className="credit-impact-score" style={{ color: getImpactColor(debt.impact_score) }}>
                    {debt.impact_score > 0 ? '+' : ''}{debt.impact_score}
                  </span>
                </div>
                <div className="credit-impact-details">
                  <span>Kalan: ₺{debt.remaining.toLocaleString('tr-TR')}</span>
                  <span>Aylık: ₺{debt.monthly_payment.toLocaleString('tr-TR')}</span>
                </div>
                <p className="credit-impact-text">{debt.impact_text}</p>
                <p className="credit-impact-recommendation">💡 {debt.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== BREAKDOWN TAB ====================
const BreakdownTab = ({ data }) => {
  const { breakdown_analysis } = data;

  return (
    <div className="credit-breakdown-tab">
      <div className="credit-breakdown-intro">
        <p>Credit score'unuz 5 ana faktörden oluşur. Her faktörün ağırlığı ve performansı:</p>
      </div>

      <div className="credit-breakdown-list">
        {breakdown_analysis.map((factor, index) => (
          <div key={index} className="credit-breakdown-card">
            <div className="credit-breakdown-header">
              <div className="credit-breakdown-title">
                <span className="credit-breakdown-icon">{factor.icon}</span>
                <div>
                  <h4>{factor.name}</h4>
                  <span className="credit-breakdown-weight">Ağırlık: {factor.weight}</span>
                </div>
              </div>
              <div className="credit-breakdown-score">
                <span className="credit-score-current">{factor.current_score.toFixed(0)}</span>
                <span className="credit-score-max">/{factor.max_score}</span>
                {factor.change !== 0 && (
                  <span className="credit-score-change" style={{ color: factor.change > 0 ? '#10b981' : '#ef4444' }}>
                    {factor.change > 0 ? '+' : ''}{factor.change.toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            <div className="credit-breakdown-progress">
              <div className="credit-progress-bar">
                <div 
                  className="credit-progress-fill" 
                  style={{ 
                    width: `${factor.percentage}%`,
                    background: factor.status_color
                  }}
                />
              </div>
              <div className="credit-progress-labels">
                <span>{factor.percentage.toFixed(0)}%</span>
                <span className="credit-progress-status" style={{ color: factor.status_color }}>
                  {factor.status_text}
                </span>
              </div>
            </div>

            <p className="credit-breakdown-explanation">{factor.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== RECOMMENDATIONS TAB ====================
const RecommendationsTab = ({ data }) => {
  const { recommendations } = data;

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Kolay': return '#10b981';
      case 'Orta': return '#f59e0b';
      case 'Zor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="credit-recommendations-tab">
      <div className="credit-recommendations-intro">
        <p>Skorunuzu artırmak için yapabileceğiniz adımlar (öncelik sırasına göre):</p>
      </div>

      <div className="credit-recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="credit-recommendation-card">
            <div className="credit-rec-priority">#{rec.priority}</div>
            
            <div className="credit-rec-content">
              <div className="credit-rec-header">
                <span className="credit-rec-icon">{rec.icon}</span>
                <h4>{rec.title}</h4>
              </div>

              <p className="credit-rec-description">{rec.description}</p>

              <div className="credit-rec-metrics">
                <div className="credit-rec-metric">
                  <span className="credit-metric-label">Etki</span>
                  <span className="credit-metric-value impact">{rec.impact}</span>
                </div>
                <div className="credit-rec-metric">
                  <span className="credit-metric-label">Zorluk</span>
                  <span 
                    className="credit-metric-value difficulty" 
                    style={{ color: getDifficultyColor(rec.difficulty) }}
                  >
                    {rec.difficulty}
                  </span>
                </div>
              </div>

              <div className="credit-rec-action">
                <span className="credit-action-label">Yapılacak:</span>
                <span className="credit-action-text">{rec.action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="credit-no-recommendations">
          <p className="credit-no-rec-icon">🎉</p>
          <p className="credit-no-rec-title">Harika!</p>
          <p className="credit-no-rec-text">Şu an için kritik öneri yok. Devam edin!</p>
        </div>
      )}
    </div>
  );
};

// Helper Functions
const getChangeColor = (direction) => {
  switch(direction) {
    case 'up': return '#10b981';
    case 'down': return '#ef4444';
    case 'neutral': return '#6b7280';
    default: return '#6b7280';
  }
};

const getImpactColor = (score) => {
  if (score > 0) return '#10b981';
  if (score < -20) return '#ef4444';
  if (score < 0) return '#f59e0b';
  return '#6b7280';
};

export default CreditScoreDetailModal;