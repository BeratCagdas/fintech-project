// frontend/src/pages/CreditCards.jsx (YENİ DOSYA)
import React, { useState, useEffect } from 'react';
import api from '../api';
import './CreditCards.css';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

const CreditCards = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState({ amount: 0, cardName: '' });
  
  const [formData, setFormData] = useState({
    bankName: '',
    cardName: '',
    limit: '',
    currentDebt: '',
    cutoffDay: '',
    dueDay: '',
    minimumPaymentRate: '20'
  });

  const [chargeData, setChargeData] = useState({
    amount: '',
    description: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    month: new Date().toISOString().slice(0, 7)
  });

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const fetchCreditCards = async () => {
    try {
      const res = await api.get('/api/credit-card');
      setCreditCards(res.data.creditCards);
      setSummary(res.data.summary);
      setLoading(false);
    } catch (err) {
      console.error('Kredi kartı verisi yüklenemedi:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/credit-card/add', {
        ...formData,
        limit: parseFloat(formData.limit),
        currentDebt: parseFloat(formData.currentDebt) || 0,
        cutoffDay: parseInt(formData.cutoffDay),
        dueDay: parseInt(formData.dueDay),
        minimumPaymentRate: parseFloat(formData.minimumPaymentRate) / 100
      });
      
      setShowAddForm(false);
      setFormData({
        bankName: '',
        cardName: '',
        limit: '',
        currentDebt: '',
        cutoffDay: '',
        dueDay: '',
        minimumPaymentRate: '20'
      });
      fetchCreditCards();
    } catch (err) {
      console.error('Kart eklenemedi:', err);
      alert('Kart eklenirken bir hata oluştu!');
    }
  };

  const handleCharge = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/credit-card/${selectedCard._id}/charge`, {
        amount: parseFloat(chargeData.amount)
      });
      
      setShowChargeModal(false);
      setChargeData({ amount: '', description: '' });
      setSelectedCard(null);
      fetchCreditCards();
    } catch (err) {
      console.error('Harcama eklenemedi:', err);
      alert('Harcama eklenirken bir hata oluştu!');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const card = selectedCard;
      const minimumPayment = card.currentDebt * card.minimumPaymentRate;
      
      await api.post(`/api/credit-card/${card._id}/payment`, {
        month: paymentData.month,
        statementAmount: card.currentDebt,
        minimumPayment: minimumPayment,
        paidAmount: parseFloat(paymentData.amount),
        dueDate: new Date()
      });
      
      setPendingExpense({
        amount: parseFloat(paymentData.amount),
        cardName: card.bankName
      });

      setShowPaymentModal(false);
      setPaymentData({ 
        amount: '', 
        month: new Date().toISOString().slice(0, 7) 
      });
      setSelectedCard(null);
      setShowExpenseModal(true);
    } catch (err) {
      console.error('Ödeme kaydedilemedi:', err);
      alert('Ödeme kaydedilirken bir hata oluştu!');
    }
  };

  const handleAddExpense = async () => {
    try {
      const res = await api.get("/api/user/profile");
      const finance = res.data.finance || {};
      
      const newExpense = {
        name: `${pendingExpense.cardName} Kredi Kartı Ödemesi`,
        amount: pendingExpense.amount,
        category: 'kredi'
      };

      await api.put("/api/user/finance", { 
        monthlyIncome: finance.monthlyIncome || 0, 
        fixedExpenses: [...(finance.fixedExpenses || []), newExpense], 
        variableExpenses: finance.variableExpenses || []
      });

      setShowExpenseModal(false);
      fetchCreditCards();
    } catch (err) {
      console.error('Gider eklenemedi:', err);
      alert('Gider eklenirken bir hata oluştu, ancak ödeme gerçekleşti.');
      setShowExpenseModal(false);
      fetchCreditCards();
    }
  };

  const handleSkipExpense = () => {
    setShowExpenseModal(false);
    fetchCreditCards();
  };

  const openDeleteModal = (card) => {
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      await api.delete(`/api/credit-card/${cardToDelete._id}`);
      fetchCreditCards();
      setShowDeleteModal(false);
      setCardToDelete(null);
    } catch (err) {
      console.error('Kart silinemedi:', err);
    }
  };

  const openChargeModal = (card) => {
    setSelectedCard(card);
    setShowChargeModal(true);
  };

  const openPaymentModal = (card) => {
    setSelectedCard(card);
    setPaymentData({
      amount: '',
      month: new Date().toISOString().slice(0, 7)
    });
    setShowPaymentModal(true);
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 80) return 'var(--accent-red)';
    if (rate >= 50) return 'var(--accent-orange)';
    if (rate >= 30) return 'var(--accent-blue)';
    return 'var(--accent-green)';
  };

  const getUtilizationLabel = (rate) => {
    if (rate >= 80) return 'Yüksek Risk';
    if (rate >= 50) return 'Orta Risk';
    if (rate >= 30) return 'İyi';
    return 'Mükemmel';
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="credit-cards-container">
      {/* Header */}
      <header className="cards-header">
        <div className="header-content">
          <div className="header-left">
            <h1>💳 Kredi Kartı Yönetimi</h1>
            <p>Kredi kartlarınızı takip edin ve limitinizi kontrol altında tutun</p>
          </div>
          <div className="header-right">
            <DarkModeToggle />
            <nav className="header-nav">
               <Link to="/" className="nav-link">Ana Sayfa</Link>
               <Link to="/dashboard" className="nav-link">Dashboard</Link>
               <Link to="/analytics" className="nav-link">Analiz</Link>
               <Link to="/debts" className="nav-link">Borçlar</Link>
               <Link to="/credit-cards" className="nav-link">Kredi Kartları</Link>
               <Link to="/investments" className="nav-link">Yatırımlar</Link>
               <Link to="/assets" className="nav-link">Varlıklar</Link>
               <Link to="/net-worth" className="nav-link">Net Değer</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="summary-card total-limit">
        
          <div className="summary-content">
            <div className="summary-label">Toplam Limit</div>
            <div className="summary-value">₺{summary.totalLimit?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card total-debt">
          
          <div className="summary-content">
            <div className="summary-label">Toplam Borç</div>
            <div className="summary-value">₺{summary.totalDebt?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card available">
          
          <div className="summary-content">
            <div className="summary-label">Kullanılabilir Limit</div>
            <div className="summary-value">₺{summary.availableCredit?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card utilization">
         
          <div className="summary-content">
            <div className="summary-label">Ortalama Kullanım</div>
            <div className="summary-value">%{summary.avgUtilization || 0}</div>
          </div>
        </div>

        <div className="summary-card-add">
          <button 
            className="add-card-btn"
            onClick={() => setShowAddForm(true)}
          >
            <span></span> Yeni Kart Ekle
          </button>
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddForm && (
        <div className="add-card-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-card-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-card-modal-header">
              <h2>Yeni Kredi Kartı Ekle</h2>
              <button className="add-card-close-btn" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddCard} className="card-form">
              <div className="add-card-form-row">
                <div className="add-card-form-group">
                  <label>Banka Adı *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Örn: Akbank"
                    required
                  />
                </div>

                <div className="add-card-form-group">
                  <label>Kart Adı</label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    placeholder="Örn: Bonus, Axess"
                  />
                </div>
              </div>

              <div className="add-card-form-row">
                <div className="add-card-form-group">
                  <label>Kart Limiti *</label>
                  <input
                    type="number"
                    name="limit"
                    value={formData.limit}
                    onChange={handleInputChange}
                    placeholder="Örn: 50000"
                    required
                  />
                </div>

                <div className="add-card-form-group">
                  <label>Mevcut Borç</label>
                  <input
                    type="number"
                    name="currentDebt"
                    value={formData.currentDebt}
                    onChange={handleInputChange}
                    placeholder="Örn: 5000"
                  />
                </div>
              </div>

              <div className="add-card-form-row">
                <div className="add-card-form-group">
                  <label>Hesap Kesim Günü</label>
                  <input
                    type="number"
                    name="cutoffDay"
                    min="1"
                    max="31"
                    value={formData.cutoffDay}
                    onChange={handleInputChange}
                    placeholder="Örn: 15"
                  />
                </div>

                <div className="add-card-form-group">
                  <label>Son Ödeme Günü</label>
                  <input
                    type="number"
                    name="dueDay"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={handleInputChange}
                    placeholder="Örn: 25"
                  />
                </div>
              </div>

              <div className="add-card-form-group">
                <label>Minimum Ödeme Oranı (%)</label>
                <input
                  type="number"
                  name="minimumPaymentRate"
                  min="0"
                  max="100"
                  value={formData.minimumPaymentRate}
                  onChange={handleInputChange}
                  placeholder="Örn: 20"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-submit">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charge Modal */}
      {showChargeModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowChargeModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Harcama Ekle - {selectedCard.bankName}</h2>
              <button className="close-btn" onClick={() => setShowChargeModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCharge} className="charge-form">
              <div className="add-card-form-group">
                <label>Harcama Tutarı *</label>
                <input
                  type="number"
                  value={chargeData.amount}
                  onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
                  placeholder="Örn: 500"
                  required
                  autoFocus
                />
              </div>

              <div className="info-box">
                <div className="info-row">
                  <span>Mevcut Borç:</span>
                  <span>₺{selectedCard.currentDebt.toLocaleString('tr-TR')}</span>
                </div>
                <div className="info-row">
                  <span>Kullanılabilir Limit:</span>
                  <span>₺{selectedCard.availableLimit?.toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowChargeModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-submit">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ödeme Yap - {selectedCard.bankName}</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handlePayment} className="payment-form">
              <div className="add-card-form-group">
                <label>Ödeme Tutarı *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder="Örn: 5000"
                  required
                  autoFocus
                />
              </div>

              <div className="info-box">
                <div className="info-row">
                  <span>Toplam Borç:</span>
                  <span className="highlight">₺{selectedCard.currentDebt.toLocaleString('tr-TR')}</span>
                </div>
                <div className="info-row">
                  <span>Minimum Ödeme:</span>
                  <span>₺{(selectedCard.currentDebt * selectedCard.minimumPaymentRate).toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <div className="quick-payment-buttons">
                <button 
                  type="button" 
                  className="quick-btn"
                  onClick={() => setPaymentData({ 
                    ...paymentData, 
                    amount: (selectedCard.currentDebt * selectedCard.minimumPaymentRate).toFixed(0) 
                  })}
                >
                  Minimum
                </button>
                <button 
                  type="button" 
                  className="quick-btn"
                  onClick={() => setPaymentData({ 
                    ...paymentData, 
                    amount: (selectedCard.currentDebt * 0.5).toFixed(0) 
                  })}
                >
                  Yarısı
                </button>
                <button 
                  type="button" 
                  className="quick-btn"
                  onClick={() => setPaymentData({ 
                    ...paymentData, 
                    amount: selectedCard.currentDebt.toFixed(0) 
                  })}
                >
                  Tümü
                </button>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-submit">
                  Öde
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="cards-list">
        <h2>Kredi Kartı Listesi</h2>
        
        {creditCards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>Henüz kredi kartı kaydı yok</h3>
            <p>Kredi kartlarınızı ekleyerek limitinizi takip edin</p>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ İlk Kartınızı Ekleyin
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {creditCards.map(card => (
              <div key={card._id} className="credit-card">
                <div className="card-visual">
                  <div className="card-chip">💳</div>
                  <div className="card-bank">{card.bankName}</div>
                  {card.cardName && <div className="card-name">{card.cardName}</div>}
                  <div className="card-limit">
                    Limit: ₺{card.limit.toLocaleString('tr-TR')}
                  </div>
                </div>

                <div className="card-info">
                  <div className="utilization-section">
                    <div className="utilization-header">
                      <span>Kullanım Oranı</span>
                      <span 
                        className="utilization-value"
                        style={{ color: getUtilizationColor(card.utilizationRate) }}
                      >
                        %{card.utilizationRate.toFixed(1)}
                      </span>
                    </div>
                    <div className="utilization-bar">
                      <div 
                        className="utilization-fill"
                        style={{ 
                          width: `${Math.min(card.utilizationRate, 100)}%`,
                          background: getUtilizationColor(card.utilizationRate)
                        }}
                      />
                    </div>
                    <div className="utilization-label" style={{ color: getUtilizationColor(card.utilizationRate) }}>
                      {getUtilizationLabel(card.utilizationRate)}
                    </div>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">💰 Mevcut Borç:</span>
                      <span className="detail-value highlight">
                        ₺{card.currentDebt.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">✅ Kullanılabilir:</span>
                      <span className="detail-value">
                        ₺{(card.availableLimit || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {card.cutoffDay && (
                      <div className="detail-row">
                        <span className="detail-label">📅 Hesap Kesim:</span>
                        <span className="detail-value">Her ayın {card.cutoffDay}. günü</span>
                      </div>
                    )}

                    {card.dueDay && (
                      <div className="detail-row">
                        <span className="detail-label">⏰ Son Ödeme:</span>
                        <span className="detail-value">Her ayın {card.dueDay}. günü</span>
                      </div>
                    )}
                  </div>

                  {/* Payment History */}
                  {card.paymentHistory && card.paymentHistory.length > 0 && (
                    <div className="payment-history-mini">
                      <h4>Son Ödemeler:</h4>
                      {card.paymentHistory.slice(-2).reverse().map((payment, idx) => (
                        <div key={idx} className="payment-mini-item">
                          <span className={payment.onTime ? 'status-good' : 'status-late'}>
                            {payment.onTime ? '✅' : '⚠️'}
                          </span>
                          <span>{payment.month}</span>
                          <span>₺{payment.paidAmount?.toLocaleString('tr-TR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-charge"
                    onClick={() => openChargeModal(card)}
                  >
                   Harcama
                  </button>
                  <button 
                    className="btn-payment"
                    onClick={() => openPaymentModal(card)}
                  >
                    Ödeme
                  </button>
                  <button 
                    className="credit-card-btn-delete"
                    onClick={() => openDeleteModal(card)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expense Confirmation Modal */}
        {showExpenseModal && (
          <div className="cc-delete-modal-overlay" onClick={handleSkipExpense}>
            <div className="cc-delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="cc-delete-icon" style={{ fontSize: '48px' }}>🧾</div>
              <h3>Gider Olarak Ekle?</h3>
              <p>
                Ödeme işleminiz başarıyla alındı. <strong>{pendingExpense.cardName}</strong> için ödenen 
                <strong> ₺{pendingExpense.amount.toLocaleString('tr-TR')}</strong> tutarını 
                sabit giderlerinize "Kredi" kategorisinde eklemek ister misiniz?
              </p>
              
              <div className="cc-delete-actions">
                <button className="cc-btn-cancel-delete" onClick={handleSkipExpense}>
                  Hayır, Ekleme
                </button>
                <button className="cc-btn-confirm-add" onClick={handleAddExpense}>
                  Evet, Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && cardToDelete && (
          <div className="cc-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="cc-delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="cc-delete-icon">💳</div>
              <h3>Kartı Sil</h3>
              <p><strong>{cardToDelete.bankName}</strong> kartını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
              
              <div className="cc-delete-actions">
                <button className="cc-btn-cancel-delete" onClick={() => setShowDeleteModal(false)}>
                  İptal
                </button>
                <button className="cc-btn-confirm-delete" onClick={confirmDeleteCard}>
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CreditCards;