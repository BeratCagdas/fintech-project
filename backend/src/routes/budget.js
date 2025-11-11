// backend/src/routes/budget.js
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Bütçe limitlerini getir
router.get('/limits', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      budgetLimits: user.budgetLimits || {
        variable: {},
        fixed: {}
      }
    });
  } catch (err) {
    console.error('Budget limits fetch error:', err);
    res.status(500).json({
      success: false,
      message: 'Bütçe limitleri alınamadı'
    });
  }
});

// Bütçe limitlerini güncelle
router.put('/limits', authMiddleware, async (req, res) => {
  try {
    const { variable, fixed } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Limitleri güncelle
    user.budgetLimits = {
      variable: variable || {},
      fixed: fixed || {}
    };

    user.markModified('budgetLimits');
    await user.save();

    res.json({
      success: true,
      message: 'Bütçe limitleri güncellendi',
      budgetLimits: user.budgetLimits
    });
  } catch (err) {
    console.error('Budget limits update error:', err);
    res.status(500).json({
      success: false,
      message: 'Bütçe limitleri güncellenemedi'
    });
  }
});

// Mevcut ay harcamalarını ve limit durumunu getir
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kategori bazlı harcamaları hesapla
    const categorySpending = {
      variable: {},
      fixed: {}
    };

    // Variable expenses
    user.finance.variableExpenses?.forEach(exp => {
      const cat = exp.category || 'diger';
      categorySpending.variable[cat] = (categorySpending.variable[cat] || 0) + (exp.amount || 0);
    });

    // Fixed expenses
    user.finance.fixedExpenses?.forEach(exp => {
      const cat = exp.category || 'diger';
      categorySpending.fixed[cat] = (categorySpending.fixed[cat] || 0) + (exp.amount || 0);
    });

    // Limit durumlarını hesapla
    const status = {
      variable: {},
      fixed: {}
    };

    // Variable status
    Object.keys(user.budgetLimits?.variable || {}).forEach(cat => {
      const limit = user.budgetLimits.variable[cat] || 0;
      const spent = categorySpending.variable[cat] || 0;
      const percentage = limit > 0 ? (spent / limit * 100).toFixed(1) : 0;
      
      status.variable[cat] = {
        limit,
        spent,
        remaining: Math.max(0, limit - spent),
        percentage: parseFloat(percentage),
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'warning' : percentage >= 70 ? 'caution' : 'safe'
      };
    });

    // Fixed status
    Object.keys(user.budgetLimits?.fixed || {}).forEach(cat => {
      const limit = user.budgetLimits.fixed[cat] || 0;
      const spent = categorySpending.fixed[cat] || 0;
      const percentage = limit > 0 ? (spent / limit * 100).toFixed(1) : 0;
      
      status.fixed[cat] = {
        limit,
        spent,
        remaining: Math.max(0, limit - spent),
        percentage: parseFloat(percentage),
        status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'warning' : percentage >= 70 ? 'caution' : 'safe'
      };
    });

    res.json({
      success: true,
      status
    });
  } catch (err) {
    console.error('Budget status error:', err);
    res.status(500).json({
      success: false,
      message: 'Bütçe durumu alınamadı'
    });
  }
});

export default router;