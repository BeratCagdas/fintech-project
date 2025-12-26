# UptimeRobot Kurulum Rehberi

## 🎯 Amaç
Render'daki free tier servisler 15 dakika kullanılmadığında uyku moduna geçer. UptimeRobot ile servisleri sürekli aktif tutabiliriz.

## 📋 Kurulum Adımları

### 1. UptimeRobot Hesabı Oluştur
1. [UptimeRobot.com](https://uptimerobot.com) adresine git
2. Ücretsiz hesap oluştur (50 monitöre kadar ücretsiz)
3. Email doğrulama yap

### 2. Backend Monitörü Ekle

#### Backend Monitor Ayarları:
```
Monitor Type: HTTP(s)
Friendly Name: Fintech Backend
URL: https://fintech-dashboard-xm3z.onrender.com/health
Monitoring Interval: 5 minutes (ücretsiz planda en düşük)
Monitor Timeout: 30 seconds
Alert Contacts: Email adresiniz
```

**Expected Response:**
```json
{
  "status": "OK",
  "uptime": 12345.67,
  "timestamp": "2025-12-26T...",
  "service": "Fintech Backend API"
}
```

### 3. Analytics Monitörü Ekle

#### Analytics Monitor Ayarları:
```
Monitor Type: HTTP(s)
Friendly Name: Fintech Analytics
URL: https://fintech-analytics-server-1.onrender.com/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Alert Contacts: Email adresiniz
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

### 4. Frontend Monitörü Ekle (Opsiyonel)

#### Frontend Monitor Ayarları:
```
Monitor Type: HTTP(s)
Friendly Name: Fintech Frontend
URL: https://fintech-frontend-8nux.onrender.com
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Alert Contacts: Email adresiniz
```

## 🔧 Health Check Endpoints

### Backend Health Check
- **URL:** `https://fintech-dashboard-xm3z.onrender.com/health`
- **Method:** GET
- **Response:** JSON with status, uptime, timestamp

### Analytics Health Check
- **URL:** `https://fintech-analytics-server-1.onrender.com/health`
- **Method:** GET
- **Response:** JSON with status

## 📊 Monitoring Intervals

UptimeRobot ücretsiz planda:
- **Minimum Interval:** 5 dakika
- **Maximum Monitors:** 50
- **Retention:** 2 ay log

Render free tier:
- **Sleep After:** 15 dakika inactivity
- **Wake Up Time:** ~30 saniye

**Sonuç:** 5 dakikalık kontrollerle servisler hiçbir zaman uyumaz! ✅

## 🚨 Alert Ayarları

### Önerilen Alert Konfigürasyonu:
```
Alert When: Down
Alert After: 2 checks (10 dakika)
Alert Contacts: Email
Re-Alert: Every hour
```

### Email Alert Örneği:
```
Subject: [UptimeRobot Alert] Fintech Backend is DOWN
Body: Your monitor "Fintech Backend" is DOWN.
      Last checked: 2025-12-26 14:30:00
      Status Code: 503 Service Unavailable
```

## 📈 Dashboard Özellikleri

UptimeRobot Dashboard'da görebilecekleriniz:
- ✅ Uptime % (99.9% ideal)
- 📊 Response time grafiği
- 🕐 Last check timestamp
- 📉 Downtime history
- 🌍 Public status page (isteğe bağlı)

## 🔄 Test Etme

### Manuel Test:
```bash
# Backend health check
curl https://fintech-dashboard-xm3z.onrender.com/health

# Analytics health check
curl https://fintech-analytics-server-1.onrender.com/health
```

### Beklenen Sonuçlar:
- **Status Code:** 200 OK
- **Response Time:** < 1000ms (ilk wake-up hariç)
- **JSON Response:** Valid format

## 💡 Pro Tips

1. **Monitoring Interval Seçimi:**
   - 5 dakika: Servisleri her zaman aktif tutar
   - 1 dakika: Gereksiz - Render zaten 15 dk bekliyor

2. **Alert Threshold:**
   - 2 check = 10 dakika: Geçici network sorunlarını filtreler
   - 1 check = 5 dakika: Çok hassas, false positive olabilir

3. **Multiple Monitors:**
   - Backend + Analytics = 2 monitör
   - Her ikisi de kritik, ikisini de izleyin

4. **Public Status Page:**
   - Kullanıcılara sistem durumunu göster
   - Örnek: `status.yourfintech.com`

## 🎯 Video İçin Gösterecekler

1. **UptimeRobot Dashboard:**
   - 2-3 monitör (Backend, Analytics, Frontend)
   - 99.9% uptime
   - Response time grafikleri

2. **Render Dashboard:**
   - Sürekli "Active" durumu
   - Zero sleep time

3. **Live Test:**
   - `/health` endpoint'ini tarayıcıda aç
   - JSON response göster
   - UptimeRobot'ta "Online" durumunu göster

## 📝 Notlar

- Free tier Render servisleri 750 saat/ay limiti var
- UptimeRobot ile sürekli aktif = ~720 saat/ay
- Frontend monitoring opsiyonel (static hosting uyumuyor)
- Analytics + Backend = Kritik servisler ✅

## 🔗 Faydalı Linkler

- [UptimeRobot Docs](https://uptimerobot.com/api/)
- [Render Free Tier Limits](https://render.com/docs/free)
- [HTTP Status Codes](https://httpstatuses.com/)

---

**✅ Kurulum Tamamlandı!** Artık projeniz 7/24 aktif kalacak.
