// backend/src/services/milestoneService.js
import User from '../models/User.js';

// Milestone tanımları
const MILESTONES = {
  savings_1k: { threshold: 1000, title: 'İlk Adım', message: 'İlk 1,000 TL\'yi biriktirdin!', icon: '🎯', color: '#3b82f6' },
  savings_5k: { threshold: 5000, title: 'Hızlı Başlangıç', message: '5,000 TL birikim! Harika gidiyorsun!', icon: '🚀', color: '#8b5cf6' },
  savings_10k: { threshold: 10000, title: 'Beş Haneli Kulüp', message: '10,000 TL! Artık ciddiye alınıyorsun!', icon: '💎', color: '#06b6d4' },
  savings_25k: { threshold: 25000, title: 'Yatırımcı', message: '25,000 TL! Yatırım zamanı!', icon: '📈', color: '#10b981' },
  savings_50k: { threshold: 50000, title: 'Yarı Yolda', message: '50,000 TL! Finansal özgürlük yolundasın!', icon: '🏆', color: '#f59e0b' },
  savings_100k: { threshold: 100000, title: 'Altı Haneli!', message: '100,000 TL! İnanılmaz başarı!', icon: '👑', color: '#ef4444' },
  savings_250k: { threshold: 250000, title: 'Çeyrek Milyon', message: '250,000 TL! Elit kulübe hoş geldin!', icon: '💰', color: '#ec4899' },
  savings_500k: { threshold: 500000, title: 'Yarım Milyon', message: '500,000 TL! Finansal guru!', icon: '🌟', color: '#8b5cf6' }
};

const STREAK_MILESTONES = {
  streak_3months: { months: 3, title: '3 Aylık Seri', message: '3 ay üst üste tasarruf! Disiplin şampiyonu!', icon: '🔥' },
  streak_6months: { months: 6, title: '6 Aylık Seri', message: '6 ay! Tasarruf alışkanlığı kazandın!', icon: '🔥🔥' },
  streak_12months: { months: 12, title: '1 Yıllık Seri', message: 'Tam bir yıl! Efsane tasarrufçu!', icon: '🔥🔥🔥' }
};

// Milestone kontrol et ve ekle
export const checkAndAwardMilestones = async (userId, cumulativeSavings) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const newMilestones = [];
  
  // Achievements yapısı yoksa oluştur
  if (!user.achievements) {
    user.achievements = {
      milestones: [],
      savingsStreak: {
        currentStreak: 0,
        longestStreak: 0,
        lastSavingsMonth: null
      },
      stats: {
        totalGoalsCompleted: 0,
        monthsWithBudgetControl: 0,
        highestMonthlySavings: 0
      }
    };
  }

  // Birikim milestone'larını kontrol et
  for (const [key, milestone] of Object.entries(MILESTONES)) {
    if (cumulativeSavings >= milestone.threshold) {
      // Bu milestone daha önce kazanılmış mı?
      const alreadyUnlocked = user.achievements.milestones.some(m => m.type === key);
      
      if (!alreadyUnlocked) {
        user.achievements.milestones.push({
          type: key,
          unlockedAt: new Date(),
          seen: false
        });
        
        newMilestones.push({
          type: key,
          ...milestone
        });
      }
    }
  }

  if (newMilestones.length > 0) {
    await user.save();
  }

  return newMilestones;
};

// Tasarruf streak'i güncelle
export const updateSavingsStreak = async (userId, monthlySavings) => {
  const user = await User.findById(userId);
  if (!user || !user.achievements) return null;

  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"
  const lastMonth = user.achievements.savingsStreak.lastSavingsMonth;

  const newMilestones = [];

  // Tasarruf pozitifse streak devam eder
  if (monthlySavings > 0) {
    // İlk defa mı yoksa devam mı?
    if (!lastMonth) {
      user.achievements.savingsStreak.currentStreak = 1;
    } else {
      // Önceki ay ile bu ay ardışık mı?
      const lastDate = new Date(lastMonth + '-01');
      const currentDate = new Date(currentMonth + '-01');
      const monthDiff = (currentDate.getFullYear() - lastDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - lastDate.getMonth());

      if (monthDiff === 1) {
        // Ardışık ay - streak devam
        user.achievements.savingsStreak.currentStreak += 1;
      } else if (monthDiff > 1) {
        // Ara verilmiş - streak sıfırla
        user.achievements.savingsStreak.currentStreak = 1;
      }
      // monthDiff === 0 ise aynı ay, streak değişmez
    }

    user.achievements.savingsStreak.lastSavingsMonth = currentMonth;

    // Longest streak güncelle
    if (user.achievements.savingsStreak.currentStreak > user.achievements.savingsStreak.longestStreak) {
      user.achievements.savingsStreak.longestStreak = user.achievements.savingsStreak.currentStreak;
    }

    // Streak milestone kontrolü
    const currentStreak = user.achievements.savingsStreak.currentStreak;
    for (const [key, milestone] of Object.entries(STREAK_MILESTONES)) {
      if (currentStreak >= milestone.months) {
        const alreadyUnlocked = user.achievements.milestones.some(m => m.type === key);
        
        if (!alreadyUnlocked) {
          user.achievements.milestones.push({
            type: key,
            unlockedAt: new Date(),
            seen: false
          });
          
          newMilestones.push({
            type: key,
            ...milestone,
            color: '#f97316'
          });
        }
      }
    }
  } else {
    // Negatif tasarruf - streak kırıldı
    user.achievements.savingsStreak.currentStreak = 0;
  }

  // Highest monthly savings güncelle
  if (monthlySavings > user.achievements.stats.highestMonthlySavings) {
    user.achievements.stats.highestMonthlySavings = monthlySavings;
  }

  await user.save();
  
  return {
    newMilestones,
    currentStreak: user.achievements.savingsStreak.currentStreak
  };
};

// Görülmemiş milestone'ları getir
export const getUnseenMilestones = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.achievements) return [];

  const unseenMilestones = user.achievements.milestones
    .filter(m => !m.seen)
    .map(m => {
      const milestoneData = MILESTONES[m.type] || STREAK_MILESTONES[m.type];
      return {
        type: m.type,
        unlockedAt: m.unlockedAt,
        ...milestoneData
      };
    });

  return unseenMilestones;
};

// Milestone'ları görüldü olarak işaretle
export const markMilestonesAsSeen = async (userId, milestoneTypes) => {
  const user = await User.findById(userId);
  if (!user || !user.achievements) return;

  user.achievements.milestones.forEach(m => {
    if (milestoneTypes.includes(m.type)) {
      m.seen = true;
    }
  });

  await user.save();
};

export default {
  checkAndAwardMilestones,
  updateSavingsStreak,
  getUnseenMilestones,
  markMilestonesAsSeen
};