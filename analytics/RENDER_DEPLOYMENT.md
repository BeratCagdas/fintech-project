# Analytics Servisini Render'a Deploy Etme Rehberi

## Adım 1: GitHub'a Push (Eğer yapmadıysanız)

```bash
git add .
git commit -m "Add Dockerfile and environment config for analytics service"
git push origin main
```

## Adım 2: Render Dashboard'a Girin

1. [Render Dashboard](https://dashboard.render.com/) adresine gidin
2. Sağ üstten **"New +"** butonuna tıklayın
3. **"Web Service"** seçeneğini seçin

## Adım 3: Repository Bağlayın

1. GitHub repository'nizi seçin: `Fintech`
2. **Root Directory** kısmına: `analytics` yazın
3. **Branch**: `main` (veya kullandığınız branch)

## Adım 4: Servis Ayarlarını Yapılandırın

### Temel Ayarlar:
- **Name**: `fintech-analytics` (veya istediğiniz isim)
- **Region**: `Frankfurt` (veya size en yakın)
- **Branch**: `main`
- **Root Directory**: `analytics`

### Build & Deploy Ayarları:
- **Runtime**: `Docker`
- **Instance Type**: `Free` (test için) veya `Starter` (production için)

> **NOT**: Docker kullandığımız için Build Command ve Start Command'a gerek yok. Dockerfile içinde tanımlı.

## Adım 5: Environment Variables Ekleyin

**Environment** sekmesinde şu değişkenleri ekleyin:

### PostgreSQL (Render Internal Database URL):
```
DATABASE_URL=postgresql://fintech_user:cTgLdCTFB4cXXKzMFcO5cbLwLsSWqjxl@dpg-d56e32umcj7s73frd610-a/fintech_analytics
```

### MongoDB Atlas:
```
MONGO_URI=mongodb+srv://fintechuser:Fintech1234@fintectdb.l0pdwv1.mongodb.net/?appName=fintectdb
```

### (Opsiyonel) Ekstra CORS Origins:
```
EXTRA_ORIGINS=
```

## Adım 6: Deploy Edin

1. **"Create Web Service"** butonuna tıklayın
2. Deploy işlemi başlayacak (5-10 dakika sürebilir)
3. Logları takip edin ve hata olup olmadığını kontrol edin

## Adım 7: Deploy URL'ini Kopyalayın

Deploy tamamlandıktan sonra:
1. Servis URL'iniz şöyle olacak: `https://fintech-analytics-xxxx.onrender.com`
2. Bu URL'i kopyalayın
3. Health check için: `https://fintech-analytics-xxxx.onrender.com/health`

## Adım 8: Backend'i Güncelleyin

Backend'deki `analytics` ve `anomalies` route'larının bu yeni URL'i kullanması için:

1. Render'da **backend servisinize** gidin
2. **Environment** sekmesine gidin
3. Yeni bir environment variable ekleyin:
   ```
   ANALYTICS_SERVICE_URL=https://fintech-analytics-xxxx.onrender.com
   ```
4. **"Save Changes"** ve **"Manual Deploy"** ile backend'i yeniden deploy edin

## Adım 9: Test Edin

### Health Check:
```bash
curl https://fintech-analytics-xxxx.onrender.com/health
```

Beklenen yanıt:
```json
{"status": "ok"}
```

### Snapshot Endpoint (Backend üzerinden):
```bash
curl https://fintech-dashboard-xm3z.onrender.com/api/analytics/snapshot
```

## Troubleshooting

### Build hatası alırsanız:
- Logları kontrol edin
- `requirements.txt` dosyasının doğru olduğundan emin olun
- Python versiyonunu kontrol edin (Dockerfile'da 3.11 kullanıyoruz)

### Database bağlantı hatası:
- `DATABASE_URL` environment variable'ının doğru olduğundan emin olun
- Render PostgreSQL servisinin çalıştığından emin olun
- Internal Database URL kullandığınızdan emin olun (External değil)

### CORS hatası:
- Frontend ve Backend URL'lerinin `main.py`'de doğru tanımlandığından emin olun
- Browser console'da hatayı kontrol edin

## Önemli Notlar

1. **Free Tier**: 15 dakika inaktif kaldıktan sonra uyur, ilk istekte uyanır (gecikme olabilir)
2. **Starter Tier**: Sürekli aktif kalır, daha hızlıdır
3. **Loglar**: Render Dashboard'dan gerçek zamanlı log takibi yapabilirsiniz
4. **Auto-Deploy**: GitHub'a her push'ta otomatik deploy olur (istersen devre dışı bırakabilirsin)

## Başarılı Deploy Kontrolü

✅ Health endpoint çalışıyor
✅ Backend'den analytics endpoint'lerine erişilebiliyor
✅ Frontend'den veriler çekiliyor
✅ PostgreSQL bağlantısı çalışıyor
✅ MongoDB bağlantısı çalışıyor

---

**Hazırlayan**: Claude Code
**Tarih**: 2025-12-25
