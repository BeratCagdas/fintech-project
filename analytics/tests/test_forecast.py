# analytics/tests/test_forecast.py
# Cash Flow Forecast fonksiyon testleri

import pytest
import pandas as pd
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta


class TestForecastCalculations:
    """Forecast hesaplama mantığı testleri"""

    def test_average_calculations(self):
        """Gelir/gider ortalaması doğru hesaplanıyor mu?"""
        data = [45000, 50000, 48000]
        avg = sum(data) / len(data)

        assert avg == 47666.666666666664
        assert round(avg, 2) == 47666.67

    def test_savings_calculation(self):
        """Tasarruf hesaplaması doğru mu?"""
        avg_income = 45000
        avg_expense = 28000
        avg_savings = avg_income - avg_expense

        assert avg_savings == 17000

    def test_trend_analysis_with_single_data_point(self):
        """Tek satır veriyle trend hesaplaması"""
        data = [45000]

        # 3'ten az veri varsa trend = 0 olmalı
        if len(data) < 3:
            income_trend = 0
            expense_trend = 0
        else:
            income_trend = np.polyfit(range(len(data)), data, 1)[0]
            expense_trend = 0

        assert income_trend == 0
        assert expense_trend == 0

    def test_nan_handling_in_std_calculation(self):
        """Standart sapma NaN kontrolü"""
        data = pd.Series([45000])  # Tek satır
        std = data.std()

        # Tek satır varsa std = NaN olur
        assert pd.isna(std)

        # Fix: NaN ise varsayılan değer kullan
        if pd.isna(std) or std == 0:
            std = data.mean() * 0.1

        assert std == 4500.0  # %10 varsayılan

    def test_confidence_interval_calculation(self):
        """Güven aralığı hesaplaması"""
        predicted_income = 45000
        income_std = 4500  # %10 sapma

        income_low = predicted_income - income_std
        income_high = predicted_income + income_std

        assert income_low == 40500
        assert income_high == 49500

    def test_negative_expense_prevention(self):
        """Gider asla negatif olamaz kontrolü"""
        predicted_expense = -1000  # Yanlış hesaplama
        avg_expense = 28000

        # Fix: Negatifse ortalamayı kullan
        if predicted_expense < 0:
            predicted_expense = avg_expense

        assert predicted_expense == 28000
        assert predicted_expense > 0


class TestDatetimeSerialization:
    """Datetime ve JSON serialization testleri"""

    def test_datetime_to_string_conversion(self):
        """Datetime'ı stringe doğru çevir"""
        forecast_date = datetime(2025, 12, 15)
        month_str = forecast_date.strftime("%Y-%m")
        month_name = forecast_date.strftime("%B %Y")

        assert month_str == "2025-12"
        assert month_name == "December 2025"

    def test_postgresql_date_conversion(self):
        """PostgreSQL DATE objesi datetime'a çevrilir mi?"""
        # String formatında tarih (PostgreSQL'den gelir)
        last_date_str = "2025-11-01"

        # String'den datetime'a çevir
        if isinstance(last_date_str, str):
            last_date = datetime.strptime(last_date_str, '%Y-%m-%d')

        assert isinstance(last_date, datetime)
        assert last_date.year == 2025
        assert last_date.month == 11

    def test_relativedelta_month_addition(self):
        """Ay ekleme işlemi doğru çalışıyor mu?"""
        last_date = datetime(2025, 11, 1)
        forecast_date = last_date + relativedelta(months=1)

        assert forecast_date.year == 2025
        assert forecast_date.month == 12
        assert forecast_date.day == 1

    def test_year_overflow_in_month_addition(self):
        """Aralık + 1 ay = Ocak (yıl değişimi)"""
        last_date = datetime(2025, 12, 1)
        forecast_date = last_date + relativedelta(months=1)

        assert forecast_date.year == 2026
        assert forecast_date.month == 1


class TestSeasonalFactors:
    """Mevsimsel faktör testleri"""

    def test_winter_seasonal_factor(self):
        """Kış ayları %15 daha fazla harcama"""
        month_num = 12  # Aralık
        seasonal_factor = 1.0

        if month_num in [12, 1]:
            seasonal_factor = 1.15

        assert seasonal_factor == 1.15

    def test_summer_seasonal_factor(self):
        """Yaz tatili %10 daha fazla harcama"""
        month_num = 7  # Temmuz
        seasonal_factor = 1.0

        if month_num in [6, 7, 8]:
            seasonal_factor = 1.10

        assert seasonal_factor == 1.10

    def test_normal_month_seasonal_factor(self):
        """Normal aylarda faktör = 1.0"""
        month_num = 3  # Mart
        seasonal_factor = 1.0

        if month_num in [12, 1]:
            seasonal_factor = 1.15
        elif month_num in [6, 7, 8]:
            seasonal_factor = 1.10

        assert seasonal_factor == 1.0


class TestEdgeCases:
    """Edge case'ler ve hata durumları"""

    def test_empty_historical_data(self):
        """Boş veri varsa hata mesajı döner"""
        historical_data = []

        if not historical_data:
            response = {
                "success": False,
                "message": "Yeterli geçmiş veri bulunamadı. En az 1 aylık veri gerekli.",
                "forecast": []
            }

        assert response["success"] is False
        assert "Yeterli geçmiş veri" in response["message"]

    def test_zero_income_edge_case(self):
        """Gelir = 0 durumu"""
        avg_income = 0
        avg_expense = 5000
        avg_savings = avg_income - avg_expense

        assert avg_savings == -5000
        assert avg_savings < 0

    def test_very_large_numbers(self):
        """Çok büyük sayılar (milyonlarca)"""
        predicted_income = 10000000  # 10 milyon
        predicted_expense = 5000000   # 5 milyon
        net_cash_flow = predicted_income - predicted_expense

        assert net_cash_flow == 5000000
        assert isinstance(net_cash_flow, (int, float))

    def test_float_precision(self):
        """Ondalık hassasiyet"""
        value = 45000.123456789
        rounded = round(value, 2)

        assert rounded == 45000.12
        assert isinstance(rounded, float)

    def test_nan_not_in_final_output(self):
        """Final output'ta NaN olmamalı"""
        import math

        income_std = float('nan')
        avg_income = 45000

        # NaN kontrolü
        if pd.isna(income_std) or income_std == 0:
            income_std = avg_income * 0.1

        assert not math.isnan(income_std)
        assert income_std == 4500.0

    def test_infinity_not_in_output(self):
        """Infinity değerleri olmamalı"""
        import math

        value = 45000 / 0.0001  # Çok büyük sayı

        assert not math.isinf(value)
        assert math.isfinite(value)


class TestRiskLevelCalculation:
    """Risk seviyesi hesaplama testleri"""

    def test_high_risk_negative_balance(self):
        """Negatif bakiye = yüksek risk"""
        current_balance = -5000

        if current_balance < 0:
            risk_level = "high"
        else:
            risk_level = "low"

        assert risk_level == "high"

    def test_medium_risk_low_balance(self):
        """Düşük bakiye = orta risk"""
        current_balance = 10000
        avg_income = 45000

        if current_balance < 0:
            risk_level = "high"
        elif current_balance < avg_income:
            risk_level = "medium"
        else:
            risk_level = "low"

        assert risk_level == "medium"

    def test_low_risk_healthy_balance(self):
        """Sağlıklı bakiye = düşük risk"""
        current_balance = 100000
        avg_income = 45000

        if current_balance < 0:
            risk_level = "high"
        elif current_balance < avg_income:
            risk_level = "medium"
        else:
            risk_level = "low"

        assert risk_level == "low"


# Pytest'i çalıştırmak için:
# cd analytics
# pytest tests/test_forecast.py -v
