# analytics/routes/forecast.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dateutil.relativedelta import relativedelta
from config.postgres import get_pg_connection
from pymongo import MongoClient
from bson import ObjectId
import os

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

# MongoDB bağlantısı
def get_mongo_connection():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise HTTPException(status_code=500, detail="MONGO_URI not configured")
    client = MongoClient(mongo_uri)
    return client['test']  # Database name

# MongoDB'den güncel finance verilerini çek
def get_current_finance_data(user_id: str):
    try:
        db = get_mongo_connection()
        user = db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return None

        finance = user.get('finance', {})
        monthly_income = finance.get('monthlyIncome', 0)

        # Sabit giderler toplamı
        fixed_expenses = finance.get('fixedExpenses', [])
        total_fixed = sum(exp.get('amount', 0) for exp in fixed_expenses if exp.get('isActive', True))

        # Değişken giderler toplamı
        variable_expenses = finance.get('variableExpenses', [])
        total_variable = sum(exp.get('amount', 0) for exp in variable_expenses)

        total_expenses = total_fixed + total_variable

        return {
            'income': monthly_income,
            'expense': total_expenses,
            'fixed_expense': total_fixed,
            'variable_expense': total_variable
        }
    except Exception as e:
        print(f"MongoDB error: {e}")
        return None

# Request model for what-if scenarios
class WhatIfScenario(BaseModel):
    scenario_type: str  # 'job_change', 'major_purchase', 'debt_payoff', 'investment', 'lifestyle_change', 'custom'
    title: str
    description: Optional[str] = None

    # Financial Impact
    income_change: Optional[float] = 0  # Aylık gelir değişimi
    expense_change: Optional[float] = 0  # Aylık gider değişimi
    one_time_cost: Optional[float] = 0  # Tek seferlik maliyet

    # Timing
    start_month: Optional[int] = 1  # Hangi ayda başlayacak (1-12)
    duration_months: Optional[int] = None  # Kaç ay sürecek (None = sürekli)

    # Advanced Options
    inflation_rate: Optional[float] = 0  # Yıllık enflasyon oranı
    growth_rate: Optional[float] = 0  # Gelir artış oranı (terfi, maaş artışı vb.)
    debt_interest_rate: Optional[float] = 0  # Borç faiz oranı

    # Investment Scenarios
    investment_return_rate: Optional[float] = 0  # Yatırım getiri oranı

    # Lifestyle Changes
    category_changes: Optional[dict] = {}  # Kategori bazlı değişiklikler

@router.get("/cash-flow/{user_id}")
async def get_cash_flow_forecast(
    user_id: str,
    months: int = 6,
    scenario: Optional[str] = None,
    test_mode: Optional[str] = None  # "stress", "normal", "optimistic"
):
    """
    Kullanıcının gelecekteki nakit akışını tahmin eder

    Parameters:
    - user_id: MongoDB user ID
    - months: Kaç ay ileriye tahmin yapılacak (3, 6, veya 12)
    - scenario: What-if scenario JSON (optional)
    """
    try:
        conn = get_pg_connection()
        cur = conn.cursor()

        # 1. Geçmiş snapshot'ları çek (son 12 ay)
        cur.execute("""
            SELECT
                snapshot_month as snapshot_date,
                total_income,
                total_expense,
                total_debt,
                net_worth,
                savings_ratio,
                month_name
            FROM monthly_snapshots
            WHERE user_id = %s
            ORDER BY snapshot_month DESC
            LIMIT 12
        """, (user_id,))

        historical_data = cur.fetchall()

        if not historical_data:
            # Geçmiş veri yoksa hata döndür
            return {
                "success": False,
                "message": "Yeterli geçmiş veri bulunamadı. Lütfen 'Yeni Aya Geç' butonuna tıklayarak snapshot oluşturun.",
                "forecast": [],
                "warnings": []
            }

        # DataFrame'e çevir
        df = pd.DataFrame(historical_data, columns=[
            'date', 'income', 'expense', 'debt', 'net_worth', 'savings_ratio', 'month_name'
        ])

        # Tüm numeric sütunları float'a çevir (Decimal -> float)
        df['income'] = pd.to_numeric(df['income'], errors='coerce').fillna(0)
        df['expense'] = pd.to_numeric(df['expense'], errors='coerce').fillna(0)
        df['debt'] = pd.to_numeric(df['debt'], errors='coerce').fillna(0)
        df['net_worth'] = pd.to_numeric(df['net_worth'], errors='coerce').fillna(0)
        df['savings_ratio'] = pd.to_numeric(df['savings_ratio'], errors='coerce').fillna(0)

        # Varlıkları net_worth'ten hesapla (net_worth = assets - debt)
        df['assets'] = df['net_worth'] + df['debt']

        # savings_ratio değerini savings_rate olarak da kullan (kod uyumluluğu için)
        df['savings_rate'] = df['savings_ratio']

        # 2. MongoDB'den güncel finance verilerini çek
        current_finance = get_current_finance_data(user_id)

        # 3. Trend analizi yap
        # MongoDB'den güncel veri varsa, onu önceliklendir
        if current_finance:
            # Güncel MongoDB verisi + geçmiş snapshot'ların ortalaması
            avg_income = (current_finance['income'] + df['income'].mean()) / 2
            avg_expense = (current_finance['expense'] + df['expense'].mean()) / 2

            # En son gider değişikliklerini yakalamak için MongoDB'i daha ağırlıklı kullan
            # Eğer MongoDB'deki gider snapshot ortalamasından %20'den fazla farklıysa, MongoDB'i kullan
            if abs(current_finance['expense'] - df['expense'].mean()) / df['expense'].mean() > 0.2:
                avg_expense = current_finance['expense']  # Büyük değişiklik varsa güncel veriyi kullan

            print(f"📊 MongoDB Current Finance: Income={current_finance['income']}, Expense={current_finance['expense']}")
            print(f"📊 Using for forecast: avg_income={avg_income}, avg_expense={avg_expense}")
        else:
            # MongoDB verisi yoksa sadece snapshot'ları kullan
            avg_income = df['income'].mean()
            avg_expense = df['expense'].mean()

        avg_savings = avg_income - avg_expense

        # Income ve expense trendlerini hesapla (linear regression)
        if len(df) >= 3:
            income_trend = np.polyfit(range(len(df)), df['income'], 1)[0]
            expense_trend = np.polyfit(range(len(df)), df['expense'], 1)[0]
        else:
            income_trend = 0
            expense_trend = 0

        # 4. Gelecek tahminlerini oluştur
        forecasts = []

        # DÜZELTME: Net worth yerine gerçekçi başlangıç bakiyesi kullan
        # Gerçek nakit bakiye = assets - debt (ama sadece likit varlıklar)
        # Basit tahmin: Son 3 ayın ortalama tasarrufunu kullan
        current_balance = avg_savings * 3  # 3 aylık tasarruf = başlangıç nakdi
        if current_balance < 0:
            current_balance = avg_income * 0.5  # Negatifse gelirin yarısı varsayalım

        # TEST MODE: Farklı senaryoları görmek için
        if test_mode == "stress":
            # Kötü senaryo: Düşük bakiye, yüksek gider
            current_balance = avg_expense * 0.8  # Sadece 1 aydan az nakit
            avg_income = avg_income * 0.85  # %15 gelir düşüşü
            avg_expense = avg_expense * 1.20  # %20 gider artışı
        elif test_mode == "critical":
            # Kritik senaryo: Çok düşük bakiye
            current_balance = avg_expense * 0.2  # Sadece 6 gün nakit
            avg_income = avg_income * 0.70  # %30 gelir düşüşü
            avg_expense = avg_expense * 1.30  # %30 gider artışı
        elif test_mode == "optimistic":
            # İyi senaryo: Yüksek bakiye, düşük gider
            current_balance = avg_expense * 6  # 6 aylık nakit
            avg_income = avg_income * 1.15  # %15 gelir artışı
            avg_expense = avg_expense * 0.85  # %15 gider azalışı

        # PostgreSQL DATE objesini datetime'a çevir
        last_date = df.iloc[0]['date']
        if isinstance(last_date, str):
            last_date = datetime.strptime(last_date, '%Y-%m-%d')
        elif hasattr(last_date, 'to_pydatetime'):
            last_date = last_date.to_pydatetime()

        for i in range(1, months + 1):
            forecast_date = last_date + relativedelta(months=i)

            # Trend ile tahmin
            predicted_income = avg_income + (income_trend * (len(df) + i))
            predicted_expense = avg_expense + (expense_trend * (len(df) + i))

            # DÜZELTME: Gider asla negatif olamaz
            if predicted_expense < 0:
                predicted_expense = avg_expense  # Negatifse ortalama gideri kullan

            # Gelir de negatif olamaz
            if predicted_income < 0:
                predicted_income = 0

            # Mevsimsellik faktörü (opsiyonel)
            month_num = forecast_date.month
            seasonal_factor = 1.0
            if month_num in [12, 1]:  # Kış ayları
                seasonal_factor = 1.15  # %15 daha fazla harcama
            elif month_num in [6, 7, 8]:  # Yaz tatili
                seasonal_factor = 1.10

            predicted_expense *= seasonal_factor

            # Net cash flow
            net_cash_flow = predicted_income - predicted_expense
            current_balance += net_cash_flow

            # Confidence interval (basit hesaplama)
            income_std = df['income'].std()
            expense_std = df['expense'].std()

            # NaN kontrolü (tek satır varsa std NaN olur)
            if pd.isna(income_std) or income_std == 0:
                income_std = avg_income * 0.1  # %10 varsayılan sapma
            if pd.isna(expense_std) or expense_std == 0:
                expense_std = avg_expense * 0.1  # %10 varsayılan sapma

            forecasts.append({
                "month": forecast_date.strftime("%Y-%m"),
                "month_name": forecast_date.strftime("%B %Y"),
                "predicted_income": round(predicted_income, 2),
                "predicted_expense": round(predicted_expense, 2),
                "net_cash_flow": round(net_cash_flow, 2),
                "cumulative_balance": round(current_balance, 2),
                "confidence": {
                    "income_low": round(predicted_income - income_std, 2),
                    "income_high": round(predicted_income + income_std, 2),
                    "expense_low": round(predicted_expense - expense_std, 2),
                    "expense_high": round(predicted_expense + expense_std, 2)
                },
                "risk_level": "high" if current_balance < 0 else "medium" if current_balance < avg_income else "low"
            })

        # 5. Gelişmiş Uyarı Sistemi (Kategorize edilmiş)
        warnings = []
        consecutive_deficits = 0

        # Tekrar eden uyarıları önlemek için set kullan
        warning_types_added = set()  # Her uyarı tipini sadece 1 kere ekle

        # Ortalama aylık gideri hesapla (Runway hesabı için)
        avg_monthly_expense = sum(f.get("predicted_expense", 0) for f in forecasts) / len(forecasts) if forecasts else 1

        # Sabit gider oranını hesapla (Geçmiş verilerden)
        # Giderlerin standart sapması düşükse sabit gider oranı yüksektir
        expense_volatility = df['expense'].std() / avg_expense if avg_expense > 0 else 0.5
        # Volatilite düşükse (%30'dan az) sabit gider oranı yüksek (%70-80)
        # Volatilite yüksekse (%50'den fazla) sabit gider oranı düşük (%40-50)
        if expense_volatility < 0.30:
            fixed_expense_ratio = 0.75  # Çok stabil giderler = yüksek sabit oran
        elif expense_volatility < 0.50:
            fixed_expense_ratio = 0.60  # Orta volatilite
        else:
            fixed_expense_ratio = 0.45  # Yüksek volatilite = düşük sabit oran

        estimated_fixed_expense = avg_expense * fixed_expense_ratio

        # Bir sonraki ayı belirle (tahminlerin ilk ayı)
        next_month_str = forecasts[0]["month"] if forecasts else None

        for i, forecast in enumerate(forecasts):
            # --- VERİ HAZIRLIĞI ---
            balance = forecast["cumulative_balance"]
            cash_flow = forecast["net_cash_flow"]
            income = forecast.get("predicted_income", 0)
            total_expense = forecast.get("predicted_expense", 0)
            fixed_expense = estimated_fixed_expense
            month_name = forecast["month_name"]

            # Ardışık açık kontrolü
            if cash_flow < 0:
                consecutive_deficits += 1
            else:
                consecutive_deficits = 0

            # ---------------------------------------------------------
            # 1. KIRMIZI - İFLAS VE KRİTİK DURUM
            # Severity: critical (En yüksek öncelik)
            # ---------------------------------------------------------
            if balance < 0:
                warnings.append({
                    "month": month_name,
                    "type": "bankruptcy",
                    "severity": "critical",
                    "color": "red",
                    "title": "🚨 Kritik Bakiye",
                    "message": f"{month_name} ayında hesap bakiyeniz -₺{abs(balance):,.0f} seviyesine düşüyor. Acil likidite gerekli!",
                    "recommendation": "Varsa vadeli hesaplarınızı bozun, acil borç bulun veya gelir kaynağı oluşturun.",
                    "impact_score": 100
                })

            elif balance < (total_expense * 0.30):  # %30 Tampon
                warnings.append({
                    "month": month_name,
                    "type": "low_buffer",
                    "severity": "critical",
                    "color": "red",
                    "title": "⚠️ Güvenlik Tamponu Tehlikede",
                    "message": f"{month_name} ayında kenarda sadece ₺{balance:,.0f} kalıyor. Beklenmedik bir masraf sizi batırabilir.",
                    "recommendation": "Acil durum fonunuzu artırın. En az 3 aylık gider tutarı biriktirin.",
                    "impact_score": 95
                })

            # ---------------------------------------------------------
            # 2. TURUNCU - YÜKSEK RİSK
            # Severity: high (Acil müdahale gerekli)
            # ---------------------------------------------------------

            # Ardışık açık kontrolü
            if consecutive_deficits >= 3:
                warnings.append({
                    "month": month_name,
                    "type": "consecutive_deficits",
                    "severity": "high",
                    "color": "orange",
                    "title": "📉 Ardışık Açık Tehlikesi",
                    "message": f"{consecutive_deficits} aydır kesintisiz gideriniz gelirinizi aşıyor. Trend kötüleşiyor.",
                    "recommendation": "Gelir artırıcı veya gider azaltıcı acil önlemler alın.",
                    "impact_score": 85
                })

            # Finansal Pist (Runway) kontrolü
            if balance > 0 and avg_monthly_expense > 0:
                runway_months = balance / avg_monthly_expense
                if runway_months < 1.0 and cash_flow < 0:
                    warnings.append({
                        "month": month_name,
                        "type": "short_runway",
                        "severity": "high",
                        "color": "orange",
                        "title": "✈️ Finansal Pist Bitiyor",
                        "message": f"{month_name} itibariyle, hiç geliriniz olmasa sadece {runway_months:.1f} ay idare edebilirsiniz.",
                        "recommendation": "En az 3 aylık gider kadar birikim hedefleyin. Acil durum fonu kritik!",
                        "impact_score": 80
                    })
                elif runway_months < 2.0:
                    warnings.append({
                        "month": month_name,
                        "type": "medium_runway",
                        "severity": "high",
                        "color": "orange",
                        "title": "⚠️ Pist Kısalıyor",
                        "message": f"Geliriniz kesilse {runway_months:.1f} ay dayanabilirsiniz. İdeal 6 aydır.",
                        "recommendation": "Acil durum fonunuzu 6 aylık gidere çıkarın.",
                        "impact_score": 70
                    })

            # ---------------------------------------------------------
            # 3. SARI - ORTA SEVİYE UYARI
            # Severity: medium (Dikkat gerekli)
            # ---------------------------------------------------------

            # Gider Katılığı (Expense Rigidity) - Sadece 1 kere ekle
            if income > 0 and "high_rigidity" not in warning_types_added:
                rigidity_ratio = fixed_expense / income
                if rigidity_ratio > 0.70:
                    warnings.append({
                        "month": month_name,
                        "type": "high_rigidity",
                        "severity": "medium",
                        "color": "yellow",
                        "title": "🧱 Bütçe Çok Katı",
                        "message": f"Gelirinizin %{rigidity_ratio*100:.0f}'i sabit giderlere (Kira, Fatura vb.) gidiyor. Esnek harcama alanınız yok.",
                        "recommendation": "Sabit giderleri düşürmeden rahatlamanız zor. Alternatif barınma veya abonelik iptalleri değerlendirin.",
                        "impact_score": 60
                    })
                    warning_types_added.add("high_rigidity")

            # Negatif nakit akışı uyarısı - HER AY için (çünkü aya özel)
            if cash_flow < 0:
                # Balance pozitifse sarı, negatifse kırmızı (zaten bankruptcy var)
                if balance > 0:
                    warnings.append({
                        "month": month_name,
                        "type": "negative_cashflow",
                        "severity": "medium",
                        "color": "yellow",
                        "title": "💸 Gider Geliri Aştı",
                        "message": f"{month_name} ayında ₺{abs(cash_flow):,.0f} açık vereceksiniz.",
                        "recommendation": "Bu ayki giderleri gözden geçirin ve gereksiz harcamaları kısın.",
                        "impact_score": 55
                    })

            # Düşük bakiye (henüz kritik değil)
            if 0 < balance < (total_expense * 0.50) and balance >= (total_expense * 0.30):
                warnings.append({
                    "month": month_name,
                    "type": "medium_buffer",
                    "severity": "medium",
                    "color": "yellow",
                    "title": "⚡ Bakiye Düşük",
                    "message": f"{month_name} ayında bakiyeniz ₺{balance:,.0f} seviyesine iniyor.",
                    "recommendation": "Acil durum fonu oluşturmaya başlayın.",
                    "impact_score": 50
                })

            # ---------------------------------------------------------
            # 4. MAVİ - BİLGİLENDİRME
            # Severity: info (İyileştirme fırsatı)
            # ---------------------------------------------------------

            # Tasarruf analizi (Sadece cash_flow > 0 ise) - Sadece 1 kere ekle
            if income > 0 and cash_flow > 0:
                savings_rate = (cash_flow / income) * 100

                # Düşük tasarruf (%0 - %5 arası)
                if savings_rate < 5.0 and "low_savings" not in warning_types_added:
                    warnings.append({
                        "month": month_name,
                        "type": "low_savings",
                        "severity": "info",
                        "color": "blue",
                        "title": "🐢 Düşük Tasarruf Hızı",
                        "message": f"Artıdasınız ama gelirinizin sadece %{savings_rate:.1f}'ini kenara atabiliyorsunuz.",
                        "recommendation": "Gereksiz değişken giderleri kısarak bu oranı %20'ye çıkarın.",
                        "impact_score": 30
                    })
                    warning_types_added.add("low_savings")

                # Orta tasarruf (%5 - %20 arası) - Uyarı yok, normal
                elif 5.0 <= savings_rate < 20.0:
                    pass  # Normal seviye, bildirim yok

                # İyi tasarruf (%20 ve üzeri)
                elif savings_rate >= 20.0 and "good_savings" not in warning_types_added:
                    warnings.append({
                        "month": month_name,
                        "type": "good_savings",
                        "severity": "info",
                        "color": "blue",
                        "title": "💎 Harika Tasarruf!",
                        "message": f"Gelirinizin %{savings_rate:.1f}'ini biriktiriyorsunuz. Tebrikler!",
                        "recommendation": "Bu tasarrufları yatırıma yönlendirmeyi düşünün.",
                        "impact_score": 20
                    })
                    warning_types_added.add("good_savings")

            # ---------------------------------------------------------
            # 5. GRİ - NÖTR BİLGİ
            # Severity: neutral (Sadece bilgilendirme)
            # ---------------------------------------------------------

            # Mevsimsel harcama uyarısı - Sadece 1 kere ekle
            forecast_month_num = datetime.strptime(forecast["month"], "%Y-%m").month
            if forecast_month_num in [12, 1] and total_expense > avg_monthly_expense * 1.1 and "seasonal_winter" not in warning_types_added:
                warnings.append({
                    "month": month_name,
                    "type": "seasonal_expense",
                    "severity": "neutral",
                    "color": "gray",
                    "title": "🎄 Mevsimsel Artış Bekleniyor",
                    "message": f"{month_name} ayında harcamalarınız normalden %15 daha yüksek olabilir (Kış ayları).",
                    "recommendation": "Yeni yıl harcamaları için önceden bütçe ayırın.",
                    "impact_score": 10
                })
                warning_types_added.add("seasonal_winter")
            elif forecast_month_num in [6, 7, 8] and total_expense > avg_monthly_expense * 1.05 and "seasonal_summer" not in warning_types_added:
                warnings.append({
                    "month": month_name,
                    "type": "seasonal_expense",
                    "severity": "neutral",
                    "color": "gray",
                    "title": "☀️ Yaz Tatili Dönemi",
                    "message": f"{month_name} ayında tatil harcamaları artabilir.",
                    "recommendation": "Tatil için önceden tasarruf yapın.",
                    "impact_score": 10
                })
                warning_types_added.add("seasonal_summer")

        # Uyarıları impact_score ve severity'ye göre sırala
        severity_order = {"critical": 0, "high": 1, "medium": 2, "info": 3, "neutral": 4}
        warnings.sort(key=lambda x: (severity_order.get(x["severity"], 5), -x.get("impact_score", 0)))

        # SADECE BİR SONRAK İ AYIN uyarılarını göster
        if next_month_str and forecasts:
            next_month_name = forecasts[0]["month_name"]
            warnings = [w for w in warnings if w.get("month") == next_month_name]

        # 6. Özet istatistikler
        summary = {
            "total_income": sum([f["predicted_income"] for f in forecasts]),
            "total_expense": sum([f["predicted_expense"] for f in forecasts]),
            "total_savings": sum([f["net_cash_flow"] for f in forecasts]),
            "average_monthly_savings": avg_savings,
            "income_trend": "increasing" if income_trend > 0 else "decreasing" if income_trend < 0 else "stable",
            "expense_trend": "increasing" if expense_trend > 0 else "decreasing" if expense_trend < 0 else "stable",
            "savings_rate": round((avg_savings / avg_income * 100) if avg_income > 0 else 0, 2)
        }

        cur.close()
        conn.close()

        # Başlangıç bakiyesini hesapla
        initial_balance = current_balance - sum([f["net_cash_flow"] for f in forecasts])

        return {
            "success": True,
            "user_id": user_id,
            "forecast_period": f"{months} months",
            "current_balance": round(initial_balance, 2),
            "code_version": "2024-12-24-v2",  # DEBUG: Check if code is reloading
            "forecasts": forecasts,
            "warnings": warnings,
            "summary": summary,
            "historical_data": {
                "avg_income": round(avg_income, 2),
                "avg_expense": round(avg_expense, 2),
                "avg_savings": round(avg_savings, 2)
            },
            "warning_stats": {
                "total_warnings": len(warnings),
                "critical": len([w for w in warnings if w["severity"] == "critical"]),
                "high": len([w for w in warnings if w["severity"] == "high"]),
                "medium": len([w for w in warnings if w["severity"] == "medium"]),
                "info": len([w for w in warnings if w["severity"] == "info"]),
                "neutral": len([w for w in warnings if w["severity"] == "neutral"])
            },
            "test_mode": test_mode if test_mode else "normal"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@router.post("/cash-flow/{user_id}/what-if")
async def calculate_what_if(
    user_id: str,
    scenario: WhatIfScenario,
    months: int = 12
):
    """
    Gelişmiş What-if scenario analizi yapar

    Desteklenen senaryolar:
    - İş Değişikliği (job_change): Maaş artışı/azalışı
    - Büyük Alım (major_purchase): Ev, araba vb.
    - Borç Ödeme (debt_payoff): Kredi kartı, konut kredisi ödeme
    - Yatırım (investment): Tasarruf, hisse, fon yatırımı
    - Yaşam Tarzı Değişikliği (lifestyle_change): Taşınma, evlilik vb.
    """
    try:
        # Normal forecast'ı al
        base_forecast = await get_cash_flow_forecast(user_id, months)

        if not base_forecast["success"]:
            return base_forecast

        # Scenario'yu uygula
        modified_forecasts = []
        cumulative_investment = 0  # Toplam yatırım

        for month_idx, forecast in enumerate(base_forecast["forecasts"], start=1):
            modified_forecast = forecast.copy()

            # Senaryo başladı mı kontrol et
            scenario_active = month_idx >= scenario.start_month

            # Duration kontrolü
            if scenario.duration_months:
                scenario_active = scenario_active and (month_idx < scenario.start_month + scenario.duration_months)

            # İlk ayda tek seferlik maliyet uygula
            if month_idx == scenario.start_month and scenario.one_time_cost > 0:
                modified_forecast["predicted_expense"] += scenario.one_time_cost
                modified_forecast["net_cash_flow"] -= scenario.one_time_cost

            # Senaryo aktifse değişiklikleri uygula
            if scenario_active:
                # Gelir değişikliği
                income_adjustment = scenario.income_change

                # Growth rate uygula (her ay biraz daha artış)
                if scenario.growth_rate > 0:
                    months_since_start = month_idx - scenario.start_month
                    income_adjustment *= (1 + scenario.growth_rate / 100) ** (months_since_start / 12)

                modified_forecast["predicted_income"] += income_adjustment
                modified_forecast["net_cash_flow"] += income_adjustment

                # Gider değişikliği
                expense_adjustment = scenario.expense_change

                # Enflasyon uygula
                if scenario.inflation_rate > 0:
                    months_since_start = month_idx - scenario.start_month
                    expense_adjustment *= (1 + scenario.inflation_rate / 100) ** (months_since_start / 12)

                modified_forecast["predicted_expense"] += expense_adjustment
                modified_forecast["net_cash_flow"] -= expense_adjustment

                # Yatırım senaryosu
                if scenario.investment_return_rate > 0 and scenario.income_change < 0:
                    # Negatif income_change yatırım olarak sayılıyor
                    monthly_investment = abs(scenario.income_change)
                    cumulative_investment += monthly_investment

                    # Bileşik getiri hesapla
                    monthly_return_rate = scenario.investment_return_rate / 100 / 12
                    investment_return = cumulative_investment * monthly_return_rate

                    modified_forecast["predicted_income"] += investment_return
                    modified_forecast["net_cash_flow"] += investment_return

                # Borç faizi
                if scenario.debt_interest_rate > 0 and scenario.one_time_cost > 0:
                    monthly_interest_rate = scenario.debt_interest_rate / 100 / 12
                    interest_payment = scenario.one_time_cost * monthly_interest_rate
                    modified_forecast["predicted_expense"] += interest_payment
                    modified_forecast["net_cash_flow"] -= interest_payment

            # Cumulative balance'ı yeniden hesapla
            if modified_forecasts:
                modified_forecast["cumulative_balance"] = (
                    modified_forecasts[-1]["cumulative_balance"] +
                    modified_forecast["net_cash_flow"]
                )
            else:
                modified_forecast["cumulative_balance"] = (
                    base_forecast["current_balance"] +
                    modified_forecast["net_cash_flow"]
                )

            # Risk level güncelle
            if modified_forecast["cumulative_balance"] < 0:
                modified_forecast["risk_level"] = "critical"
            elif modified_forecast["cumulative_balance"] < modified_forecast["predicted_income"]:
                modified_forecast["risk_level"] = "high"
            elif modified_forecast["cumulative_balance"] < modified_forecast["predicted_income"] * 3:
                modified_forecast["risk_level"] = "medium"
            else:
                modified_forecast["risk_level"] = "low"

            modified_forecasts.append(modified_forecast)

        # Detaylı karşılaştırma
        base_total_income = sum([f["predicted_income"] for f in base_forecast["forecasts"]])
        base_total_expense = sum([f["predicted_expense"] for f in base_forecast["forecasts"]])
        base_total_savings = sum([f["net_cash_flow"] for f in base_forecast["forecasts"]])

        scenario_total_income = sum([f["predicted_income"] for f in modified_forecasts])
        scenario_total_expense = sum([f["predicted_expense"] for f in modified_forecasts])
        scenario_total_savings = sum([f["net_cash_flow"] for f in modified_forecasts])

        comparison = {
            "base_final_balance": base_forecast["forecasts"][-1]["cumulative_balance"],
            "scenario_final_balance": modified_forecasts[-1]["cumulative_balance"],
            "difference": modified_forecasts[-1]["cumulative_balance"] - base_forecast["forecasts"][-1]["cumulative_balance"],
            "difference_percentage": round(
                ((modified_forecasts[-1]["cumulative_balance"] - base_forecast["forecasts"][-1]["cumulative_balance"])
                / abs(base_forecast["forecasts"][-1]["cumulative_balance"]) * 100)
                if base_forecast["forecasts"][-1]["cumulative_balance"] != 0 else 0,
                2
            ),
            "impact": "positive" if modified_forecasts[-1]["cumulative_balance"] > base_forecast["forecasts"][-1]["cumulative_balance"] else "negative",

            # Toplam değişiklikler
            "total_income_change": scenario_total_income - base_total_income,
            "total_expense_change": scenario_total_expense - base_total_expense,
            "total_savings_change": scenario_total_savings - base_total_savings,

            # Ortalamalar
            "avg_monthly_income_change": (scenario_total_income - base_total_income) / months,
            "avg_monthly_expense_change": (scenario_total_expense - base_total_expense) / months,
            "avg_monthly_savings_change": (scenario_total_savings - base_total_savings) / months,

            # ROI (yatırım senaryoları için)
            "roi_percentage": round(
                ((scenario_total_savings - base_total_savings) / abs(scenario.one_time_cost) * 100)
                if scenario.one_time_cost > 0 else 0,
                2
            ) if scenario.one_time_cost > 0 else None,

            # Payback period (kaç ayda kendini amorti eder)
            "payback_months": None,

            # Risk assessment
            "risk_months": len([f for f in modified_forecasts if f["cumulative_balance"] < 0]),
            "lowest_balance": min([f["cumulative_balance"] for f in modified_forecasts]),
            "highest_balance": max([f["cumulative_balance"] for f in modified_forecasts])
        }

        # Payback period hesapla
        if scenario.one_time_cost > 0:
            cumulative_benefit = 0
            for idx, forecast in enumerate(modified_forecasts, start=1):
                base_forecast_item = base_forecast["forecasts"][idx - 1]
                monthly_benefit = forecast["net_cash_flow"] - base_forecast_item["net_cash_flow"]
                cumulative_benefit += monthly_benefit

                if cumulative_benefit >= scenario.one_time_cost:
                    comparison["payback_months"] = idx
                    break

        # İçgörüler ve öneriler
        insights = []

        if comparison["difference"] > 0:
            insights.append({
                "type": "positive",
                "message": f"Bu senaryo {months} ay sonunda {abs(comparison['difference']):.2f} TL daha fazla bakiye sağlar."
            })
        else:
            insights.append({
                "type": "negative",
                "message": f"Bu senaryo {months} ay sonunda {abs(comparison['difference']):.2f} TL daha az bakiye bırakır."
            })

        if comparison["risk_months"] > 0:
            insights.append({
                "type": "warning",
                "message": f"Bu senaryoda {comparison['risk_months']} ay boyunca bakiyeniz negatife düşebilir."
            })

        if comparison["payback_months"]:
            insights.append({
                "type": "info",
                "message": f"Başlangıç maliyeti {comparison['payback_months']} ayda geri dönecektir."
            })

        if comparison["roi_percentage"] and comparison["roi_percentage"] > 0:
            insights.append({
                "type": "positive",
                "message": f"Yatırım getirisi: %{comparison['roi_percentage']}"
            })

        return {
            "success": True,
            "scenario": {
                "title": scenario.title,
                "type": scenario.scenario_type,
                "description": scenario.description,
                "income_change": scenario.income_change,
                "expense_change": scenario.expense_change,
                "one_time_cost": scenario.one_time_cost,
                "start_month": scenario.start_month,
                "duration_months": scenario.duration_months
            },
            "base_forecast": base_forecast["forecasts"],
            "scenario_forecast": modified_forecasts,
            "comparison": comparison,
            "insights": insights,
            "metadata": {
                "months_analyzed": months,
                "cumulative_investment": cumulative_investment,
                "inflation_adjusted": scenario.inflation_rate > 0,
                "growth_adjusted": scenario.growth_rate > 0
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-if scenario error: {str(e)}")
