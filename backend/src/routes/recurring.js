import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Yaklaşan ödemeleri getir
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const today = new Date();
    const upcomingDays = 7; // 7 gün içindeki ödemeler
    const futureDate = new Date(today.getTime() + upcomingDays * 24 * 60 * 60 * 1000);

    // Recurring olan ve aktif olan giderleri filtrele
    const upcomingPayments = user.finance.fixedExpenses
      .filter(expense => 
        expense.isRecurring && 
        expense.isActive && 
        expense.nextPaymentDate &&
        new Date(expense.nextPaymentDate) <= futureDate
      )
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));

    res.json({
      success: true,
      upcomingPayments: upcomingPayments
    });

  } catch (err) {
    console.error('Upcoming payments error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yaklaşan ödemeler alınamadı' 
    });
  }
});

// Sonraki ödeme tarihini hesapla
const calculateNextPaymentDate = (expense) => {
  const today = new Date();
  let nextDate = new Date();

  switch (expense.frequency) {
    case 'daily':
      nextDate.setDate(today.getDate() + 1);
      break;
    
    case 'weekly':
      const daysUntilNext = (expense.dayOfWeek - today.getDay() + 7) % 7;
      nextDate.setDate(today.getDate() + (daysUntilNext || 7));
      break;
    
    case 'monthly':
      nextDate.setMonth(today.getMonth() + 1);
      nextDate.setDate(expense.dayOfMonth);
      
      // Eğer belirlenen gün bu ayda yoksa (örn: 31 Şubat)
      if (nextDate.getDate() !== expense.dayOfMonth) {
        nextDate.setDate(0); // Ayın son günü
      }
      break;
    
    case 'yearly':
      nextDate.setFullYear(today.getFullYear() + 1);
      nextDate.setMonth(today.getMonth());
      nextDate.setDate(expense.dayOfMonth);
      break;
  }

  return nextDate;
};

// Recurring expense ekle/güncelle
router.post('/expense', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { 
      name, 
      amount, 
      isRecurring, 
      frequency, 
      dayOfMonth, 
      dayOfWeek,
      autoAdd,
      category 
    } = req.body;

    const newExpense = {
      name,
      amount,
      isRecurring,
      frequency: frequency || 'monthly',
      autoAdd: autoAdd || false,
      category: category || 'diger',
      isActive: true,
      reminderSent: false,
      createdAt: new Date()
    };

    // Recurring ise sonraki ödeme tarihini hesapla
    if (isRecurring) {
      if (frequency === 'monthly' || frequency === 'yearly') {
        newExpense.dayOfMonth = dayOfMonth;
      }
      if (frequency === 'weekly') {
        newExpense.dayOfWeek = dayOfWeek;
      }
      newExpense.nextPaymentDate = calculateNextPaymentDate(newExpense);
    }

    user.finance.fixedExpenses.push(newExpense);
    await user.save();

    res.json({
      success: true,
      message: 'Gider eklendi',
      expense: newExpense
    });

  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Gider eklenemedi' 
    });
  }
});

// Recurring expense aktif/pasif yap
router.patch('/expense/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const expense = user.finance.fixedExpenses.id(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gider bulunamadı' 
      });
    }

    expense.isActive = !expense.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Gider ${expense.isActive ? 'aktif' : 'pasif'} edildi`,
      expense
    });

  } catch (err) {
    console.error('Toggle expense error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'İşlem başarısız' 
    });
  }
});

export default router;
export { calculateNextPaymentDate };