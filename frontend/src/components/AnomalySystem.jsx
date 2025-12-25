import React, { useState, useEffect } from 'react';
import AnomalyModal from './AnomalyModal';
import api from '../api'; // Axios instance'ınız

const AnomalySystem = ({ userId }) => {
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);

  // 1. Anomalileri Çek
  const fetchAnomalies = async () => {
    try {
      // Python servisi port 8000'de ise ve api.js 5001'e bakıyorsa,
      // burada tam URL vermeniz gerekebilir veya proxy ayarı yapmalısınız.
      // Şimdilik api.js üzerinden gittiğini varsayıyoruz.
      const response = await api.get(`/api/anomalies/recent/${userId}?acknowledged=false`);
      
      if (response.data.success && response.data.alerts.length > 0) {
        setAlerts(response.data.alerts);
        setCurrentAlert(response.data.alerts[0]); // İlkini göster
      }
    } catch (error) {
      console.error("Anomali kontrol hatası:", error);
    }
  };

  // Component mount olduğunda çalıştır
  useEffect(() => {
    if (userId) {
      fetchAnomalies();
      
      // İsterseniz her 5 dakikada bir tekrar kontrol ettirebilirsiniz
      const interval = setInterval(fetchAnomalies, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // 2. Anomaliyi Onayla (Acknowledge)
  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/api/anomalies/acknowledge/${alertId}`);
      
      // Listeden çıkar
      const remainingAlerts = alerts.filter(a => a.id !== alertId);
      setAlerts(remainingAlerts);
      
      // Varsa bir sonrakini göster
      if (remainingAlerts.length > 0) {
        setCurrentAlert(remainingAlerts[0]);
      } else {
        setCurrentAlert(null);
      }
    } catch (error) {
      console.error("Anomali onay hatası:", error);
    }
  };

  if (!currentAlert) return null;

  return (
    <AnomalyModal 
      alert={currentAlert} 
      onAcknowledge={handleAcknowledge} 
    />
  );
};

export default AnomalySystem;
