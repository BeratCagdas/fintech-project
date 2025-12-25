import React, { useState, useEffect } from 'react';
import { fetchDailyInsight } from '../services/insightService';
import './SmartInsights.css';

const SmartInsights = () => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    setLoading(true);
    const data = await fetchDailyInsight();
    if (data.success) {
      setInsight(data.insight);
    }
    setLoading(false);
  };

  const typeColors = {
    warning: '#f59e0b',
    alert: '#ef4444',
    success: '#10b981',
    opportunity: '#3b82f6',
    info: '#6366f1'
  };

  return (
    <div 
      className="smart-insights-widget"
      style={{ borderLeftColor: insight ? (typeColors[insight.type] || '#6366f1') : '#6366f1' }}
    >
      <div className="insight-header">
        <span className="insight-icon">{loading ? '💡' : insight?.icon || '💡'}</span>
        <h4>💡 Bugünün Önerisi</h4>
      </div>
      
      {loading ? (
        // 🆕 Gerçekçi Skeleton Loader
        <div className="insight-body">
          <div className="skeleton-title"></div>
          <div className="skeleton-text">
            <div className="skeleton-line long"></div>
            <div className="skeleton-line medium"></div>
            <div className="skeleton-line short"></div>
          </div>
        </div>
      ) : insight ? (
        // Gerçek İçerik
        <div className="insight-body">
          <h3 className="insight-title">{insight.title}</h3>
          <p className="insight-message">{insight.message}</p>
        </div>
      ) : (
        // Empty State
        <div className="insight-body">
          <p className="insight-empty">Bugün için öneri yok</p>
        </div>
      )}
      
      <div className="insight-footer">
        <button 
          className="insight-refresh-btn"
          onClick={loadInsight}
          disabled={loading}
        >
          {loading ? '⏳ Yükleniyor...' : '🔄 Yenile'}
        </button>
      </div>
    </div>
  );
};

export default SmartInsights;