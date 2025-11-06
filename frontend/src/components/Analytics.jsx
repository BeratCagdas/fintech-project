import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import "./Analytics.css";

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/user/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const getScoreColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Mükemmel';
    if (score >= 60) return 'İyi';
    if (score >= 40) return 'Orta';
    return 'Geliştirilmeli';
  };

  const categoryData = [
    { name: 'Gelir Yönetimi', score: analytics.categoryScores.incomeManagement },
    { name: 'Harcama Kontrolü', score: analytics.categoryScores.expenseControl },
    { name: 'Tasarruf Oranı', score: analytics.categoryScores.savingsRate },
    { name: 'Yatırım', score: analytics.categoryScores.investment },
    { name: 'Hedef Başarısı', score: analytics.categoryScores.goalAchievement }
  ];

  const COLORS = ['#667eea', '#764ba2', '#f39c12', '#e74c3c', '#27ae60', '#3498db'];

  // Trend data (örnek - gerçekte backend'den gelecek)
  const trendData = [
    { month: 'Oca', income: analytics.summary.income * 0.9, expenses: analytics.summary.totalExpenses * 0.85, savings: analytics.summary.savings * 0.95 },
    { month: 'Şub', income: analytics.summary.income * 0.92, expenses: analytics.summary.totalExpenses * 0.9, savings: analytics.summary.savings * 0.98 },
    { month: 'Mar', income: analytics.summary.income * 0.95, expenses: analytics.summary.totalExpenses * 0.92, savings: analytics.summary.savings * 1.0 },
    { month: 'Nis', income: analytics.summary.income * 0.98, expenses: analytics.summary.totalExpenses * 0.95, savings: analytics.summary.savings * 1.02 },
    { month: 'May', income: analytics.summary.income * 1.0, expenses: analytics.summary.totalExpenses * 0.98, savings: analytics.summary.savings * 1.05 },
    { month: 'Haz', income: analytics.summary.income, expenses: analytics.summary.totalExpenses, savings: analytics.summary.savings }
  ];

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h1>📊 Finansal Analytics</h1>
        <p>Gelir ve harcamalarınızın detaylı analizi</p>
      </div>

      {/* Health Score Section */}
      <div className="health-score-section">
        <div className="health-score-card">
          <div className="score-gauge">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#ecf0f1"
                strokeWidth="20"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={getScoreColor(analytics.healthScore)}
                strokeWidth="20"
                strokeDasharray={`${(analytics.healthScore / 100) * 251} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="score-value">
              <span className="score-number">{analytics.healthScore}</span>
              <span className="score-total">/100</span>
            </div>
          </div>
          <h2>Finansal Sağlık Puanınız</h2>
          <p className="score-label" style={{ color: getScoreColor(analytics.healthScore) }}>
            {getScoreLabel(analytics.healthScore)}
          </p>
          <div className="score-description">
            Finansal durumunuzun genel değerlendirmesi
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

      {/* Main Grid */}
      <div className="analytics-grid">
        {/* Trend Chart */}
        <div className="analytics-card wide">
          <div className="card-header">
            <h3>📈 6 Aylık Trend Analizi</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                <XAxis dataKey="month" stroke="#7f8c8d" />
                <YAxis stroke="#7f8c8d" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  formatter={(value) => `₺${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#27ae60" strokeWidth={3} name="Gelir" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="expenses" stroke="#e74c3c" strokeWidth={3} name="Gider" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="savings" stroke="#3498db" strokeWidth={3} name="Tasarruf" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                      <div className="expense-amount">₺{Number(expense.amount).toLocaleString('tr-TR')}</div>
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

        {/* Expense Distribution Pie Chart */}
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
                  <Tooltip formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Scores Bar Chart */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>📊 Kategori Performansı</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                <XAxis dataKey="name" stroke="#7f8c8d" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#7f8c8d" domain={[0, 100]} />
                <Tooltip />
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

      {/* Insights Section */}
      {analytics.insights.length > 0 && (
        <div className="insights-section">
          <h3>💡 Akıllı Öneriler ve İçgörüler</h3>
          <div className="insights-grid">
            {analytics.insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">{insight.icon}</div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Section */}
      <div className="comparison-section">
        <h3>📊 Finansal Karşılaştırma</h3>
        <div className="comparison-grid">
          <div className="comparison-card">
            <h4>Tasarruf Oranı</h4>
            <div className="comparison-values">
              <div className="comparison-item">
                <span className="comparison-label">Senin</span>
                <span className="comparison-value">{analytics.summary.savingsRate}%</span>
              </div>
              <div className="comparison-divider">vs</div>
              <div className="comparison-item">
                <span className="comparison-label">İdeal</span>
                <span className="comparison-value">20%+</span>
              </div>
            </div>
            {analytics.summary.savingsRate >= 20 ? (
              <div className="comparison-status success">✅ İdeal seviyedesin!</div>
            ) : (
              <div className="comparison-status warning">⚠️ İdeal seviyenin altındasın</div>
            )}
          </div>

          <div className="comparison-card">
            <h4>Harcama/Gelir Oranı</h4>
            <div className="comparison-values">
              <div className="comparison-item">
                <span className="comparison-label">Senin</span>
                <span className="comparison-value">{((analytics.summary.totalExpenses / analytics.summary.income) * 100).toFixed(0)}%</span>
              </div>
              <div className="comparison-divider">vs</div>
              <div className="comparison-item">
                <span className="comparison-label">İdeal</span>
                <span className="comparison-value">{'<'}80%</span>
              </div>
            </div>
            {(analytics.summary.totalExpenses / analytics.summary.income) <= 0.8 ? (
              <div className="comparison-status success">✅ Kontrol altındasın!</div>
            ) : (
              <div className="comparison-status warning">⚠️ Harcamalarını azaltmalısın</div>
            )}
          </div>

          <div className="comparison-card">
            <h4>Finansal Sağlık</h4>
            <div className="comparison-values">
              <div className="comparison-item">
                <span className="comparison-label">Senin</span>
                <span className="comparison-value">{analytics.healthScore}/100</span>
              </div>
              <div className="comparison-divider">vs</div>
              <div className="comparison-item">
                <span className="comparison-label">Hedef</span>
                <span className="comparison-value">80+</span>
              </div>
            </div>
            {analytics.healthScore >= 80 ? (
              <div className="comparison-status success">✅ Mükemmel durumdasın!</div>
            ) : analytics.healthScore >= 60 ? (
              <div className="comparison-status warning">💪 İyileştirme devam et!</div>
            ) : (
              <div className="comparison-status error">⚠️ Daha fazla çaba gerekli</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;