// backend/src/routes/milestones.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getUnseenMilestones,
  markMilestonesAsSeen
} from '../services/milestoneService.js';
import User from '../models/User.js';

const router = express.Router();

// Görülmemiş milestone'ları getir
router.get('/unseen', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const unseenMilestones = await getUnseenMilestones(userId);
    
    res.json({
      success: true,
      milestones: unseenMilestones
    });
  } catch (err) {
    console.error('Unseen milestones error:', err);
    res.status(500).json({
      success: false,
      message: 'Milestone\'lar alınamadı',
      error: err.message
    });
  }
});

// Milestone'ları görüldü olarak işaretle
router.post('/mark-seen', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { milestoneTypes } = req.body;
    
    if (!milestoneTypes || !Array.isArray(milestoneTypes)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz milestone tipleri'
      });
    }
    
    await markMilestonesAsSeen(userId, milestoneTypes);
    
    res.json({
      success: true,
      message: 'Milestone\'lar görüldü olarak işaretlendi'
    });
  } catch (err) {
    console.error('Mark seen error:', err);
    res.status(500).json({
      success: false,
      message: 'Milestone\'lar işaretlenemedi',
      error: err.message
    });
  }
});

// Kullanıcının tüm achievement istatistiklerini getir
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.achievements) {
      return res.json({
        success: true,
        stats: {
          totalMilestones: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalGoalsCompleted: 0,
          monthsWithBudgetControl: 0,
          highestMonthlySavings: 0
        }
      });
    }
    
    res.json({
      success: true,
      stats: {
        totalMilestones: user.achievements.milestones.length,
        currentStreak: user.achievements.savingsStreak.currentStreak,
        longestStreak: user.achievements.savingsStreak.longestStreak,
        totalGoalsCompleted: user.achievements.stats.totalGoalsCompleted,
        monthsWithBudgetControl: user.achievements.stats.monthsWithBudgetControl,
        highestMonthlySavings: user.achievements.stats.highestMonthlySavings
      },
      milestones: user.achievements.milestones.map(m => ({
        type: m.type,
        unlockedAt: m.unlockedAt,
        seen: m.seen
      }))
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı',
      error: err.message
    });
  }
});

export default router;