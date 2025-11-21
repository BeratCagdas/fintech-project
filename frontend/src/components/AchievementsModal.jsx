// frontend/src/components/AchievementsModal.jsx
import React from 'react';
import './AchievementsModal.css';

const AchievementsModal = ({ 
  isOpen, 
  onClose, 
  achievementStats, 
  cumulativeSavings 
}) => {
  if (!isOpen) return null;

  // Milestone definitions
  const savingsMilestones = [
    { type: 'savings_1k', threshold: 1000, title: 'İlk Adım', icon: '🎯' },
    { type: 'savings_5k', threshold: 5000, title: 'Hızlı Başlangıç', icon: '🚀' },
    { type: 'savings_10k', threshold: 10000, title: 'Beş Haneli Kulüp', icon: '💎' },
    { type: 'savings_25k', threshold: 25000, title: 'Yatırımcı', icon: '📈' },
    { type: 'savings_50k', threshold: 50000, title: 'Yarı Yolda', icon: '🏆' },
    { type: 'savings_100k', threshold: 100000, title: 'Altı Haneli!', icon: '👑' },
    { type: 'savings_250k', threshold: 250000, title: 'Çeyrek Milyon', icon: '💰' },
    { type: 'savings_500k', threshold: 500000, title: 'Yarım Milyon', icon: '🌟' }
  ];

  const streakMilestones = [
    { type: 'streak_3months', months: 3, title: '3 Aylık Seri', icon: '🔥' },
    { type: 'streak_6months', months: 6, title: '6 Aylık Seri', icon: '🔥🔥' },
    { type: 'streak_12months', months: 12, title: '1 Yıllık Seri', icon: '🔥🔥🔥' }
  ];

  // ✅ YENİ: Gerçek unlocked sayısını hesapla
  const unlockedSavingsMilestones = savingsMilestones.filter(
    m => cumulativeSavings >= m.threshold
  ).length;

  const unlockedStreakMilestones = streakMilestones.filter(
    m => achievementStats.longestStreak >= m.months
  ).length;

  const totalUnlockedMilestones = unlockedSavingsMilestones + unlockedStreakMilestones;

  // ✅ YENİ: Son kazanılan milestone'u bul (en yüksek threshold'lu)
  const latestSavingsMilestone = savingsMilestones
    .filter(m => cumulativeSavings >= m.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0];

  const latestStreakMilestone = streakMilestones
    .filter(m => achievementStats.longestStreak >= m.months)
    .sort((a, b) => b.months - a.months)[0];

  // En son kazanılan milestone (tarih bazlı değil, en yüksek değer bazlı)
  const latestMilestone = latestSavingsMilestone || latestStreakMilestone;

  return (
    <div className="achievements-modal-overlay">
      <div className="achievements-modal-backdrop" onClick={onClose}></div>
      
      <div className="achievements-modal-container">
        {/* Header */}
        <div className="achievements-modal-header">
          <h2>🏆 Başarılarım</h2>
          <button className="achievements-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="achievements-modal-body">
          
          {/* Stats Overview */}
          <div className="achievements-stats-overview">
            <div className="achievement-stat-card">
              <div className="achievement-stat-icon">🏅</div>
              <div className="achievement-stat-content">
                <div className="achievement-stat-label">Toplam Başarı</div>
                <div className="achievement-stat-value">{totalUnlockedMilestones}</div>
              </div>
            </div>
            
            <div className="achievement-stat-card">
              <div className="achievement-stat-icon">🔥</div>
              <div className="achievement-stat-content">
                <div className="achievement-stat-label">Mevcut Seri</div>
                <div className="achievement-stat-value">{achievementStats.currentStreak} ay</div>
              </div>
            </div>
            
            <div className="achievement-stat-card">
              <div className="achievement-stat-icon">📊</div>
              <div className="achievement-stat-content">
                <div className="achievement-stat-label">Rekor Seri</div>
                <div className="achievement-stat-value">{achievementStats.longestStreak} ay</div>
              </div>
            </div>
            
            <div className="achievement-stat-card">
              <div className="achievement-stat-icon">💰</div>
              <div className="achievement-stat-content">
                <div className="achievement-stat-label">Toplam Birikim</div>
                <div className="achievement-stat-value">₺{cumulativeSavings.toLocaleString('tr-TR')}</div>
              </div>
            </div>
          </div>

          {/* Latest Achievement */}
          {latestMilestone && (
            <div className="achievements-latest-section">
              <h3>⭐ Son Kazanılan Başarı</h3>
              <div className="achievements-highlight-card">
                <div className="achievements-highlight-icon">
                  {latestMilestone.icon}
                </div>
                <div className="achievements-highlight-info">
                  <h4>{latestMilestone.title}</h4>
                  <p className="achievements-highlight-date">
                    {latestSavingsMilestone 
                      ? `₺${latestMilestone.threshold.toLocaleString('tr-TR')} birikime ulaştınız!`
                      : `${latestMilestone.months} aylık seri tamamlandı!`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Savings Milestones */}
          <div className="achievements-category-section">
            <h3>💰 Birikim Başarıları</h3>
            <div className="achievements-milestone-grid">
              {savingsMilestones.map(milestone => {
                const isUnlocked = cumulativeSavings >= milestone.threshold;
                const progress = (cumulativeSavings / milestone.threshold) * 100;
                
                return (
                  <div 
                    key={milestone.type} 
                    className={`achievements-milestone-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievements-milestone-icon">
                      {isUnlocked ? milestone.icon : '🔒'}
                    </div>
                    <div className="achievements-milestone-title">
                      {isUnlocked ? milestone.title : '???'}
                    </div>
                    <div className="achievements-milestone-threshold">
                      {isUnlocked ? `₺${milestone.threshold.toLocaleString('tr-TR')}` : '???'}
                    </div>
                    
                    {!isUnlocked && cumulativeSavings > 0 && (
                      <div className="achievements-milestone-progress">
                        <div className="achievements-progress-bar">
                          <div 
                            className="achievements-progress-fill"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <span className="achievements-progress-text">
                          {Math.min(progress, 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="achievements-category-section">
            <h3>🔥 Tasarruf Serisi Başarıları</h3>
            <div className="achievements-milestone-grid">
              {streakMilestones.map(milestone => {
                const isUnlocked = achievementStats.longestStreak >= milestone.months;
                const progress = (achievementStats.currentStreak / milestone.months) * 100;
                
                return (
                  <div 
                    key={milestone.type} 
                    className={`achievements-milestone-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievements-milestone-icon">
                      {isUnlocked ? milestone.icon : '🔒'}
                    </div>
                    <div className="achievements-milestone-title">
                      {isUnlocked ? milestone.title : '???'}
                    </div>
                    <div className="achievements-milestone-threshold">
                      {isUnlocked ? `${milestone.months} ay` : '???'}
                    </div>
                    
                    {!isUnlocked && achievementStats.currentStreak > 0 && (
                      <div className="achievements-milestone-progress">
                        <div className="achievements-progress-bar">
                          <div 
                            className="achievements-progress-fill"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <span className="achievements-progress-text">
                          {achievementStats.currentStreak} / {milestone.months}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ✅ GÜNCELLEME: Empty State sadece gerçekten başarı yoksa göster */}
          {totalUnlockedMilestones === 0 && (
            <div className="achievements-empty-state">
              <div className="achievements-empty-icon">🎯</div>
              <h3>Henüz başarı kazanılmadı!</h3>
              <p>İlk tasarrufunu yaparak başarı kazanmaya başla!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;