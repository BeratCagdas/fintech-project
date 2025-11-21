import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { generateInsight } from '../services/insightService.js';

const router = express.Router();

// Günlük insight getir
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('🔍 Insight oluşturuluyor...');
    
    const insight = await generateInsight(userId);
    
    console.log('✅ Insight oluşturuldu:', insight);
    
    res.json({
      success: true,
      insight: insight
    });

  } catch (err) {
    console.error('❌ Insight error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Insight oluşturulamadı',
      error: err.message
    });
  }
});

export default router;