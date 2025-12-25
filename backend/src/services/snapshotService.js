// backend/src/services/snapshotService.js (YENİ DOSYA)
import axios from 'axios';

const ANALYTICS_API = process.env.ANALYTICS_API_URL || 'http://localhost:8000';

export const triggerSnapshot = async (userId, month) => {
  try {
    console.log(`📊 Creating snapshot for ${userId} - ${month}`);
    
    const response = await axios.post(`${ANALYTICS_API}/api/snapshot/create`, {
      user_id: userId.toString(),
      month: month
    }, {
      timeout: 30000
    });
    
    console.log(`✅ Snapshot created - Health Score: ${response.data.financial_health_score}/100`);
    return response.data;
    
  } catch (err) {
    console.error(`❌ Snapshot failed:`, err.message);
    // Snapshot başarısız olsa bile reset devam etsin
    return { success: false, error: err.message };
  }
};