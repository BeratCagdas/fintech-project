// backend/src/routes/anomalies.js
import express from 'express';
import pg from 'pg';
import authMiddleware from '../middleware/authMiddleware.js';

const { Pool } = pg;
const router = express.Router();

// PostgreSQL bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.POSTGRES_URI || 'postgresql://postgres:password@localhost:5432/fintech_analytics',
});

// GET: Kullanıcının son anomalilerini getir
router.get('/recent/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId; // URL'den al
    const tokenUserId = req.user._id.toString(); // Token'dan al

    // Güvenlik kontrolü: Kendi anomalilerine bakabilir
    if (userId !== tokenUserId) {
      return res.status(403).json({
        success: false,
        message: 'Yetkisiz erişim'
      });
    }

    const { acknowledged } = req.query;
    
    let query = `
      SELECT 
        id,
        alert_type,
        severity,
        category,
        current_value,
        expected_value,
        deviation_percentage,
        title,
        description,
        recommendation,
        detection_date,
        is_acknowledged,
        created_at
      FROM anomaly_alerts 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (acknowledged === 'false') {
      query += ` AND (is_acknowledged IS NULL OR is_acknowledged = FALSE)`;
    }
    
    query += ` ORDER BY detection_date DESC, id DESC LIMIT 10`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      alerts: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Anomali getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST: Anomaliyi "okundu" olarak işaretle
router.post('/acknowledge/:alertId', authMiddleware, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const query = `
      UPDATE anomaly_alerts 
      SET is_acknowledged = TRUE,
          acknowledged_at = NOW()
      WHERE id = $1
      RETURNING id, title
    `;
    
    const result = await pool.query(query, [alertId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Anomali bulunamadı' 
      });
    }
    
    res.json({ 
      success: true,
      alert: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Anomali onaylama hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST: Tüm anomalileri "okundu" yap
router.post('/acknowledge-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    const query = `
      UPDATE anomaly_alerts 
      SET is_acknowledged = TRUE,
          acknowledged_at = NOW()
      WHERE user_id = $1 
      AND (is_acknowledged IS NULL OR is_acknowledged = FALSE)
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({ 
      success: true,
      count: result.rows.length,
      message: `${result.rows.length} anomali okundu olarak işaretlendi`
    });
    
  } catch (error) {
    console.error('❌ Tüm anomalileri onaylama hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET: Anomali istatistikleri
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_acknowledged = FALSE OR is_acknowledged IS NULL) as unacknowledged,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'high') as high,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium,
        COUNT(*) FILTER (WHERE severity = 'low') as low
      FROM anomaly_alerts
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total),
        unacknowledged: parseInt(stats.unacknowledged),
        by_severity: {
          critical: parseInt(stats.critical),
          high: parseInt(stats.high),
          medium: parseInt(stats.medium),
          low: parseInt(stats.low)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ İstatistik hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;