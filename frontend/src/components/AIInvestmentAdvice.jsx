// components/AIInvestmentAdvice.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIInvestmentAdvice.css';

const AIInvestmentAdvice = () => {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAIAdvice = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get('http://localhost:5000/api/ai/investment-advice', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAdvice(res.data);
      setShowModal(true);
    } catch (err) {
      console.error('AI tavsiyesi alınamadı:', err);
      setError('AI tavsiyesi alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* AI Button */}
      <button 
        className="ai-advice-button"
        onClick={fetchAIAdvice}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="ai-spinner"></span>
            Size en iyi yatırım önerisini hazırlıyoruz... 
          </>
        ) : (
          <>
            <span className="ai-icon">🤖</span>
            AI Yatırım Önerisi Al
          </>
        )}
      </button>

      {/* AI Modal */}
      {showModal && advice && (
        <div className="ai-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2>AI Yatırım Danışmanı</h2>
              <button 
                className="ai-close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>


<div className="ai-user-profile">
  <div className="profile-item">
    <span className="profile-label">Gelir</span>
    <span className="profile-value">
      ₺{advice.userProfile.income.toLocaleString('tr-TR')}
    </span>
  </div>
  <div className="profile-item">
    <span className="profile-label">Gider</span>
    <span className="profile-value">
      ₺{advice.userProfile.totalExpenses.toLocaleString('tr-TR')}
    </span>
  </div>
  <div className="profile-item">
    <span className="profile-label">Tasarruf</span>
    <span className="profile-value">
      ₺{advice.userProfile.savings.toLocaleString('tr-TR')}
    </span>
  </div>
  <div className="profile-item">
    <span className="profile-label">Risk</span>
    <span className="profile-value">
      {advice.userProfile.riskProfile === 'low' ? 'Düşük' : 
       advice.userProfile.riskProfile === 'medium' ? 'Orta' : 'Yüksek'}
    </span>
  </div>
  <div className="profile-item">
    <span className="profile-label">Vade</span>
    <span className="profile-value">
      {advice.userProfile.investmentType}
    </span>
  </div>
</div>

            <div className="ai-advice-content">
              {advice.advice.split('\n').map((line, index) => {
                if (line.trim() === '') return null;
                
                if (line.includes('🎯')) {
                  return <h3 key={index} className="advice-title">{line}</h3>;
                }
                
                if (line.match(/^\d+\./)) {
                  return <h4 key={index} className="advice-subtitle">{line}</h4>;
                }
                
                if (line.includes('💡')) {
                  return <div key={index} className="advice-tip">{line}</div>;
                }
                
                return <p key={index} className="advice-text">{line}</p>;
              })}
            </div>

            <div className="ai-modal-footer">
              <button 
                className="ai-refresh-btn"
                onClick={fetchAIAdvice}
                disabled={loading}
              >
                🔄 Yeni Öneri Al
              </button>
              <button 
                className="ai-close-btn-footer"
                onClick={() => setShowModal(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="ai-error">
          <p>{error}</p>
        </div>
      )}
    </>
  );
};

export default AIInvestmentAdvice;