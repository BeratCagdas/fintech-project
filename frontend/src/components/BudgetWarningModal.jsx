import React from 'react';
import './BudgetWarningModal.css';

const BudgetWarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  categoryLabel,
  categoryIcon,
  limit,
  currentSpent,
  newAmount,
  exceedAmount 
}) => {
  if (!isOpen) return null;

  const newTotal = currentSpent + newAmount;
  const percentage = ((newTotal / limit) * 100).toFixed(0);

  return (
    <div className="budget-warning-overlay" onClick={onClose}>
      <div className="budget-warning-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bw-header">
          <div className="bw-icon-circle">
            <span className="bw-icon">⚠️</span>
          </div>
          <h2>Bütçe Limiti Aşımı!</h2>
          <button className="bw-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="bw-body">
          <div className="bw-category-info">
            <span className="bw-category-icon-large">{categoryIcon}</span>
            <span className="bw-category-name-large">{categoryLabel}</span>
          </div>

          <div className="bw-stats-grid">
            <div className="bw-stat-item">
              <div className="bw-stat-label">Mevcut Limit</div>
              <div className="bw-stat-value limit">₺{limit.toLocaleString('tr-TR')}</div>
            </div>
            <div className="bw-stat-item">
              <div className="bw-stat-label">Şu Anki Harcama</div>
              <div className="bw-stat-value current">₺{currentSpent.toLocaleString('tr-TR')}</div>
            </div>
            <div className="bw-stat-item">
              <div className="bw-stat-label">Eklenecek</div>
              <div className="bw-stat-value adding">₺{newAmount.toLocaleString('tr-TR')}</div>
            </div>
            <div className="bw-stat-item highlight">
              <div className="bw-stat-label">Yeni Toplam</div>
              <div className="bw-stat-value total">₺{newTotal.toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div className="bw-progress-section">
            <div className="bw-progress-bar-container">
              <div 
                className="bw-progress-bar-fill exceeded"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              >
                <span className="bw-progress-percentage">{percentage}%</span>
              </div>
            </div>
            <div className="bw-progress-labels">
              <span>0%</span>
              <span className="bw-limit-marker">100%</span>
            </div>
          </div>

          <div className="bw-message">
            <div className="bw-exceed-badge">
              <span className="bw-exceed-icon">🔴</span>
              <span>Limiti ₺{exceedAmount.toLocaleString('tr-TR')} aşacaksınız!</span>
            </div>
            <p className="bw-warning-text">
              Bu harcamayı eklemek istediğinize emin misiniz?
            </p>
          </div>
        </div>

        <div className="bw-footer">
          <button className="bw-btn-cancel" onClick={onClose}>
            ❌ İptal Et
          </button>
          <button className="bw-btn-confirm" onClick={onConfirm}>
            ✅ Yine de Ekle
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetWarningModal;