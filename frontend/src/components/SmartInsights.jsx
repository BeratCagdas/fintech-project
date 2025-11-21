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

  if (loading) {
    return (
      <div className="smart-insights-widget loading">
        <div className="insight-header">
          <span className="insight-icon">💡</span>
          <h4>Bugünün Önerisi</h4>
        </div>
        <div className="insight-body">
          <div className="insight-shimmer"></div>
        </div>
      </div>
    );
  }

  if (!insight) return null;

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
      style={{ borderLeftColor: typeColors[insight.type] || '#6366f1' }}
    >
      <div className="insight-header">
        <span className="insight-icon">{insight.icon}</span>
        <h4>💡 Bugünün Önerisi</h4>
      </div>
      
      <div className="insight-body">
        <h3 className="insight-title">{insight.title}</h3>
        <p className="insight-message">{insight.message}</p>
      </div>
      
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