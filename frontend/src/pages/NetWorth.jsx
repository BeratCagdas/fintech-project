// frontend/src/pages/NetWorth.jsx (YENİ DOSYA)
import React, { useState, useEffect } from 'react';
import api from '../api';
import './NetWorth.css';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const NetWorth = () => {
  const [netWorth, setNetWorth] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetWorth();
  }, []);

  const fetchNetWorth = async () => {
    try {
      const res = await api.get('/api/net-worth');
      setNetWorth(res.data.netWorth);
      setBreakdown(res.data.breakdown);
      setLoading(false);
    } catch (err) {
      console.error('Net worth verisi yüklenemedi:', err);
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  const assetsData = breakdown ? [
    { name: 'Nakit', value: breakdown.assets.cash },
    { name: 'Yatırımlar', value: breakdown.assets.investments },
    { name: 'Varlıklar', value: breakdown.assets.property }
  ].filter(item => item.value > 0) : [];

  const liabilitiesData = breakdown ? [
    { name: 'Borçlar', value: breakdown.liabilities.debts },
    { name: 'Kredi Kartı', value: breakdown.liabilities.creditCards },
    { name: 'Varlık Kredileri', value: breakdown.liabilities.assetLoans }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="net-worth-container">
      {/* Header */}
      <header className="net-worth-header">
        <div className="header-content">
          <div className="header-left">
            <h1>💎 Net Varlık Değeri</h1>
            <p>Toplam varlıklarınız ve yükümlülükleriniz</p>
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

      {/* Main Net Worth Display */}
      <div className="net-worth-main">
        <div className="net-worth-card">
      
          <div className="net-worth-content">
            <div className="net-worth-label">Net Varlık Değeri</div>
            <div className="net-worth-value">
              ₺{netWorth?.netValue.toLocaleString('tr-TR') || 0}
            </div>
            <div className="net-worth-date">
              Son güncelleme: {netWorth?.lastCalculated ? new Date(netWorth.lastCalculated).toLocaleString('tr-TR') : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Assets vs Liabilities */}
      <div className="comparison-section">
        <div className="comparison-card assets">
          <div className="comparison-header">
            <h2>Toplam Varlıklar</h2>
            <div className="comparison-value">
              ₺{netWorth?.totalAssets.toLocaleString('tr-TR') || 0}
            </div>
          </div>
          
          {assetsData.length > 0 && (
            <>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={assetsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--dark-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="breakdown-list">
                {breakdown && (
                  <>
                    <div className="breakdown-item">
                      <div className="breakdown-color" style={{ background: COLORS[0] }}></div>
                      <span className="breakdown-label">Nakit ve Tasarruf</span>
                      <span className="breakdown-value">₺{breakdown.assets.cash.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-color" style={{ background: COLORS[1] }}></div>
                      <span className="breakdown-label">Yatırımlar</span>
                      <span className="breakdown-value">₺{breakdown.assets.investments.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-color" style={{ background: COLORS[2] }}></div>
                      <span className="breakdown-label">Varlıklar</span>
                      <span className="breakdown-value">₺{breakdown.assets.property.toLocaleString('tr-TR')}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="comparison-card liabilities">
          <div className="comparison-header">
            <h2>💳 Toplam Yükümlülükler</h2>
            <div className="comparison-value red">
              ₺{netWorth?.totalLiabilities.toLocaleString('tr-TR') || 0}
            </div>
          </div>
          
          {liabilitiesData.length > 0 ? (
            <>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={liabilitiesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {liabilitiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#f59e0b'][index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--dark-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="breakdown-list">
                {breakdown && (
                  <>
                    <div className="breakdown-item">
                      <div className="breakdown-color" style={{ background: '#ef4444' }}></div>
                      <span className="breakdown-label">Borçlar</span>
                      <span className="breakdown-value">₺{breakdown.liabilities.debts.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-color" style={{ background: '#f97316' }}></div>
                      <span className="breakdown-label">Kredi Kartı</span>
                      <span className="breakdown-value">₺{breakdown.liabilities.creditCards.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-color" style={{ background: '#f59e0b' }}></div>
                      <span className="breakdown-label">Varlık Kredileri</span>
                      <span className="breakdown-value">₺{breakdown.liabilities.assetLoans.toLocaleString('tr-TR')}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-chart">
              <p>Herhangi bir yükümlülük bulunmuyor! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Hızlı İşlemler</h2>
        <div className="actions-grid">
          <Link to="/debts" className="action-card">
            <div className="action-icon">💳</div>
            <h3>Borçlar</h3>
            <p>Borçlarınızı yönetin</p>
          </Link>
          
          <Link to="/credit-cards" className="action-card">
            <div className="action-icon">💳</div>
            <h3>Kredi Kartları</h3>
            <p>Kartlarınızı takip edin</p>
          </Link>
          
          <Link to="/investments" className="action-card">
            <div className="action-icon">📈</div>
            <h3>Yatırımlar</h3>
            <p>Portföyünüzü büyütün</p>
          </Link>
          
          <Link to="/assets" className="action-card">
            <div className="action-icon">🏠</div>
            <h3>Varlıklar</h3>
            <p>Varlıklarınızı yönetin</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NetWorth;