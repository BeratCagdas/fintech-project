import React from 'react';
import './AnomalyModal.css';

const AnomalyModal = ({ alert, onAcknowledge }) => {
  if (!alert) return null;

  // Kategoriye göre ikon seçimi
  const getIcon = (category) => {
    const icons = {
      eglence: '🎮',
      market: '🛒',
      ulasim: '🚗',
      kira: '🏠',
      faturalar: '💡',
      giyim: '👕',
      yemek: '🍔',
      saglik: '💊',
      egitim: '📚',
      default: '⚠️'
    };
    return icons[category?.toLowerCase()] || icons.default;
  };

  // Severity'ye göre badge rengi
  const getSeverityLabel = (severity) => {
    const labels = {
      critical: 'KRİTİK SEVİYE',
      high: 'YÜKSEK ÖNEM',
      medium: 'DİKKAT',
      low: 'BİLGİ'
    };
    return labels[severity] || 'ANOMALİ';
  };

  return (
    <div className="anomaly-overlay">
      <div className="anomaly-modal">
        <div className="anomaly-header">
          <div className="anomaly-icon-wrapper">
            {getIcon(alert.category)}
          </div>
          <h2>{alert.title}</h2>
          <span className={`anomaly-severity-badge severity-${alert.severity}`}>
            {getSeverityLabel(alert.severity)}
          </span>
        </div>

        <div className="anomaly-body">
          <p className="anomaly-description">
            {alert.description}
          </p>

          <div className="anomaly-stats">
            <div className="anomaly-stat-item">
              <div className="anomaly-stat-label">Normalde (Ort.)</div>
              <div className="anomaly-stat-value">
                ₺{alert.expected_value?.toLocaleString('tr-TR')}
              </div>
            </div>
            <div className="anomaly-stat-item">
              <div className="anomaly-stat-label">Bu Ay</div>
              <div className="anomaly-stat-value highlight">
                ₺{alert.current_value?.toLocaleString('tr-TR')}
              </div>
            </div>
            <div className="anomaly-stat-item">
              <div className="anomaly-stat-label">Değişim</div>
              <div className="anomaly-stat-value" style={{ color: alert.deviation_percentage > 0 ? '#ef4444' : '#10b981' }}>
                {alert.deviation_percentage > 0 ? '+' : ''}%{Math.abs(alert.deviation_percentage).toFixed(0)}
              </div>
            </div>
            <div className="anomaly-stat-item">
              <div className="anomaly-stat-label">Anomali Skoru</div>
              <div className="anomaly-stat-value">
                {alert.severity === 'critical' ? '🔥 Kritik' : '⚡ Yüksek'}
              </div>
            </div>
          </div>

          {alert.recommendation && (
            <div className="anomaly-recommendation">
              <div className="rec-icon">💡</div>
              <div className="rec-text">
                <h4>AI Önerisi:</h4>
                <p>{alert.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        <div className="anomaly-footer">
          <button className="anomaly-btn-ack" onClick={() => onAcknowledge(alert.id)}>
            Anladım, Teşekkürler 👍
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnomalyModal;
