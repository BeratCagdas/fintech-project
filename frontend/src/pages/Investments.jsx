// frontend/src/pages/Investments.jsx (YENİ DOSYA)
import React, { useState, useEffect } from 'react';
import api from '../api';
import './Investments.css';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [investmentToSell, setInvestmentToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'hisse',
    name: '',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    totalInvested: '',
    currentValue: '',
    purchaseDate: '',
    platform: '',
    notes: ''
  });

  const [updateData, setUpdateData] = useState({
    currentPrice: '',
    currentValue: ''
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const res = await api.get('/api/investment');
      setInvestments(res.data.investments);
      setSummary(res.data.summary);
      setLoading(false);
    } catch (err) {
      console.error('Yatırım verisi yüklenemedi:', err);
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

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/investment/add', {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        purchasePrice: parseFloat(formData.purchasePrice),
        currentPrice: parseFloat(formData.currentPrice) || parseFloat(formData.purchasePrice),
        totalInvested: parseFloat(formData.totalInvested),
        currentValue: parseFloat(formData.currentValue) || parseFloat(formData.totalInvested)
      });
      
      setShowAddForm(false);
      setFormData({
        type: 'hisse',
        name: '',
        symbol: '',
        quantity: '',
        purchasePrice: '',
        currentPrice: '',
        totalInvested: '',
        currentValue: '',
        purchaseDate: '',
        platform: '',
        notes: ''
      });
      fetchInvestments();
    } catch (err) {
      console.error('Yatırım eklenemedi:', err);
      alert('Yatırım eklenirken bir hata oluştu!');
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/investment/${selectedInvestment._id}/update-price`, {
        currentPrice: parseFloat(updateData.currentPrice),
        currentValue: parseFloat(updateData.currentValue)
      });
      
      setShowUpdateModal(false);
      setUpdateData({ currentPrice: '', currentValue: '' });
      setSelectedInvestment(null);
      fetchInvestments();
    } catch (err) {
      console.error('Fiyat güncellenemedi:', err);
      alert('Fiyat güncellenirken bir hata oluştu!');
    }
  };

  const openSellModal = (investment) => {
    setInvestmentToSell(investment);
    setSellPrice(investment.currentPrice || '');
    setShowSellModal(true);
  };

  const confirmSellInvestment = async (e) => {
    e.preventDefault();
    if (!investmentToSell || !sellPrice) return;

    try {
      await api.post(`/api/investment/${investmentToSell._id}/sell`, {
        sellPrice: parseFloat(sellPrice)
      });
      fetchInvestments();
      setShowSellModal(false);
      setInvestmentToSell(null);
      setSellPrice('');
    } catch (err) {
      console.error('Yatırım satılamadı:', err);
    }
  };

  const openDeleteModal = (investment) => {
    setInvestmentToDelete(investment);
    setShowDeleteModal(true);
  };

  const confirmDeleteInvestment = async () => {
    if (!investmentToDelete) return;
    try {
      await api.delete(`/api/investment/${investmentToDelete._id}`);
      fetchInvestments();
      setShowDeleteModal(false);
      setInvestmentToDelete(null);
    } catch (err) {
      console.error('Yatırım silinemedi:', err);
    }
  };

  const openUpdateModal = (investment) => {
    setSelectedInvestment(investment);
    setUpdateData({
      currentPrice: investment.currentPrice || '',
      currentValue: investment.currentValue || ''
    });
    setShowUpdateModal(true);
  };

  const getTypeLabel = (type) => {
    const types = {
      'hisse': 'Hisse Senedi',
      'fon': 'Yatırım Fonu',
      'tahvil': 'Tahvil',
      'doviz': 'Döviz',
      'altin': 'Altın',
      'kripto': 'Kripto Para',
      'bist': 'BIST',
      'diger': 'Diğer'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'hisse': '📈',
      'fon': '📊',
      'tahvil': '📜',
      'doviz': '💵',
      'altin': '🪙',
      'kripto': '₿',
      'bist': '🏦',
      'diger': '💼'
    };
    return icons[type] || '💼';
  };

  const getProfitColor = (profitLoss) => {
    return profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="investments-container">
      {/* Header */}
      <header className="investments-header">
        <div className="header-content">
          <div className="header-left">
            <h1>📈 Yatırım Portföyü</h1>
            <p>Yatırımlarınızı takip edin ve performansınızı izleyin</p>
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
        <div className="summary-card invested">
         
          <div className="summary-content">
            <div className="summary-label">Toplam Yatırım</div>
            <div className="summary-value">₺{summary.totalInvested?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card current">
          
          <div className="summary-content">
            <div className="summary-label">Güncel Değer</div>
            <div className="summary-value">₺{summary.totalValue?.toLocaleString('tr-TR') || 0}</div>
          </div>
        </div>

        <div className="summary-card profit">
          
          <div className="summary-content">
            <div className="summary-label">Kar/Zarar</div>
            <div 
              className="summary-value"
              style={{ color: getProfitColor(summary.profitLoss) }}
            >
              {summary.profitLoss >= 0 ? '+' : ''}₺{summary.profitLoss?.toLocaleString('tr-TR') || 0}
            </div>
            <div 
              className="summary-subtitle"
              style={{ color: getProfitColor(summary.profitLoss) }}
            >
              %{summary.profitLossPercentage || 0}
            </div>
          </div>
        </div>

        <div className="summary-card count">
          
          <div className="summary-content">
            <div className="summary-label">Toplam Yatırım</div>
            <div className="summary-value">{summary.count || 0}</div>
          </div>
        </div>

        <div className="investments-summary-card-action">
          <button 
            className="add-investment-btn"
            onClick={() => setShowAddForm(true)}
          >
            <span></span> Yeni Yatırım Ekle
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="investments-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="investments-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="investments-modal-header">
              <h2>Yeni Yatırım Ekle</h2>
              <button className="investments-close-btn" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddInvestment} className="investment-form">
              <div className="investments-form-row">
                <div className="investments-form-group">
                  <label>Yatırım Türü *</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="hisse">Hisse Senedi</option>
                    <option value="fon">Yatırım Fonu</option>
                    <option value="tahvil">Tahvil</option>
                    <option value="doviz">Döviz</option>
                    <option value="altin">Altın</option>
                    <option value="kripto">Kripto Para</option>
                    <option value="bist">BIST</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div className="investments-form-group">
                  <label>Yatırım Adı *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Örn: Apple Inc."
                    required
                  />
                </div>
              </div>

              <div className="investments-form-row">
                <div className="investments-form-group">
                  <label>Sembol/Kod</label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="Örn: AAPL"
                  />
                </div>

                <div className="investments-form-group">
                  <label>Platform</label>
                  <input
                    type="text"
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    placeholder="Örn: Midas, Binance"
                  />
                </div>
              </div>

              <div className="investments-form-row">
                <div className="investments-form-group">
                  <label>Miktar/Adet</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Örn: 10"
                  />
                </div>

                <div className="investments-form-group">
                  <label>Alış Fiyatı *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    placeholder="Örn: 150"
                    required
                  />
                </div>
              </div>

              <div className="investments-form-row">
                <div className="investments-form-group">
                  <label>Toplam Yatırım Tutarı *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalInvested"
                    value={formData.totalInvested}
                    onChange={handleInputChange}
                    placeholder="Örn: 15000"
                    required
                  />
                </div>

                <div className="investments-form-group">
                  <label>Güncel Fiyat</label>
                  <input
                    type="number"
                    step="0.01"
                    name="currentPrice"
                    value={formData.currentPrice}
                    onChange={handleInputChange}
                    placeholder="Boş bırakılırsa alış fiyatı"
                  />
                </div>
              </div>

              <div className="investments-form-row">
                <div className="investments-form-group">
                  <label>Güncel Değer</label>
                  <input
                    type="number"
                    step="0.01"
                    name="currentValue"
                    value={formData.currentValue}
                    onChange={handleInputChange}
                    placeholder="Boş bırakılırsa yatırım tutarı"
                  />
                </div>

                <div className="investments-form-group">
                  <label>Alış Tarihi *</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="investments-form-group">
                <label>Notlar</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="İsteğe bağlı notlar..."
                  rows="3"
                />
              </div>

              <div className="investments-form-actions">
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

      {/* Update Price Modal */}
      {showUpdateModal && selectedInvestment && (
        <div className="investments-modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="investments-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="investments-modal-header">
              <h2>Fiyat Güncelle - {selectedInvestment.name}</h2>
              <button className="investments-close-btn" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleUpdatePrice} className="update-form">
              <div className="investments-form-group">
                <label>Güncel Fiyat *</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateData.currentPrice}
                  onChange={(e) => setUpdateData({ ...updateData, currentPrice: e.target.value })}
                  placeholder="Örn: 175"
                  required
                  autoFocus
                />
              </div>

              <div className="investments-form-group">
                <label>Güncel Toplam Değer</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateData.currentValue}
                  onChange={(e) => setUpdateData({ ...updateData, currentValue: e.target.value })}
                  placeholder="Boş bırakılırsa hesaplanır"
                />
              </div>

              <div className="investments-info-box">
                <div className="info-row">
                  <span>Alış Fiyatı:</span>
                  <span>₺{selectedInvestment.purchasePrice.toLocaleString('tr-TR')}</span>
                </div>
                <div className="info-row">
                  <span>Yatırılan:</span>
                  <span>₺{selectedInvestment.totalInvested.toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <div className="investments-form-actions">
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

      {/* Investments List */}
      <div className="investments-list">
        <h2>Yatırım Portföyü</h2>
        
        {investments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3>Henüz yatırım kaydı yok</h3>
            <p>Yatırımlarınızı ekleyerek portföyünüzü takip edin</p>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ İlk Yatırımınızı Ekleyin
            </button>
          </div>
        ) : (
          <div className="investments-grid">
            {investments.map(investment => {
              const profitLoss = investment.profitLoss || 0;
              const profitPct = investment.profitLossPercentage || 0;
              
              return (
                <div key={investment._id} className="investment-card">
                  <div className="investment-header">
                    <div className="investment-title">
                      <span className="investment-icon">{getTypeIcon(investment.type)}</span>
                      <div>
                        <h3>{investment.name}</h3>
                        {investment.symbol && (
                          <span className="investment-symbol">{investment.symbol}</span>
                        )}
                      </div>
                    </div>
                    <span className="investment-type">{getTypeLabel(investment.type)}</span>
                  </div>

                  <div className="investment-info">
                    <div className="info-row main">
                      <span className="info-label">Güncel Değer:</span>
                      <span className="info-value big">
                        ₺{(investment.currentValue || investment.totalInvested).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="profit-section">
                      <div 
                        className="profit-value"
                        style={{ color: getProfitColor(profitLoss) }}
                      >
                        {profitLoss >= 0 ? '▲' : '▼'} {profitLoss >= 0 ? '+' : ''}₺{profitLoss.toLocaleString('tr-TR')}
                      </div>
                      <div 
                        className="profit-percentage"
                        style={{ color: getProfitColor(profitLoss) }}
                      >
                        ({profitLoss >= 0 ? '+' : ''}{profitPct}%)
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="info-row">
                      <span className="info-label">💰 Yatırılan:</span>
                      <span className="info-value">
                        ₺{investment.totalInvested.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {investment.quantity > 0 && (
                      <div className="info-row">
                        <span className="info-label">📊 Miktar:</span>
                        <span className="info-value">{investment.quantity}</span>
                      </div>
                    )}

                    <div className="info-row">
                      <span className="info-label">💵 Alış Fiyatı:</span>
                      <span className="info-value">
                        ₺{investment.purchasePrice.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {investment.currentPrice && (
                      <div className="info-row">
                        <span className="info-label">📈 Güncel Fiyat:</span>
                        <span className="info-value">
                          ₺{investment.currentPrice.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}

                    <div className="info-row">
                      <span className="info-label">📅 Alış Tarihi:</span>
                      <span className="info-value">
                        {new Date(investment.purchaseDate).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    {investment.platform && (
                      <div className="info-row">
                        <span className="info-label">🏦 Platform:</span>
                        <span className="info-value">{investment.platform}</span>
                      </div>
                    )}

                    {investment.notes && (
                      <div className="notes-section">
                        <span className="notes-label">📝 Not:</span>
                        <p className="notes-text">{investment.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="investment-actions">
                    <button 
                      className="btn-update"
                      onClick={() => openUpdateModal(investment)}
                    >
                       Güncelle
                    </button>
                    <button 
                      className="btn-sell"
                      onClick={() => openSellModal(investment)}
                    >
                       Sat
                    </button>
                    <button 
                      className="investments-btn-delete"
                      onClick={() => openDeleteModal(investment)}
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

      {/* Portfolio Breakdown */}
      {investments.length > 0 && summary.byType && (
        <div className="portfolio-breakdown">
          <h2>Portföy Dağılımı</h2>
          <div className="breakdown-grid">
            {Object.entries(summary.byType).map(([type, data]) => (
              <div key={type} className="breakdown-card">
                <div className="breakdown-icon">{getTypeIcon(type)}</div>
                <div className="breakdown-content">
                  <div className="breakdown-title">{getTypeLabel(type)}</div>
                  <div className="breakdown-count">{data.count} Yatırım</div>
                  <div className="breakdown-value">
                    ₺{data.currentValue.toLocaleString('tr-TR')}
                  </div>
                  <div className="breakdown-invested">
                    Yatırılan: ₺{data.invested.toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && investmentToSell && (
        <div className="inv-sell-modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="inv-sell-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-sell-header">
              <h2>Yatırımı Sat</h2>
              <button className="inv-close-btn" onClick={() => setShowSellModal(false)}>✕</button>
            </div>
            <p className="inv-sell-subtitle">{investmentToSell.name} varlığını satıyorsunuz.</p>
            
            <form onSubmit={confirmSellInvestment}>
              <div className="investments-form-group">
                <label>Satış Fiyatı (Birim Başına)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={sellPrice} 
                  onChange={(e) => setSellPrice(e.target.value)} 
                  placeholder="Örn: 150"
                  required 
                  autoFocus
                />
              </div>
              <div className="inv-sell-actions">
                <button type="button" className="inv-btn-cancel" onClick={() => setShowSellModal(false)}>İptal</button>
                <button type="submit" className="inv-btn-confirm">Satışı Onayla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && investmentToDelete && (
        <div className="inv-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="inv-delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-delete-icon">🗑️</div>
            <h3>Yatırımı Sil</h3>
            <p><strong>{investmentToDelete.name}</strong> yatırımını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="inv-delete-actions">
              <button className="inv-btn-cancel-delete" onClick={() => setShowDeleteModal(false)}>İptal</button>
              <button className="inv-btn-confirm-delete" onClick={confirmDeleteInvestment}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Investments;