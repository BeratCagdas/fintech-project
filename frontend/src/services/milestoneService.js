// frontend/src/services/milestoneService.js
import api from '../api';

// Görülmemiş milestone'ları getir
export const fetchUnseenMilestones = async () => {
  try {
    const response = await api.get('/api/milestones/unseen');
    return response.data.milestones || [];
  } catch (error) {
    console.error('Unseen milestones fetch error:', error);
    return [];
  }
};

// Milestone'ları görüldü olarak işaretle
export const markMilestonesAsSeen = async (milestoneTypes) => {
  try {
    const response = await api.post('/api/milestones/mark-seen', {
      milestoneTypes
    });
    return response.data;
  } catch (error) {
    console.error('Mark milestones seen error:', error);
    throw error;
  }
};

// Achievement istatistiklerini getir
export const fetchAchievementStats = async () => {
  try {
    const response = await api.get('/api/milestones/stats');
    return response.data;
  } catch (error) {
    console.error('Achievement stats fetch error:', error);
    return null;
  }
};

export default {
  fetchUnseenMilestones,
  markMilestonesAsSeen,
  fetchAchievementStats
};