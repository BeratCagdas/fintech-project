// backend/src/routes/debt.js (YENİ DOSYA)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm borçları getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const activeDebts = user.debts.filter(d => d.status === 'aktif');
    const totalDebt = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const monthlyPayment = activeDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    
    res.json({
      success: true,
      debts: user.debts,
      summary: {
        totalDebt,
        monthlyPayment,
        activeCount: activeDebts.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yeni borç ekle
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const newDebt = {
      type: req.body.type,
      name: req.body.name,
      bankName: req.body.bankName,
      totalAmount: req.body.totalAmount,
      remainingAmount: req.body.remainingAmount || req.body.totalAmount,
      monthlyPayment: req.body.monthlyPayment,
      interestRate: req.body.interestRate || 0,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: 'aktif'
    };
    
    user.debts.push(newDebt);
    await user.save();
    
    res.json({
      success: true,
      debt: user.debts[user.debts.length - 1],
      message: 'Borç eklendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Borç ödemesi kaydet
router.post('/:debtId/payment', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const debt = user.debts.id(req.params.debtId);
    
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Borç bulunamadı' });
    }
    
    const payment = {
      month: req.body.month,
      dueDate: req.body.dueDate,
      paidDate: new Date(),
      amount: req.body.amount,
      paid: true,
      onTime: new Date() <= new Date(req.body.dueDate),
      daysLate: req.body.daysLate || 0
    };
    
    debt.paymentHistory.push(payment);
    debt.remainingAmount -= req.body.amount;
    
    if (debt.remainingAmount <= 0) {
      debt.status = 'kapandi';
      debt.remainingAmount = 0;
    }
    
    await user.save();
    
    res.json({
      success: true,
      debt,
      message: 'Ödeme kaydedildi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Borç güncelle
router.put('/:debtId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const debt = user.debts.id(req.params.debtId);
    
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Borç bulunamadı' });
    }
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        debt[key] = req.body[key];
      }
    });
    
    await user.save();
    
    res.json({
      success: true,
      debt,
      message: 'Borç güncellendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Borç sil
router.delete('/:debtId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const debt = user.debts.id(req.params.debtId);
    
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Borç bulunamadı' });
    }
    
    user.debts.pull(req.params.debtId);
    await user.save();
    
    res.json({
      success: true,
      message: 'Borç silindi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;