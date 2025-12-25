// frontend/src/pages/Assets.jsx (YENİ DOSYA)
import React, { useState, useEffect } from 'react';
import api from '../api';
import './Assets.css';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLoanPaymentModal, setShowLoanPaymentModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [pendingSavings, setPendingSavings] = useState({ amount: 0, assetName: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [assetToSell, setAssetToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'ev',
    name: '',
    description: '',
    purchaseValue: '',
    currentValue: '',
    purchaseDate: '',
    hasLoan: false,
    loanAmount: '',
    loanMonthlyPayment: '',
    appreciationRate: ''
  });

  const [updateData, setUpdateData] = useState({
    currentValue: ''
  });

  const [loanPaymentData, setLoanPaymentData] = useState({
    amount: ''
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/api/asset');
      setAssets(res.data.assets);
      setSummary(res.data.summary);
      setLoading(false);
    } catch (err) {
      console.error('Varlık verisi yüklenemedi:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/asset/add', {
        ...formData,
        purchaseValue: parseFloat(formData.purchaseValue) || 0,
        currentValue: parseFloat(formData.currentValue),
        loanAmount: parseFloat(formData.loanAmount) || 0,
        loanMonthlyPayment: parseFloat(formData.loanMonthlyPayment) || 0,
        appreciationRate: parseFloat(formData.appreciationRate) || 0
      });
      
      setShowAddForm(false);
      setFormData({
        type: 'ev',
        name: '',
        description: '',
        purchaseValue: '',
        currentValue: '',
        purchaseDate: '',
        hasLoan: false,
        loanAmount: '',
        loanMonthlyPayment: '',
        appreciationRate: ''
      });
      fetchAssets();
    } catch (err) {
      console.error('Varlık eklenemedi:', err);
      alert('Varlık eklenirken bir hata oluştu!');
    }
  };

  const handleUpdateValue = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/asset/${selectedAsset._id}/update-value`, {
        currentValue: parseFloat(updateData.currentValue)
      });
      
      setShowUpdateModal(false);
      setUpdateData({ currentValue: '' });
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      console.error('Değer güncellenemedi:', err);
      alert('Değer güncellenirken bir hata oluştu!');
    }
  };

  const handleLoanPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/asset/${selectedAsset._id}/loan-payment`, {
        amount: parseFloat(loanPaymentData.amount)
      });
      
      setShowLoanPaymentModal(false);
      setLoanPaymentData({ amount: '' });
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      console.error('Kredi ödemesi kaydedilemedi:', err);
      alert('Kredi ödemesi kaydedilirken bir hata oluştu!');
    }
  };

  const openSellModal = (asset) => {
    setAssetToSell(asset);
    setSellPrice(asset.currentValue || '');
    setShowSellModal(true);
  };

  const confirmSellAsset = async (e) => {
    e.preventDefault();
    if (!assetToSell || !sellPrice) return;

    try {
      await api.post(`/api/asset/${assetToSell._id}/sell`, {
        sellPrice: parseFloat(sellPrice)
      });
      
      setPendingSavings({
        amount: parseFloat(sellPrice),
        assetName: assetToSell.name
      });

      fetchAssets();
      setShowSellModal(false);
      setAssetToSell(null);
      setSellPrice('');
      setShowSavingsModal(true);
    } catch (err) {
      console.error('Varlık satılamadı:', err);
    }
  };

  const handleAddSavings = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api.post('/api/monthly/savings/add', {
        amount: pendingSavings.amount,
        description: `${pendingSavings.assetName} Satışı`
      }, { timeout: 20000 }); // Timeout süresini 20 saniyeye çıkarıyoruz
      setShowSavingsModal(false);
      alert("Tutar başarıyla birikime eklendi!");
    } catch (err) {
      console.error('Birikim eklenemedi:', err);
      
      // Eğer sunucu başarılı yanıt (2xx) döndüyse ama axios hata algıladıysa (örn: veri formatı)
      if (err.response && err.response.status >= 200 && err.response.status < 300) {
        setShowSavingsModal(false);
        alert("Tutar başarıyla birikime eklendi!");
        return;
      }

      // Timeout veya ağ hatası durumunda (yanıt yoksa) kullanıcıyı doğru bilgilendir
      const isTimeout = err.code === 'ECONNABORTED' || !err.response;
      const errorMessage = isTimeout 
        ? 'İşlem sunucuya iletildi ancak yanıt uzun sürdü. Tutar eklenmiş olabilir, lütfen Dashboard üzerinden bakiyenizi kontrol ediniz.'
        : (err.response?.data?.message || 'İşlem tamamlanmış olabilir. Lütfen Dashboard üzerinden bakiyenizi kontrol ediniz.');
        
      alert(errorMessage);
      setShowSavingsModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipSavings = () => {
    setShowSavingsModal(false);
  };

  const openDeleteModal = (asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      await api.delete(`/api/asset/${assetToDelete._id}`);
      fetchAssets();
      setShowDeleteModal(false);
      setAssetToDelete(null);
    } catch (err) {
      console.error('Varlık silinemedi:', err);
    }
  };

  const openUpdateModal = (asset) => {
    setSelectedAsset(asset);
    setUpdateData({ currentValue: asset.currentValue || '' });
    setShowUpdateModal(true);
  };

  const openLoanPaymentModal = (asset) => {
    setSelectedAsset(asset);
    setLoanPaymentData({ amount: '' });
    setShowLoanPaymentModal(true);
  };

  const getTypeLabel = (type) => {
    const types = {
      'ev': 'Ev/Daire',
      'arsa': 'Arsa/Arazi',
      'araba': 'Araç',
      'diger': 'Diğer'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'ev': '🏠',
      'arsa': '🌳',
      'araba': '🚗',
      'diger': '📦'
    };
    return icons[type] || '📦';
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="assets-container">
      {/* Header */}
      <header className="assets-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🏠 Varlık Yönetimi</h1>
            <p>Sahip olduğunuz varlıkları takip edin</p>
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
        <div className="summary-card total-value">
          
          <div className="summary-content">
            <div className="summary-label">Toplam Değer</div>
            <div className="summary-value">₺{summary.totalValue?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card total-loan">
          
          <div className="summary-content">
            <div className="summary-label">Toplam Kredi</div>
            <div className="summary-value">₺{summary.totalLoan?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card net-value">
          
          <div className="summary-content">
            <div className="summary-label">Net Değer</div>
            <div className="summary-value">₺{summary.netValue?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card count">
         
          <div className="summary-content">
            <div className="summary-label">Toplam Varlık</div>
            <div className="summary-value">{summary.count || 0}</div>
          </div>
        </div>

        <div className="btn-summary-card-action">
          <button 
            className="add-asset-btn"
            onClick={() => setShowAddForm(true)}
          >
            <span></span> Yeni Varlık Ekle
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="assets-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="assets-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="assets-modal-header">
              <h2>Yeni Varlık Ekle</h2>
              <button className="assets-close-btn" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddAsset} className="asset-form">
              <div className="assets-form-row">
                <div className="assets-form-group">
                  <label>Varlık Türü *</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ev">Ev/Daire</option>
                    <option value="arsa">Arsa/Arazi</option>
                    <option value="araba">Araç</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div className="assets-form-group">
                  <label>Varlık Adı *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Örn: İstanbul Dairesi"
                    required
                  />
                </div>
              </div>

              <div className="assets-form-group">
                <label>Açıklama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Örn: 3+1, 120m², Kadıköy"
                  rows="2"
                />
              </div>

              <div className="assets-form-row">
                <div className="assets-form-group">
                  <label>Alış Değeri</label>
                  <input
                    type="number"
                    name="purchaseValue"
                    value={formData.purchaseValue}
                    onChange={handleInputChange}
                    placeholder="Örn: 2000000"
                  />
                </div>

                <div className="assets-form-group">
                  <label>Güncel Değer *</label>
                  <input
                    type="number"
                    name="currentValue"
                    value={formData.currentValue}
                    onChange={handleInputChange}
                    placeholder="Örn: 2500000"
                    required
                  />
                </div>
              </div>

              <div className="assets-form-row">
                <div className="assets-form-group">
                  <label>Alış Tarihi</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="assets-form-group">
                  <label>Değer Artış Oranı (%/yıl)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="appreciationRate"
                    value={formData.appreciationRate}
                    onChange={handleInputChange}
                    placeholder="Örn: 15"
                  />
                </div>
              </div>

              <div className="assets-form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="hasLoan"
                    checked={formData.hasLoan}
                    onChange={handleInputChange}
                  />
                  <span>Bu varlık üzerinde kredi var</span>
                </label>
              </div>

              {formData.hasLoan && (
                <div className="loan-section">
                  <h3>Kredi Bilgileri</h3>
                  <div className="assets-form-row">
                    <div className="assets-form-group">
                      <label>Kalan Kredi Tutarı</label>
                      <input
                        type="number"
                        name="loanAmount"
                        value={formData.loanAmount}
                        onChange={handleInputChange}
                        placeholder="Örn: 1000000"
                      />
                    </div>

                    <div className="assets-form-group">
                      <label>Aylık Ödeme</label>
                      <input
                        type="number"
                        name="loanMonthlyPayment"
                        value={formData.loanMonthlyPayment}
                        onChange={handleInputChange}
                        placeholder="Örn: 25000"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="assets-form-actions">
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

      {/* Update Value Modal */}
      {showUpdateModal && selectedAsset && (
        <div className="assets-modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="assets-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="assets-modal-header">
              <h2>Değer Güncelle - {selectedAsset.name}</h2>
              <button className="assets-close-btn" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleUpdateValue} className="update-form">
              <div className="assets-form-group">
                <label>Güncel Değer *</label>
                <input
                  type="number"
                  value={updateData.currentValue}
                  onChange={(e) => setUpdateData({ currentValue: e.target.value })}
                  placeholder="Örn: 2750000"
                  required
                  autoFocus
                />
              </div>

              <div className="assets-info-box">
                {selectedAsset.purchaseValue > 0 && (
                  <div className="info-row">
                    <span>Alış Değeri:</span>
                    <span>₺{selectedAsset.purchaseValue.toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="info-row">
                  <span>Mevcut Değer:</span>
                  <span>₺{selectedAsset.currentValue.toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <div className="assets-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowUpdateModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-submit">
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Payment Modal */}
      {showLoanPaymentModal && selectedAsset && (
        <div className="assets-modal-overlay" onClick={() => setShowLoanPaymentModal(false)}>
          <div className="assets-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="assets-modal-header">
              <h2>Kredi Ödemesi - {selectedAsset.name}</h2>
              <button className="assets-close-btn" onClick={() => setShowLoanPaymentModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleLoanPayment} className="payment-form">
              <div className="assets-form-group">
                <label>Ödeme Tutarı *</label>
                <input
                  type="number"
                  value={loanPaymentData.amount}
                  onChange={(e) => setLoanPaymentData({ amount: e.target.value })}
                  placeholder="Örn: 25000"
                  required
                  autoFocus
                />
              </div>

              <div className="assets-info-box">
                <div className="info-row">
                  <span>Kalan Kredi:</span>
                  <span className="highlight">₺{selectedAsset.loanAmount.toLocaleString('tr-TR')}</span>
                </div>
                {selectedAsset.loanMonthlyPayment > 0 && (
                  <div className="info-row">
                    <span>Aylık Taksit:</span>
                    <span>₺{selectedAsset.loanMonthlyPayment.toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="assets-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowLoanPaymentModal(false)}>
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

      {/* Assets List */}
      <div className="assets-list">
        <h2>Varlık Listesi</h2>
        
        {assets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>Henüz varlık kaydı yok</h3>
            <p>Sahip olduğunuz varlıkları ekleyerek takip edin</p>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ İlk Varlığınızı Ekleyin
            </button>
          </div>
        ) : (
          <div className="assets-grid">
            {assets.map(asset => {
              const equity = asset.currentValue - (asset.loanAmount || 0);
              const ltv = asset.currentValue > 0 ? ((asset.loanAmount || 0) / asset.currentValue * 100) : 0;
              
              return (
                <div key={asset._id} className="asset-card">
                  <div className="asset-header">
                    <div className="asset-title">
                      <span className="asset-icon">{getTypeIcon(asset.type)}</span>
                      <div>
                        <h3>{asset.name}</h3>
                        {asset.description && (
                          <p className="asset-description">{asset.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="asset-type">{getTypeLabel(asset.type)}</span>
                  </div>

                  <div className="asset-info">
                    <div className="value-section">
                      <div className="main-value">
                        <span className="value-label">Güncel Değer</span>
                        <span className="value-amount">
                          ₺{asset.currentValue.toLocaleString('tr-TR')}
                        </span>
                      </div>

                      {asset.hasLoan && (
                        <>
                          <div className="equity-display">
                            <span>Öz Sermaye:</span>
                            <span className="equity-value">₺{equity.toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="ltv-bar">
                            <div className="ltv-label">
                              <span>Kredi/Değer Oranı</span>
                              <span>{ltv.toFixed(1)}%</span>
                            </div>
                            <div className="ltv-progress">
                              <div 
                                className="ltv-fill"
                                style={{ 
                                  width: `${Math.min(ltv, 100)}%`,
                                  background: ltv > 80 ? 'var(--accent-red)' : ltv > 50 ? 'var(--accent-orange)' : 'var(--accent-green)'
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="divider"></div>

                    <div className="detail-section">
                      {asset.purchaseValue > 0 && (
                        <div className="info-row">
                          <span className="info-label">💰 Alış Değeri:</span>
                          <span className="info-value">
                            ₺{asset.purchaseValue.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      )}

                      {asset.appreciationRate && (
                        <div className="info-row">
                          <span className="info-label">📈 Değer Artışı:</span>
                          <span className="info-value appreciation">
                            +%{asset.appreciationRate}/yıl
                          </span>
                        </div>
                      )}

                      {asset.purchaseDate && (
                        <div className="info-row">
                          <span className="info-label">📅 Alış Tarihi:</span>
                          <span className="info-value">
                            {new Date(asset.purchaseDate).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      )}

                      {asset.hasLoan && (
                        <>
                          <div className="loan-info-section">
                            <div className="loan-header">💳 Kredi Bilgileri</div>
                            <div className="info-row">
                              <span className="info-label">Kalan Kredi:</span>
                              <span className="info-value loan">
                                ₺{asset.loanAmount.toLocaleString('tr-TR')}
                              </span>
                            </div>
                            {asset.loanMonthlyPayment > 0 && (
                              <div className="info-row">
                                <span className="info-label">Aylık Taksit:</span>
                                <span className="info-value">
                                  ₺{asset.loanMonthlyPayment.toLocaleString('tr-TR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="asset-actions">
                    <button 
                      className="btn-update"
                      onClick={() => openUpdateModal(asset)}
                    >
                       Değer Güncelle
                    </button>
                    {asset.hasLoan && asset.loanAmount > 0 && (
                      <button 
                        className="btn-loan-payment"
                        onClick={() => openLoanPaymentModal(asset)}
                      >
                        💳 Kredi Öde
                      </button>
                    )}
                    <button 
                      className="btn-sell"
                      onClick={() => openSellModal(asset)}
                    >
                       Sat
                    </button>
                    <button 
                      className="assets-btn-delete"
                      onClick={() => openDeleteModal(asset)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Asset Type Breakdown */}
      {assets.length > 0 && summary.byType && (
        <div className="type-breakdown">
          <h2>Varlık Dağılımı</h2>
          <div className="breakdown-grid">
            {Object.entries(summary.byType).map(([type, data]) => (
              <div key={type} className="breakdown-card">
                <div className="breakdown-icon">{getTypeIcon(type)}</div>
                <div className="breakdown-content">
                  <div className="breakdown-title">{getTypeLabel(type)}</div>
                  <div className="breakdown-count">{data.count} Varlık</div>
                  <div className="breakdown-value">
                    ₺{data.totalValue.toLocaleString('tr-TR')}
                  </div>
                  {data.totalLoan > 0 && (
                    <div className="breakdown-loan">
                      Kredi: ₺{data.totalLoan.toLocaleString('tr-TR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && assetToSell && (
        <div className="asset-sell-modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="asset-sell-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="asset-sell-header">
              <h2>Varlığı Sat</h2>
              <button className="asset-close-btn" onClick={() => setShowSellModal(false)}>✕</button>
            </div>
            <p className="asset-sell-subtitle">{assetToSell.name} varlığını satıyorsunuz.</p>
            
            <form onSubmit={confirmSellAsset}>
              <div className="assets-form-group">
                <label>Satış Fiyatı</label>
                <input 
                  type="number" 
                  value={sellPrice} 
                  onChange={(e) => setSellPrice(e.target.value)} 
                  placeholder="Örn: 3000000"
                  required 
                  autoFocus
                />
              </div>
              <div className="asset-sell-actions">
                <button type="button" className="asset-btn-cancel" onClick={() => setShowSellModal(false)}>İptal</button>
                <button type="submit" className="asset-btn-confirm">Satışı Onayla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Savings Confirmation Modal */}
      {showSavingsModal && (
        <div className="asset-delete-modal-overlay" onClick={handleSkipSavings}>
          <div className="asset-delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="asset-delete-icon" style={{ fontSize: '48px' }}>💰</div>
            <h3>Birikime Ekle?</h3>
            <p>
              Varlık satışı başarıyla gerçekleşti. Elde edilen 
              <strong> ₺{pendingSavings.amount.toLocaleString('tr-TR')}</strong> tutarını 
              toplam birikiminize eklemek ister misiniz?
            </p>
            
            <div className="asset-delete-actions">
              <button className="asset-btn-cancel-delete" onClick={handleSkipSavings}>
                Hayır, Ekleme
              </button>
              <button 
                className="asset-btn-confirm-add" 
                onClick={handleAddSavings}
                disabled={isSaving}
                style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'wait' : 'pointer' }}
              >
                {isSaving ? 'Ekleniyor...' : 'Evet, Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assetToDelete && (
        <div className="asset-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="asset-delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="asset-delete-icon">🗑️</div>
            <h3>Varlığı Sil</h3>
            <p><strong>{assetToDelete.name}</strong> varlığını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="asset-delete-actions">
              <button className="asset-btn-cancel-delete" onClick={() => setShowDeleteModal(false)}>İptal</button>
              <button className="asset-btn-confirm-delete" onClick={confirmDeleteAsset}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Assets;