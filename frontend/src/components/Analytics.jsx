import React, { useState, useEffect, useMemo } from "react";
import api from "../api";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import "./Analytics.css";
import DarkModeToggle from "./DarkModeToggle";
import { Link } from "react-router-dom";
import CreditScoreDetailModal from "./CreditScoreDetailModal";

// Helper fonksiyonları
const getCreditScoreColor = (score) => {
  if (!score) return '#6b7280';
  if (score >= 750) return '#10b981';
  if (score >= 700) return '#3b82f6';
  if (score >= 650) return '#f59e0b';
  if (score >= 600) return '#f97316';
  return '#ef4444';
};

const getRiskBadge = (category) => {
  const badges = {
    'A': { color: '#10b981', text: 'Minimal Risk', emoji: '🟢' },
    'B': { color: '#3b82f6', text: 'Low Risk', emoji: '🔵' },
    'C': { color: '#f59e0b', text: 'Medium Risk', emoji: '🟡' },
    'D': { color: '#f97316', text: 'High Risk', emoji: '🟠' },
    'E': { color: '#ef4444', text: 'Very High Risk', emoji: '🔴' }
  };
  return badges[category] || { color: '#6b7280', text: 'N/A', emoji: '⚪' };
};

const getScorePercentage = (score, max) => {
  return Math.round((score / max) * 100);
};

const getScoreColor = (score) => {
  if (score >= 80) return '#27ae60';
  if (score >= 60) return '#f39c12';
  if (score >= 40) return '#b18c66';
  if (score < 40) return '#e74c3c';
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Mükemmel';
  if (score >= 60) return 'İyi';
  if (score >= 40) return 'Orta';
  return 'Geliştirilmeli';
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthScoreSource, setHealthScoreSource] = useState(null); 
  const [creditScore, setCreditScore] = useState(null);
  const [comprehensiveHealth, setComprehensiveHealth] = useState({
    currentMonth: null,
    historical: [],
    loading: true
  });
  const [history, setHistory] = useState([]); // ✅ YENİ: History state
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchComprehensiveHealth();
    fetchCreditScore(); 
    fetchHistory(); // ✅ YENİ: History fetch
  }, []);

  // ✅ YENİ: History fetch function
  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/monthly/history");
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  const trendData = useMemo(() => {
    let data = [];

    // 1. Geçmiş verileri al (PostgreSQL - /api/monthly/history öncelikli)
    if (history.length > 0) {
      data = [...history]
        .reverse()
        .map(snapshot => ({
          month: snapshot.monthName?.substring(0, 3) || 'N/A',
          income: snapshot.income,
          expenses: snapshot.totalExpenses,
          savings: snapshot.savings
        }));
    } else if (comprehensiveHealth.historical?.length > 0) {
      // Fallback: Comprehensive Health
      data = [...comprehensiveHealth.historical]
        .reverse()
        .map(snapshot => ({
          month: snapshot.month_name?.substring(0, 3) || 'N/A',
          income: parseFloat(snapshot.income || snapshot.total_income) || 0,
          expenses: parseFloat(snapshot.expense || snapshot.total_expense) || 0,
          savings: parseFloat(snapshot.savings) || 0
        }));
    } else if (analytics?.monthlyHistory?.length > 0) {
      // Fallback: MongoDB geçmişi
      data = analytics.monthlyHistory.map(month => ({
        month: month.monthName?.substring(0, 3) || 'N/A',
        income: parseFloat(month.income) || 0,
        expenses: parseFloat(month.totalExpenses) || 0,
        savings: parseFloat(month.savings) || 0
      }));
    }

    // 2. Mevcut ayı (Canlı Veri) ekle
    if (analytics?.summary) {
      const currentIncome = parseFloat(analytics.summary.income) || 0;
      const currentExpense = parseFloat(analytics.summary.totalExpenses) || 0;
      
      // Sadece veri varsa ekle
      if (currentIncome > 0 || currentExpense > 0) {
        data.push({
          month: 'Bu Ay',
          income: currentIncome,
          expenses: currentExpense,
          savings: parseFloat(analytics.summary.savings) || 0
        });
      }
    }
    
    // Son 6 ayı döndür
    return data.slice(-6);
  }, [analytics, comprehensiveHealth, history]);

  const categoryData = useMemo(() => {
    if (!analytics?.categoryScores) return [];
    
    return [
      { name: 'Gelir Yönetimi', score: analytics.categoryScores.incomeManagement },
      { name: 'Harcama Kontrolü', score: analytics.categoryScores.expenseControl },
      { name: 'Tasarruf Oranı', score: analytics.categoryScores.savingsRate },
      { name: 'Yatırım', score: analytics.categoryScores.investment },
      { name: 'Hedef Başarısı', score: analytics.categoryScores.goalAchievement }
    ];
  }, [analytics]);

  // ✅ YENİ: Skor görüntüleme mantığı (Race condition çözümü)
  const displayHealthScore = useMemo(() => {
    // 1. Öncelik: Kapsamlı hesaplamadan gelen güncel skor
    if (comprehensiveHealth.currentMonth?.score !== undefined && comprehensiveHealth.currentMonth?.score !== null) {
      return comprehensiveHealth.currentMonth.score;
    }
    // 2. Öncelik: Analytics servisinden gelen skor
    return analytics?.healthScore || 0;
  }, [analytics, comprehensiveHealth]);

  const scoreColor = useMemo(() => 
    getCreditScoreColor(creditScore?.creditScore), 
    [creditScore]
  );

  const riskBadge = useMemo(() => 
    getRiskBadge(creditScore?.riskCategory), 
    [creditScore]
  );

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      const res = await api.get("/api/user/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComprehensiveHealth = async () => {
    try {
      const response = await api.get('/api/financial-health/comprehensive');
      
      if (response.data.success) {
        const currentScore = response.data.currentMonth.score;
        const currentData = response.data.currentMonth.data;
        
        setComprehensiveHealth({
          currentMonth: response.data.currentMonth,
          historical: response.data.historical,
          loading: false
        });
        
        if (currentScore !== null) {
          setAnalytics(prev => prev ? {
            ...prev,
            healthScore: currentScore,
            cumulativeSavings: currentData.cumulativeSavings
          } : prev);
          
          setHealthScoreSource('professional');
        }
      }
    } catch (err) {
      console.error('❌ Kapsamlı veri yüklenemedi:', err);
      setComprehensiveHealth(prev => ({ ...prev, loading: false }));
      setHealthScoreSource('unavailable');
    }
  };
   
  const fetchCreditScore = async () => {
    try {
      const response = await api.get('/api/analytics/credit-score/latest');
      
      if (response.data.success) {
        setCreditScore(response.data);
      } else {
        setCreditScore(null);
      }
    } catch (err) {
      console.error('❌ Credit score yüklenemedi:', err);
      setCreditScore(null);
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f39c12', '#e74c3c', '#27ae60', '#3498db'];

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner">📊</div>
        <p>Analytics yükleniyor...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-error">
        <p>Analytics verileri yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <header className="analytics-main-header">
        <div className="analytics-header-container">
          <div className="analytics-header-left-section">
            <div className="analytics-title-group">
              <h1 className="analytics-page-title">📊 Finansal Analytics</h1>
              <p className="analytics-page-subtitle">Gelir ve harcamalarınızın detaylı analizi</p>
            </div>
            <nav className="analytics-navigation-menu">
              <Link to="/" className="analytics-nav-item">
                <span className="analytics-nav-icon">🏠</span>
                Ana Sayfa
              </Link>
              <Link to="/dashboard" className="analytics-nav-item">
                <span className="analytics-nav-icon">📊</span>
                Dashboard
              </Link>
              <Link to="/manager" className="analytics-nav-item">
                <span className="analytics-nav-icon">💰</span>
                Finans Manager
              </Link>
            </nav>
          </div>

          <div className="analytics-header-right-section">
            <div className="analytics-utility-section">
              <DarkModeToggle />
              <div className="analytics-notification-badge">
                <span className="analytics-notification-icon">🔔</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Score Cards */}
      <div className="analytics-main-container">
        <div className="health-score-section">
          {/* Financial Health Card */}
          <div className="score-card financial-health">
            <div className="score-circle-container">
              <svg className="score-circle" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeDasharray={`${(displayHealthScore) * 5.03} 502.4`}
                  strokeLinecap="round"
                  style={{ 
                    transform: 'rotate(-90deg)',
                    transformOrigin: '100px 100px',
                    transition: 'stroke-dasharray 0.8s ease'
                  }}
                />
                <text x="100" y="95" textAnchor="middle" className="score-number">
                  {displayHealthScore}
                </text>
                <text x="100" y="115" textAnchor="middle" className="score-max">
                  /100
                </text>
              </svg>
            </div>
            
            <h3 className="score-title">Finansal Sağlık Puanınız</h3>
              
            <p className="score-subtitle">
              <span style={{ color: getScoreColor(displayHealthScore), fontSize:20, fontWeight: 900 }}>
                {getScoreLabel(displayHealthScore)}
              </span>
            </p>
          </div>

          {/* Credit Score Card */}
          <div className="score-card credit-score">
            <div className="score-circle-container">
              <svg className="score-circle" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="20"
                  strokeDasharray={`${((creditScore?.creditScore || 0) / 850) * 502.4} 502.4`}
                  strokeLinecap="round"
                  style={{ 
                    transform: 'rotate(-90deg)',
                    transformOrigin: '100px 100px',
                    transition: 'stroke-dasharray 0.8s ease'
                  }}
                />
                <text x="100" y="95" textAnchor="middle" className="score-number">
                  {creditScore?.creditScore || 0}
                </text>
                <text x="100" y="115" textAnchor="middle" className="score-max">
                  /850
                </text>
              </svg>
            </div>
            
            <h3 className="score-title">Kredi Skorunuz</h3>
            
            {creditScore?.riskCategory ? (
              <>
                <div 
                  className="risk-badge" 
                  style={{ background: riskBadge.color }}
                >
                  <span>{riskBadge.emoji}</span>
                  <span>{creditScore.riskCategory} - {riskBadge.text}</span>
                </div>
              
                <button 
                  className="detail-report-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  📈 Detaylı Rapor
                </button>
              </>
            ) : (
              <div className="no-credit-score">
                <p>⚪ Henüz credit score hesaplanmamış</p>
                <p className="small-text">Bir aya geçiş yaptığınızda otomatik hesaplanacak</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Scores */}
        <div className="category-scores-card">
          <h3>📋 Kategori Skorları</h3>
          {categoryData.map((category, index) => (
            <div key={index} className="category-score-item">
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="category-value">{category.score}/100</span>
              </div>
              <div className="category-bar">
                <div 
                  className="category-bar-fill"
                  style={{ 
                    width: `${category.score}%`,
                    background: getScoreColor(category.score)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <div className="summary-label">Aylık Gelir</div>
            <div className="summary-value">₺{Number(analytics.summary.income).toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="summary-icon">💸</div>
          <div className="summary-content">
            <div className="summary-label">Toplam Gider</div>
            <div className="summary-value">₺{Number(analytics.summary.totalExpenses).toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <div className="summary-card savings">
          <div className="summary-icon">🏦</div>
          <div className="summary-content">
            <div className="summary-label">Net Tasarruf</div>
            <div className="summary-value">₺{Number(analytics.summary.savings).toLocaleString('tr-TR')}</div>
            <div className="summary-subtitle">%{analytics.summary.savingsRate} tasarruf oranı</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        {/* Trend Chart */}
        <div className="analytics-card trend-chart">
          <div className="card-header">
            <h3>📈 6 Aylık Trend Analizi</h3>
          </div>
          <div className="card-body">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                  <XAxis dataKey="month" stroke="#7f8c8d" />
                  <YAxis stroke="#7f8c8d" />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a2e', 
                      border: '1px solid #2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => `₺${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#27ae60" 
                    strokeWidth={3} 
                    name="Gelir" 
                    dot={{ r: 5 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#e74c3c" 
                    strokeWidth={3} 
                    name="Gider" 
                    dot={{ r: 5 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#3498db" 
                    strokeWidth={3} 
                    name="Tasarruf" 
                    dot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-message">
                <p className="empty-icon">📊</p>
                <p className="empty-title">Henüz yeterli veri yok</p>
                <p className="empty-subtitle">En az 2 aylık veri gerekli</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="analytics-bottom-grid">
          {/* Top Expenses */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>💰 En Yüksek Harcamalar</h3>
            </div>
            <div className="card-body">
              {analytics.topExpenses.length > 0 ? (
                <div className="top-expenses-list">
                  {analytics.topExpenses.map((expense, index) => (
                    <div key={index} className="expense-item">
                      <div className="expense-rank">{index + 1}</div>
                      <div className="expense-details">
                        <div className="expense-name">
                          {expense.name}
                          <span className="expense-type">{expense.type}</span>
                        </div>
                        <div className="expense-amount">
                          ₺{Number(expense.amount).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="expense-percentage">{expense.percentage}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">Henüz harcama verisi yok</p>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          {analytics.topExpenses.length > 0 && (
            <div className="analytics-card">
              <div className="card-header">
                <h3>📊 Harcama Dağılımı</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.topExpenses}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percentage}) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {analytics.topExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a2e', 
                        border: '1px solid #2d3748',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                      formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>📊 Kategori Performansı</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#7f8c8d" 
                    tick={{ fontSize: 11 }} 
                    angle={-15} 
                    textAnchor="end" 
                    height={80} 
                  />
                  <YAxis stroke="#7f8c8d" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a2e', 
                      border: '1px solid #2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="score" fill="#667eea">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreditScoreDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}

      />
    </div>
  );
};

export default Analytics;