// backend/src/routes/asset.js (YENİ DOSYA)
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm varlıkları getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const totalValue = user.assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalLoan = user.assets.reduce((sum, asset) => sum + (asset.loanAmount || 0), 0);
    const netValue = totalValue - totalLoan;
    
    // Tip bazında grupla
    const byType = {};
    user.assets.forEach(asset => {
      if (!byType[asset.type]) {
        byType[asset.type] = {
          count: 0,
          totalValue: 0,
          totalLoan: 0
        };
      }
      byType[asset.type].count++;
      byType[asset.type].totalValue += asset.currentValue;
      byType[asset.type].totalLoan += (asset.loanAmount || 0);
    });
    
    res.json({
      success: true,
      assets: user.assets,
      summary: {
        totalValue,
        totalLoan,
        netValue,
        count: user.assets.length,
        byType
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yeni varlık ekle
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const newAsset = {
      type: req.body.type,
      name: req.body.name,
      description: req.body.description,
      purchaseValue: req.body.purchaseValue,
      currentValue: req.body.currentValue,
      purchaseDate: req.body.purchaseDate,
      hasLoan: req.body.hasLoan || false,
      loanAmount: req.body.loanAmount || 0,
      loanMonthlyPayment: req.body.loanMonthlyPayment || 0,
      appreciationRate: req.body.appreciationRate
    };
    
    user.assets.push(newAsset);
    await user.save();
    
    res.json({
      success: true,
      asset: user.assets[user.assets.length - 1],
      message: 'Varlık eklendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Varlık değerini güncelle
router.put('/:assetId/update-value', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const asset = user.assets.id(req.params.assetId);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Varlık bulunamadı' });
    }
    
    asset.currentValue = req.body.currentValue;
    
    // Değer artış oranını hesapla
    if (asset.purchaseValue) {
      const appreciation = ((asset.currentValue - asset.purchaseValue) / asset.purchaseValue) * 100;
      asset.appreciationRate = appreciation.toFixed(2);
    }
    
    await user.save();
    
    res.json({
      success: true,
      asset,
      message: 'Değer güncellendi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Varlık kredisi ödemesi
router.post('/:assetId/loan-payment', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const asset = user.assets.id(req.params.assetId);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Varlık bulunamadı' });
    }
    
    asset.loanAmount -= req.body.amount;
    asset.loanAmount = Math.max(0, asset.loanAmount);
    
    if (asset.loanAmount === 0) {
      asset.hasLoan = false;
      asset.loanMonthlyPayment = 0;
    }
    
    await user.save();
    
    res.json({
      success: true,
      asset,
      message: 'Kredi ödemesi kaydedildi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Varlık sat
router.post('/:assetId/sell', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const asset = user.assets.id(req.params.assetId);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Varlık bulunamadı' });
    }
    
    const sellPrice = req.body.sellPrice;
    const netProceeds = sellPrice - (asset.loanAmount || 0);
    
    // Kümülatif tasarrufa ekle
    user.cumulativeSavings = (user.cumulativeSavings || 0) + netProceeds;
    
    user.assets.pull(req.params.assetId);
    await user.save();
    
    res.json({
      success: true,
      sellPrice,
      loanPaid: asset.loanAmount || 0,
      netProceeds,
      message: 'Varlık satıldı'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Varlık sil
router.delete('/:assetId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const asset = user.assets.id(req.params.assetId);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Varlık bulunamadı' });
    }
    
    user.assets.pull(req.params.assetId);
    await user.save();
    
    res.json({
      success: true,
      message: 'Varlık silindi'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;