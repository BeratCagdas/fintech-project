import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import axios from 'axios';

const router = express.Router();

const ANALYTICS_API = process.env.ANALYTICS_API_URL || 'http://localhost:8000';
console.log('🔍 ANALYTICS_API:', ANALYTICS_API);
// Get latest credit score with auto-calculation
router.get('/credit-score/latest', authMiddleware, async (req, res) => {
  const userId = req.user._id.toString(); // ✅ Scope dışına taşındı

  try {
    // Python API'den en son credit score'u al
    const response = await axios.get(
      `${ANALYTICS_API}/api/snapshots/latest/${userId}`,
      { timeout: 10000 }
    );

    if (response.data && response.data.credit_score) {
      // Credit score zaten hesaplanmış
      return res.json({
        success: true,
        creditScore: response.data.credit_score || null,
        riskCategory: response.data.risk_category || null,
        riskLevel: response.data.risk_level || null,
        breakdown: {
          paymentHistory: response.data.payment_history_score || 0,
          debtBurden: response.data.debt_burden_score || 0,
          behavior: response.data.behavior_score || 0,
          stability: response.data.stability_score || 0,
          asset: response.data.asset_score || 0
        },
        metrics: {
          creditUtilization: response.data.credit_utilization || 0,
          debtToIncome: response.data.debt_to_income || 0,
          onTimePaymentRate: response.data.on_time_payment_rate || 0
        }
      });
    }

  } catch (error) {
    // Error durumunda da otomatik hesaplama yap
    console.log('⚠️ Credit score bulunamadı, otomatik hesaplama başlatılıyor...');
  }

  // Credit score yoksa veya hata olduysa, otomatik hesapla
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    // Şu anki ayı belirle
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Mevcut finansal verileri al
    const currentIncome = user.finance.monthlyIncome || 0;
    const fixedTotal = user.finance.fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const variableTotal = user.finance.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalExpenses = fixedTotal + variableTotal;
    const savings = currentIncome - totalExpenses;

    // Snapshot data hazırla
    const snapshotData = {
      userId: user._id.toString(),
      month: currentMonth,
      year: now.getFullYear(),
      monthName: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][now.getMonth()],
      income: currentIncome,
      expenses: totalExpenses,
      savings: savings,
      cumulativeSavings: user.cumulativeSavings || 0,
      fixedExpenses: user.finance.fixedExpenses.map(exp => ({
        name: exp.name,
        amount: exp.amount,
        category: exp.category,
        isRecurring: exp.isRecurring,
        frequency: exp.frequency,
        dayOfMonth: exp.dayOfMonth
      })),
      variableExpenses: user.finance.variableExpenses.map(exp => ({
        name: exp.name,
        amount: exp.amount,
        category: exp.category
      })),
      debts: (user.debts || []).map(debt => ({
        type: debt.type,
        name: debt.name,
        totalAmount: debt.totalAmount,
        remainingAmount: debt.remainingAmount,
        monthlyPayment: debt.monthlyPayment,
        status: debt.status,
        paymentHistory: debt.paymentHistory || []
      })),
      creditCards: (user.creditCards || []).map(card => ({
        bankName: card.bankName,
        limit: card.limit,
        currentDebt: card.currentDebt,
        utilizationRate: card.utilizationRate || 0,
        paymentHistory: card.paymentHistory || []
      })),
      investments: (user.investments || []).map(inv => ({
        type: inv.type,
        name: inv.name,
        totalInvested: inv.totalInvested,
        currentValue: inv.currentValue || inv.totalInvested,
        profitLoss: inv.profitLoss || 0
      })),
      assets: (user.assets || []).map(asset => ({
        type: asset.type,
        name: asset.name,
        currentValue: asset.currentValue,
        hasLoan: asset.hasLoan || false,
        loanAmount: asset.loanAmount || 0
      })),
      monthlyHistory: (user.monthlyHistory || []).map(h => ({
        month: h.month,
        monthName: h.monthName,
        year: h.year,
        income: h.income,
        expenses: h.totalExpenses,
        savings: h.savings,
        cumulativeSavings: user.cumulativeSavings
      }))
    };

    // Python API'ye gönder ve hesaplat
    const pythonResponse = await axios.post(
      `${ANALYTICS_API}/api/calculate-monthly-snapshot`,
      snapshotData,
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (pythonResponse.data && pythonResponse.data.creditScore) {
      console.log('✅ Credit score otomatik hesaplandı:', pythonResponse.data.creditScore);

      // ✅ PostgreSQL'e kaydedildi mi kontrol et (snapshot servisi otomatik kaydetmeli)
      // Eğer kaydedildiyse, tekrar fetch et
      try {
        const checkResponse = await axios.get(
          `${ANALYTICS_API}/api/snapshots/latest/${userId}`,
          { timeout: 5000 }
        );

        if (checkResponse.data && checkResponse.data.credit_score) {
          // Başarıyla kaydedilmiş, gerçek veriyi döndür
          return res.json({
            success: true,
            creditScore: checkResponse.data.credit_score,
            riskCategory: checkResponse.data.risk_category,
            riskLevel: checkResponse.data.risk_level,
            breakdown: {
              paymentHistory: checkResponse.data.payment_history_score || 0,
              debtBurden: checkResponse.data.debt_burden_score || 0,
              behavior: checkResponse.data.behavior_score || 0,
              stability: checkResponse.data.stability_score || 0,
              asset: checkResponse.data.asset_score || 0
            },
            metrics: {
              creditUtilization: checkResponse.data.credit_utilization || 0,
              debtToIncome: checkResponse.data.debt_to_income || 0,
              onTimePaymentRate: checkResponse.data.on_time_payment_rate || 0
            },
            autoCalculated: true
          });
        }
      } catch (recheckError) {
        console.log('⚠️ Recheck failed, returning calculated data:', recheckError.message);
      }

      // Kaydedilmemişse, hesaplanan veriyi döndür
      // ⚠️ Python API snake_case döndürüyor, onu camelCase'e çevirelim
      const pythonData = pythonResponse.data;

      return res.json({
        success: true,
        creditScore: pythonData.creditScore || pythonData.credit_score,
        riskCategory: pythonData.riskCategory || pythonData.risk_category,
        riskLevel: pythonData.riskLevel || pythonData.risk_level,
        breakdown: pythonData.breakdown || {
          paymentHistory: 0,
          debtBurden: 0,
          behavior: 0,
          stability: 0,
          asset: 0
        },
        metrics: pythonData.metrics || {},
        autoCalculated: true,
        saved: true // Snapshot servisi kaydetmiş olmalı
      });
    }

    // Hesaplama başarısız olsa bile boş döndür
    return res.json({
      success: false,
      message: 'Credit score hesaplanamadı',
      creditScore: null
    });

  } catch (autoCalcError) {
    console.error('❌ Auto-calculation error:', autoCalcError.message);

    return res.json({
      success: false,
      message: 'Credit score otomatik hesaplanamadı',
      creditScore: null
    });
  }
});

router.get('/credit-score/explain', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    console.log('📊 Credit score açıklama isteniyor:', userId);
    
   
    const response = await axios.get(
      `${ANALYTICS_API}/api/credit-score/explain/${userId}`, 
      { timeout: 10000 }
    );
    
    console.log('✅ Python response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Credit score açıklama başarılı');
      return res.json(response.data);
    } else {
      return res.json({
        success: false,
        message: response.data.message || 'Veri bulunamadı'
      });
    }
    
  } catch (error) {
    console.error('❌ Credit score açıklama hatası:', error.message);
    
    if (error.response) {
      console.error('Python API error:', error.response.data);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Credit score açıklama başarısız',
      error: error.message
    });
  }
});

// Get Cash Flow Forecast
router.get('/cash-flow/forecast', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const months = req.query.months || 6; // Default 6 months

    console.log(`💰 Cash flow forecast isteniyor: ${userId}, ${months} ay`);

    const response = await axios.get(
      `${ANALYTICS_API}/api/forecast/cash-flow/${userId}?months=${months}`,
      { timeout: 15000 }
    );

    if (response.data.success) {
      console.log('✅ Cash flow forecast başarılı');
      return res.json(response.data);
    } else {
      return res.json({
        success: false,
        message: response.data.message || 'Forecast verisi bulunamadı'
      });
    }

  } catch (error) {
    console.error('❌ Cash flow forecast hatası:', error.message);

    if (error.response) {
      console.error('Python API error:', error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Cash flow forecast başarısız',
      error: error.message
    });
  }
});

// What-if Scenario Analysis
router.post('/cash-flow/what-if', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { scenario, months } = req.body;

    console.log(`🔮 What-if scenario isteniyor: ${userId}`);
    console.log('Scenario:', scenario);

    const response = await axios.post(
      `${ANALYTICS_API}/api/forecast/cash-flow/${userId}/what-if?months=${months || 6}`,
      scenario,
      { timeout: 15000 }
    );

    if (response.data.success) {
      console.log('✅ What-if scenario başarılı');
      return res.json(response.data);
    } else {
      return res.json({
        success: false,
        message: response.data.message || 'What-if analizi başarısız'
      });
    }

  } catch (error) {
    console.error('❌ What-if scenario hatası:', error.message);

    if (error.response) {
      console.error('Python API error:', error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'What-if scenario başarısız',
      error: error.message
    });
  }
});


export default router;