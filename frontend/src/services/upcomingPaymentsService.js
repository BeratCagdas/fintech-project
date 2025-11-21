import api from '../api';

export const fetchUpcomingPayments = async () => {
  try {
    const response = await api.get('/api/recurring/upcoming');
    return response.data;
  } catch (error) {
    console.error('Upcoming payments fetch error:', error);
    return { success: false, upcomingPayments: [], count: 0 };
  }
};

export default {
  fetchUpcomingPayments
};