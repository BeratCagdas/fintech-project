// backend/src/routes/financialHealth.js - TAM HALİ

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import axios from 'axios';
import User from '../models/User.js';

const router = express.Router();
const ANALYTICS_API = process.env.ANALYTICS_API_URL || 'http://localhost:8000';

// 🆕 Kapsamlı finansal sağlık verisi
router.get('/comprehensive', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    console.log(`📊 Fetching comprehensive health data for: ${userId}`);
    
    // MongoDB'den user çek
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Mevcut ay verilerini hazırla
    const monthlyIncome = user.finance.monthlyIncome || 0;
    const fixedTotal = user.finance.fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const variableTotal = user.finance.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalExpenses = fixedTotal + variableTotal;
    const savings = monthlyIncome - totalExpenses;
    const savingsRatio = monthlyIncome > 0 ? savings / monthlyIncome : 0;
    const expenseRatio = monthlyIncome > 0 ? totalExpenses / monthlyIncome : 0;
    
    // Budget adherence hesapla
    const budgetLimits = user.budgetLimits || {};
    const variableExpenses = user.finance.variableExpenses || [];
    const budgetAdherence = {};
    
    const categories = ['market', 'yemek', 'ulasim', 'eglence', 'giyim', 'saglik', 'diger'];
    categories.forEach(category => {
      const limit = budgetLimits.variable?.[category] || 0;
      const spent = variableExpenses
        .filter(exp => exp.category === category)
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      budgetAdherence[category] = {
        limit,
        spent,
        adherence_pct: limit > 0 ? (spent / limit) * 100 : 0,
        status: limit === 0 ? 'no_limit' : (spent / limit <= 0.8 ? 'good' : (spent / limit <= 1 ? 'warning' : 'over'))
      };
    });
    
    // Expense breakdown
    const expenseBreakdown = { variable: {}, fixed: {} };
    variableExpenses.forEach(exp => {
      const cat = exp.category || 'diger';
      expenseBreakdown.variable[cat] = (expenseBreakdown.variable[cat] || 0) + exp.amount;
    });
    
    user.finance.fixedExpenses.forEach(exp => {
      const cat = exp.category || 'diger';
      expenseBreakdown.fixed[cat] = (expenseBreakdown.fixed[cat] || 0) + exp.amount;
    });
    
    // 1. Mevcut ayın skorunu hesapla
    let currentMonthScore = null;
    try {
      const currentScoreRes = await axios.post(
        `${ANALYTICS_API}/api/calculate-current-score`,
        {
          income: monthlyIncome,
          totalExpenses: totalExpenses,
          cumulativeSavings: user.cumulativeSavings || 0,
          savingsRatio: savingsRatio,
          expenseRatio: expenseRatio,
          budgetAdherence: budgetAdherence,
          expenseBreakdown: expenseBreakdown,
          savingsStreak: user.achievements?.savingsStreak?.currentStreak || 0
        },
        { timeout: 30000 }
      );
      
      currentMonthScore = currentScoreRes.data;
      console.log(`✅ Current month score: ${currentMonthScore.score}/100`);
    } catch (err) {
      console.error('⚠️ Current month score calculation failed:', err.message);
    }
    
    // 2. Son 6 ayın snapshot'larını çek
    let historicalData = [];
    try {
      const historyRes = await axios.get(
        `${ANALYTICS_API}/api/snapshots/history/${userId}?months=6`,
        { timeout: 30000 }
      );
      
      historicalData = historyRes.data.history || [];
      console.log(`✅ Retrieved ${historicalData.length} historical snapshots`);
    } catch (err) {
      console.error('⚠️ Historical data fetch failed:', err.message);
    }
    
    // Response
    res.json({
      success: true,
      currentMonth: {
        score: currentMonthScore?.score || null,
        breakdown: currentMonthScore?.breakdown || null,
        data: {
          income: monthlyIncome,
          expenses: totalExpenses,
          savings: savings,
          savingsRatio: Math.round(savingsRatio * 100),
          cumulativeSavings: user.cumulativeSavings || 0
        }
      },
      historical: historicalData,
      hasHistory: historicalData.length > 0
    });
    
  } catch (err) {
    console.error('❌ Comprehensive health fetch error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch comprehensive health data' 
    });
  }
});

export default router;