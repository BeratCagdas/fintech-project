import api from '../api';

export const fetchDailyInsight = async () => {
  try {
    const response = await api.get('/api/insights/daily');
    return response.data;
  } catch (error) {
    console.error('Daily insight fetch error:', error);
    return { success: false, insight: null };
  }
};

export default {
  fetchDailyInsight
};