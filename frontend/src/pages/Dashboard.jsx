import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./dashboard.css";
import axios from "axios";
import CalculatorHub from "../components/CalculatorHub";
import GoalsTracker  from "./GoalsTracker";
function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCalculatorHubOpen, setIsCalculatorHubOpen] = useState(false);
  const [riskLevel, setRiskLevel] = useState("medium");
  const [investmentType, setInvestmentType] = useState("kısa");
  const [loading, setLoading] = useState(true);

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
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSavePreferences = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;

    try {
      const res = await axios.put(
        "http://localhost:5000/api/user/preferences",
        { riskProfile: riskLevel, investmentType },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
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

  // Trend verisi (örnek - sonra backend'den gelecek)
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

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">💰 FinTech</div>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="#" className="nav-link active">
              <span className="icon">📊</span>
              <span>Dashboard</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <span className="icon">📈</span>
              <span>Analytics</span>
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
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <span>🔍</span>
              <input type="text" placeholder="Search..." />
            </div>
            <div className="notification-icon">🔔</div>
            <div className="user-avatar">
              {userData.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card income">
            <div className="stat-header">
              <div className="stat-icon">💵</div>
            </div>
            <div className="stat-label">Aylık Gelir</div>
            <div className="stat-value">₺{income.toLocaleString('tr-TR')}</div>
            <div className="stat-change">+0%</div>
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
        </div>

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
                    contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
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
          <h3>🤖 AI Yatırım Önerisi</h3>
          <p>{advice}</p>
        </div>

        {/* Calculator Hub CTA Button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            className="calculator-hub-cta-button"
            onClick={() => setIsCalculatorHubOpen(true)}
          >
            <span className="cta-icon">🧮</span>
            <div className="cta-content">
              <span className="cta-title">Hesaplama Araçları</span>
              <span className="cta-subtitle">8 Finansal Hesaplayıcı</span>
            </div>
            <span className="cta-arrow">→</span>
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