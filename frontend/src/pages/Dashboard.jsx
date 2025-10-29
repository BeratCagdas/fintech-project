import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import axios from "axios";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [riskLevel, setRiskLevel] = useState("medium");
  const [investmentType, setInvestmentType] = useState("kısa");
  const [financeData, setFinanceData] = useState({
    income: 10000,
    expenses: 4500,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUserData(res.data);
        setRiskLevel(res.data.riskProfile || "medium");
        setInvestmentType(res.data.investmentType || "kısa");
      } catch (err) {
        console.error(err);
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

  const savings = financeData.income - financeData.expenses;

  const getInvestmentAdvice = (risk, type) => {
    if (risk === "low") {
      return type === "kısa"
        ? "Kısa vadeli düşük riskli tahvil fonları önerilir."
        : "Orta-uzun vadede dengeli fonlar tercih edebilirsiniz.";
    }
    if (risk === "medium") {
      return type === "orta"
        ? "Orta vadeli hisse senedi ve tahvil dengesi önerilir."
        : "Uzun vadede hisse ağırlıklı yatırım uygun.";
    }
    if (risk === "high") {
      return "Uzun vadeli hisse senedi ve kripto gibi yüksek riskli yatırımlar önerilir.";
    }
    return "Yatırım önerisi yok.";
  };

  const advice = userData ? getInvestmentAdvice(userData.riskProfile, userData.investmentType) : "";

  return (
    <div className="dashboard-container">
      {userData ? (
        <section className="dashboard-section">
          {/* Sol sütun */}
          <div className="left-row">
            <div className="profile">
              <h2>Profil</h2>
              <p>Ad Soyad: {userData.name}</p>
              <p>Email: {userData.email}</p>
              <p>Risk Profili: {userData.riskProfile}</p>
              <p>Vade Tercihi: {userData.investmentType}</p>
              <button className="btn" onClick={() => setShowModal(true)}>
                Yatırım Tercihlerini Düzenle
              </button>
              <button className="btn logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {/* Sağ sütun */}
          <div className="right-row">
            <div className="top">
              <div className="cards-top">Gelir: {financeData.income}₺</div>
              <div className="cards-top">Gider: {financeData.expenses}₺</div>
            </div>

            <div className="bottom">
              <div className="cards-bottom">Tasarruf: {savings}₺</div>
              <div className="cards-bottom">AI Öneri: {advice}</div>
            </div>
          </div>
        </section>
      ) : (
        <p>Veri yükleniyor...</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Yatırım Tercihlerini Güncelle</h3>
            <label>Risk Profili:</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>

            <label>Vade Tercihi:</label>
            <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value)}>
              <option value="kısa">3-6 Ay</option>
              <option value="orta">6-12 Ay</option>
              <option value="uzun">1-3 Sene</option>
            </select>

            <button className="btn" onClick={handleSavePreferences}>
              Kaydet
            </button>
            <button className="btn cancel" onClick={() => setShowModal(false)}>
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
