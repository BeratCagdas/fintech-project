import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import axios from 'axios';

const router = express.Router();

const ANALYTICS_API = process.env.ANALYTICS_API_URL || 'http://localhost:8000';
console.log('🔍 ANALYTICS_API:', ANALYTICS_API);
// Get latest credit score
router.get('/credit-score/latest', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Python API'den en son credit score'u al
    const response = await axios.get(
      `${ANALYTICS_API}/api/snapshots/latest/${userId}`,
      { timeout: 10000 }
       
    );
    
    if (response.data) {
      return res.json({
        success: true,
        creditScore: response.data.credit_score || null,
        riskCategory: response.data.risk_category || null,
        riskLevel: response.data.risk_level || null,
        breakdown: {
          paymentHistory: response.data.payment_history_score || 0,
          debtBurden: response.data.debt_burden_score || 0,
          behavior: response.data.behavior_score || 0,
          stability: response.data.stability_score || 0,
          asset: response.data.asset_score || 0
        },
        metrics: {
          creditUtilization: response.data.credit_utilization || 0,
          debtToIncome: response.data.debt_to_income || 0,
          onTimePaymentRate: response.data.on_time_payment_rate || 0
        }
      });
    } else {
      return res.json({
        success: false,
        message: 'Henüz credit score hesaplanmamış'
      });
    }
    
  } catch (error) {
    console.error('Credit score fetch error:', error.message);
    
    // Python API çalışmıyorsa boş döndür
    return res.json({
      success: false,
      message: 'Credit score verisi alınamadı',
      creditScore: null
    });
  }
});

router.get('/credit-score/explain', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    console.log('📊 Credit score açıklama isteniyor:', userId);
    
   
    const response = await axios.get(
      `${ANALYTICS_API}/api/credit-score/explain/${userId}`, 
      { timeout: 10000 }
    );
    
    console.log('✅ Python response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Credit score açıklama başarılı');
      return res.json(response.data);
    } else {
      return res.json({
        success: false,
        message: response.data.message || 'Veri bulunamadı'
      });
    }
    
  } catch (error) {
    console.error('❌ Credit score açıklama hatası:', error.message);
    
    if (error.response) {
      console.error('Python API error:', error.response.data);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Credit score açıklama başarısız',
      error: error.message
    });
  }
});

// Get Cash Flow Forecast
router.get('/cash-flow/forecast', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const months = req.query.months || 6; // Default 6 months

    console.log(`💰 Cash flow forecast isteniyor: ${userId}, ${months} ay`);

    const response = await axios.get(
      `${ANALYTICS_API}/api/forecast/cash-flow/${userId}?months=${months}`,
      { timeout: 15000 }
    );

    if (response.data.success) {
      console.log('✅ Cash flow forecast başarılı');
      return res.json(response.data);
    } else {
      return res.json({
        success: false,
        message: response.data.message || 'Forecast verisi bulunamadı'
      });
    }

  } catch (error) {
    console.error('❌ Cash flow forecast hatası:', error.message);

    if (error.response) {
      console.error('Python API error:', error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Cash flow forecast başarısız',
      error: error.message
    });
  }
});

// What-if Scenario Analysis
router.post('/cash-flow/what-if', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { scenario, months } = req.body;

    console.log(`🔮 What-if scenario isteniyor: ${userId}`);
    console.log('Scenario:', scenario);

    const response = await axios.post(
      `${ANALYTICS_API}/api/forecast/cash-flow/${userId}/what-if?months=${months || 6}`,
      scenario,
      { timeout: 15000 }
    );

    if (response.data.success) {
      console.log('✅ What-if scenario başarılı');
      return res.json(response.data);
    } else {
      return res.json({
        success: false,
        message: response.data.message || 'What-if analizi başarısız'
      });
    }

  } catch (error) {
    console.error('❌ What-if scenario hatası:', error.message);

    if (error.response) {
      console.error('Python API error:', error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'What-if scenario başarısız',
      error: error.message
    });
  }
});


export default router;