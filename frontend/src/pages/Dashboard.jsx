import PDFExport from "../components/PDFExport.jsx";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./Dashboard.css";
import api from "../api"; // axios yerine api import ettik
import CalculatorHub from "../components/CalculatorHub";
import GoalsTracker from "./GoalsTracker";
import AIInvestmentAdvice from "../components/AIInvestmentAdvice.jsx";
import DarkModeToggle from "../components/DarkModeToggle.jsx";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCalculatorHubOpen, setIsCalculatorHubOpen] = useState(false);
  const [riskLevel, setRiskLevel] = useState("medium");
  const [investmentType, setInvestmentType] = useState("kısa");
  const [loading, setLoading] = useState(true);
  const [cumulativeSavings, setCumulativeSavings] = useState(0);
  
  // YENİ STATE'LER
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/user/profile"); // api kullanıyoruz, token otomatik
        setUserData(res.data);
        setRiskLevel(res.data.riskProfile || "medium");
        setInvestmentType(res.data.investmentType || "kısa");
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);
    
  useEffect(() => {
    const fetchCumulativeSavings = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) return;
      
      try {
        const res = await api.get('/api/monthly/cumulative-savings'); // api kullanıyoruz
        setCumulativeSavings(res.data.cumulativeSavings);
      } catch (err) {
        console.error('Cumulative savings error:', err);
      }
    };
    
    // YENİ: History çek
    const fetchMonthlyHistory = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) return;

      try {
        const res = await api.get('/api/monthly/history'); // api kullanıyoruz
        setMonthlyHistory(res.data.history || []);
      } catch (err) {
        console.error('History error:', err);
      }
    };
    
    fetchCumulativeSavings();
    fetchMonthlyHistory();
  }, []);

  // YENİ: Monthly Reset fonksiyonu
  const handleMonthlyReset = async () => {
    const confirmReset = window.confirm(
      '⚠️ Yeni aya geçmek istediğinize emin misiniz?\n\n' +
      '✅ Mevcut ay verileri geçmişe kaydedilecek\n' +
      '✅ Tasarruf toplam birikime eklenecek\n' +
      '✅ Gelir ve değişken giderler sıfırlanacak\n' +
      '✅ Recurring giderler korunacak'
    );

    if (!confirmReset) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;

    try {
      const res = await api.post('/api/monthly/reset', {}); // api kullanıyoruz

      if (res.data.success) {
        alert(
          `🎉 Yeni aya geçildi!\n\n` +
          `📊 Geçen ay tasarruf: ₺${res.data.data.previousMonthSavings.toLocaleString('tr-TR')}\n` +
          `💎 Toplam birikim: ₺${res.data.data.cumulativeSavings.toLocaleString('tr-TR')}\n` +
          `🔄 Korunan gider sayısı: ${res.data.data.recurringExpensesKept}`
        );
        
        // Verileri yenile
        window.location.reload();
      }
    } catch (err) {
      console.error('Reset error:', err);
      alert('❌ Reset işlemi başarısız oldu!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSavePreferences = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;

    try {
      const res = await api.put(
        "/api/user/preferences",
        { riskProfile: riskLevel, investmentType }
      ); // api kullanıyoruz, token otomatik
      setUserData(res.data);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Tercihler kaydedilirken bir hata oluştu.");
    }
  };

  const getInvestmentAdvice = (risk, type, savings) => {
    const savingsFormatted = savings.toLocaleString('tr-TR');
    
    if (risk === "low") {
      return type === "kısa"
        ? `Aylık ₺${savingsFormatted} tasarrufunuzla, kısa vadeli düşük riskli tahvil fonları ve BES önerilir. %15-20 getiri hedefleyebilirsiniz.`
        : `Orta-uzun vadede dengeli fonlar ve devlet tahvilleri tercih edebilirsiniz. Yıllık %20-25 getiri potansiyeli var.`;
    }
    if (risk === "medium") {
      return type === "orta"
        ? `₺${savingsFormatted} tasarrufunuzla orta vadeli %40 hisse senedi fonları, %30 BES, %30 altın/döviz dengesi önerilir. %25-35 getiri bekleyebilirsiniz.`
        : `Uzun vadede %50 hisse ağırlıklı, %30 BES, %20 altın portföyü uygun. %35-50 getiri hedeflenebilir.`;
    }
    if (risk === "high") {
      return `₺${savingsFormatted} tasarrufunuzla uzun vadeli %60 hisse senedi, %20 kripto, %20 altın gibi yüksek riskli yatırımlar önerilir. %50-80 getiri potansiyeli var.`;
    }
    return "Yatırım önerisi için tercihlerinizi güncelleyin.";
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <p>Veriler yükleniyor...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="loading-spinner">
        <p>Veri bulunamadı. Lütfen tekrar giriş yapın.</p>
      </div>
    );
  }

  const income = userData.finance?.monthlyIncome || 0;
  const totalExpenses = userData.finance?.totalExpenses || 0;
  const savings = userData.finance?.savings || 0;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : 0;
  const advice = getInvestmentAdvice(userData.riskProfile, userData.investmentType, savings);

  const riskText = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek'
  };

  // Trend verisi
  const trendData = [
    { month: 'Oca', income: income * 0.9, expenses: totalExpenses * 0.85 },
    { month: 'Şub', income: income * 0.95, expenses: totalExpenses * 0.9 },
    { month: 'Mar', income: income * 1.0, expenses: totalExpenses * 0.95 },
    { month: 'Nis', income: income * 0.98, expenses: totalExpenses * 1.0 },
    { month: 'May', income: income * 1.05, expenses: totalExpenses * 1.05 },
    { month: 'Haz', income: income, expenses: totalExpenses },
  ];

  // Pie chart verisi
  const pieData = [
    { name: 'Tasarruf', value: Number(savingsRate), color: '#27ae60' },
    { name: 'Gider', value: 100 - Number(savingsRate), color: '#e74c3c' },
  ];

  // YENİ: History için grafik verisi
  const chartData = monthlyHistory
    .slice(0, 6)
    .reverse()
    .map(month => ({
      name: month.monthName,
      tasarruf: month.savings,
      gelir: month.income,
      gider: month.totalExpenses
    }));
    
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">💰 FinTech</div>
        
        <ul className="sidebar-nav">
          <li className="nav-item">
            <a href="#" className="nav-link active">
              <span className="icon">📊</span>
              <span>Dashboard</span>
            </a>
          </li>
          
          <li className="nav-item">
            <a href="#" className="nav-link">
              <span className="icon">💳</span>
              <span>My Wallet</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <span className="icon">🔄</span>
              <span>Transaction</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <span className="icon">👤</span>
              <span>Account</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <span className="icon">⚙️</span>
              <span>Setting</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link" onClick={(e) => {
              e.preventDefault();
              setIsCalculatorHubOpen(true);
            }}>
              <span className="icon">🧮</span>
              <span>Hesap Araçları</span>
            </a>
          </li>
          <li className="nav-item">
            <Link to="/analytics" className="nav-link">
              <span className="icon">📊</span>
              <span>Analytics</span>
            </Link>
          </li>
          <li className="nav-item">
              {userData && <PDFExport userData={userData} />}
          </li>
        </ul>
           
        <div className="sidebar-footer">
          <a href="#" className="nav-link" onClick={handleLogout}>
            <span className="icon">🚪</span>
            <span>Log Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
<header className="dash-main-header">
  <div className="dash-header-container">
    {/* Sol Taraf - Başlık ve Navigasyon */}
    <div className="dash-header-left-section">
      <h1 className="dash-page-title">Dashboard</h1>
      <nav className="dash-navigation-menu">
        <Link to="/" className="dash-nav-item">
          <span className="dash-nav-icon">🏠</span>
          Ana Sayfa
        </Link>
        <Link to="/manager" className="dash-nav-item">
          <span className="dash-nav-icon">💰</span>
          Finans Manajer
        </Link>
        <Link to="/analytics" className="dash-nav-item">
          <span className="dash-nav-icon">📊</span>
          Analytics
        </Link>
      </nav>
    </div>

    {/* Sağ Taraf - Aksiyonlar ve Kullanıcı */}
    <div className="dash-header-right-section">
      <div className="dash-action-buttons">
        <button className="dash-action-btn dash-history-btn" onClick={() => setShowHistory(!showHistory)}>
          <span className="dash-btn-icon">📊</span>
          Geçmiş Aylar
        </button>
        <button className="dash-action-btn dash-reset-btn" onClick={handleMonthlyReset}>
          <span className="dash-btn-icon">🗓️</span>
          Yeni Aya Geç
        </button>
      </div>
      
      <div className="dash-utility-section">
        <DarkModeToggle />
        <div className="dash-notification-badge">
          <span className="dash-notification-icon">🔔</span>
          <span className="dash-notification-count">3</span>
        </div>
        <div className="dash-user-profile">
          <div className="dash-avatar-circle">
            {userData.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  </div>
</header>

        {/* Stats Row - DÜZELTİLMİŞ */}
        <div className="stats-row">
          <div className="stat-card income">
            <div className="stat-header">
              <div className="stat-icon">💵</div>
            </div>
            <div className="stat-label">Aylık Gelir</div>
            <div className="stat-value">₺{income.toLocaleString('tr-TR')}</div>
            <div className="stat-change">Bu ay</div>
          </div>

          <div className="stat-card expense">
            <div className="stat-header">
              <div className="stat-icon">💸</div>
            </div>
            <div className="stat-label">Toplam Gider</div>
            <div className="stat-value">₺{totalExpenses.toLocaleString('tr-TR')}</div>
            <div className="stat-change negative">-{((totalExpenses/income)*100).toFixed(0)}%</div>
          </div>

          <div className="stat-card savings">
            <div className="stat-header">
              <div className="stat-icon">🏦</div>
            </div>
            <div className="stat-label">Aylık Tasarruf</div>
            <div className="stat-value">₺{savings.toLocaleString('tr-TR')}</div>
            <div className="stat-change">+{savingsRate}%</div>
          </div>

          {/* Cumulative Savings - AYRI CARD */}
          <div className="stat-card cumulative">
            <div className="stat-header">
              <div className="stat-icon">💎</div>
            </div>
            <div className="stat-label">Toplam Birikim</div>
            <div className="stat-value">₺{cumulativeSavings.toLocaleString('tr-TR')}</div>
            <div className="stat-change">Kümülatif</div>
          </div>
        </div>

        {/* YENİ: History Section */}
        {showHistory && monthlyHistory.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h2>📊 Aylık Geçmiş</h2>
              <button className="close-history-btn" onClick={() => setShowHistory(false)}>✕</button>
            </div>

            {/* Grafik */}
            <div className="history-chart">
              <h3>Son 6 Aylık Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a2e', 
                      border: '1px solid #2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                  />
                  <Line type="monotone" dataKey="tasarruf" stroke="#10b981" strokeWidth={3} name="Tasarruf" />
                  <Line type="monotone" dataKey="gelir" stroke="#3b82f6" strokeWidth={2} name="Gelir" />
                  <Line type="monotone" dataKey="gider" stroke="#ef4444" strokeWidth={2} name="Gider" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tablo */}
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Ay</th>
                    <th>Gelir</th>
                    <th>Gider</th>
                    <th>Tasarruf</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyHistory.map((month, index) => (
                    <tr key={index}>
                      <td className="month-cell">{month.monthName} {month.year}</td>
                      <td className="income-cell">₺{month.income.toLocaleString('tr-TR')}</td>
                      <td className="expense-cell">₺{month.totalExpenses.toLocaleString('tr-TR')}</td>
                      <td className={`savings-cell ${month.savings >= 0 ? 'positive' : 'negative'}`}>
                        ₺{month.savings.toLocaleString('tr-TR')}
                      </td>
                      <td>
                        {month.savings >= 0 ? (
                          <span className="status-badge success">✓ Başarılı</span>
                        ) : (
                          <span className="status-badge danger">✕ Aşım</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Chart Card */}
          <div className="chart-card">
            <div className="card-header">
              <h3 className="card-title">Finance Statistic</h3>
              <div className="card-actions">
                <select>
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#7f8c8d" />
                  <YAxis stroke="#7f8c8d" />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a2e', 
                      border: '1px solid #2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#27ae60" 
                    strokeWidth={3}
                    dot={{ fill: '#27ae60', r: 5 }}
                    name="Gelir"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#e74c3c" 
                    strokeWidth={3}
                    dot={{ fill: '#e74c3c', r: 5 }}
                    name="Gider"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="sidebar-cards">
            {/* Activity Card */}
            <div className="activity-card">
              <div className="card-header">
                <h3 className="card-title">Activity</h3>
              </div>
              <div className="activity-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-text">{savingsRate}%</div>
              </div>
              <div className="activity-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#27ae60' }}></div>
                  <div className="legend-info">
                    <div className="legend-label">Tasarruf</div>
                    <div className="legend-value">{savingsRate}%</div>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#e74c3c' }}></div>
                  <div className="legend-info">
                    <div className="legend-label">Gider</div>
                    <div className="legend-value">{100-savingsRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h3>{userData.name}</h3>
                  <p>{userData.email}</p>
                </div>
              </div>
              
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Risk Profili</span>
                  <span className="detail-value">{riskText[userData.riskProfile]}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Vade Tercihi</span>
                  <span className="detail-value">{userData.investmentType}</span>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  Düzenle
                </button>
                <button className="btn btn-secondary">Detaylar</button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Advice Card */}
        <div className="ai-card">
          <AIInvestmentAdvice />
        </div>

        {/* Calculator Hub CTA Button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            className="calculator-hub-cta-button-dashboard"
            onClick={() => setIsCalculatorHubOpen(true)}
          >
            <span className="cta-icon-dashboard">🧮</span>
            <div className="cta-content-dashboard">
              <span className="cta-title-dashboard">Hesaplama Araçları</span>
              <span className="cta-subtitle-dashboard">8 Finansal Hesaplayıcı</span>
            </div>
            <span className="cta-arrow-dashboard">→</span>
          </button>
        </div>
      </main>

      {/* Calculator Hub Modal */}
      <CalculatorHub 
        isOpen={isCalculatorHubOpen} 
        onClose={() => setIsCalculatorHubOpen(false)} 
      />

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>⚙️ Yatırım Tercihlerini Güncelle</h3>
            
            <div className="modal-field">
              <label>Risk Profili:</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                <option value="low">Düşük Risk</option>
                <option value="medium">Orta Risk</option>
                <option value="high">Yüksek Risk</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Vade Tercihi:</label>
              <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value)}>
                <option value="kısa">3-6 Ay</option>
                <option value="orta">6-12 Ay</option>
                <option value="uzun">1-3 Sene</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSavePreferences}>
                ✅ Kaydet
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                ❌ İptal
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div><GoalsTracker></GoalsTracker></div>
    </div>
  );
}

export default Dashboard;