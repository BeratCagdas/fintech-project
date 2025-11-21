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
        <div className="warning-header">
          <div className="warning-icon-circle">
            <span className="warning-icon">⚠️</span>
          </div>
          <h2>Bütçe Limiti Aşımı!</h2>
          <button className="close-warning-btn" onClick={onClose}>✕</button>
        </div>

        <div className="warning-body">
          <div className="category-info-warning">
            <span className="category-icon-large">{categoryIcon}</span>
            <span className="category-name-large">{categoryLabel}</span>
          </div>

          <div className="budget-stats-grid">
            <div className="budget-stat-item">
              <div className="stat-label">Mevcut Limit</div>
              <div className="stat-value limit">₺{limit.toLocaleString('tr-TR')}</div>
            </div>
            <div className="budget-stat-item">
              <div className="stat-label">Şu Anki Harcama</div>
              <div className="stat-value current">₺{currentSpent.toLocaleString('tr-TR')}</div>
            </div>
            <div className="budget-stat-item">
              <div className="stat-label">Eklenecek</div>
              <div className="stat-value adding">₺{newAmount.toLocaleString('tr-TR')}</div>
            </div>
            <div className="budget-stat-item highlight">
              <div className="stat-label">Yeni Toplam</div>
              <div className="stat-value total">₺{newTotal.toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill exceeded"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              >
                <span className="progress-percentage">{percentage}%</span>
              </div>
            </div>
            <div className="progress-labels">
              <span>0%</span>
              <span className="limit-marker">100%</span>
            </div>
          </div>

          <div className="warning-message">
            <div className="exceed-badge">
              <span className="exceed-icon">🔴</span>
              <span>Limiti ₺{exceedAmount.toLocaleString('tr-TR')} aşacaksınız!</span>
            </div>
            <p className="warning-text">
              Bu harcamayı eklemek istediğinize emin misiniz?
            </p>
          </div>
        </div>

        <div className="warning-footer">
          <button className="btn-cancel" onClick={onClose}>
            ❌ İptal Et
          </button>
          <button className="btn-confirm-warning" onClick={onConfirm}>
            ✅ Yine de Ekle
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetWarningModal;