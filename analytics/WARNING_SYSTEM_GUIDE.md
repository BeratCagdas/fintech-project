# 📊 Gelişmiş Uyarı Sistemi Dokümantasyonu

## 🎨 Renk Skalası ve Kategorizasyon

Finansal tahmin uyarıları 5 seviyeli renk kodlu sistem ile kategorize edilmiştir:

### 🔴 KIRMIZI - Kritik Durum
**Severity:** `critical`
**Öncelik:** En yüksek (1)
**Anlamı:** Acil müdahale gerekli, finansal risk çok yüksek

#### Uyarı Tipleri:
1. **İflas Riski (bankruptcy)**
   - Bakiye negatife düşüyor
   - Impact Score: 100/100
   - Örnek: "Hesap bakiyeniz -₺15,000 seviyesine düşüyor"

2. **Güvenlik Tamponu Tehlikede (low_buffer)**
   - Bakiye < Aylık giderin %30'u
   - Impact Score: 95/100
   - Örnek: "Kenarda sadece ₺5,000 kalıyor, beklenmedik masraf batırabilir"

---

### 🟠 TURUNCU - Yüksek Risk
**Severity:** `high`
**Öncelik:** Çok yüksek (2)
**Anlamı:** Yakın gelecekte sorun çıkabilir, önlem alınmalı

#### Uyarı Tipleri:
1. **Ardışık Açık Tehlikesi (consecutive_deficits)**
   - 3+ aydır kesintisiz gider > gelir
   - Impact Score: 85/100
   - Örnek: "4 aydır gideriniz gelirinizi aşıyor"

2. **Finansal Pist Bitiyor (short_runway)**
   - Runway < 1 ay && nakit akışı negatif
   - Impact Score: 80/100
   - Örnek: "Geliriniz kesilse sadece 0.7 ay yaşarsınız"

3. **Pist Kısalıyor (medium_runway)**
   - 1 ay < Runway < 2 ay
   - Impact Score: 70/100
   - Örnek: "1.5 aylık rezerviniz var, ideal 6 ay"

---

### 🟡 SARI - Orta Seviye Uyarı
**Severity:** `medium`
**Öncelik:** Orta (3)
**Anlamı:** Potansiyel problem, iyileştirme yapılabilir

#### Uyarı Tipleri:
1. **Bütçe Çok Katı (high_rigidity)**
   - Sabit Gider / Gelir > %70
   - Impact Score: 60/100
   - Örnek: "Gelirinizin %75'i sabit giderlere gidiyor"

2. **Gider Geliri Aştı (negative_cashflow)**
   - O ay gider > gelir (ama bakiye pozitif)
   - Impact Score: 55/100
   - Örnek: "Bu ay ₺3,500 açık vereceksiniz"

3. **Bakiye Düşük (medium_buffer)**
   - %30 < Bakiye < %50 aylık gider
   - Impact Score: 50/100
   - Örnek: "Bakiyeniz ₺8,000 seviyesine iniyor"

---

### 🔵 MAVİ - Bilgilendirme
**Severity:** `info`
**Öncelik:** Düşük (4)
**Anlamı:** İyileştirme fırsatı, optimizasyon önerisi

#### Uyarı Tipleri:
1. **Düşük Tasarruf Hızı (low_savings)**
   - Tasarruf oranı < %5
   - Impact Score: 30/100
   - Örnek: "Gelirinizin sadece %3'ünü biriktiriyorsunuz"

2. **Harika Tasarruf (good_savings)** ✨
   - Tasarruf oranı ≥ %20 (Pozitif geri bildirim)
   - Impact Score: 20/100
   - Örnek: "Gelirinizin %25'ini biriktiriyorsunuz!"

---

### ⚫ GRİ - Nötr Bilgi
**Severity:** `neutral`
**Öncelik:** En düşük (5)
**Anlamı:** Sadece bilgilendirme, mevsimsel/genel durum

#### Uyarı Tipleri:
1. **Mevsimsel Artış (seasonal_expense)**
   - Kış ayları (Aralık-Ocak): +%15 harcama
   - Yaz tatili (Haziran-Ağustos): +%10 harcama
   - Impact Score: 10/100
   - Örnek: "Aralık ayında harcamalar normalden %15 yüksek olabilir"

---

## 📐 Uyarı Sıralama Algoritması

Uyarılar şu öncelik sırasına göre gösterilir:

```python
1. Severity (critical → high → medium → info → neutral)
2. Impact Score (100 → 0)
```

**Örnek Sıralama:**
1. 🔴 İflas (100) - Critical
2. 🔴 Düşük Tampon (95) - Critical
3. 🟠 Ardışık Açık (85) - High
4. 🟠 Pist Bitiyor (80) - High
5. 🟡 Katı Bütçe (60) - Medium
6. 🔵 Düşük Tasarruf (30) - Info
7. ⚫ Mevsimsel (10) - Neutral

---

## 🎯 Frontend Entegrasyonu

### Kullanım:
```jsx
import ForecastWarnings from './components/ForecastWarnings';

<ForecastWarnings warnings={forecastData.warnings} />
```

### Filtreleme:
Kullanıcı renk kategorilerine göre filtreleme yapabilir:
- **Tümü**: Tüm uyarılar
- **Kritik** (Kırmızı): Acil müdahale
- **Yüksek Risk** (Turuncu): Hızlı önlem
- **Orta** (Sarı): İyileştirme
- **Bilgi** (Mavi): Optimizasyon
- **Nötr** (Gri): Genel bilgi

---

## 🔧 Backend Parametreleri

### Runway Hesaplama:
```python
runway_months = current_balance / average_monthly_expense
```

### Rigidity Ratio:
```python
rigidity_ratio = fixed_expenses / monthly_income
```

### Savings Rate:
```python
savings_rate = net_cash_flow / monthly_income
```

---

## 📊 Impact Score Dağılımı

| Score Aralığı | Anlamı | Renk Kategorisi |
|---------------|--------|-----------------|
| 90-100 | Çok Yüksek Risk | 🔴 Kırmızı |
| 70-89 | Yüksek Risk | 🟠 Turuncu |
| 50-69 | Orta Risk | 🟡 Sarı |
| 20-49 | Düşük Risk | 🔵 Mavi |
| 0-19 | Minimal Risk | ⚫ Gri |

---

## 💡 Öneriler Sistemi

Her uyarı ile birlikte actionable (uygulanabilir) öneriler sunulur:

**Kırmızı:**
- "Vadeli hesaplarınızı bozun"
- "Acil borç bulun"

**Turuncu:**
- "Gelir artırıcı önlemler alın"
- "3 aylık acil fon oluşturun"

**Sarı:**
- "Gereksiz harcamaları kısın"
- "Sabit giderleri gözden geçirin"

**Mavi:**
- "Tasarrufları yatırıma dönüştürün"
- "Değişken giderleri optimize edin"

**Gri:**
- "Mevsimsel harcamalar için önceden bütçe ayırın"

---

## 🚀 Gelecek İyileştirmeler

1. **Balina Harcama Dedektörü (Whale Detector)**
   - Tek kalem > Toplam giderin %25'i
   - Büyük ödemeler için önceden planlama

2. **Trend Analizi**
   - 3 aylık gelir/gider trendi
   - Kötüleşen metrikler için erken uyarı

3. **Kişiselleştirilmiş Eşikler**
   - Kullanıcı risk toleransına göre ayarlanabilir limitler
   - Dinamik runway hedefleri

4. **Akıllı Kategori Analizi**
   - Gerçek harcama kategorilerine göre detaylı analiz
   - "Yeme-içme harcamanız %40 arttı" gibi özel uyarılar

---

## 📱 Responsive Tasarım

- **Desktop**: Grid layout (3 kolon)
- **Tablet**: 2 kolon
- **Mobile**: Tek kolon, tam genişlik kartlar
- **Animasyonlar**: Smooth slide-in effects
- **Hover Effects**: Card elevation on hover

---

## 🎨 Renk Paleti

```css
Kırmızı: #dc3545
Turuncu: #fd7e14
Sarı: #ffc107
Mavi: #0dcaf0
Gri: #6c757d
```

---

**Oluşturulma Tarihi:** Aralık 2024
**Versiyon:** 1.0
**Geliştirici Notu:** Bu sistem financial stress testing ve proactive budgeting için tasarlanmıştır.
