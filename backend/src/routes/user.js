import User from "../models/User.js";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js"; 
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Profil bilgilerini getir (finans hesaplamaları ile)
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
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Profile GET hatası:", error);
    res.status(500).json({ message: "Profil bilgileri alınamadı" });
  }
});

// Yatırım tercihlerini güncelle
router.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const { riskProfile, investmentType } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { riskProfile, investmentType },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

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
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Preferences PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Finans verilerini güncelle
router.put("/finance", protect, async (req, res) => {
  try {
    const { monthlyIncome, fixedExpenses, variableExpenses } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    user.finance = {
      monthlyIncome,
      fixedExpenses,
      variableExpenses,
    };

    await user.save();
    
    // Hesaplamaları yap
    const totalFixedExpenses = fixedExpenses?.reduce(
      (sum, exp) => sum + (exp.amount || 0), 
      0
    ) || 0;
    
    const totalVariableExpenses = variableExpenses?.reduce(
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
        variableExpenses,
        totalExpenses,
        savings
      }
    });
  } catch (error) {
    console.error("Finance PUT hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});
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
    res.json({ message: "Hedef eklendi", goals: user.finance.goals });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Hedef güncelle
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

// Hedef sil
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
export default router;