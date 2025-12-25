// backend/src/routes/monthly.js - GÜNCELLENMIŞ (PostgreSQL expense_events ile)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { calculateNextPaymentDate } from './recurring.js';
import { checkAndAwardMilestones, updateSavingsStreak } from '../services/milestoneService.js';
import { triggerSnapshot } from '../services/snapshotService.js';
import axios from 'axios';
import { get_pg_connection } from '../db.js';
const router = express.Router();

const ANALYTICS_API = process.env.ANALYTICS_API_URL || 'http://localhost:8000';

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

    console.log('\n🔄 MONTHLY RESET STARTED');
    console.log('=======================');

    // Mevcut ay verileri
    const currentIncome = user.finance.monthlyIncome || 0;
    const fixedTotal = user.finance.fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const variableTotal = user.finance.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalExpenses = fixedTotal + variableTotal;
    const savings = currentIncome - totalExpenses;

    console.log(`💰 Income: ${currentIncome}`);
    console.log(`💸 Fixed: ${fixedTotal}, Variable: ${variableTotal}, Total: ${totalExpenses}`);
    console.log(`💎 Savings: ${savings}`);

    // Kaydedilecek ayı hesapla
    let recordMonth, recordYear, recordMonthName;
    
    // ✅ YENİ MANTIK: Son ayı PostgreSQL'den sorgula
    const pool = get_pg_connection();
    let lastSnapshotDate = null;

    try {
      const pgResult = await pool.query(
        'SELECT snapshot_month FROM monthly_snapshots WHERE user_id = $1 ORDER BY snapshot_month DESC LIMIT 1',
        [userId]
      );
      if (pgResult.rows.length > 0) {
        lastSnapshotDate = pgResult.rows[0].snapshot_month;
      }
    } catch (pgErr) {
      console.error('❌ PG Last Snapshot Check Error:', pgErr);
    }

    if (lastSnapshotDate) {
      // Postgres'te veri var, son kaydın üzerine 1 ay ekle
      const lastDate = new Date(lastSnapshotDate);
      lastDate.setMonth(lastDate.getMonth() + 1);
      
      recordMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
      recordYear = lastDate.getFullYear();
      recordMonthName = getMonthName(lastDate.getMonth());
      console.log('📅 Last snapshot (PG):', lastSnapshotDate);
      console.log('📅 Recording month:', recordMonth);

    } else if (user.monthlyHistory.length === 0) {
      // İlk kayıt - şu anki ayı kullan
      const now = new Date();
      recordMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      recordYear = now.getFullYear();
      recordMonthName = getMonthName(now.getMonth());
      console.log('📅 First reset - using current month:', recordMonth);
    } else {
      // Fallback: Mongo geçmişi varsa oradan devam et
      const lastHistory = user.monthlyHistory[user.monthlyHistory.length - 1];
      const lastDate = new Date(lastHistory.month + '-01');
      
      // Bir ay ekle
      lastDate.setMonth(lastDate.getMonth() + 1);
      
      recordMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
      recordYear = lastDate.getFullYear();
      recordMonthName = getMonthName(lastDate.getMonth());
      console.log('📅 Last month (Mongo):', lastHistory.month);
      console.log('📅 Recording month:', recordMonth);
    }
    
    console.log(`📆 Month: ${recordMonthName} ${recordYear}`);

    // Kümülatif tasarrufa ekle
    const newCumulativeSavings = (user.cumulativeSavings || 0) + savings;
    user.cumulativeSavings = newCumulativeSavings;
    console.log(`📊 Cumulative Savings: ${newCumulativeSavings}`);

    // 🆕 ADIM 1: EXPENSE EVENTS KAYDET (PostgreSQL)
    try {
      console.log('\n💾 Saving expense events to PostgreSQL...');
      
      await axios.post(
        `${ANALYTICS_API}/api/expense-events/bulk-insert`,
        {
          userId: user._id.toString(),
          month: recordMonth,
          year: recordYear,
          totalIncome: currentIncome,
          totalExpense: totalExpenses, 
          savings: savings,
          fixedExpenses: user.finance.fixedExpenses.map(exp => ({
            name: exp.name,
            amount: exp.amount,
            category: exp.category,
            isRecurring: exp.isRecurring || false,
            frequency: exp.frequency,
            dayOfMonth: exp.dayOfMonth
          })),
          variableExpenses: user.finance.variableExpenses.map(exp => ({
            name: exp.name,
            amount: exp.amount,
            category: exp.category
          }))
        },
        { 
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('✅ Expense events saved to PostgreSQL');
      
    } catch (expenseError) {
      console.error('❌ Expense events save error:', expenseError.message);
      // Devam et, bu bloklayıcı değil
    }

    // 🆕 ADIM 2: CREDIT SCORE HESAPLA (PostgreSQL Snapshot)
    const snapshotData = {
      userId: user._id.toString(),
      month: recordMonth,
      year: recordYear,
      monthName: recordMonthName,
      
      // Finansal veriler
      income: currentIncome,
      expenses: totalExpenses,
      savings: savings,
      cumulativeSavings: newCumulativeSavings,
      
      // ✅ EKSİK OLAN KISIM EKLENDİ: Harcama Detayları
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
      
      // Borçlar
      debts: (user.debts || []).map(debt => ({
        type: debt.type,
        name: debt.name,
        totalAmount: debt.totalAmount,
        remainingAmount: debt.remainingAmount,
        monthlyPayment: debt.monthlyPayment,
        status: debt.status,
        paymentHistory: debt.paymentHistory || []
      })),
      
      // Kredi Kartları
      creditCards: (user.creditCards || []).map(card => ({
        bankName: card.bankName,
        limit: card.limit,
        currentDebt: card.currentDebt,
        utilizationRate: card.utilizationRate || 0,
        paymentHistory: card.paymentHistory || []
      })),
      
      // Yatırımlar
      investments: (user.investments || []).map(inv => ({
        type: inv.type,
        name: inv.name,
        totalInvested: inv.totalInvested,
        currentValue: inv.currentValue || inv.totalInvested,
        profitLoss: inv.profitLoss || 0
      })),
      
      // Varlıklar
      assets: (user.assets || []).map(asset => ({
        type: asset.type,
        name: asset.name,
        currentValue: asset.currentValue,
        hasLoan: asset.hasLoan || false,
        loanAmount: asset.loanAmount || 0
      })),
      
      // Aylık geçmiş
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

    console.log('\n📦 Snapshot Data Prepared:');
    console.log(`   Debts: ${snapshotData.debts.length}`);
    console.log(`   Credit Cards: ${snapshotData.creditCards.length}`);
    console.log(`   Investments: ${snapshotData.investments.length}`);
    console.log(`   Assets: ${snapshotData.assets.length}`);
    console.log(`   History: ${snapshotData.monthlyHistory.length} months`);

    // Python'a gönder - Credit Score hesapla
    let creditScore = null;
    let riskCategory = null;
    let riskLevel = null;

    try {
      console.log('\n🐍 Calling Python API for Credit Score...');
      const pythonResponse = await axios.post(
        `${ANALYTICS_API}/api/calculate-monthly-snapshot`,
        snapshotData,
        { 
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('✅ Python API Response received');
      
      creditScore = pythonResponse.data.creditScore;
      riskCategory = pythonResponse.data.riskCategory;
      riskLevel = pythonResponse.data.riskLevel;

      console.log(`💳 Credit Score: ${creditScore}/850`);
      console.log(`📊 Risk Category: ${riskCategory} - ${riskLevel}`);
      
    } catch (pythonError) {
      console.error('❌ Python API Error:', pythonError.message);
      if (pythonError.response) {
        console.error('Response data:', pythonError.response.data);
      }
      console.log('⚠️  Continuing without credit score...');
    }

    // 🆕 ADIM 3: MONGODB HISTORY'YE KAYDET (Korunuyor - silinmiyor!)
    user.monthlyHistory.push({
      month: recordMonth,
      year: recordYear,
      monthName: recordMonthName,
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
        category: exp.category
      })),
      creditScore: creditScore,
      riskCategory: riskCategory,
      createdAt: new Date()
    });

    console.log(`📝 Added to MongoDB history: ${recordMonthName} ${recordYear}`);

    // Milestone kontrolü
    const newMilestones = await checkAndAwardMilestones(userId, newCumulativeSavings);
    const streakResult = await updateSavingsStreak(userId, savings);

    // 🆕 ADIM 4: AKTİF AYI RESETLE
    user.finance.variableExpenses = [];
    user.finance.monthlyIncome = 0;
    console.log('🧹 Variable expenses and income cleared');

    // Sabit giderleri işle
    const newFixedExpenses = [];
    for (const expense of user.finance.fixedExpenses) {
      if (expense.isRecurring && expense.isActive) {
        if (expense.nextPaymentDate) {
          expense.nextPaymentDate = calculateNextPaymentDate(expense);
        }
        newFixedExpenses.push(expense);
      }
    }
    user.finance.fixedExpenses = newFixedExpenses;
    console.log(`🔄 Recurring expenses updated: ${newFixedExpenses.length}`);

    // Kullanıcıyı kaydet
    await user.save();
    console.log('✅ User saved to MongoDB');

    // Eski snapshot oluştur (backward compatibility)
    console.log(`📅 Creating legacy snapshot for: ${recordMonth}`);
    const snapshotResult = await triggerSnapshot(userId, recordMonth);

    console.log('=======================');
    console.log('✅ MONTHLY RESET COMPLETED\n');

    return {
      success: true,
      message: `${recordMonthName} ${recordYear} dönemine geçildi`,
      data: {
        month: recordMonth,
        monthName: recordMonthName,
        year: recordYear,
        previousMonthSavings: savings,
        cumulativeSavings: newCumulativeSavings,
        recurringExpensesKept: newFixedExpenses.length,
        newMilestones: newMilestones || [],
        currentStreak: streakResult?.currentStreak || 0,
        streakMilestones: streakResult?.newMilestones || [],
        snapshotCreated: snapshotResult.success,
        financialHealthScore: snapshotResult.financial_health_score || null,
        creditScore: creditScore,
        riskCategory: riskCategory,
        riskLevel: riskLevel,
        snapshotMonth: recordMonth
      }
    };

  } catch (err) {
    console.error('❌ Monthly reset error:', err);
    return {
      success: false,
      message: 'Reset işlemi başarısız: ' + err.message
    };
  }
};

// Manuel reset endpoint
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

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    console.log('📊 History endpoint called for user:', userId);

    const pool = get_pg_connection();
    console.log('✅ PostgreSQL pool obtained');

    // monthly_snapshots tablosundan verileri çek (Daha güvenilir kaynak)
    console.log('🔍 Querying monthly_snapshots...');
    const result = await pool.query(`
      SELECT
        snapshot_month,
        month_name,
        year,
        total_income,
        total_expense,
        savings,
        created_at
      FROM monthly_snapshots
      WHERE user_id = $1
      ORDER BY snapshot_month DESC
      LIMIT 12
    `, [userId]);

    console.log('✅ Query successful, rows:', result.rows.length);

    const history = result.rows.map(row => {
      const d = new Date(row.snapshot_month);
      const month_year = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      return {
        _id: month_year,
        month: month_year,
        year: row.year,
        monthName: row.month_name,
        income: Number(row.total_income),
        totalExpenses: Number(row.total_expense),
        savings: Number(row.savings),
        createdAt: row.created_at
      };
    });

    // Kümülatif tasarrufu Mongo'dan al
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      history: history,
      cumulativeSavings: user.cumulativeSavings || 0
    });

  } catch (err) {
    console.error('History fetch error (PG):', err);
    res.status(500).json({ success: false, message: 'Geçmiş veriler alınamadı' });
  }
});
    
  router.get('/history/details', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { month } = req.query; 

    if (!month) {
      return res.status(400).json({ success: false, message: 'Ay bilgisi eksik' });
    }

    const pool = get_pg_connection();

    const result = await pool.query(`
      SELECT 
        name, 
        amount, 
        category, 
        expense_type, 
        day_of_month
      FROM expense_events
      WHERE user_id = $1 AND month_year = $2
      ORDER BY day_of_month ASC
    `, [userId, month]);

    const fixedExpenses = [];
    const variableExpenses = [];

    result.rows.forEach(row => {
      const item = {
        name: row.name,
        amount: Number(row.amount),
        category: row.category,
        day: row.day_of_month
      };

      if (row.expense_type === 'fixed') {
        fixedExpenses.push(item);
      } else {
        variableExpenses.push(item);
      }
    });

    res.json({
      success: true,
      data: {
        fixedExpenses,
        variableExpenses
      }
    });

  } catch (err) {
    console.error('Month details fetch error:', err);
    res.status(500).json({ success: false, message: 'Detaylar alınamadı' });
  }
});


router.get('/cumulative-savings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, cumulativeSavings: user.cumulativeSavings || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Toplam tasarruf alınamadı' });
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

// ✅ YENİ: Dashboard açıldığında anlık anomali kontrolü
router.post('/check-anomalies', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });

    // Şu anki ayı belirle
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Toplamları hesapla
    const fixedTotal = user.finance.fixedExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const variableTotal = user.finance.variableExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = fixedTotal + variableTotal;

    // 1. Verileri Postgres'e Eşitle (Sync)
    await axios.post(
      `${ANALYTICS_API}/api/expense-events/bulk-insert`,
      {
        userId: user._id.toString(),
        month: currentMonth,
        year: now.getFullYear(),
        totalIncome: user.finance.monthlyIncome || 0,
        totalExpense: totalExpenses,
        savings: (user.finance.monthlyIncome || 0) - totalExpenses,
        fixedExpenses: user.finance.fixedExpenses,
        variableExpenses: user.finance.variableExpenses
      }
    );

    // 2. Anomali Dedektörünü Çalıştır
    const detectRes = await axios.post(`${ANALYTICS_API}/api/anomalies/detect/${user._id}`);

    res.json({ success: true, data: detectRes.data });

  } catch (err) {
    console.error('Anomaly check error:', err.message);
    res.status(500).json({ success: false, message: 'Anomali kontrolü yapılamadı' });
  }
});

export default router;
export { performMonthlyReset };