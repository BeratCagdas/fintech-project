import PDFExport from "../components/PDFExport.jsx";
import { fetchBudgetLimits, fetchBudgetStatus, updateBudgetLimits } from '../services/budgetService';
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./Dashboard.css";
import api from "../api";
import CalculatorHub from "../components/CalculatorHub";
import GoalsTracker from "./GoalsTracker";
import AIInvestmentAdvice from "../components/AIInvestmentAdvice.jsx";
import DarkModeToggle from "../components/DarkModeToggle.jsx";
import MilestoneNotification from '../components/MilestoneNotification';
import { fetchUnseenMilestones, markMilestonesAsSeen, fetchAchievementStats } from '../services/milestoneService';
import AchievementsModal from '../components/AchievementsModal';
import UpcomingPayments from '../components/UpcomingPayments';
import SmartInsights from '../components/SmartInsights';
import { useOnboarding } from '../context/OnboardingContext';
import AnomalySystem from '../components/AnomalySystem';
import ForecastCards from '../components/ForecastCards';
import ForecastWarnings from '../components/ForecastWarnings';
import ProfileModal from '../components/ProfileModal';
import WhatIfScenario from '../components/WhatIfScenario';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

function Dashboard() {
  const MySwal = withReactContent(Swal);
  const { recheckOnboarding } = useOnboarding();
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
  const [detailExpenses, setDetailExpenses] = useState({ fixed: [], variable: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Yükleniyor durumu
  const [budgetLimits, setBudgetLimits] = useState({ variable: {}, fixed: {} });
  const [budgetStatus, setBudgetStatus] = useState({ variable: {}, fixed: {} });
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [milestoneQueue, setMilestoneQueue] = useState([]);   
  const [achievementStats, setAchievementStats] = useState({
  totalMilestones: 0,
  currentStreak: 0,
  longestStreak: 0,
  latestMilestone: null
});
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [chartFilter, setChartFilter] = useState('6months');
  const [chartData, setChartData] = useState([]);
  const [forecastWarnings, setForecastWarnings] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Debug: Forecast warnings değiştiğinde log
  useEffect(() => {
    console.log('📢 Forecast warnings state updated:', forecastWarnings);
  }, [forecastWarnings]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [anomaliesChecked, setAnomaliesChecked] = useState(false); // ✅ Kontrol durumu
  const [showWhatIfModal, setShowWhatIfModal] = useState(false); // ✅ What-If Modal state
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

        // ✅ Yeni kullanıcı için onboarding kontrolü
        await recheckOnboarding();

        // ✅ Dashboard açılınca anomalileri kontrol et (Sync & Detect)
        try {
          await api.post('/api/monthly/check-anomalies');
        } catch (e) {
          console.error('Anomaly check failed:', e);
        }
        setAnomaliesChecked(true); // Hata olsa bile sistemi aç

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
  }, [navigate, recheckOnboarding]);
    
useEffect(() => {
  const fetchCumulativeSavings = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) return;
    
    try {
      const res = await api.get('/api/monthly/cumulative-savings');
      if (res.data) {
        setCumulativeSavings(res.data.cumulativeSavings || 0);
      }
    } catch (err) {
      console.error('Cumulative savings error:', err);
    }
  };
  
const fetchMonthlyHistory = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) return;

  try {
    // 1. İSTEK AT
    const res = await api.get('/api/monthly/history');
    
    // API'den gelen veriyi al
    const historyData = res.data.history || [];

    // 2. TABLO İÇİN STATE GÜNCELLE
    // (Backend zaten 'income', 'totalExpenses' gibi doğru key'leri gönderiyor)
    setMonthlyHistory(historyData);

    // 3. GRAFİK İÇİN VERİYİ HAZIRLA
    // Backend veriyi "En yeni en üstte" gönderir.
    // Grafik için bunu "reverse()" ile ters çevirip (Eskiden Yeniye) ayarlıyoruz.
    const chartDataFormatted = [...historyData]
      .reverse() 
      .map(item => ({
        name: `${item.monthName.substring(0, 3)} ${item.year}`, // Örn: "Oca 2025"
        tasarruf: item.savings,
        gelir: item.income,
        gider: item.totalExpenses
      }));

    setChartData(chartDataFormatted);

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
  checkForMilestones(); 
  loadAchievementStats();
  
}, []);

const handleMonthlyReset = async () => {
  // 🛡️ KORUMA 1: Tarihe Göre Kontrol (Sadece Ayın İlk 3 Günü)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const isProduction = window.location.hostname !== 'localhost';

  // Production'da sadece ayın 1-3'ünde çalışsın
  if (isProduction && dayOfMonth > 3) {
    await MySwal.fire({
      title: '<span style="color: #fff">🚫 Ay Kapatma Dönemi Geçti</span>',
      html: `
        <div style="color: #cbd5e1; line-height: 1.6;">
          <p>Ay kapatma işlemi sadece ayın <strong>ilk 3 gününde</strong> yapılabilir.</p>
          <p style="margin-top: 10px;">Bugün: ${today.getDate()} ${today.toLocaleDateString('tr-TR', { month: 'long' })}</p>
          <p style="margin-top: 10px; font-size: 0.9rem; color: #94a3b8;">Bir sonraki fırsat: 1-3 ${new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString('tr-TR', { month: 'long' })}</p>
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'Tamam',
      background: '#1e293b',
      confirmButtonColor: '#3b82f6'
    });
    return;
  }

  // 🛡️ KORUMA 2: Son reset'ten beri en az 28 gün geçmiş olmalı
  try {
    const historyRes = await api.get('/api/monthly/history');
    if (historyRes.data.success && historyRes.data.history.length > 0) {
      const lastReset = new Date(historyRes.data.history[0].month + '-01');
      const daysSinceReset = Math.floor((today - lastReset) / (1000 * 60 * 60 * 24));

      if (daysSinceReset < 28) {
        await MySwal.fire({
          title: '<span style="color: #fff">⏰ Çok Erken!</span>',
          html: `
            <div style="color: #cbd5e1; line-height: 1.6;">
              <p>Son ay kapatmadan sadece <strong>${daysSinceReset} gün</strong> geçti.</p>
              <p style="margin-top: 10px;">En az <strong>28 gün</strong> beklemelisiniz.</p>
              <p style="margin-top: 10px; font-size: 0.9rem; color: #94a3b8;">Kalan: ${28 - daysSinceReset} gün</p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Anladım',
          background: '#1e293b',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }
  } catch (err) {
    // History check skipped
  }

  // 1. ADIM: PROFESYONEL ONAY EKRANI
  const confirmResult = await MySwal.fire({
    // Başlık
  
    // İçerik: Büyük İkon + Liste
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; color: #cbd5e1; margin-bottom: 20px;">
        <div style="font-size: 4rem; margin-bottom: 10px;">⚠️</div> 
        <p style="font-size: 1rem;">Bu işlem geri alınamaz. Onaylıyor musunuz?</p>
      </div>

      <div style="background: #27273a; padding: 20px; border-radius: 12px; text-align: left;">
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
          <li style="display: flex; align-items: center; gap: 10px; color: #fff;">
            <span><b>Veriler</b> geçmişe arşivlenir</span>
          </li>
          <li style="display: flex; align-items: center; gap: 10px; color: #fff;">
             <span><b>Tasarruf</b> birikime eklenir</span>
          </li>
          <li style="display: flex; align-items: center; gap: 10px; color: #fff;">
            <span><b>Anlık harcamalar</b> sıfırlanır</span>
          </li>
          <li style="display: flex; align-items: center; gap: 10px; color: #fff;">
            <span><b>Tekrarlayan Giderler</b> korunur</span>
          </li>
        </ul>
      </div>
    `,
    background: '#1e1e2d', 
    showCancelButton: true,
    confirmButtonText: 'Evet', 
    cancelButtonText: 'Hayır',
    confirmButtonColor: '#3b82f6', 
    cancelButtonColor: '#ef4444', 
    reverseButtons: true, // Vazgeç solda
    allowOutsideClick: false,
    
   
    didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const cancelBtn = Swal.getCancelButton();
        
 
        if(confirmBtn) {
            confirmBtn.style.padding = '14px 30px';
            confirmBtn.style.fontSize = '1.1rem';
            confirmBtn.style.fontWeight = 'bold';
        }
       
        if(cancelBtn) {
            cancelBtn.style.padding = '14px 30px';
            cancelBtn.style.fontSize = '1.1rem';
            cancelBtn.style.fontWeight = 'bold';
        }
    }
  });

  // Kullanıcı vazgeçerse işlemi durdur
  if (!confirmResult.isConfirmed) return;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) return;

  try {
    // API İSTEĞİ
    const res = await api.post('/api/monthly/reset', {});

    if (res.data.success) {
      const data = res.data.data;

      // 2. ADIM: BAŞARI EKRANI
      await MySwal.fire({
        title: '<span style="color: #fff">Yeni aya başarıyla geçiş yaptınız.</span>',
        html: `
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
            
            <div style="background: #2b2b40; padding: 12px; border-radius: 10px; border-left: 4px solid #4ade80; display: flex; justify-content: space-between; align-items: center;">
               <span style="color: #cbd5e1; font-size: 0.9rem;">Geçen Ay Tasarruf</span>
               <span style="color: #4ade80; font-weight: bold; font-size: 1.1rem;">₺${data.previousMonthSavings.toLocaleString('tr-TR')}</span>
            </div>

            <div style="background: #2b2b40; padding: 12px; border-radius: 10px; border-left: 4px solid #60a5fa; display: flex; justify-content: space-between; align-items: center;">
               <span style="color: #cbd5e1; font-size: 0.9rem;">Toplam Birikim</span>
               <span style="color: #60a5fa; font-weight: bold; font-size: 1.1rem;"> ₺${data.cumulativeSavings.toLocaleString('tr-TR')}</span>
            </div>

            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; background: #27273a; padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.2rem;">🔄</div>
                    <div style="color: #fff; font-weight: bold;">${data.recurringExpensesKept}</div>
                    <div style="color: #94a3b8; font-size: 0.75rem;">Gider Korundu</div>
                </div>
                
                ${data.currentStreak > 0 ? `
                <div style="flex: 1; background: #27273a; padding: 10px; border-radius: 8px; text-align: center; border: 1px solid #f59e0b;">
                    <div style="font-size: 1.2rem;">🔥</div>
                    <div style="color: #f59e0b; font-weight: bold;">${data.currentStreak} Ay</div>
                    <div style="color: #94a3b8; font-size: 0.75rem;">Seri Devam Ediyor</div>
                </div>` : ''}
            </div>

            ${data.newMilestones?.length > 0 ? `
              <div style="margin-top: 5px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 6px; color: #fbbf24; font-weight: bold; animation: pulse 2s infinite;">
                 🏆 Yeni Başarım: ${data.newMilestones[0]}
              </div>
            ` : ''}

          </div>
        `,
        icon: 'success',
        iconColor: '#4ade80',
        background: '#1e1e2d',
        confirmButtonText: 'Harika, Devam Et',
        confirmButtonColor: '#10b981',
        allowOutsideClick: false
      });

      // --- İşlem tamamlandıktan sonra ---

      // Milestone kuyruğunu ayarla
      const allMilestones = [
        ...(data.newMilestones || []),
        ...(data.streakMilestones || [])
      ];

      if (allMilestones.length > 0) {
        setMilestoneQueue(allMilestones);
        setCurrentMilestone(allMilestones[0]);
      }

      // Sayfayı yenile
      window.location.reload();
    }

  } catch (err) {
    console.error('Reset error:', err);
    
    // Hata Mesajı
    MySwal.fire({
      icon: 'error',
      title: 'Bir Sorun Oluştu',
      text: 'Yeni aya geçiş yapılamadı, lütfen tekrar deneyin.',
      background: '#1e1e2d',
      color: '#fff',
      confirmButtonColor: '#ef4444'
    });
  }
};


  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };
  const checkForMilestones = async () => {
  try {
    const milestones = await fetchUnseenMilestones();
    
    if (milestones.length > 0) {
      setMilestoneQueue(milestones);
      setCurrentMilestone(milestones[0]); // İlkini göster
    }
  } catch (error) {
    console.error('Milestone kontrolü hatası:', error);
  }
};
const loadAchievementStats = async () => {
  try {
    const stats = await fetchAchievementStats();
    
    if (stats && stats.success) {
      // En son kazanılan milestone'u bul
      const sortedMilestones = stats.milestones
        ?.filter(m => m.seen)
        ?.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
      
      const latestMilestone = sortedMilestones?.[0] || null;
      
      setAchievementStats({
        totalMilestones: stats.stats.totalMilestones || 0,
        currentStreak: stats.stats.currentStreak || 0,
        longestStreak: stats.stats.longestStreak || 0,
        latestMilestone: latestMilestone
      });
    }
  } catch (error) {
    console.error('Achievement stats yüklenemedi:', error);
  }
};
// Milestone kuyruğunu işle
const handleMilestoneClose = async () => {
  if (!currentMilestone) return;
  
  try {
    // Bu milestone'u görüldü olarak işaretle
    await markMilestonesAsSeen([currentMilestone.type]);
    
    // Kuyruktan çıkar
    const remaining = milestoneQueue.slice(1);
    setMilestoneQueue(remaining);
    
    // Sonraki milestone varsa göster
    if (remaining.length > 0) {
      setTimeout(() => {
        setCurrentMilestone(remaining[0]);
      }, 500); // Kısa delay
    } else {
      setCurrentMilestone(null);
    }
  } catch (error) {
    console.error('Milestone işaretleme hatası:', error);
    setCurrentMilestone(null);
  }
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

  // ✅ YENİ: Dynamic chart data based on filter
  const getFilteredData = () => {
    if (monthlyHistory.length === 0) {
      // Eğer geçmiş yoksa, sadece bu ayı göster
      return [{
        month: 'Bu Ay',
        income: income,
        expenses: totalExpenses,
        savings: savings
      }];
    }

    const monthCount = chartFilter === '3months' ? 3 : chartFilter === '12months' ? 12 : 6;

    // Son N ayı al, ters çevir (eski -> yeni sıralama)
    const historyData = monthlyHistory
      .slice(0, Math.min(monthCount, monthlyHistory.length))
      .reverse()
      .map((month, index) => {
        return {
          month: month.monthName?.substring(0, 3) || `Ay ${index + 1}`,
          income: month.income || 0,
          expenses: month.totalExpenses || 0,
          savings: month.savings || 0
        };
      });

    // Eğer mevcut ay henüz history'de değilse, onu da ekle
    const currentMonthInHistory = monthlyHistory.some(m => {
      const historyDate = new Date(m.month);
      const now = new Date();
      return historyDate.getMonth() === now.getMonth() &&
             historyDate.getFullYear() === now.getFullYear();
    });

    if (!currentMonthInHistory && income > 0) {
      historyData.push({
        month: 'Bu Ay',
        income: income,
        expenses: totalExpenses,
        savings: savings
      });
    }

    return historyData;
  };

  const trendData = getFilteredData();

  const pieData = [
    { name: 'Tasarruf', value: Number(savingsRate), color: 'var(--accent-green)' },
    { name: 'Gider', value: 100 - Number(savingsRate), color: 'var(--accent-red)' },
  ];


    
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

  const getUserId = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const userObj = JSON.parse(userStr);
      return userObj.id || userObj._id;
    } catch (e) {
      return null;
    }
  };

const fetchMonthDetails = async (monthString) => {
  setIsLoadingDetails(true);
  // Önce içini boşalt ki eski veriler görünmesin
  setDetailExpenses({ fixed: [], variable: [] }); 

  try {
    // Backend endpoint'imiz
    const res = await api.get(`/api/monthly/history/details?month=${monthString}`);
    
    if (res.data.success) {
      setDetailExpenses({
        fixed: res.data.data.fixedExpenses || [],
        variable: res.data.data.variableExpenses || []
      });
    }
  } catch (err) {
    console.error("Detay çekme hatası:", err);
  } finally {
    setIsLoadingDetails(false);
  }
};




return (
  <div className="dashboard-container">
    {/* Sidebar */}
    <aside className="sidebar">
      <div className="logo">💰 FinTech</div>
      
      <ul className="sidebar-nav">
        <li className="nav-item">
          <a href="#" className="nav-link active">
            <span className="icon">📊 </span>
            <span>Dashboard</span>
          </a>
        </li>
          
         <li className="nav-item">
          <Link to="/net-worth" className="nav-link">
            <span className="icon">💳</span>
            <span>Cüzdan</span>
          </Link>
        </li>
        
    
       
        <li className="nav-item">
          <Link to="/settings" className="nav-link">
            <span className="icon">⚙️</span>
            <span>Ayarlar</span>
          </Link>
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
            <span>Analiz</span>
          </Link>
        </li>
        <li className="nav-item">
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              setShowWhatIfModal(true);
            }}
          >
            <span className="icon">🔮</span>
            <span>What-If Analizi</span>
          </a>
        </li>
            <li className="nav-item">
                     <a 
               href="#" 
               className="nav-link"
               onClick={(e) => {
               e.preventDefault();
               setShowAchievements(true);
                     }}
         >
         <span className="icon">🏆</span>
         <span>Başarılarım</span>
         {achievementStats.totalMilestones > 0 && (
         <span className="nav-badge">{achievementStats.totalMilestones}</span>
          )}
             </a>
          </li>
          <li className="nav-item">
             <a 
             href="#" 
            className="nav-link"
            onClick={(e) => {
            e.preventDefault();
            setShowGoals(true);
    }}
  >
    <span className="icon">🎯</span>
    <span>Hedeflerim</span>
  </a>
      </li>
        <li className="nav-item">
          {userData && <PDFExport userData={userData} />}
        </li>
        <li className="nav-item">
          <AIInvestmentAdvice />
        </li>
      </ul>
       
      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <a href="#" className="nav-link" onClick={handleLogout}>
          <span className="icon">🚪</span>
          <span>Çıkış Yap</span>
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
                  Analiz
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
                <div
                  className="dash-notification-badge"
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <span className="dash-notification-icon">🔔</span>
                  {forecastWarnings.length > 0 && (
                    <span className="notification-count">{forecastWarnings.length}</span>
                  )}
                </div>
                <div
                  className="dash-user-profile"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
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
               <UpcomingPayments />
               <SmartInsights />
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
                             // 1. Özet bilgileri (Gelir, Gider, Tasarruf) hemen göster
                            setSelectedMonth(month);
    
                          // 2. Modalı aç (İçeride 'Yükleniyor...' dönecek)
                          setShowMonthDetail(true);
    
                        // 3. API'ye git ve detaylı harcama listesini çek ("2025-01" ile)
                       fetchMonthDetails(month.month); 
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
          {/* Main Content */}
          <div className="dashboard-main-content">
            <div className="chart-card premium-chart">
            <div className="card-header">
              <h3 className="card-title">📊 Finansal Trend</h3>
              <div className="card-actions">
                <select
                  className="chart-filter-select"
                  value={chartFilter}
                  onChange={(e) => setChartFilter(e.target.value)}
                >
                  <option value="3months">Son 3 Ay</option>
                  <option value="6months">Son 6 Ay</option>
                  <option value="12months">Son 12 Ay</option>
                </select>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--dark-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      padding: '12px'
                    }}
                    formatter={(value, name) => {
                      const label = name === 'income' ? 'Gelir' : name === 'expenses' ? 'Gider' : name;
                      return [`₺${value.toLocaleString('tr-TR')}`, label];
                    }}
                    labelStyle={{
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="var(--accent-green)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--accent-green)', r: 6, strokeWidth: 2, stroke: 'var(--dark-card)' }}
                    activeDot={{ r: 8 }}
                    name="Gelir"
                    fill="url(#colorIncome)"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--accent-red)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--accent-red)', r: 6, strokeWidth: 2, stroke: 'var(--dark-card)' }}
                    activeDot={{ r: 8 }}
                    name="Gider"
                    fill="url(#colorExpense)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash Flow Forecast Cards */}
          <div className="spending-stats-card">
            <div className="card-header">
              <h3 className="card-title">🔮 Nakit Akışı Tahmini</h3>
            </div>
            <ForecastCards onWarnings={(warnings) => {
              console.log('🎯 Dashboard received warnings:', warnings);
              setForecastWarnings(warnings);
            }} />

            {/* Forecast Warnings - Sadece bir sonraki ayın uyarıları 
            {forecastWarnings && forecastWarnings.length > 0 && (
              <ForecastWarnings warnings={forecastWarnings} />
            )}
              */}
          </div>
          </div>

          {/* Sidebar */}
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
                <button className="dash-btn-primary" onClick={() => setShowProfileDropdown(true)}>
                  Düzenle
                </button>
                <button className="dash-btn-secondary" onClick={() => navigate('/settings')}>Ayarlar</button>
              </div>
            </div>
          </div>
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

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <h3>🔔 Bildirimler</h3>
              <button className="dash-close-notifications" onClick={() => setShowNotifications(false)}>✕</button>
            </div>
            <div className="notifications-body">
              {forecastWarnings.length === 0 ? (
                <div className="no-notifications">
                  <span style={{ fontSize: '2rem' }}>✓</span>
                  <p>Yeni bildirim yok</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {forecastWarnings.map((warning, index) => (
                    <div key={index} className={`notification-item severity-${warning.severity}`}>
                      <div className="notification-icon">
                        {warning.severity === 'critical' ? '🔴' : warning.severity === 'warning' ? '🟠' : '🟡'}
                      </div>
                      <div className="notification-content">
                        <div className="notification-message">{warning.message}</div>
                        <div className="notification-meta">
                          <span className="notification-month">{warning.month}</span>
                          {warning.amount && (
                            <span className="notification-amount">
                              ₺{Math.abs(warning.amount).toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Dropdown */}
        {showProfileDropdown && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-header">
              <div className="profile-dropdown-user">
                <div className="profile-dropdown-avatar">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-dropdown-info">
                  <h4>{userData.name}</h4>
                  <p>{userData.email}</p>
                </div>
              </div>
              <button className="dash-close-profile" onClick={() => setShowProfileDropdown(false)}>✕</button>
            </div>

            <div className="profile-dropdown-body">
              <ProfileModal
                isOpen={true}
                onClose={() => {}}
                userData={userData}
                onUpdate={(updatedUser) => {
                  setUserData(updatedUser);
                  setRiskLevel(updatedUser.riskProfile || 'medium');
                  setInvestmentType(updatedUser.investmentType || 'kısa');
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Month Detail Modal */}
{showMonthDetail && selectedMonth && (
  <div className="dash-month-detail-modal">
    <div className="dash-month-detail-overlay" onClick={() => setShowMonthDetail(false)}></div>
    <div className="dash-month-detail-content">
      
      {/* HEADER */}
      <div className="dash-month-detail-header">
        <h2>📊 {selectedMonth.monthName} {selectedMonth.year} - Detaylı Analiz</h2>
        <button className="dash-month-detail-close-btn" onClick={() => setShowMonthDetail(false)}>X</button>
      </div>

      <div className="dash-month-detail-body">
        
        {/* 1. ÖZET KARTLARI (Veri Kaynağı: selectedMonth - Listeden gelen hazır veri) */}
        <div className="dash-month-summary-cards">
          <div className="dash-month-summary-card income">
            <div className="dash-month-summary-info">
              <div className="dash-month-summary-label">Toplam Gelir</div>
              <div className="dash-month-summary-value">₺{selectedMonth.income.toLocaleString('tr-TR')}</div>
            </div>
          </div>
          <div className="dash-month-summary-card expense">
            <div className="dash-month-summary-info">
              <div className="dash-month-summary-label">Toplam Gider</div>
              <div className="dash-month-summary-value">₺{selectedMonth.totalExpenses.toLocaleString('tr-TR')}</div>
            </div>
          </div>
          <div className="dash-month-summary-card savings">
            <div className="dash-month-summary-info">
              <div className="dash-month-summary-label">Tasarruf</div>
              <div className="dash-month-summary-value">₺{selectedMonth.savings.toLocaleString('tr-TR')}</div>
            </div>
          </div>
        </div>

        {/* 2. KATEGORİ KIRILIMI (Veri Kaynağı: detailExpenses - API'den yeni gelen veri) */}
        <div className="dash-month-category-breakdown">
          <h3>📂 Kategoriye Göre Harcamalar</h3>
          
          {isLoadingDetails ? (
            <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>
              Veriler yükleniyor... ⏳
            </div>
          ) : (
            <>
              {/* SABİT GİDERLER */}
              {detailExpenses.fixed && detailExpenses.fixed.length > 0 ? (
                <div className="dash-month-expense-group">
                  <h4>📌 Sabit Giderler</h4>
                  <div className="dash-month-category-list">
                    {(() => {
                      // Helper fonksiyonunun çalıştığını varsayıyorum
                      const fixedTotals = getCategoryTotals(detailExpenses.fixed);
                      return Object.entries(fixedTotals).map(([category, amount]) => (
                        <div key={category} className="dash-month-category-item">
                          <div className="dash-month-category-left">
                            <span className="dash-month-category-icon">{getCategoryIcon(category)}</span>
                            <span className="dash-month-category-name">{getCategoryLabel(category)}</span>
                          </div>
                          <span className="dash-month-category-amount">₺{amount.toLocaleString('tr-TR')}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <div style={{padding: '10px', color: '#64748b', fontStyle: 'italic'}}>Bu ay sabit gider bulunamadı.</div>
              )}

              {/* DEĞİŞKEN GİDERLER */}
              {detailExpenses.variable && detailExpenses.variable.length > 0 ? (
                <div className="dash-month-expense-group">
                  <h4>🛒 Değişken Giderler</h4>
                  <div className="dash-month-category-list">
                    {(() => {
                      const variableTotals = getCategoryTotals(detailExpenses.variable);
                      return Object.entries(variableTotals).map(([category, amount]) => (
                        <div key={category} className="dash-month-category-item">
                          <div className="dash-month-category-left">
                            <span className="dash-month-category-icon">{getCategoryIcon(category)}</span>
                            <span className="dash-month-category-name">{getCategoryLabel(category)}</span>
                          </div>
                          <span className="dash-month-category-amount">₺{amount.toLocaleString('tr-TR')}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <div style={{padding: '10px', color: '#64748b', fontStyle: 'italic'}}>Bu ay değişken gider bulunamadı.</div>
              )}
            </>
          )}
        </div>

        {/* 3. KARŞILAŞTIRMA BÖLÜMÜ (NOT: Şimdilik sadece özet var, detay yoksa gizler) */}
        {(() => {
          // Önceki ayı bul
          const currentIndex = monthlyHistory.findIndex(m => m.month === selectedMonth.month);
          const previousMonth = currentIndex < monthlyHistory.length - 1 ? monthlyHistory[currentIndex + 1] : null;
          
          // Eğer önceki ayın DETAYLARI elimizde yoksa (yeni sistemde fetch etmediğimiz sürece yok),
          // Burası hata vermesin diye kontrol ekledik.
          // İleride "Karşılaştır" diye ayrı bir API yazarsak burayı açarız.
          if (previousMonth && previousMonth.variableExpenses && previousMonth.variableExpenses.length > 0) {
             // ... Eski karşılaştırma kodun burada kalabilir ...
             const comparison = compareWithPreviousMonth(selectedMonth, previousMonth);
             return (
               <div className="dash-month-comparison-section">
                 {/* ... Senin mevcut kodların ... */}
               </div>
             )
          }
          // Veri yoksa gösterme (Güvenli Mod)
          return null;
        })()}

      </div>
    </div>
  </div>
)}

      {/* Budget Settings Modal */}
      {showBudgetSettings && (
        <div className="modal-overlay" onClick={() => setShowBudgetSettings(false)}>
          <div className="modal-content budget-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2> Bütçe Yönetimi</h2>
              <button className="budget-close-modal-btn" onClick={() => setShowBudgetSettings(false)}>✕</button>
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
 
       <AchievementsModal
      isOpen={showAchievements}
      onClose={() => setShowAchievements(false)}
      achievementStats={achievementStats}
      cumulativeSavings={cumulativeSavings}
/>
    {/* Goals Modal */}
{showGoals && (
  <div className="goals-tracker-modal-overlay">
    <div className="goals-tracker-modal-backdrop" onClick={() => setShowGoals(false)}></div>
    <div className="goals-tracker-modal-wrapper">
      <div className="goals-tracker-modal-header">
        <h2>🎯 Hedeflerim</h2>
        <button 
          className="goals-tracker-close-btn" 
          onClick={() => setShowGoals(false)}
        >
          ✕
        </button>
      </div>
      <div className="goals-tracker-modal-content">
        <GoalsTracker />
      </div>
    </div>
  </div>
)}
        {/* Anomaly System Component */}
        {/* ✅ Sadece kontrol bittikten sonra göster (Race condition önlemek için) */}
        {anomaliesChecked && <AnomalySystem userId={getUserId()} />}

        {/* What-If Scenario Modal */}
        {showWhatIfModal && (
          <WhatIfScenario onClose={() => setShowWhatIfModal(false)} />
        )}

        {/* Cash Flow Forecast Component For Notifications section*/}
    </div>
  );
}

export default Dashboard;