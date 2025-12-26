# 🧪 Test Kullanıcısı Oluşturma Kılavuzu

Bu kılavuz, **tüm özelliklerin canlı olarak test edilebileceği** zengin demo kullanıcısını nasıl oluşturacağınızı açıklar.

---

## 📋 Test Kullanıcısı Özellikleri

### Giriş Bilgileri
- **Email:** `demo@fintech.com`
- **Şifre:** `demo123`
- **User ID:** `676d5b67c9d5c977c88a05e3`

### 💰 Finansal Durum
- **Aylık Gelir:** 55,000₺
- **Toplam Giderler:** 51,850₺ (bu ay)
- **Kümülatif Tasarruf:** 127,000₺
- **Net Worth:** 3,826,050₺

### 📊 Geçmiş Veriler
- **6 aylık history** (Temmuz - Aralık 2025)
- Düzenli gelir/gider paterni
- Credit score geçmişi (680 → 725)
- Her ay pozitif tasarruf

### 🚨 Anomali Tetikleyici
- **Market Harcaması:**
  - Normal: ~3,000₺ (son 6 aylık ortalama)
  - Bu ay: **15,000₺** ⚠️
  - **%400 artış** → Critical anomaly uyarısı!

### 💳 Kredi Kartları
1. **Garanti BBVA Bonus Premium**
   - Limit: 50,000₺
   - Borç: 42,000₺
   - **Kullanım: %84** ⚠️ (yüksek risk)

2. **İş Bankası Maximum**
   - Limit: 30,000₺
   - Borç: 8,500₺
   - Kullanım: %28 (normal)

### 🏠 Borçlar
1. **Konut Kredisi** - 520,000₺ kalan
2. **Araba Kredisi** - 85,000₺ kalan

### 📈 Yatırımlar
- **Apple Hisse:** +750₺ kar (%8.33)
- **Dolar:** +6,450₺ kar (%15.09)
- **Gram Altın:** +9,600₺ kar (%22.86)

### 🏡 Varlıklar
- **Ev (Kadıköy):** 4,200,000₺
- **Araba (2023 Corolla):** 120,000₺

### 🏆 Başarılar (Achievements)
- ✅ 10k tasarruf milestone
- ✅ 25k tasarruf milestone
- ✅ 50k tasarruf milestone
- ✅ 100k tasarruf milestone
- ✅ 3 aylık streak milestone
- 🔥 **Mevcut Streak:** 6 ay üst üste tasarruf

---

## 🚀 Kurulum Adımları

### Adım 1: MongoDB Scriptini Çalıştır

```bash
cd c:\Users\Berat\Desktop\Fintech

# Node.js scriptini çalıştır
node scripts/create-test-user.js
```

**Beklenen Çıktı:**
```
✅ TEST KULLANICISI OLUŞTURULDU!
==================================
📧 Email: demo@fintech.com
🔑 Şifre: demo123
🆔 User ID: 676d5b67c9d5c977c88a05e3
💰 Kümülatif Tasarruf: 127,000₺
📊 Son Credit Score: 725/850
🏆 Milestone'lar: 5 adet
🔥 Streak: 6 ay
⚠️  ANOMALY: Market harcaması 15,000₺
==================================
```

---

### Adım 2: PostgreSQL Scriptini Çalıştır

#### **Render PostgreSQL** (Canlı ortam):

```bash
# Render'dan DATABASE_URL'i kopyala
# Örn: postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/fintech_db

psql "postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/fintech_db" \
  -f scripts/seed-test-user-pg.sql
```

#### **Yerel PostgreSQL** (localhost):

```bash
psql -U postgres -d fintech_analytics -f scripts/seed-test-user-pg.sql
```

**Beklenen Çıktı:**
```
DELETE 0
DELETE 0
DELETE 0
INSERT 0 1
INSERT 0 1
...
✅ SEED TAMAMLANDI!
```

---

## 🎯 Test Senaryoları

### 1. ⚠️ Anomali Tespiti
**Ne Olacak:**
- Login olunca dashboard'da **anomaly alert** görünecek
- Market kategorisinde %400 artış uyarısı
- "Critical" severity badge

**Test Adımları:**
1. `demo@fintech.com` ile giriş yap
2. Dashboard'da kırmızı uyarı kartını gör
3. Uyarıya tıkla → Detayları oku
4. "Anladım" → Uyarı kapat

---

### 2. 📊 Cash Flow Forecast
**Ne Olacak:**
- Gelecek 3 ay tahmini gösterecek
- Risk uyarıları olacak (yüksek kredi kartı borcu)
- Seasonal faktörler (Aralık: kış ayı +%15)

**Test Adımları:**
1. Dashboard → Cash Flow Forecast bölümü
2. Grafik üzerinde 3 ay tahmini
3. Risk seviyesi: "Medium" veya "High"
4. Uyarı mesajları oku

---

### 3. 💳 Credit Score
**Ne Olacak:**
- Credit Score: **725/850** (B kategorisi)
- Yüksek kredi kartı kullanımı uyarısı (%84)
- Risk faktörleri listesi

**Test Adımları:**
1. Dashboard → Credit Score kartı
2. 725 puanı gör
3. "Detayları Gör" → Açıklama modal'ı
4. Risk faktörlerini incele

---

### 4. 🏆 Milestone'lar
**Ne Olacak:**
- 5 milestone kazanılmış gösterecek
- 6 aylık streak badge'i
- Bir sonraki milestone: 250k tasarruf (123k daha lazım)

**Test Adımları:**
1. Dashboard → Achievements bölümü
2. Kazanılan milestone'ları gör
3. Progress bar'ı kontrol et
4. Streak bilgisini oku

---

### 5. 📈 Geçmiş Veriler (Historical Data)
**Ne Olacak:**
- Son 6 aylık grafik gösterecek
- Gelir/Gider/Tasarruf trendleri
- Aylık detaylar tablosu

**Test Adımları:**
1. Dashboard → Aylık Geçmiş grafiği
2. 3/6/12 ay filtrelerini dene
3. Herhangi bir aya tıkla → Detay modal'ı
4. O aydaki giderleri gör

---

### 6. 💎 Net Worth
**Ne Olacak:**
- Toplam varlık: ~4.5M₺
- Toplam borç: ~655k₺
- Net değer: ~3.8M₺
- Pasta grafik breakdown

**Test Adımları:**
1. Net Worth sayfasına git
2. Varlık/Borç dağılımını gör
3. Her kategoriye tıkla → Detaylar
4. Trend grafiğini incele

---

### 7. 🎯 Hedefler (Goals)
**Ne Olacak:**
- 2 aktif hedef:
  - Tatil Fonu: 38k/50k (%76 tamamlanmış)
  - Acil Durum Fonu: 89k/100k (%89 tamamlanmış)

**Test Adımları:**
1. Goals Tracker sayfasına git
2. Progress bar'ları gör
3. Hedeflere tıkla → Detay
4. Deadline bilgilerini kontrol et

---

## 🔍 Veri Doğrulama

### MongoDB Kontrolü:
```javascript
// MongoDB'de test kullanıcıyı sorgula
use fintech

db.users.findOne({ email: "demo@fintech.com" })
```

### PostgreSQL Kontrolü:
```sql
-- Snapshot sayısı (6 olmalı)
SELECT COUNT(*) FROM monthly_snapshots
WHERE user_id = '676d5b67c9d5c977c88a05e3';

-- Anomaly sayısı (1 olmalı)
SELECT COUNT(*) FROM anomaly_alerts
WHERE user_id = '676d5b67c9d5c977c88a05e3';

-- Expense events sayısı (~50+ olmalı)
SELECT COUNT(*) FROM expense_events
WHERE user_id = '676d5b67c9d5c977c88a05e3';
```

---

## 🧹 Test Kullanıcısını Silme

### MongoDB:
```bash
mongosh "MONGODB_URI" --eval 'db.users.deleteOne({ email: "demo@fintech.com" })'
```

### PostgreSQL:
```sql
DELETE FROM expense_events WHERE user_id = '676d5b67c9d5c977c88a05e3';
DELETE FROM anomaly_alerts WHERE user_id = '676d5b67c9d5c977c88a05e3';
DELETE FROM monthly_snapshots WHERE user_id = '676d5b67c9d5c977c88a05e3';
```

---

## 📝 Notlar

### ⚠️ Önemli:
1. **Anomaly detection** otomatik çalışır, dashboard açılınca tetiklenir
2. **Credit score** hesaplaması snapshot'la birlikte yapılır
3. **Forecast** geçmiş verilere göre tahmin yapar (6 ay yeterli)
4. **Milestone'lar** kümülatif tasarruf artınca otomatik unlock olur

### 💡 İpuçları:
- Test kullanıcıyla "Yeni Aya Geç" yaparsanız, snapshot oluşturulur
- Market harcamasını 3000₺'ye düşürün → Anomaly kaybolur
- Gelir artırın → Credit score yükselir
- Hedeflere para ekleyin → Milestone açılabilir

---

## 🎬 Demo Için Kullanım

Bu test kullanıcısı **iş görüşmelerinde** ve **CV portfolyosunda** canlı demo için mükemmel:

1. **"Anomaly Detection nasıl çalışıyor?"** → Market uyarısını göster
2. **"Credit score hesaplaması?"** → 725 puanı açıkla
3. **"Forecast accuracy?"** → 6 aylık geçmişle tahmin göster
4. **"Milestone sistemi?"** → 5 kazanılmış achievement göster
5. **"Dual-database?"** → MongoDB + PostgreSQL entegrasyonu göster

---

## ✅ Test Checklist

- [ ] MongoDB scriptini çalıştırdım
- [ ] PostgreSQL scriptini çalıştırdım
- [ ] `demo@fintech.com` ile giriş yapabildim
- [ ] Dashboard'da anomaly uyarısı görünüyor
- [ ] Cash Flow Forecast çalışıyor
- [ ] Credit Score gösteriliyor (725)
- [ ] 6 aylık geçmiş grafikte
- [ ] Milestone'lar gösteriliyor
- [ ] Net Worth hesaplanmış
- [ ] Hedefler gösteriliyor

---

**Test kullanıcısı hazır! 🎉**

Şimdi `demo@fintech.com` / `demo123` ile giriş yaparak tüm özellikleri test edebilirsiniz.
