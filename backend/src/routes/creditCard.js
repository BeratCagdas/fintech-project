// backend/src/routes/creditCard.js (YENİ DOSYA)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm kartları getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.updateCreditCardUtilization();
    await user.save();
    
    const activeCards = user.creditCards.filter(c => c.status === 'aktif');
    const totalLimit = activeCards.reduce((sum, c) => sum + c.limit, 0);
    const totalDebt = activeCards.reduce((sum, c) => sum + c.currentDebt, 0);
    const avgUtilization = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
    
    res.json({
      success: true,
      creditCards: user.creditCards,
      summary: {
        totalLimit,
        totalDebt,
        availableCredit: totalLimit - totalDebt,
        avgUtilization: avgUtilization.toFixed(1),
        activeCount: activeCards.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yeni kart ekle
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const newCard = {
      bankName: req.body.bankName,
      cardName: req.body.cardName,
      limit: req.body.limit,
      currentDebt: req.body.currentDebt || 0,
      cutoffDay: req.body.cutoffDay,
      dueDay: req.body.dueDay,
      minimumPaymentRate: req.body.minimumPaymentRate || 0.2,
      status: 'aktif'
    };
    
    user.creditCards.push(newCard);
    user.updateCreditCardUtilization();
    await user.save();
    
    res.json({
      success: true,
      creditCard: user.creditCards[user.creditCards.length - 1],
      message: 'Kart eklendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Kart harcaması ekle
router.post('/:cardId/charge', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const card = user.creditCards.id(req.params.cardId);
    
    if (!card) {
      return res.status(404).json({ success: false, message: 'Kart bulunamadı' });
    }
    
    card.currentDebt += req.body.amount;
    user.updateCreditCardUtilization();
    await user.save();
    
    res.json({
      success: true,
      creditCard: card,
      message: 'Harcama eklendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Kart ödemesi
router.post('/:cardId/payment', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const card = user.creditCards.id(req.params.cardId);
    
    if (!card) {
      return res.status(404).json({ success: false, message: 'Kart bulunamadı' });
    }
    
    const payment = {
      month: req.body.month,
      statementAmount: req.body.statementAmount,
      minimumPayment: req.body.minimumPayment,
      paidAmount: req.body.paidAmount,
      paidDate: new Date(),
      onTime: new Date() <= new Date(req.body.dueDate),
      daysLate: req.body.daysLate || 0
    };
    
    card.paymentHistory.push(payment);
    card.currentDebt -= req.body.paidAmount;
    card.currentDebt = Math.max(0, card.currentDebt);
    
    user.updateCreditCardUtilization();
    await user.save();
    
    res.json({
      success: true,
      creditCard: card,
      message: 'Ödeme kaydedildi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Kart sil
router.delete('/:cardId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const card = user.creditCards.id(req.params.cardId);
    
    if (!card) {
      return res.status(404).json({ success: false, message: 'Kart bulunamadı' });
    }
    
    user.creditCards.pull(req.params.cardId);
    user.updateCreditCardUtilization();
    await user.save();
    
    res.json({ success: true, message: 'Kart silindi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;