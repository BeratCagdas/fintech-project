import api from '../api';

// Bütçe limitlerini getir
export const fetchBudgetLimits = async () => {
  try {
    const res = await api.get('/api/budget/limits');
    return res.data.budgetLimits;
  } catch (err) {
    console.error('Budget limits fetch error:', err);
    return { variable: {}, fixed: {} };
  }
};

// Bütçe durumunu getir (harcama vs limit)
export const fetchBudgetStatus = async () => {
  try {
    const res = await api.get('/api/budget/status');
    return res.data.status;
  } catch (err) {
    console.error('Budget status fetch error:', err);
    return { variable: {}, fixed: {} };
  }
};

// Bütçe limitlerini güncelle
export const updateBudgetLimits = async (variable, fixed) => {
  try {
    const res = await api.put('/api/budget/limits', { variable, fixed });
    return res.data;
  } catch (err) {
    console.error('Budget limits update error:', err);
    throw err;
  }
};