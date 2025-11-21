// frontend/src/components/UpcomingPayments.jsx
import React, { useState, useEffect } from 'react';
import { fetchUpcomingPayments } from '../services/upcomingPaymentsService';
import './UpcomingPayments.css';

const UpcomingPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadPayments();
    
    // Her 1 saatte bir yenile
    const interval = setInterval(loadPayments, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    const data = await fetchUpcomingPayments();
    if (data.success) {
      setPayments(data.upcomingPayments);
    }
    setLoading(false);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      kira: '🏠',
      faturalar: '💡',
      abonelik: '📱',
      kredi: '💳',
      sigorta: '🛡️',
      egitim: '📚',
      diger: '📦'
    };
    return icons[category] || '📦';
  };

  const getUrgencyClass = (daysUntil) => {
    if (daysUntil === 0) return 'urgent-today';
    if (daysUntil <= 2) return 'urgent-soon';
    if (daysUntil <= 5) return 'urgent-warning';
    return 'urgent-normal';
  };

  const getUrgencyText = (daysUntil) => {
    if (daysUntil === 0) return 'Bugün';
    if (daysUntil === 1) return 'Yarın';
    return `${daysUntil} gün`;
  };

  const displayedPayments = showAll ? payments : payments.slice(0, 3);
  const nextPayment = payments[0];

  if (loading) {
    return (
      <div className="stat-card upcoming-payments-card">
        <div className="stat-header">
          <div className="stat-icon">⏰</div>
        </div>
        <div className="stat-label">Yaklaşan Ödemeler</div>
        <div className="stat-value">...</div>
        <div className="stat-change">Yükleniyor</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="stat-card upcoming-payments-card no-payments">
        <div className="stat-header">
          <div className="stat-icon">✅</div>
        </div>
        <div className="stat-label">Yaklaşan Ödemeler</div>
        <div className="stat-value">Yok</div>
        <div className="stat-change positive">7 gün temiz!</div>
      </div>
    );
  }

  return (
    <div className="stat-card upcoming-payments-card" onClick={() => setShowAll(!showAll)}>
      <div className="stat-header">
        <div className="stat-icon">⏰</div>
        <span className="payment-count-badge">{payments.length}</span>
      </div>
      <div className="stat-label">Yaklaşan Ödemeler</div>
      
      {!showAll ? (
        <>
          <div className="stat-value next-payment-name">{nextPayment.name}</div>
          <div className={`stat-change ${getUrgencyClass(nextPayment.daysUntil)}`}>
            {getUrgencyText(nextPayment.daysUntil)} • ₺{nextPayment.amount.toLocaleString('tr-TR')}
          </div>
        </>
      ) : (
        <div className="upcoming-payments-expanded">
          {displayedPayments.map((payment) => (
            <div 
              key={payment.id} 
              className={`upcoming-payment-row ${getUrgencyClass(payment.daysUntil)}`}
            >
              <span className="payment-icon-small">{getCategoryIcon(payment.category)}</span>
              <span className="payment-name-small">{payment.name}</span>
              <span className="payment-amount-small">₺{payment.amount.toLocaleString('tr-TR')}</span>
              <span className="payment-days-small">{getUrgencyText(payment.daysUntil)}</span>
            </div>
          ))}
          {payments.length > 3 && (
            <div className="show-more-hint">
              +{payments.length - 3} daha
            </div>
          )}
        </div>
      )}
      
      <div className="expand-hint">
        {showAll ? '▲ Küçült' : '▼ Tümünü Gör'}
      </div>
    </div>
  );
};

export default UpcomingPayments;