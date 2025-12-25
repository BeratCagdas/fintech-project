# 🧪 Forecast Warning System - Test Mode Kullanım Kılavuzu

## 📖 Genel Bakış

Uyarı sisteminin tüm özelliklerini test etmek için **test_mode** parametresi eklenmiştir. Bu sayede farklı finansal senaryoları simüle edebilir ve tüm uyarı tiplerini görebilirsiniz.

---

## 🎯 Test Modları

### 1. **NORMAL Mode** (Varsayılan)
```
GET /api/forecast/cash-flow/{userId}?months=12
```

**Özellikleri:**
- Gerçek PostgreSQL verilerini kullanır
- Başlangıç bakiye = Son 3 ayın ortalama tasarrufu
- Trend analizi ile tahmin yapar
- Gerçekçi uyarılar üretir

**Ne zaman kullanılır:**
- Production ortamında
- Gerçek kullanıcı verilerini görmek için

---

### 2. 🔴 **CRITICAL Mode**
```
GET /api/forecast/cash-flow/{userId}?months=12&test_mode=critical
```

**Simüle Edilen Durum:**
- 💰 **Başlangıç Bakiye:** Sadece 6 günlük gider (0.2 × avg_expense)
- 📉 **Gelir:** %30 düşüş (0.70 × avg_income)
- 📈 **Gider:** %30 artış (1.30 × avg_expense)

**Göreceğiniz Uyarılar:**
- 🔴 **İflas Riski** (bankruptcy) - Balance < 0
- 🔴 **Güvenlik Tamponu Tehlikede** (low_buffer)
- 🟠 **Finansal Pist Bitiyor** (short_runway)
- 🟠 **Ardışık Açık Tehlikesi** (consecutive_deficits)

**Örnek Senaryo:**
> İşinizi kaybettiniz ve acil harcamalarınız arttı. Bakiyeniz çok düşük.

---

### 3. 🟠 **STRESS Mode**
```
GET /api/forecast/cash-flow/{userId}?months=12&test_mode=stress
```

**Simüle Edilen Durum:**
- 💰 **Başlangıç Bakiye:** 1 aydan az nakit (0.8 × avg_expense)
- 📉 **Gelir:** %15 düşüş (0.85 × avg_income)
- 📈 **Gider:** %20 artış (1.20 × avg_expense)

**Göreceğiniz Uyarılar:**
- 🟠 **Pist Kısalıyor** (medium_runway)
- 🟠 **Ardışık Açık** (consecutive_deficits)
- 🟡 **Gider Geliri Aştı** (negative_cashflow)
- 🟡 **Bakiye Düşük** (medium_buffer)

**Örnek Senaryo:**
> Maaşınız gecikiyor ve beklenmedik masraflar çıktı. Sıkıntılı bir dönem.

---

### 4. 🟢 **OPTIMISTIC Mode**
```
GET /api/forecast/cash-flow/{userId}?months=12&test_mode=optimistic
```

**Simüle Edilen Durum:**
- 💰 **Başlangıç Bakiye:** 6 aylık gider rezervi (6 × avg_expense)
- 📈 **Gelir:** %15 artış (1.15 × avg_income)
- 📉 **Gider:** %15 azalış (0.85 × avg_expense)

**Göreceğiniz Uyarılar:**
- 🔵 **Harika Tasarruf!** (good_savings)
- ⚫ **Mevsimsel Bilgiler** (seasonal_expense)
- 🔵 **Düşük Tasarruf Hızı** (low_savings - eğer %5'in altındaysa)

**Örnek Senaryo:**
> Terfi aldınız, yan gelir başlattınız ve giderleri kıstınız. Finansal durum çok iyi.

---

## 📊 Test Modu Karşılaştırma Tablosu

| Özellik | Normal | Critical | Stress | Optimistic |
|---------|--------|----------|--------|------------|
| **Başlangıç Bakiye** | 3 ay tasarruf | 6 gün | 24 gün | 6 ay |
| **Gelir Değişimi** | %0 | -%30 | -%15 | +%15 |
| **Gider Değişimi** | %0 | +%30 | +%20 | -%15 |
| **Kırmızı Uyarı** | Nadiren | ✅ Çok | Bazen | ❌ Yok |
| **Turuncu Uyarı** | Bazen | ✅ Çok | ✅ Evet | ❌ Yok |
| **Sarı Uyarı** | ✅ Evet | ✅ Evet | ✅ Evet | Nadiren |
| **Mavi Uyarı** | Bazen | ❌ Yok | ❌ Yok | ✅ Evet |
| **Gri Uyarı** | ✅ Evet | ✅ Evet | ✅ Evet | ✅ Evet |

---

## 🧪 Frontend Test Örneği

```jsx
import { useState } from 'react';
import ForecastWarnings from './components/ForecastWarnings';

function ForecastTestPage({ userId }) {
  const [testMode, setTestMode] = useState('normal');
  const [forecastData, setForecastData] = useState(null);

  const loadForecast = async (mode) => {
    const url = `http://localhost:8000/api/forecast/cash-flow/${userId}?months=12&test_mode=${mode}`;
    const response = await axios.get(url);
    setForecastData(response.data);
    setTestMode(mode);
  };

  return (
    <div>
      <h1>Forecast Testi</h1>

      {/* Test Modu Seçici */}
      <div className="test-mode-selector">
        <button onClick={() => loadForecast('normal')}>
          Normal
        </button>
        <button onClick={() => loadForecast('critical')}>
          🔴 Critical
        </button>
        <button onClick={() => loadForecast('stress')}>
          🟠 Stress
        </button>
        <button onClick={() => loadForecast('optimistic')}>
          🟢 Optimistic
        </button>
      </div>

      {/* Uyarı İstatistikleri */}
      {forecastData && (
        <div className="warning-stats">
          <h3>Test Modu: {forecastData.test_mode}</h3>
          <p>Toplam Uyarı: {forecastData.warning_stats.total_warnings}</p>
          <p>🔴 Kritik: {forecastData.warning_stats.critical}</p>
          <p>🟠 Yüksek: {forecastData.warning_stats.high}</p>
          <p>🟡 Orta: {forecastData.warning_stats.medium}</p>
          <p>🔵 Bilgi: {forecastData.warning_stats.info}</p>
          <p>⚫ Nötr: {forecastData.warning_stats.neutral}</p>
        </div>
      )}

      {/* Uyarıları Göster */}
      {forecastData && <ForecastWarnings warnings={forecastData.warnings} />}
    </div>
  );
}
```

---

## 🎯 Hangi Test Modunu Ne Zaman Kullanmalı?

### Development (Geliştirme):
- ✅ **Critical**: Kırmızı uyarıların görünümünü test et
- ✅ **Stress**: Turuncu uyarıların çalıştığını doğrula
- ✅ **Optimistic**: Mavi uyarıların göründüğünü kontrol et

### QA (Kalite Kontrol):
- ✅ **Critical**: Edge case'leri test et
- ✅ **Normal**: Gerçek veri akışını doğrula

### Demo (Sunum):
- ✅ **Critical**: Sistem yeteneklerini göster
- ✅ **Optimistic**: Pozitif senaryoları göster

### Production (Canlı):
- ✅ **Normal**: Sadece gerçek verileri kullan
- ❌ Test modlarını kullanma

---

## 🔧 Backend Değişiklikleri

### Sabit Gider Hesaplama
Artık gerçek veriden dinamik hesaplanıyor:

```python
# Gider volatilitesine göre sabit gider oranı
expense_volatility = df['expense'].std() / avg_expense

if expense_volatility < 0.30:
    fixed_expense_ratio = 0.75  # Stabil giderler
elif expense_volatility < 0.50:
    fixed_expense_ratio = 0.60  # Orta
else:
    fixed_expense_ratio = 0.45  # Volatil giderler
```

### Başlangıç Bakiyesi
Net worth yerine gerçekçi nakit bakiyesi:

```python
# Normal mode
current_balance = avg_savings * 3  # 3 aylık tasarruf

# Test modes
if test_mode == "critical":
    current_balance = avg_expense * 0.2  # 6 gün
elif test_mode == "stress":
    current_balance = avg_expense * 0.8  # 24 gün
elif test_mode == "optimistic":
    current_balance = avg_expense * 6  # 6 ay
```

---

## 📈 Beklenen Sonuçlar

### Critical Mode Çıktısı:
```json
{
  "warning_stats": {
    "total_warnings": 45,
    "critical": 12,
    "high": 18,
    "medium": 10,
    "info": 3,
    "neutral": 2
  },
  "warnings": [
    {
      "severity": "critical",
      "color": "red",
      "title": "🚨 Kritik Bakiye",
      "message": "Haziran 2025 ayında hesap bakiyeniz -₺45,000 seviyesine düşüyor..."
    }
  ]
}
```

### Optimistic Mode Çıktısı:
```json
{
  "warning_stats": {
    "total_warnings": 8,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "info": 6,
    "neutral": 2
  },
  "warnings": [
    {
      "severity": "info",
      "color": "blue",
      "title": "💎 Harika Tasarruf!",
      "message": "Gelirinizin %35'ini biriktiriyorsunuz. Tebrikler!"
    }
  ]
}
```

---

## ⚠️ Önemli Notlar

1. **Test modları sadece development için**
   - Production'da mutlaka `test_mode=null` veya parametresiz kullanın

2. **Veriler simüle edilir**
   - Test modunda gerçek kullanıcı davranışları yansımaz
   - Sadece görsel test içindir

3. **Response'da test_mode bilgisi var**
   - Frontend'de kullanıcıya hangi modda olduğunu gösterin

4. **Cache kullanmayın**
   - Test sonuçları cache'lenmemeli

---

**Son Güncelleme:** Aralık 2024
**Versiyon:** 1.1
