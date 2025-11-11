import PDFExport from "../components/PDFExport.jsx";
import { fetchBudgetLimits, fetchBudgetStatus, updateBudgetLimits } from '../services/budgetService';
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./Dashboard.css";
import api from "../api";
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
  
  // HISTORY KISMI İÇİN STATELER
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showMonthDetail, setShowMonthDetail] = useState(false);
  const [budgetLimits, setBudgetLimits] = useState({ variable: {}, fixed: {} });
  const [budgetStatus, setBudgetStatus] = useState({ variable: {}, fixed: {} });
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
   
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
        const res = await api.get("/api/user/profile");
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
        const res = await api.get('/api/monthly/cumulative-savings');
        setCumulativeSavings(res.data.cumulativeSavings);
      } catch (err) {
        console.error('Cumulative savings error:', err);
      }
    };
    
    const fetchMonthlyHistory = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) return;

      try {
        const res = await api.get('/api/monthly/history');
        setMonthlyHistory(res.data.history || []);
      } catch (err) {
        console.error('History error:', err);
      }
    };
    
    const fetchBudgetData = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) return;
      
      try {
        const limits = await fetchBudgetLimits();
        const status = await fetchBudgetStatus();
        setBudgetLimits(limits);
        setBudgetStatus(status);
      } catch (err) {
        console.error('Budget data error:', err);
      }
    };
    
    fetchCumulativeSavings();
    fetchMonthlyHistory();
    fetchBudgetData(); 
  }, []);

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
      const res = await api.post('/api/monthly/reset', {});

      if (res.data.success) {
        alert(
          `🎉 Yeni aya geçildi!\n\n` +
          `📊 Geçen ay tasarruf: ₺${res.data.data.previousMonthSavings.toLocaleString('tr-TR')}\n` +
          `💎 Toplam birikim: ₺${res.data.data.cumulativeSavings.toLocaleString('tr-TR')}\n` +
          `🔄 Korunan gider sayısı: ${res.data.data.recurringExpensesKept}`
        );
        
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

  const trendData = [
    { month: 'Oca', income: income * 0.9, expenses: totalExpenses * 0.85 },
    { month: 'Şub', income: income * 0.95, expenses: totalExpenses * 0.9 },
    { month: 'Mar', income: income * 1.0, expenses: totalExpenses * 0.95 },
    { month: 'Nis', income: income * 0.98, expenses: totalExpenses * 1.0 },
    { month: 'May', income: income * 1.05, expenses: totalExpenses * 1.05 },
    { month: 'Haz', income: income, expenses: totalExpenses },
  ];

  const pieData = [
    { name: 'Tasarruf', value: Number(savingsRate), color: '#27ae60' },
    { name: 'Gider', value: 100 - Number(savingsRate), color: '#e74c3c' },
  ];

  const chartData = monthlyHistory
    .slice(0, 6)
    .reverse()
    .map(month => ({
      name: month.monthName,
      tasarruf: month.savings,
      gelir: month.income,
      gider: month.totalExpenses
    }));
    
  const getCategoryIcon = (category) => {
    const icons = {
      market: '🛒', yemek: '🍔', ulasim: '🚗', eglence: '🎬',
      giyim: '👕', saglik: '💊', kira: '🏠', faturalar: '💡',
      abonelik: '📱', kredi: '💳', sigorta: '🛡️', egitim: '📚',
      diger: '📦'
    };
    return icons[category] || '📦';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      market: 'Market', yemek: 'Yemek', ulasim: 'Ulaşım', eglence: 'Eğlence',
      giyim: 'Giyim', saglik: 'Sağlık', kira: 'Kira', faturalar: 'Faturalar',
      abonelik: 'Abonelik', kredi: 'Kredi', sigorta: 'Sigorta', egitim: 'Eğitim',
      diger: 'Diğer'
    };
    return labels[category] || 'Diğer';
  };

  const getCategoryTotals = (expenses) => {
    const totals = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'diger';
      totals[cat] = (totals[cat] || 0) + (exp.amount || 0);
    });
    return totals;
  };

  const compareWithPreviousMonth = (currentMonth, previousMonth) => {
    if (!previousMonth) return null;
    
    const currentTotals = getCategoryTotals([
      ...(currentMonth.fixedExpenses || []),
      ...(currentMonth.variableExpenses || [])
    ]);
    
    const previousTotals = getCategoryTotals([
      ...(previousMonth.fixedExpenses || []),
      ...(previousMonth.variableExpenses || [])
    ]);
    
    const comparison = {};
    
    Object.keys({...currentTotals, ...previousTotals}).forEach(cat => {
      const current = currentTotals[cat] || 0;
      const previous = previousTotals[cat] || 0;
      const diff = current - previous;
      const percentChange = previous > 0 ? ((diff / previous) * 100).toFixed(1) : 0;
      
      comparison[cat] = { current, previous, diff, percentChange };
    });
    
    return comparison;
  };

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

        {/* Stats Row */}
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

          <div className="stat-card cumulative">
            <div className="stat-header">
              <div className="stat-icon">💎</div>
            </div>
            <div className="stat-label">Toplam Birikim</div>
            <div className="stat-value">₺{cumulativeSavings.toLocaleString('tr-TR')}</div>
            <div className="stat-change">Kümülatif</div>
          </div>
        </div>

        {/* History Section */}
        {showHistory && monthlyHistory.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h2>📊 Aylık Geçmiş</h2>
              <button className="close-history-btn" onClick={() => setShowHistory(false)}>✕</button>
            </div>

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

            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Ay</th>
                    <th>Gelir</th>
                    <th>Gider</th>
                    <th>Tasarruf</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
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
                      <td>
                        <button 
                          className="btn-detail"
                          onClick={() => {
                            setSelectedMonth(month);
                            setShowMonthDetail(true);
                          }}
                        >
                          📊 Detay
                        </button>
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

          <div className="sidebar-cards">
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

            {/* Budget Alert Card */}
            <div className="budget-alert-card">
              <div className="card-header">
                <h3 className="card-title">💰 Bütçe Durumu</h3>
                <button 
                  className="settings-btn"
                  onClick={() => setShowBudgetSettings(true)}
                >
                  ⚙️
                </button>
              </div>

              {(() => {
                const allCategories = {
                  ...budgetStatus.variable,
                  ...budgetStatus.fixed
                };
                
                const exceeded = Object.values(allCategories).filter(cat => cat.status === 'exceeded').length;
                const warning = Object.values(allCategories).filter(cat => cat.status === 'warning').length;
                const caution = Object.values(allCategories).filter(cat => cat.status === 'caution').length;
                
                const highestSpending = Object.entries(allCategories)
                  .filter(([_, data]) => data.spent > 0)
                  .sort((a, b) => b[1].spent - a[1].spent)[0];
                
                return (
                  <div className="budget-summary">
                    {exceeded > 0 && (
                      <div className="budget-alert danger">
                        <span className="alert-icon">🔴</span>
                        <div className="alert-text">
                          <strong>{exceeded} kategori</strong> limiti aştı!
                        </div>
                      </div>
                    )}
                    
                    {warning > 0 && exceeded === 0 && (
                      <div className="budget-alert warning">
                        <span className="alert-icon">🟠</span>
                        <div className="alert-text">
                          <strong>{warning} kategori</strong> limite yakın
                        </div>
                      </div>
                    )}
                    
                    {caution > 0 && exceeded === 0 && warning === 0 && (
                      <div className="budget-alert caution">
                        <span className="alert-icon">🟡</span>
                        <div className="alert-text">
                          <strong>{caution} kategori</strong> dikkat seviyesinde
                        </div>
                      </div>
                    )}
                    
                    {exceeded === 0 && warning === 0 && caution === 0 && (
                      <div className="budget-alert safe">
                        <span className="alert-icon">🟢</span>
                        <div className="alert-text">
                          Tüm kategoriler güvenli!
                        </div>
                      </div>
                    )}

                    {highestSpending && (
                      <div className="budget-stat">
                        <div className="stat-label">En yüksek harcama:</div>
                        <div className="stat-value">
                          {getCategoryIcon(highestSpending[0])} {getCategoryLabel(highestSpending[0])}
                          <span className="amount">₺{highestSpending[1].spent.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    )}

                    <button 
                      className="btn-detail-budget"
                      onClick={() => setShowBudgetSettings(true)}
                    >
                      📊 Detaylı Görünüm
                    </button>
                  </div>
                );
              })()}
            </div>

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

        <div className="ai-card">
          <AIInvestmentAdvice />
        </div>

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

      {/* Month Detail Modal */}
      {showMonthDetail && selectedMonth && (
        <div className="month-detail-modal">
          <div className="modal-overlay" onClick={() => setShowMonthDetail(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>📊 {selectedMonth.monthName} {selectedMonth.year} - Detaylı Analiz</h2>
              <button className="close-modal-btn" onClick={() => setShowMonthDetail(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="summary-cards">
                <div className="summary-card income">
                  <div className="summary-icon">💰</div>
                  <div className="summary-info">
                    <div className="summary-label">Toplam Gelir</div>
                    <div className="summary-value">₺{selectedMonth.income.toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                <div className="summary-card expense">
                  <div className="summary-icon">💸</div>
                  <div className="summary-info">
                    <div className="summary-label">Toplam Gider</div>
                    <div className="summary-value">₺{selectedMonth.totalExpenses.toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                <div className="summary-card savings">
                  <div className="summary-icon">💎</div>
                  <div className="summary-info">
                    <div className="summary-label">Tasarruf</div>
                    <div className="summary-value">₺{selectedMonth.savings.toLocaleString('tr-TR')}</div>
                  </div>
                </div>
              </div>

              <div className="category-breakdown">
                <h3>📂 Kategoriye Göre Harcamalar</h3>
                
                {selectedMonth.fixedExpenses && selectedMonth.fixedExpenses.length > 0 && (
                  <div className="expense-group">
                    <h4>📌 Sabit Giderler</h4>
                    <div className="category-list">
                      {(() => {
                        const fixedTotals = getCategoryTotals(selectedMonth.fixedExpenses);
                        return Object.entries(fixedTotals).map(([category, amount]) => (
                          <div key={category} className="category-item">
                            <div className="category-left">
                              <span className="category-icon">{getCategoryIcon(category)}</span>
                              <span className="category-name">{getCategoryLabel(category)}</span>
                            </div>
                            <span className="category-amount">₺{amount.toLocaleString('tr-TR')}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {selectedMonth.variableExpenses && selectedMonth.variableExpenses.length > 0 && (
                  <div className="expense-group">
                    <h4>🛒 Değişken Giderler</h4>
                    <div className="category-list">
                      {(() => {
                        const variableTotals = getCategoryTotals(selectedMonth.variableExpenses);
                        return Object.entries(variableTotals).map(([category, amount]) => (
                          <div key={category} className="category-item">
                            <div className="category-left">
                              <span className="category-icon">{getCategoryIcon(category)}</span>
                              <span className="category-name">{getCategoryLabel(category)}</span>
                            </div>
                            <span className="category-amount">₺{amount.toLocaleString('tr-TR')}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const currentIndex = monthlyHistory.findIndex(m => m.month === selectedMonth.month);
                const previousMonth = currentIndex < monthlyHistory.length - 1 ? monthlyHistory[currentIndex + 1] : null;
                
                if (previousMonth) {
                  const comparison = compareWithPreviousMonth(selectedMonth, previousMonth);
                  
                  return (
                    <div className="comparison-section">
                      <h3>📊 Önceki Ay Karşılaştırması ({previousMonth.monthName} {previousMonth.year})</h3>
                      <div className="comparison-list">
                        {Object.entries(comparison).map(([category, data]) => {
                          if (data.current === 0 && data.previous === 0) return null;
                          
                          return (
                            <div key={category} className="comparison-item">
                              <div className="comparison-left">
                                <span className="category-icon">{getCategoryIcon(category)}</span>
                                <span className="category-name">{getCategoryLabel(category)}</span>
                              </div>
                              <div className="comparison-right">
                                <div className="comparison-values">
                                  <span className="previous-value">₺{data.previous.toLocaleString('tr-TR')}</span>
                                  <span className="arrow">→</span>
                                  <span className="current-value">₺{data.current.toLocaleString('tr-TR')}</span>
                                </div>
                                <span className={`comparison-badge ${data.diff > 0 ? 'increase' : data.diff < 0 ? 'decrease' : 'same'}`}>
                                  {data.diff > 0 ? '↑' : data.diff < 0 ? '↓' : '='} 
                                  {Math.abs(data.percentChange)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Budget Settings Modal */}
      {showBudgetSettings && (
        <div className="budget-modal">
          <div className="modal-overlay" onClick={() => setShowBudgetSettings(false)}></div>
          <div className="modal-content budget-modal-content">
            <div className="modal-header">
              <h2>💰 Bütçe Yönetimi</h2>
              <button className="close-modal-btn" onClick={() => setShowBudgetSettings(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="budget-section">
                <h3>🛒 Değişken Gider Limitleri</h3>
                <div className="budget-categories">
                  {['market', 'yemek', 'ulasim', 'eglence', 'giyim', 'saglik', 'diger'].map(category => {
                    const status = budgetStatus.variable?.[category];
                    
                    return (
                      <div key={category} className="budget-category-item">
                        <div className="category-info">
                          <div className="category-header">
                            <span className="category-icon">{getCategoryIcon(category)}</span>
                            <span className="category-name">{getCategoryLabel(category)}</span>
                          </div>
                          
                          {status && (
                            <div className="category-stats">
                              <span className="spent">₺{status.spent.toLocaleString('tr-TR')}</span>
                              <span className="separator">/</span>
                              <span className="limit">₺{status.limit.toLocaleString('tr-TR')}</span>
                            </div>
                          )}
                        </div>

                        {status && status.limit > 0 && (
                          <div className="progress-container">
                            <div 
                              className={`progress-bar ${status.status}`}
                              style={{ width: `${Math.min(status.percentage, 100)}%` }}
                            >
                              <span className="progress-text">{status.percentage}%</span>
                            </div>
                          </div>
                        )}

                        <div className="limit-input-group">
                          <input
                            type="number"
                            placeholder="Limit belirle"
                            value={budgetLimits.variable?.[category] || ''}
                            onChange={(e) => {
                              setBudgetLimits({
                                ...budgetLimits,
                                variable: {
                                  ...budgetLimits.variable,
                                  [category]: Number(e.target.value)
                                }
                              });
                            }}
                            className="limit-input"
                          />
                          <span className="input-currency">₺</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="budget-section">
                <h3>📌 Sabit Gider Limitleri</h3>
                <div className="budget-categories">
                  {['kira', 'faturalar', 'abonelik', 'kredi', 'sigorta', 'egitim', 'diger'].map(category => {
                    const status = budgetStatus.fixed?.[category];
                    
                    return (
                      <div key={category} className="budget-category-item">
                        <div className="category-info">
                          <div className="category-header">
                            <span className="category-icon">{getCategoryIcon(category)}</span>
                            <span className="category-name">{getCategoryLabel(category)}</span>
                          </div>
                          
                          {status && (
                            <div className="category-stats">
                              <span className="spent">₺{status.spent.toLocaleString('tr-TR')}</span>
                              <span className="separator">/</span>
                              <span className="limit">₺{status.limit.toLocaleString('tr-TR')}</span>
                            </div>
                          )}
                        </div>

                        {status && status.limit > 0 && (
                          <div className="progress-container">
                            <div 
                              className={`progress-bar ${status.status}`}
                              style={{ width: `${Math.min(status.percentage, 100)}%` }}
                            >
                              <span className="progress-text">{status.percentage}%</span>
                            </div>
                          </div>
                        )}

                        <div className="limit-input-group">
                          <input
                            type="number"
                            placeholder="Limit belirle"
                            value={budgetLimits.fixed?.[category] || ''}
                            onChange={(e) => {
                              setBudgetLimits({
                                ...budgetLimits,
                                fixed: {
                                  ...budgetLimits.fixed,
                                  [category]: Number(e.target.value)
                                }
                              });
                            }}
                            className="limit-input"
                          />
                          <span className="input-currency">₺</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-save-budget"
                onClick={async () => {
                  try {
                    await updateBudgetLimits(budgetLimits.variable, budgetLimits.fixed);
                    alert('✅ Bütçe limitleri kaydedildi!');
                    
                    const limits = await fetchBudgetLimits();
                    const status = await fetchBudgetStatus();
                    setBudgetLimits(limits);
                    setBudgetStatus(status);
                    
                    setShowBudgetSettings(false);
                  } catch (err) {
                    alert('❌ Limitler kaydedilemedi!');
                  }
                }}
              >
                💾 Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <CalculatorHub 
        isOpen={isCalculatorHubOpen} 
        onClose={() => setIsCalculatorHubOpen(false)} 
      />

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
      
      <div><GoalsTracker /></div>
    </div>
  );
}

export default Dashboard;