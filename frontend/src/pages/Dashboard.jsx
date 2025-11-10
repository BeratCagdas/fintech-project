import PDFExport from "../components/PDFExport.jsx";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import "./Dashboard.css";
import api from "../api/axios"; // ✅ axios yerine global api kullanıyoruz
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
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const navigate = useNavigate();

  // === Kullanıcı verisini çek ===
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/user/profile", {
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

  // === Birikim & Geçmiş verilerini çek ===
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;

    const fetchCumulativeSavings = async () => {
      try {
        const res = await api.get("/api/monthly/cumulative-savings", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setCumulativeSavings(res.data.cumulativeSavings);
      } catch (err) {
        console.error("Cumulative savings error:", err);
      }
    };

    const fetchMonthlyHistory = async () => {
      try {
        const res = await api.get("/api/monthly/history", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMonthlyHistory(res.data.history || []);
      } catch (err) {
        console.error("History error:", err);
      }
    };

    fetchCumulativeSavings();
    fetchMonthlyHistory();
  }, []);

  // === Yeni aya geçiş işlemi ===
  const handleMonthlyReset = async () => {
    const confirmReset = window.confirm(
      "⚠️ Yeni aya geçmek istediğinize emin misiniz?\n\n" +
        "✅ Mevcut ay verileri geçmişe kaydedilecek\n" +
        "✅ Tasarruf toplam birikime eklenecek\n" +
        "✅ Gelir ve değişken giderler sıfırlanacak\n" +
        "✅ Recurring giderler korunacak"
    );
    if (!confirmReset) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;

    try {
      const res = await api.post(
        "/api/monthly/reset",
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (res.data.success) {
        alert(
          `🎉 Yeni aya geçildi!\n\n` +
            `📊 Geçen ay tasarruf: ₺${res.data.data.previousMonthSavings.toLocaleString(
              "tr-TR"
            )}\n` +
            `💎 Toplam birikim: ₺${res.data.data.cumulativeSavings.toLocaleString(
              "tr-TR"
            )}\n` +
            `🔄 Korunan gider sayısı: ${res.data.data.recurringExpensesKept}`
        );
        window.location.reload();
      }
    } catch (err) {
      console.error("Reset error:", err);
      alert("❌ Reset işlemi başarısız oldu!");
    }
  };

  // === Çıkış ===
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // === Tercihleri kaydet ===
  const handleSavePreferences = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;

    try {
      const res = await api.put(
        "/api/user/preferences",
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

  // === Yatırım önerisi oluştur ===
  const getInvestmentAdvice = (risk, type, savings) => {
    const savingsFormatted = savings.toLocaleString("tr-TR");

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

  // === Loading veya hata durumu ===
  if (loading) {
    return (
      <div className="loading-spinner">
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
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

  // === Hesaplamalar ===
  const income = userData.finance?.monthlyIncome || 0;
  const totalExpenses = userData.finance?.totalExpenses || 0;
  const savings = userData.finance?.savings || 0;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : 0;
  const advice = getInvestmentAdvice(
    userData.riskProfile,
    userData.investmentType,
    savings
  );

  const riskText = {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
  };

  // === Grafik verileri ===
  const trendData = [
    { month: "Oca", income: income * 0.9, expenses: totalExpenses * 0.85 },
    { month: "Şub", income: income * 0.95, expenses: totalExpenses * 0.9 },
    { month: "Mar", income: income, expenses: totalExpenses },
    { month: "Nis", income: income * 1.02, expenses: totalExpenses * 1.05 },
    { month: "May", income: income * 1.05, expenses: totalExpenses * 1.08 },
    { month: "Haz", income: income, expenses: totalExpenses },
  ];

  const pieData = [
    { name: "Tasarruf", value: Number(savingsRate), color: "#27ae60" },
    { name: "Gider", value: 100 - Number(savingsRate), color: "#e74c3c" },
  ];

  const chartData = monthlyHistory
    .slice(0, 6)
    .reverse()
    .map((month) => ({
      name: month.monthName,
      tasarruf: month.savings,
      gelir: month.income,
      gider: month.totalExpenses,
    }));

  // === JSX ===
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
            <Link to="/analytics" className="nav-link">
              <span className="icon">📈</span>
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

      {/* Main */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dash-main-header">
          <div className="dash-header-container">
            <div className="dash-header-left-section">
              <h1 className="dash-page-title">Dashboard</h1>
              <nav className="dash-navigation-menu">
                <Link to="/" className="dash-nav-item">🏠 Ana Sayfa</Link>
                <Link to="/manager" className="dash-nav-item">💰 Finans Manajer</Link>
                <Link to="/analytics" className="dash-nav-item">📊 Analytics</Link>
              </nav>
            </div>

            <div className="dash-header-right-section">
              <div className="dash-action-buttons">
                <button className="dash-action-btn" onClick={() => setShowHistory(!showHistory)}>📊 Geçmiş</button>
                <button className="dash-action-btn dash-reset-btn" onClick={handleMonthlyReset}>🗓️ Yeni Ay</button>
              </div>

              <div className="dash-utility-section">
                <DarkModeToggle />
                <div className="dash-user-profile">
                  <div className="dash-avatar-circle">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* İstatistik kartları */}
        <div className="stats-row">
          <div className="stat-card income">
            <div className="stat-icon">💵</div>
            <div className="stat-label">Aylık Gelir</div>
            <div className="stat-value">₺{income.toLocaleString("tr-TR")}</div>
          </div>

          <div className="stat-card expense">
            <div className="stat-icon">💸</div>
            <div className="stat-label">Gider</div>
            <div className="stat-value">₺{totalExpenses.toLocaleString("tr-TR")}</div>
          </div>

          <div className="stat-card savings">
            <div className="stat-icon">🏦</div>
            <div className="stat-label">Tasarruf</div>
            <div className="stat-value">₺{savings.toLocaleString("tr-TR")}</div>
          </div>

          <div className="stat-card cumulative">
            <div className="stat-icon">💎</div>
            <div className="stat-label">Toplam Birikim</div>
            <div className="stat-value">₺{cumulativeSavings.toLocaleString("tr-TR")}</div>
          </div>
        </div>

        {/* Grafikler */}
        {showHistory && (
          <div className="history-section">
            <h3>📊 Aylık Geçmiş</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `₺${v.toLocaleString("tr-TR")}`} />
                <Line type="monotone" dataKey="tasarruf" stroke="#10b981" />
                <Line type="monotone" dataKey="gelir" stroke="#3b82f6" />
                <Line type="monotone" dataKey="gider" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="ai-card">
          <AIInvestmentAdvice />
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="calculator-hub-cta-button-dashboard" onClick={() => setIsCalculatorHubOpen(true)}>
            🧮 Hesaplama Araçları
          </button>
        </div>
      </main>

      {/* Calculator Modal */}
      <CalculatorHub isOpen={isCalculatorHubOpen} onClose={() => setIsCalculatorHubOpen(false)} />

      {/* Tercih Modalı */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>⚙️ Yatırım Tercihlerini Güncelle</h3>
            <div className="modal-field">
              <label>Risk Profili:</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Vade:</label>
              <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value)}>
                <option value="kısa">3-6 Ay</option>
                <option value="orta">6-12 Ay</option>
                <option value="uzun">1-3 Sene</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSavePreferences}>✅ Kaydet</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>❌ İptal</button>
            </div>
          </div>
        </div>
      )}

      <div><GoalsTracker /></div>
    </div>
  );
}

export default Dashboard;
