import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Sonraki ödeme tarihini hesapla (ÖNCE TANIMLA)
export const calculateNextPaymentDate = (expense) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let nextDate = new Date();

  switch (expense.frequency) {
    case 'daily':
      nextDate.setDate(today.getDate() + 1);
      break;
    
    case 'weekly':
      if (expense.dayOfWeek === undefined) {
        console.warn('⚠️ Weekly expense but no dayOfWeek specified');
        return null;
      }
      
      const daysUntilNext = (expense.dayOfWeek - today.getDay() + 7) % 7;
      nextDate.setDate(today.getDate() + (daysUntilNext || 7));
      break;
    
    case 'monthly':
      if (!expense.dayOfMonth) {
        console.warn('⚠️ Monthly expense but no dayOfMonth specified');
        return null;
      }
      
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // ✅ Önce BU AYIN belirlenen gününü dene
      nextDate = new Date(currentYear, currentMonth, expense.dayOfMonth);
      nextDate.setHours(0, 0, 0, 0);
      
      // ✅ Eğer bu ayın tarihi GEÇMİŞSE, gelecek aya al
      if (nextDate <= today) {
        nextDate = new Date(currentYear, currentMonth + 1, expense.dayOfMonth);
      }
      
      // ✅ Eğer belirlenen gün bu ayda yoksa (örn: 31 Şubat), ayın son günü
      if (nextDate.getDate() !== expense.dayOfMonth) {
        nextDate.setDate(0); // Önceki ayın son günü
      }
      break;
    
    case 'yearly':
      if (!expense.dayOfMonth) {
        console.warn('⚠️ Yearly expense but no dayOfMonth specified');
        return null;
      }
      
      nextDate.setFullYear(today.getFullYear() + 1);
      nextDate.setMonth(today.getMonth());
      nextDate.setDate(expense.dayOfMonth);
      break;
      
    default:
      console.warn('⚠️ Unknown frequency:', expense.frequency);
      return null;
  }

  return nextDate;
};

// ✅ Yaklaşan ödemeleri getir (OPTİMİZE EDİLMİŞ)
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    if (!user.finance || !user.finance.fixedExpenses) {
      return res.json({
        success: true,
        upcomingPayments: [],
        count: 0
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingDays = 30; // ✅ 7 gün (test için 30 yapabilirsiniz)
    const futureDate = new Date(today.getTime() + (upcomingDays * 24 * 60 * 60 * 1000));
      
   
     
    // ✅ Filter ve Map birlikte (optimize)
    const upcomingPayments = user.finance.fixedExpenses
      .filter(expense => {
        // Sadece recurring ve aktif olanlar
        if (!expense.isRecurring || !expense.isActive) {
          return false;
        }
        
        // nextPaymentDate olmalı
        if (!expense.nextPaymentDate) {
         
          return false;
        }

        const paymentDate = new Date(expense.nextPaymentDate);
        paymentDate.setHours(0, 0, 0, 0);
        
        // Bugün ile futureDate arasında mı?
        const isInRange = paymentDate >= today && paymentDate <= futureDate;
        
        if (expense.isRecurring && expense.isActive) {
          console.log(`📅 "${expense.name}": ${paymentDate.toLocaleDateString('tr-TR')} - ${isInRange ? '✅ Dahil' : '❌ Dahil değil'}`);
        }
        
        return isInRange;
      })
      .map(expense => {
        const paymentDate = new Date(expense.nextPaymentDate);
        paymentDate.setHours(0, 0, 0, 0);
        
        // ✅ Kaç gün kaldığını hesapla (ROUNDED)
        const daysUntil = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));

        return {
          id: expense._id,
          name: expense.name,
          amount: expense.amount,
          category: expense.category || 'diger',
          nextPaymentDate: expense.nextPaymentDate,
          daysUntil: daysUntil, // ✅ EKLENDI (undefined gün sorunu çözüldü)
          frequency: expense.frequency
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil); // En yakından uzağa

   

    res.json({
      success: true,
      upcomingPayments: upcomingPayments,
      count: upcomingPayments.length
    });

  } catch (err) {
    console.error('❌ Upcoming payments error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yaklaşan ödemeler alınamadı',
      error: err.message
    });
  }
});

// ✅ Recurring expense ekle (OPTİMİZE EDİLMİŞ)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { name, amount, frequency, dayOfMonth, dayOfWeek, autoAdd, category } = req.body;

    if (!name || !amount || !frequency) {
      return res.status(400).json({
        success: false,
        message: 'Eksik bilgi: name, amount, frequency gerekli'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    // ✅ Yeni expense objesi
    const newExpense = {
      name,
      amount,
      isRecurring: true,
      frequency,
      dayOfMonth: (frequency === 'monthly' || frequency === 'yearly') ? dayOfMonth : null,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
      autoAdd: autoAdd || false,
      isActive: true,
      reminderSent: false,
      category: category || 'diger',
      createdAt: new Date()
    };

    // ✅ nextPaymentDate'i calculateNextPaymentDate ile hesapla
    newExpense.nextPaymentDate = calculateNextPaymentDate(newExpense);

    if (!newExpense.nextPaymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Ödeme tarihi hesaplanamadı. Frequency ve day bilgilerini kontrol edin.'
      });
    }

    user.finance.fixedExpenses.push(newExpense);
    await user.save();

    

    res.json({
      success: true,
      message: 'Yinelenen gider eklendi',
      expense: newExpense
    });

  } catch (err) {
    console.error('❌ Add recurring expense error:', err);
    res.status(500).json({
      success: false,
      message: 'Gider eklenemedi',
      error: err.message
    });
  }
});

// ✅ MIGRATION: Mevcut expense'lere nextPaymentDate ekle
router.post('/fix-payment-dates', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    if (!user.finance || !user.finance.fixedExpenses) {
      return res.json({
        success: false,
        message: 'Finance verisi bulunamadı',
        updatedCount: 0
      });
    }

    let updatedCount = 0;

  
    user.finance.fixedExpenses.forEach((expense, index) => {
      // Sadece recurring, aktif ve nextPaymentDate olmayan giderleri güncelle
      if (expense.isRecurring && expense.isActive && !expense.nextPaymentDate) {
        
        const calculatedDate = calculateNextPaymentDate(expense);
        
        if (calculatedDate) {
          expense.nextPaymentDate = calculatedDate;
          updatedCount++;
          
         
        } else {
          console.log(`⚠️ Skipped #${index + 1}: ${expense.name} (Tarih hesaplanamadı)`);
        }
      }
    });

    await user.save();

   

    res.json({
      success: true,
      message: `${updatedCount} ödeme tarihi güncellendi`,
      updatedCount: updatedCount
    });

  } catch (err) {
    console.error('❌ Migration error:', err);
    res.status(500).json({
      success: false,
      message: 'Migration başarısız',
      error: err.message
    });
  }
});

// ✅ TEST: Ödemeleri yakınlaştır (geliştirme için)
router.post('/fix-for-testing', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatedCount = 0;

  

    user.finance.fixedExpenses.forEach((expense, index) => {
      if (expense.isRecurring && expense.isActive) {
        // Hepsini bugün + 3 gün yap
        const testDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        expense.nextPaymentDate = testDate;
        updatedCount++;
        
      }
    });

    await user.save();

   

    res.json({
      success: true,
      message: `${updatedCount} ödeme bugün + 3 gün olarak ayarlandı`,
      updatedCount
    });

  } catch (err) {
    console.error('❌ Test fix error:', err);
    res.status(500).json({ success: false, error: err.message });
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
    console.error('❌ Toggle expense error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'İşlem başarısız' 
    });
  }
});

export default router;