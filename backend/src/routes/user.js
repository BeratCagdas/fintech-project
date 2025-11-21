import User from "../models/User.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js"; 
import { registerUser, loginUser } from "../controllers/authController.js";
import { checkAndAwardMilestones } from '../services/milestoneService.js';

const router = express.Router();

// ✅ Profil bilgilerini getir (finans hesaplamaları ile)
router.get("/profile", protect, async (req, res) => {
  try {
    const user = req.user;

    // Toplam sabit giderleri hesapla
    const totalFixedExpenses = user.finance?.fixedExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    // Toplam değişken giderleri hesapla
    const totalVariableExpenses = user.finance?.variableExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    const monthlyIncome = user.finance?.monthlyIncome || 0;
    const savings = monthlyIncome - totalExpenses;
    
    // Kullanıcı bilgilerini finans detayları ile birlikte gönder
    res.json({
      name: user.name,
      email: user.email,
      riskProfile: user.riskProfile,
      investmentType: user.investmentType,
      finance: {
        monthlyIncome,
        fixedExpenses: user.finance?.fixedExpenses || [],
        variableExpenses: user.finance?.variableExpenses || [],
        goals: user.finance?.goals || [],
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Profile GET hatası:", error);
    res.status(500).json({ message: "Profil bilgileri alınamadı" });
  }
});

// ✅ YENİ: Profil güncelle (POST) - Onboarding için
router.post("/update-profile", protect, async (req, res) => {
  try {
    const { riskProfile, investmentType } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    if (riskProfile) user.riskProfile = riskProfile;
    if (investmentType) user.investmentType = investmentType;
    
    await user.save();

    res.json({
      success: true,
      message: "Profil güncellendi",
      user: {
        riskProfile: user.riskProfile,
        investmentType: user.investmentType
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Profil güncellenemedi" });
  }
});

// ✅ YENİ: Finans güncelle (POST) - Onboarding için
router.post("/update-finance", protect, async (req, res) => {
  try {
    const { monthlyIncome } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    if (monthlyIncome !== undefined) {
      user.finance.monthlyIncome = parseFloat(monthlyIncome) || 0;
    }
    
    user.markModified('finance');
    await user.save();

    res.json({
      success: true,
      message: "Finans güncellendi",
      finance: {
        monthlyIncome: user.finance.monthlyIncome
      }
    });
  } catch (error) {
    console.error("Update finance error:", error);
    res.status(500).json({ success: false, message: "Finans güncellenemedi" });
  }
});

// ✅ YENİ: Sabit gider ekle - Sample data için
router.post("/add-fixed-expense", protect, async (req, res) => {
  try {
    const { name, amount, category, isRecurring } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    const newExpense = {
      name,
      amount: parseFloat(amount) || 0,
      category: category || 'diger',
      isRecurring: isRecurring || false,
      isActive: true,
      createdAt: new Date()
    };

    user.finance.fixedExpenses.push(newExpense);
    user.markModified('finance');
    await user.save();

    res.json({
      success: true,
      message: "Sabit gider eklendi",
      expense: newExpense
    });
  } catch (error) {
    console.error("Add fixed expense error:", error);
    res.status(500).json({ success: false, message: "Gider eklenemedi" });
  }
});

// ✅ YENİ: Değişken gider ekle - Sample data için
router.post("/add-variable-expense", protect, async (req, res) => {
  try {
    const { name, amount, category } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    const newExpense = {
      name,
      amount: parseFloat(amount) || 0,
      category: category || 'diger',
      createdAt: new Date()
    };

    user.finance.variableExpenses.push(newExpense);
    user.markModified('finance');
    await user.save();

    res.json({
      success: true,
      message: "Değişken gider eklendi",
      expense: newExpense
    });
  } catch (error) {
    console.error("Add variable expense error:", error);
    res.status(500).json({ success: false, message: "Gider eklenemedi" });
  }
});

// ✅ Profil bilgilerini güncelle (PUT)
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    const totalFixedExpenses = user.finance?.fixedExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    ) || 0;

    const totalVariableExpenses = user.finance?.variableExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    ) || 0;

    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    const monthlyIncome = user.finance?.monthlyIncome || 0;
    const savings = monthlyIncome - totalExpenses;

    res.json({
      name: user.name,
      email: user.email,
      riskProfile: user.riskProfile,
      investmentType: user.investmentType,
      finance: {
        monthlyIncome,
        fixedExpenses: user.finance?.fixedExpenses || [],
        variableExpenses: user.finance?.variableExpenses || [],
        goals: user.finance?.goals || [],
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Profile PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Şifre değiştir (PUT)
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mevcut şifre yanlış" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (error) {
    console.error("Password PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Bildirim ayarlarını güncelle (PUT)
router.put("/notifications", protect, async (req, res) => {
  try {
    const { emailNotifications, budgetAlerts, milestoneAlerts, monthlyReports } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (!user.notifications) {
      user.notifications = {};
    }

    if (emailNotifications !== undefined) user.notifications.emailNotifications = emailNotifications;
    if (budgetAlerts !== undefined) user.notifications.budgetAlerts = budgetAlerts;
    if (milestoneAlerts !== undefined) user.notifications.milestoneAlerts = milestoneAlerts;
    if (monthlyReports !== undefined) user.notifications.monthlyReports = monthlyReports;

    user.markModified('notifications');
    await user.save();

    res.json({ message: "Bildirim ayarları güncellendi", notifications: user.notifications });
  } catch (error) {
    console.error("Notifications PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Hesabı sil (DELETE)
router.delete("/account", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "Hesap başarıyla silindi" });
  } catch (error) {
    console.error("Account DELETE hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Yatırım tercihlerini güncelle (eski - PUT)
router.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const { riskProfile, investmentType, currency, language } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (riskProfile) user.riskProfile = riskProfile;
    if (investmentType) user.investmentType = investmentType;
    if (currency) user.currency = currency;
    if (language) user.language = language;

    await user.save();

    // Güncellenmiş kullanıcı bilgilerini döndür
    const totalFixedExpenses = user.finance?.fixedExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    const totalVariableExpenses = user.finance?.variableExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    const monthlyIncome = user.finance?.monthlyIncome || 0;
    const savings = monthlyIncome - totalExpenses;

    res.json({
      name: user.name,
      email: user.email,
      riskProfile: user.riskProfile,
      investmentType: user.investmentType,
      finance: {
        monthlyIncome,
        fixedExpenses: user.finance?.fixedExpenses || [],
        variableExpenses: user.finance?.variableExpenses || [],
        goals: user.finance?.goals || [],
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Preferences PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Finans verilerini güncelle (eski - PUT)
router.put("/finance", protect, async (req, res) => {
  try {
    const { monthlyIncome, fixedExpenses, variableExpenses } = req.body;
    
    console.log('🔍 BACKEND - Gelen variableExpenses:', JSON.stringify(variableExpenses, null, 2));

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // ✅ variableExpenses'lere default category ekle
    const normalizedVariableExpenses = (variableExpenses || []).map(exp => ({
      ...exp,
      category: exp.category || 'diger'
    }));

    user.finance.monthlyIncome = monthlyIncome;
    user.finance.fixedExpenses = fixedExpenses || [];
    user.finance.variableExpenses = normalizedVariableExpenses;
    
    user.markModified('finance');
    
    await user.save();
    
    console.log('🔍 BACKEND - Kaydedilen variableExpenses:', JSON.stringify(user.finance.variableExpenses, null, 2));
    
    // ✅ YENİ: Cumulative savings varsa milestone kontrolü yap
    if (user.cumulativeSavings && user.cumulativeSavings > 0) {
      try {
        await checkAndAwardMilestones(req.user._id, user.cumulativeSavings);
        console.log('✅ Milestone kontrolü yapıldı:', user.cumulativeSavings);
      } catch (milestoneErr) {
        console.error('Milestone kontrolü hatası:', milestoneErr);
        // Milestone hatası finance güncellemeyi engellemez
      }
    }
    
    // Hesaplamaları yap
    const totalFixedExpenses = fixedExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    const totalVariableExpenses = normalizedVariableExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    const savings = monthlyIncome - totalExpenses;

    res.json({ 
      message: "Finans verileri güncellendi", 
      finance: {
        monthlyIncome,
        fixedExpenses,
        variableExpenses: normalizedVariableExpenses,
        goals: user.finance?.goals || [],
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Finance PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Hedef ekle
router.post("/goals", protect, async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, category } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    user.finance.goals.push({
      title,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      category
    });

    await user.save();
    console.log('🔍 BACKEND - Kaydedilen variableExpenses:', JSON.stringify(user.finance.variableExpenses, null, 2));
    res.json({ message: "Hedef eklendi", goals: user.finance.goals });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Hedef güncelle
router.put("/goals/:goalId", protect, async (req, res) => {
  try {
    const { currentAmount } = req.body;
    
    const user = await User.findById(req.user._id);
    const goal = user.finance.goals.id(req.params.goalId);
    
    if (!goal) return res.status(404).json({ message: "Hedef bulunamadı" });
    
    goal.currentAmount = currentAmount;
    await user.save();
    
    res.json({ message: "Hedef güncellendi", goals: user.finance.goals });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Hedef sil
router.delete("/goals/:goalId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.finance.goals.pull(req.params.goalId);
    
    await user.save();
    res.json({ message: "Hedef silindi", goals: user.finance.goals });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ Analytics endpoint
router.get("/analytics", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const finance = user.finance;
    const income = finance.monthlyIncome || 0;
    const totalFixed = finance.fixedExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const totalVariable = finance.variableExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const totalExpenses = totalFixed + totalVariable;
    const savings = income - totalExpenses;
    const savingsRate = income > 0 ? ((savings / income) * 100) : 0;

    // Finansal Sağlık Skoru Hesaplama
    let healthScore = 0;
    
    // Tasarruf oranı skoru (0-30 puan)
    if (savingsRate >= 30) healthScore += 30;
    else if (savingsRate >= 20) healthScore += 25;
    else if (savingsRate >= 10) healthScore += 15;
    else if (savingsRate > 0) healthScore += 5;

    // Borç yükü skoru (0-25 puan) - şimdilik tam puan
    healthScore += 25;

    // Bütçe kontrolü (0-20 puan)
    if (finance.fixedExpenses?.length > 0 || finance.variableExpenses?.length > 0) {
      healthScore += 20;
    }

    // Hedef belirlemesi (0-15 puan)
    if (finance.goals?.length > 0) healthScore += 15;

    // Gelir istikrarı (0-10 puan)
    if (income > 0) healthScore += 10;

    // Kategori skorları
    const categoryScores = {
      incomeManagement: income > 0 ? 85 : 50,
      expenseControl: savingsRate >= 20 ? 80 : savingsRate >= 10 ? 65 : 45,
      savingsRate: savingsRate >= 30 ? 90 : savingsRate >= 20 ? 75 : savingsRate >= 10 ? 60 : 30,
      investment: 45, // Placeholder
      goalAchievement: finance.goals?.length > 0 ? 80 : 40
    };

    // Kategori bazlı harcama dağılımı
    const expenseBreakdown = [
      ...finance.fixedExpenses.map(exp => ({ name: exp.name, amount: exp.amount, type: 'Sabit' })),
      ...finance.variableExpenses.map(exp => ({ name: exp.name, amount: exp.amount, type: 'Değişken' }))
    ].sort((a, b) => b.amount - a.amount);

    // Top 5 harcama
    const topExpenses = expenseBreakdown.slice(0, 5).map(exp => ({
      ...exp,
      percentage: totalExpenses > 0 ? ((exp.amount / totalExpenses) * 100).toFixed(1) : 0
    }));

    // Akıllı öneriler
    const insights = [];
    
    if (savingsRate < 20) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Tasarruf oranı düşük',
        message: `Tasarruf oranınız %${savingsRate.toFixed(0)}. İdeal oran %20 ve üzeri. Aylık ₺${((income * 0.2) - savings).toLocaleString('tr-TR')} daha tasarruf etmelisiniz.`,
        priority: 'high'
      });
    }

    if (savingsRate >= 30) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Mükemmel tasarruf!',
        message: `Gelirin %${savingsRate.toFixed(0)}'ını tasarruf ediyorsun. Harika gidiyorsun!`,
        priority: 'low'
      });
    }

    const largestExpense = expenseBreakdown[0];
    if (largestExpense && (largestExpense.amount / income) > 0.4) {
      insights.push({
        type: 'info',
        icon: '💡',
        title: `${largestExpense.name} harcamanız yüksek`,
        message: `${largestExpense.name} gelirinizin %${((largestExpense.amount/income)*100).toFixed(0)}'ini oluşturuyor. Bu kategoriyi optimize edebilirsiniz.`,
        priority: 'medium'
      });
    }

    if (!finance.goals || finance.goals.length === 0) {
      insights.push({
        type: 'info',
        icon: '🎯',
        title: 'Hedef belirle',
        message: 'Finansal hedefler belirlemek motivasyonunu artırır ve tasarrufu kolaylaştırır.',
        priority: 'medium'
      });
    }

    res.json({
      healthScore: Math.round(healthScore),
      categoryScores,
      topExpenses,
      insights,
      summary: {
        income,
        totalExpenses,
        savings,
        savingsRate: savingsRate.toFixed(1),
        expenseCount: expenseBreakdown.length
      }
    });

  } catch (error) {
    console.error("Analytics hatası:", error);
    res.status(500).json({ message: "Analytics hesaplanamadı" });
  }
});

export default router;