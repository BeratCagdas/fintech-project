import React, { useState, useMemo } from 'react';
import './ForecastWarnings.css';

const ForecastWarnings = ({ warnings = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Renk kategorilerine göre uyarıları grupla
  const colorCategories = useMemo(() => {
    return {
      red: warnings.filter(w => w.color === 'red'),
      orange: warnings.filter(w => w.color === 'orange'),
      yellow: warnings.filter(w => w.color === 'yellow'),
      blue: warnings.filter(w => w.color === 'blue'),
      gray: warnings.filter(w => w.color === 'gray'),
    };
  }, [warnings]);

  // Filtrelenmiş uyarılar
  const filteredWarnings = useMemo(() => {
    if (selectedFilter === 'all') return warnings;
    return colorCategories[selectedFilter] || [];
  }, [selectedFilter, warnings, colorCategories]);

  // Emoji ikonları
  const getEmojiFromTitle = (title) => {
    const emojiMatch = title.match(/[\u{1F300}-\u{1F9FF}]/u);
    return emojiMatch ? emojiMatch[0] : '⚠️';
  };

  if (!warnings || warnings.length === 0) {
    return (
      <div className="forecast-warnings-container">
        <div className="warnings-empty">
          <div className="warnings-empty-icon">✅</div>
          <div className="warnings-empty-text">Tüm tahminler güvenli görünüyor!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-warnings-container">
      {/* Header */}
      <div className="warnings-header">
        <div className="warnings-title">
          <span>📊 Finansal Uyarılar</span>
          <span className="warnings-count">{filteredWarnings.length}</span>
        </div>

        {/* Filter Buttons */}
        <div className="warnings-filter">
          <button
            className={`filter-button all ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            Tümü ({warnings.length})
          </button>
          {colorCategories.red.length > 0 && (
            <button
              className={`filter-button red ${selectedFilter === 'red' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('red')}
            >
              Kritik ({colorCategories.red.length})
            </button>
          )}
          {colorCategories.orange.length > 0 && (
            <button
              className={`filter-button orange ${selectedFilter === 'orange' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('orange')}
            >
              Yüksek Risk ({colorCategories.orange.length})
            </button>
          )}
          {colorCategories.yellow.length > 0 && (
            <button
              className={`filter-button yellow ${selectedFilter === 'yellow' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('yellow')}
            >
              Orta ({colorCategories.yellow.length})
            </button>
          )}
          {colorCategories.blue.length > 0 && (
            <button
              className={`filter-button blue ${selectedFilter === 'blue' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('blue')}
            >
              Bilgi ({colorCategories.blue.length})
            </button>
          )}
          {colorCategories.gray.length > 0 && (
            <button
              className={`filter-button gray ${selectedFilter === 'gray' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('gray')}
            >
              Nötr ({colorCategories.gray.length})
            </button>
          )}
        </div>
      </div>

      {/* Warnings Grid */}
      <div className="warnings-grid">
        {filteredWarnings.map((warning, index) => (
          <div key={index} className={`warning-card ${warning.color}`}>
            {/* Header */}
            <div className="warning-header">
              <div className="warning-icon">
                {getEmojiFromTitle(warning.title)}
              </div>
              <div className="warning-header-text">
                <div className="warning-month">{warning.month}</div>
                <h3 className="warning-title">{warning.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}</h3>
                <span className={`warning-severity-badge ${warning.severity}`}>
                  {warning.severity === 'critical' ? 'KRİTİK' :
                   warning.severity === 'high' ? 'YÜKSEK' :
                   warning.severity === 'medium' ? 'ORTA' :
                   warning.severity === 'info' ? 'BİLGİ' : 'NÖTR'}
                </span>
              </div>
            </div>

            {/* Message */}
            <div className="warning-message">
              {warning.message}
            </div>

            {/* Recommendation */}
            {warning.recommendation && (
              <div className="warning-recommendation">
                <div className="recommendation-label">
                  <span>💡</span>
                  <span>Öneri</span>
                </div>
                <div className="recommendation-text">
                  {warning.recommendation}
                </div>
              </div>
            )}

            {/* Impact Score */}
            {warning.impact_score !== undefined && (
              <div className="warning-impact">
                <div className="impact-label">Etki:</div>
                <div className="impact-bar">
                  <div
                    className="impact-fill"
                    style={{ width: `${warning.impact_score}%` }}
                  />
                </div>
                <div className="impact-score">{warning.impact_score}/100</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastWarnings;
