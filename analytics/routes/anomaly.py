# analytics/routes/anomaly.py (YENİ DOSYA)

from fastapi import APIRouter, HTTPException
from config.postgres import get_pg_connection 
from config.mongo import get_mongo_db 
from services.anomaly.detector import AnomalyDetector

router = APIRouter()
router = APIRouter(prefix="/api", tags=["Anomaly"])
# 1. Anomaly Detection Çalıştır
@router.post("/anomalies/detect/{user_id}")
async def detect_anomalies(user_id: str):
    """
    Kullanıcı için anomaly detection çalıştır
    Tespit edilen anomalileri PostgreSQL'e kaydet
    """
    try:
        print(f"🔍 Anomaly detection başlatıldı: {user_id}")
        
        # Connections
        pg_conn = get_pg_connection()
        
        
        # Detector
        detector = AnomalyDetector(user_id, pg_conn)
        
        # Detect
        alerts = detector.detect_all()
        
        # Save to PostgreSQL
        detector.save_alerts_to_db()
        
        # Close connections
        pg_conn.close()
        
        return {
            "success": True,
            "message": f"{len(alerts)} anomali tespit edildi",
            "alerts": alerts,
            "count": len(alerts)
        }
        
    except Exception as e:
        print(f"❌ Anomaly detection error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# 2. Kullanıcının Anomalilerini Getir
@router.get("/anomalies/recent/{user_id}")
async def get_recent_anomalies(user_id: str, limit: int = 10, acknowledged: bool = None):
    """
    Kullanıcının son anomalilerini getir
    """
    try:
        print(f"📊 Anomaliler getiriliyor: {user_id}")
        
        pg_conn = get_pg_connection()
        cur = pg_conn.cursor()
        
        # Query oluştur
        query = """
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
            WHERE user_id = %s
        """
        
        params = [user_id]
        
        # Acknowledged filter
        if acknowledged is not None:
            query += " AND is_acknowledged = %s"
            params.append(acknowledged)
        
        query += " ORDER BY detection_date DESC, created_at DESC LIMIT %s"
        params.append(limit)
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        cur.close()
        pg_conn.close()
        
        if not rows:
            return {
                "success": True,
                "alerts": [],
                "count": 0,
                "message": "Henüz anomali tespit edilmedi"
            }
        
        # Parse results
        alerts = []
        for row in rows:
            alerts.append({
                "id": row[0],
                "type": row[1],
                "severity": row[2],
                "category": row[3],
                "current_value": float(row[4]) if row[4] else 0,
                "expected_value": float(row[5]) if row[5] else 0,
                "deviation_percentage": float(row[6]) if row[6] else 0,
                "title": row[7],
                "description": row[8],
                "recommendation": row[9],
                "detection_date": str(row[10]),
                "is_acknowledged": row[11],
                "created_at": str(row[12])
            })
        
        print(f"✅ {len(alerts)} anomali bulundu")
        
        return {
            "success": True,
            "alerts": alerts,
            "count": len(alerts)
        }
        
    except Exception as e:
        print(f"❌ Get anomalies error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# 3. Anomali'yi Acknowledge Et (Gördüm İşaretle)
@router.post("/anomalies/acknowledge/{alert_id}")
async def acknowledge_anomaly(alert_id: int):
    """
    Anomaliyi 'görüldü' olarak işaretle
    """
    try:
        print(f"✅ Anomaly acknowledge: {alert_id}")
        
        pg_conn = get_pg_connection()
        cur = pg_conn.cursor()
        
        cur.execute("""
            UPDATE anomaly_alerts
            SET is_acknowledged = TRUE,
                acknowledged_at = NOW()
            WHERE id = %s
            RETURNING id, title
        """, (alert_id,))
        
        result = cur.fetchone()
        
        if not result:
            cur.close()
            pg_conn.close()
            raise HTTPException(status_code=404, detail="Anomaly not found")
        
        pg_conn.commit()
        cur.close()
        pg_conn.close()
        
        return {
            "success": True,
            "message": "Anomaly acknowledged",
            "alert_id": result[0],
            "title": result[1]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Acknowledge error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# 4. Tüm Anomalileri Acknowledge Et
@router.post("/anomalies/acknowledge-all/{user_id}")
async def acknowledge_all_anomalies(user_id: str):
    """
    Kullanıcının tüm anomalilerini 'görüldü' yap
    """
    try:
        print(f"✅ All anomalies acknowledge: {user_id}")
        
        pg_conn = get_pg_connection()
        cur = pg_conn.cursor()
        
        cur.execute("""
            UPDATE anomaly_alerts
            SET is_acknowledged = TRUE,
                acknowledged_at = NOW()
            WHERE user_id = %s AND is_acknowledged = FALSE
            RETURNING COUNT(*)
        """, (user_id,))
        
        count = cur.fetchone()[0]
        
        pg_conn.commit()
        cur.close()
        pg_conn.close()
        
        return {
            "success": True,
            "message": f"{count} anomaly acknowledged",
            "count": count
        }
        
    except Exception as e:
        print(f"❌ Acknowledge all error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# 5. Anomaly İstatistikleri
@router.get("/anomalies/stats/{user_id}")
async def get_anomaly_stats(user_id: str):
    """
    Kullanıcının anomaly istatistikleri
    """
    try:
        pg_conn = get_pg_connection()
        cur = pg_conn.cursor()
        
        # Toplam anomali sayısı
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_acknowledged = FALSE) as unacknowledged,
                COUNT(*) FILTER (WHERE severity = 'critical') as critical,
                COUNT(*) FILTER (WHERE severity = 'high') as high,
                COUNT(*) FILTER (WHERE severity = 'medium') as medium,
                COUNT(*) FILTER (WHERE severity = 'low') as low
            FROM anomaly_alerts
            WHERE user_id = %s
        """, (user_id,))
        
        stats = cur.fetchone()
        
        cur.close()
        pg_conn.close()
        
        return {
            "success": True,
            "stats": {
                "total": stats[0],
                "unacknowledged": stats[1],
                "by_severity": {
                    "critical": stats[2],
                    "high": stats[3],
                    "medium": stats[4],
                    "low": stats[5]
                }
            }
        }
        
    except Exception as e:
        print(f"❌ Stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))