import React, { useState, useEffect } from "react";
import api from "../api/axios"; // ✅ axios yerine global api
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import "./Analytics.css";
import DarkModeToggle from "./DarkModeToggle";
import { Link, useNavigate } from "react-router-dom";

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

      // ✅ Artık backend URL'si otomatik belirlenecek
      const res = await api.get("/api/user/analytics", {
        headers: { Authorization: `Bearer ${token}` },
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
    if (score >= 80) return "#27ae60";
    if (score >= 60) return "#f39c12";
    return "#e74c3c";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Mükemmel";
    if (score >= 60) return "İyi";
    if (score >= 40) return "Orta";
    return "Geliştirilmeli";
  };

  const categoryData = [
    { name: "Gelir Yönetimi", score: analytics.categoryScores.incomeManagement },
    { name: "Harcama Kontrolü", score: analytics.categoryScores.expenseControl },
    { name: "Tasarruf Oranı", score: analytics.categoryScores.savingsRate },
    { name: "Yatırım", score: analytics.categoryScores.investment },
    { name: "Hedef Başarısı", score: analytics.categoryScores.goalAchievement },
  ];

  const COLORS = ["#667eea", "#764ba2", "#f39c12", "#e74c3c", "#27ae60", "#3498db"];

  const trendData = [
    { month: "Oca", income: analytics.summary.income * 0.9, expenses: analytics.summary.totalExpenses * 0.85, savings: analytics.summary.savings * 0.95 },
    { month: "Şub", income: analytics.summary.income * 0.92, expenses: analytics.summary.totalExpenses * 0.9, savings: analytics.summary.savings * 0.98 },
    { month: "Mar", income: analytics.summary.income * 0.95, expenses: analytics.summary.totalExpenses * 0.92, savings: analytics.summary.savings * 1.0 },
    { month: "Nis", income: analytics.summary.income * 0.98, expenses: analytics.summary.totalExpenses * 0.95, savings: analytics.summary.savings * 1.02 },
    { month: "May", income: analytics.summary.income * 1.0, expenses: analytics.summary.totalExpenses * 0.98, savings: analytics.summary.savings * 1.05 },
    { month: "Haz", income: analytics.summary.income, expenses: analytics.summary.totalExpenses, savings: analytics.summary.savings },
  ];

  return (
    <div className="analytics-container">
      {/* Header */}
      <header className="analytics-main-header">
        <div className="analytics-header-container">
          <div className="analytics-header-left-section">
            <div className="analytics-title-group">
              <h1 className="analytics-page-title">📊 Finansal Analytics</h1>
              <p className="analytics-page-subtitle">
                Gelir ve harcamalarınızın detaylı analizi
              </p>
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

      {/* Health Score Section */}
      <div className="health-score-section">
        <div className="health-score-card">
          <div className="score-gauge">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#ecf0f1" strokeWidth="20" />
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
                    background: getScoreColor(category.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* (Kalan render kısmı senin kodundakiyle aynı şekilde devam ediyor) */}
    </div>
  );
};

export default Analytics;
