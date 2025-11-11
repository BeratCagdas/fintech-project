// backend/src/routes/monthly.js (YENİ DOSYA)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { calculateNextPaymentDate } from './recurring.js';

const router = express.Router();

// Ay isimlerini al
const getMonthName = (monthNumber) => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[monthNumber];
};

// Aylık reset işlemi
const performMonthlyReset = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: 'Kullanıcı bulunamadı' };

    // Mevcut ay verileri
    const currentIncome = user.finance.monthlyIncome || 0;
    const fixedTotal = user.finance.fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const variableTotal = user.finance.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalExpenses = fixedTotal + variableTotal;
    const savings = currentIncome - totalExpenses;

    // History'e kaydet
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    user.monthlyHistory.push({
      month: monthStr,
      year: now.getFullYear(),
      monthName: getMonthName(now.getMonth()),
      income: currentIncome,
      totalExpenses: totalExpenses,
      savings: savings,
      fixedExpenses: user.finance.fixedExpenses.map(exp => ({
        name: exp.name,
        amount: exp.amount,
        category: exp.category
      })),
    variableExpenses: user.finance.variableExpenses.map(exp => ({
     name: exp.name,
     amount: exp.amount,
     category: exp.category // ✅ EKLE
      })),
      createdAt: new Date()
    });

    // Kümülatif tasarrufa ekle
    user.cumulativeSavings += savings;

    // Değişken giderleri temizle
    user.finance.variableExpenses = [];

    // Geliri sıfırla
    user.finance.monthlyIncome = 0;

    // Sabit giderleri işle
    const newFixedExpenses = [];
    
    for (const expense of user.finance.fixedExpenses) {
      if (expense.isRecurring && expense.isActive) {
        // Recurring giderler kalır
        
        // Sonraki ödeme tarihini güncelle
        if (expense.nextPaymentDate) {
          expense.nextPaymentDate = calculateNextPaymentDate(expense);
        }
        
        // autoAdd true ise yeni aya otomatik ekle
        if (expense.autoAdd) {
          // Gider zaten recurring olarak kalacak, tekrar eklemiyoruz
        }
        
        newFixedExpenses.push(expense);
      }
      // Recurring olmayan giderler silinir
    }

    user.finance.fixedExpenses = newFixedExpenses;

    await user.save();

    return {
      success: true,
      message: 'Aylık reset başarılı',
      data: {
        previousMonthSavings: savings,
        cumulativeSavings: user.cumulativeSavings,
        recurringExpensesKept: newFixedExpenses.length
      }
    };

  } catch (err) {
    console.error('Monthly reset error:', err);
    return {
      success: false,
      message: 'Reset işlemi başarısız: ' + err.message
    };
  }
};

// Manuel reset endpoint (test için)
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const result = await performMonthlyReset(req.user._id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error('Reset endpoint error:', err);
    res.status(500).json({
      success: false,
      message: 'Reset başarısız'
    });
  }
});

// History getir
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Son 12 ayı getir
    const history = user.monthlyHistory
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 12);

    res.json({
      success: true,
      history: history,
      cumulativeSavings: user.cumulativeSavings
    });

  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Geçmiş veriler alınamadı'
    });
  }
});

// Kümülatif tasarrufu getir
router.get('/cumulative-savings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      cumulativeSavings: user.cumulativeSavings || 0
    });

  } catch (err) {
    console.error('Cumulative savings error:', err);
    res.status(500).json({
      success: false,
      message: 'Toplam tasarruf alınamadı'
    });
  }
});

export default router;
export { performMonthlyReset };