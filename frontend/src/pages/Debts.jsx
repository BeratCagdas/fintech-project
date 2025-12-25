// frontend/src/pages/Debts.jsx (YENİ DOSYA)
import React, { useState, useEffect } from 'react';
import api from '../api';
import './Debts.css';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState({ amount: 0, debtName: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    type: 'ihtiyac_kredisi',
    name: '',
    bankName: '',
    totalAmount: '',
    remainingAmount: '',
    monthlyPayment: '',
    interestRate: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const res = await api.get('/api/debt');
      setDebts(res.data.debts);
      setSummary(res.data.summary);
      setLoading(false);
    } catch (err) {
      console.error('Borç verisi yüklenemedi:', err);
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

  const handleAddDebt = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/debt/add', {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        remainingAmount: parseFloat(formData.remainingAmount) || parseFloat(formData.totalAmount),
        monthlyPayment: parseFloat(formData.monthlyPayment),
        interestRate: parseFloat(formData.interestRate) || 0
      });
      
      setShowAddForm(false);
      setFormData({
        type: 'ihtiyac_kredisi',
        name: '',
        bankName: '',
        totalAmount: '',
        remainingAmount: '',
        monthlyPayment: '',
        interestRate: '',
        startDate: '',
        endDate: ''
      });
      fetchDebts();
    } catch (err) {
      console.error('Borç eklenemedi:', err);
    }
  };

  const openPaymentModal = (debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.monthlyPayment || '');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDebt) return;

    try {
      await api.post(`/api/debt/${selectedDebt._id}/payment`, {
        month: new Date().toISOString().slice(0, 7),
        amount: parseFloat(paymentAmount),
        dueDate: new Date()
      });
      
      setPendingExpense({
        amount: parseFloat(paymentAmount),
        debtName: selectedDebt.name
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedDebt(null);
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
        name: `${pendingExpense.debtName} Ödemesi`,
        amount: pendingExpense.amount,
        category: 'kredi'
      };

      await api.put("/api/user/finance", { 
        monthlyIncome: finance.monthlyIncome || 0, 
        fixedExpenses: [...(finance.fixedExpenses || []), newExpense], 
        variableExpenses: finance.variableExpenses || []
      });

      setShowExpenseModal(false);
      fetchDebts();
    } catch (err) {
      console.error('Gider eklenemedi:', err);
      alert('Gider eklenirken bir hata oluştu, ancak ödeme gerçekleşti.');
      setShowExpenseModal(false);
      fetchDebts();
    }
  };

  const handleSkipExpense = () => {
    setShowExpenseModal(false);
    fetchDebts();
  };

  const openDeleteModal = (debt) => {
    setDebtToDelete(debt);
    setShowDeleteModal(true);
  };

  const confirmDeleteDebt = async () => {
    if (!debtToDelete) return;
    try {
      await api.delete(`/api/debt/${debtToDelete._id}`);
      fetchDebts();
      setShowDeleteModal(false);
      setDebtToDelete(null);
    } catch (err) {
      console.error('Borç silinemedi:', err);
    }
  };

  const getDebtTypeLabel = (type) => {
    const types = {
      'kredi_karti': 'Kredi Kartı',
      'ihtiyac_kredisi': 'İhtiyaç Kredisi',
      'konut_kredisi': 'Konut Kredisi',
      'arac_kredisi': 'Araç Kredisi',
      'egitim_kredisi': 'Eğitim Kredisi',
      'diger': 'Diğer'
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'aktif': return '#3498db';
      case 'kapandi': return '#27ae60';
      case 'gecikme': return '#e74c3c';
      case 'yapilandirma': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'aktif': 'Aktif',
      'kapandi': 'Kapatıldı',
      'gecikme': 'Gecikme',
      'yapilandirma': 'Yapılandırma'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="debts-container">
      {/* Header */}
      <header className="debts-header">
        <div className="header-content">
          <div className="header-left">
            <h1>💳 Borç & Kredi Yönetimi</h1>
            <p>Borçlarınızı takip edin ve yönetin</p>
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
        <div className="summary-card total">
          
          <div className="summary-content">
            <div className="summary-label">Toplam Borç</div>
            <div className="summary-value">₺{summary.totalDebt?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card monthly">
          
          <div className="summary-content">
            <div className="summary-label">Aylık Ödeme</div>
            <div className="summary-value">₺{summary.monthlyPayment?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card count">
         
          <div className="summary-content">
            <div className="summary-label">Aktif Borç</div>
            <div className="summary-value">{summary.activeCount || 0}</div>
          </div>
        </div>

        <div className="debts-summary-card-action">
          <button 
            className="add-debt-btn"
            onClick={() => setShowAddForm(true)}
          >
            <span></span> Yeni Borç Ekle
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yeni Borç Ekle</h2>
              <button className="debts-modal-close-btn" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddDebt} className="debt-form">
              <div className="debts-form-row">
                <div className="debts-form-group">
                  <label>Borç Türü *</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ihtiyac_kredisi">İhtiyaç Kredisi</option>
                    <option value="konut_kredisi">Konut Kredisi</option>
                    <option value="arac_kredisi">Araç Kredisi</option>
                    <option value="egitim_kredisi">Eğitim Kredisi</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div className="debts-form-group">
                  <label>Borç Adı *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Örn: Araba Kredisi"
                    required
                  />
                </div>
              </div>

              <div className="debts-form-row">
                <div className="debts-form-group">
                  <label>Banka/Kurum</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Örn: Akbank"
                  />
                </div>

                <div className="debts-form-group">
                  <label>Faiz Oranı (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    placeholder="Örn: 2.5"
                  />
                </div>
              </div>

              <div className="debts-form-row">
                <div className="debts-form-group">
                  <label>Toplam Borç Tutarı *</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    placeholder="Örn: 500000"
                    required
                  />
                </div>

                <div className="debts-form-group">
                  <label>Kalan Borç</label>
                  <input
                    type="number"
                    name="remainingAmount"
                    value={formData.remainingAmount}
                    onChange={handleInputChange}
                    placeholder="Boş bırakılırsa toplam tutar alınır"
                  />
                </div>
              </div>

              <div className="debts-form-row">
                <div className="debts-form-group">
                  <label>Aylık Ödeme *</label>
                  <input
                    type="number"
                    name="monthlyPayment"
                    value={formData.monthlyPayment}
                    onChange={handleInputChange}
                    placeholder="Örn: 15000"
                    required
                  />
                </div>

                <div className="debts-form-group">
                  <label>Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="debts-form-group">
                <label>Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ödeme Yap - {selectedDebt.name}</h2>
              <button className="debts-modal-close-btn" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="debt-payment-form">
              <div className="debts-form-group">
                <label>Ödeme Tutarı *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Örn: 15000"
                  required
                  autoFocus
                />
              </div>

              <div className="info-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Kalan Borç:</span>
                  <span className="highlight" style={{ fontWeight: 'bold', color: '#ef4444' }}>
                    ₺{selectedDebt.remainingAmount.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Aylık Taksit:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    ₺{selectedDebt.monthlyPayment.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              <div className="quick-payment-buttons" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                  type="button" 
                  className="quick-btn"
                  style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                  onClick={() => setPaymentAmount(selectedDebt.monthlyPayment)}
                >
                  Taksit Tutarı
                </button>
                <button 
                  type="button" 
                  className="quick-btn"
                  style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                  onClick={() => setPaymentAmount(selectedDebt.remainingAmount)}
                >
                  Kalanın Tamamı
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

      {/* Debts List */}
      <div className="debts-list">
        <h2>Borç Listesi</h2>
        
        {debts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Henüz borç kaydı yok</h3>
            <p>Borçlarınızı takip etmek için yeni borç ekleyin</p>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ İlk Borcunuzu Ekleyin
            </button>
          </div>
        ) : (
          <div className="debts-grid">
            {debts.map(debt => (
              <div key={debt._id} className="debt-card">
                <div className="debt-header">
                  <div className="debt-title">
                    <h3>{debt.name}</h3>
                    <span className="debt-type">{getDebtTypeLabel(debt.type)}</span>
                  </div>
                  <span 
                    className="debt-status"
                    style={{ backgroundColor: getStatusColor(debt.status) }}
                  >
                    {getStatusLabel(debt.status)}
                  </span>
                </div>

                <div className="debt-info">
                  {debt.bankName && (
                    <div className="info-row">
                      <span className="info-label">🏦 Banka:</span>
                      <span className="info-value">{debt.bankName}</span>
                    </div>
                  )}
                  
                  <div className="info-row">
                    <span className="info-label">💰 Kalan Borç:</span>
                    <span className="info-value highlight">
                      ₺{debt.remainingAmount.toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">💵 Toplam Borç:</span>
                    <span className="info-value">
                      ₺{debt.totalAmount.toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">📅 Aylık Ödeme:</span>
                    <span className="info-value">
                      ₺{debt.monthlyPayment.toLocaleString('tr-TR')}
                    </span>
                  </div>

                  {debt.interestRate > 0 && (
                    <div className="info-row">
                      <span className="info-label">📊 Faiz Oranı:</span>
                      <span className="info-value">%{debt.interestRate}</span>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">📆 Başlangıç:</span>
                    <span className="info-value">
                      {new Date(debt.startDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-section">
                    <div className="progress-label">
                      <span>Ödenen</span>
                      <span>
                        %{(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100).toFixed(1)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment History */}
                  {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                    <div className="payment-history">
                      <h4>Son Ödemeler:</h4>
                      <div className="payment-list">
                        {debt.paymentHistory.slice(-3).reverse().map((payment, idx) => (
                          <div key={idx} className="payment-item">
                            <span className={`payment-status ${payment.onTime ? 'on-time' : 'late'}`}>
                              {payment.onTime ? '✅' : '⚠️'}
                            </span>
                            <span className="payment-month">{payment.month}</span>
                            <span className="payment-amount">
                              ₺{payment.amount?.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="debt-actions">
                  {debt.status === 'aktif' && (
                    <button 
                      className="btn-payment"
                      onClick={() => openPaymentModal(debt)}
                    >
                      💳 Ödeme Yap
                    </button>
                  )}
                  <button 
                    className="debt-btn-delete"
                    onClick={() => openDeleteModal(debt)}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expense Confirmation Modal */}
        {showExpenseModal && (
          <div className="debts-delete-modal-overlay" onClick={handleSkipExpense}>
            <div className="debts-delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="debts-delete-icon" style={{ fontSize: '48px' }}>🧾</div>
              <h3>Gider Olarak Ekle?</h3>
              <p>
                Ödeme işleminiz başarıyla alındı. <strong>{pendingExpense.debtName}</strong> için ödenen 
                <strong> ₺{pendingExpense.amount.toLocaleString('tr-TR')}</strong> tutarını 
                sabit giderlerinize "Kredi" kategorisinde eklemek ister misiniz?
              </p>
              
              <div className="debts-delete-actions">
                <button className="debts-btn-cancel-delete" onClick={handleSkipExpense}>
                  Hayır, Ekleme
                </button>
                <button className="debts-btn-confirm-add" onClick={handleAddExpense}>
                  Evet, Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && debtToDelete && (
          <div className="debts-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="debts-delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="debts-delete-icon">⚠️</div>
              <h3>Borcu Sil</h3>
              <p><strong>{debtToDelete.name}</strong> adlı borcu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
              
              <div className="debts-delete-actions">
                <button className="debts-btn-cancel-delete" onClick={() => setShowDeleteModal(false)}>
                  İptal
                </button>
                <button className="debts-btn-confirm-delete" onClick={confirmDeleteDebt}>
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

export default Debts;