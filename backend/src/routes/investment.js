// backend/src/routes/investment.js (YENİ DOSYA)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm yatırımları getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const totalInvested = user.investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const totalValue = user.investments.reduce((sum, inv) => sum + (inv.currentValue || inv.totalInvested), 0);
    const totalProfitLoss = totalValue - totalInvested;
    const profitLossPercentage = totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100) : 0;
    
    // Tip bazında grupla
    const byType = {};
    user.investments.forEach(inv => {
      if (!byType[inv.type]) {
        byType[inv.type] = {
          count: 0,
          invested: 0,
          currentValue: 0
        };
      }
      byType[inv.type].count++;
      byType[inv.type].invested += inv.totalInvested;
      byType[inv.type].currentValue += (inv.currentValue || inv.totalInvested);
    });
    
    res.json({
      success: true,
      investments: user.investments,
      summary: {
        totalInvested,
        totalValue,
        profitLoss: totalProfitLoss,
        profitLossPercentage: profitLossPercentage.toFixed(2),
        count: user.investments.length,
        byType
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yeni yatırım ekle
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const newInvestment = {
      type: req.body.type,
      name: req.body.name,
      symbol: req.body.symbol,
      quantity: req.body.quantity,
      purchasePrice: req.body.purchasePrice,
      currentPrice: req.body.currentPrice || req.body.purchasePrice,
      totalInvested: req.body.totalInvested,
      currentValue: req.body.currentValue || req.body.totalInvested,
      purchaseDate: req.body.purchaseDate,
      platform: req.body.platform,
      notes: req.body.notes
    };
    
    // Kar/Zarar hesapla
    newInvestment.profitLoss = newInvestment.currentValue - newInvestment.totalInvested;
    newInvestment.profitLossPercentage = ((newInvestment.profitLoss / newInvestment.totalInvested) * 100).toFixed(2);
    
    user.investments.push(newInvestment);
    await user.save();
    
    res.json({
      success: true,
      investment: user.investments[user.investments.length - 1],
      message: 'Yatırım eklendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yatırım fiyat güncelle
router.put('/:investmentId/update-price', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const investment = user.investments.id(req.params.investmentId);
    
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Yatırım bulunamadı' });
    }
    
    investment.currentPrice = req.body.currentPrice;
    investment.currentValue = req.body.currentValue || (investment.quantity * investment.currentPrice);
    investment.profitLoss = investment.currentValue - investment.totalInvested;
    investment.profitLossPercentage = ((investment.profitLoss / investment.totalInvested) * 100).toFixed(2);
    
    await user.save();
    
    res.json({
      success: true,
      investment,
      message: 'Fiyat güncellendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yatırım sat/kapat
router.post('/:investmentId/sell', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const investment = user.investments.id(req.params.investmentId);
    
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Yatırım bulunamadı' });
    }
    
    const sellPrice = req.body.sellPrice;
    const sellValue = req.body.quantity ? (req.body.quantity * sellPrice) : (investment.quantity * sellPrice);
    const profitLoss = sellValue - investment.totalInvested;
    
    // Kümülatif tasarrufa ekle (satış getirisi)
    user.cumulativeSavings = (user.cumulativeSavings || 0) + sellValue;
    
    // Yatırımı kaldır
    user.investments.pull(req.params.investmentId);
    await user.save();
    
    res.json({
      success: true,
      sellValue,
      profitLoss,
      message: 'Yatırım satıldı'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yatırım sil
router.delete('/:investmentId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const investment = user.investments.id(req.params.investmentId);
    
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Yatırım bulunamadı' });
    }
    
    user.investments.pull(req.params.investmentId);
    await user.save();
    
    res.json({
      success: true,
      message: 'Yatırım silindi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;