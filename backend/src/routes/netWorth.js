// backend/src/routes/netWorth.js (YENİ DOSYA)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Net Worth hesapla ve getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Net Worth hesapla
    const netWorth = user.calculateNetWorth();
    await user.save();
    
    // Detaylı breakdown
    const breakdown = {
      assets: {
        cash: user.cumulativeSavings || 0,
        investments: user.investments.reduce((sum, inv) => sum + (inv.currentValue || inv.totalInvested), 0),
        property: user.assets.reduce((sum, asset) => sum + asset.currentValue, 0),
        total: 0
      },
      liabilities: {
        debts: user.debts
          .filter(d => d.status === 'aktif')
          .reduce((sum, d) => sum + d.remainingAmount, 0),
        creditCards: user.creditCards
          .filter(c => c.status === 'aktif')
          .reduce((sum, c) => sum + c.currentDebt, 0),
        assetLoans: user.assets.reduce((sum, a) => sum + (a.loanAmount || 0), 0),
        total: 0
      }
    };
    
    breakdown.assets.total = 
      breakdown.assets.cash + 
      breakdown.assets.investments + 
      breakdown.assets.property;
    
    breakdown.liabilities.total = 
      breakdown.liabilities.debts + 
      breakdown.liabilities.creditCards + 
      breakdown.liabilities.assetLoans;
    
    const netValue = breakdown.assets.total - breakdown.liabilities.total;
    
    res.json({
      success: true,
      netWorth: {
        totalAssets: breakdown.assets.total,
        totalLiabilities: breakdown.liabilities.total,
        netValue,
        lastCalculated: netWorth.lastCalculated
      },
      breakdown
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Net Worth geçmişi (snapshot'lardan)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // monthlyHistory'den net worth trend'i oluştur
    const history = user.monthlyHistory.map(h => ({
      month: h.month,
      monthName: h.monthName,
      year: h.year,
      savings: h.savings,
      cumulativeSavings: h.cumulativeSavings || 0,
      // Net worth için daha fazla veri gerekirse buraya eklenecek
    }));
    
    res.json({
      success: true,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;