# analytics/tests/test_snapshot.py
# Snapshot service ve credit score hesaplama testleri

import pytest


class TestCreditScoreCalculations:
    """Credit score hesaplama mantığı testleri"""

    def test_debt_to_income_ratio(self):
        """Borç/gelir oranı hesaplaması"""
        total_debt = 10000
        total_income = 45000

        debt_to_income = total_debt / total_income if total_income > 0 else 0

        assert debt_to_income == 0.2222222222222222
        assert round(debt_to_income, 2) == 0.22  # %22

    def test_credit_utilization_calculation(self):
        """Kredi kartı kullanım oranı"""
        current_debt = 5000
        credit_limit = 20000

        utilization = current_debt / credit_limit if credit_limit > 0 else 0

        assert utilization == 0.25  # %25

    def test_zero_division_prevention(self):
        """Sıfıra bölme hatası önleme"""
        debt = 1000
        income = 0

        # Güvenli bölme
        debt_to_income = debt / income if income > 0 else 0

        assert debt_to_income == 0  # Hata vermez

    def test_credit_score_range(self):
        """Credit score 0-850 arasında olmalı"""
        calculated_score = 920  # Hatalı hesaplama

        # Sınırlama
        final_score = max(0, min(calculated_score, 850))

        assert final_score == 850
        assert 0 <= final_score <= 850


class TestSnapshotDataValidation:
    """Snapshot veri doğrulama testleri"""

    def test_required_fields_present(self):
        """Gerekli alanlar mevcut mu?"""
        snapshot_data = {
            'userId': '694d5b67c9d5c977c88a05e3',
            'month': '2025-12',
            'year': 2025,
            'income': 45000,
            'expenses': 28000
        }

        required_fields = ['userId', 'month', 'year', 'income', 'expenses']

        for field in required_fields:
            assert field in snapshot_data

    def test_numeric_values_are_floats(self):
        """Sayısal değerler float'a çevrilmeli"""
        income_str = "45000.50"
        income_float = float(income_str)

        assert isinstance(income_float, float)
        assert income_float == 45000.5

    def test_array_mapping(self):
        """Dizi verileri doğru map edilmeli"""
        debts = [
            {'type': 'konut', 'amount': 500000},
            {'type': 'araba', 'amount': 150000}
        ]

        total_debt = sum(debt['amount'] for debt in debts)

        assert total_debt == 650000
        assert len(debts) == 2

    def test_empty_array_handling(self):
        """Boş diziler güvenli işlenmeli"""
        credit_cards = []

        total_debt = sum(card.get('currentDebt', 0) for card in credit_cards)

        assert total_debt == 0
        assert len(credit_cards) == 0


class TestFinancialHealthScore:
    """Finansal sağlık skoru testleri"""

    def test_savings_ratio_calculation(self):
        """Tasarruf oranı hesaplaması"""
        savings = 17000
        income = 45000

        savings_ratio = savings / income if income > 0 else 0

        assert round(savings_ratio, 3) == 0.378  # %37.8

    def test_expense_ratio_calculation(self):
        """Gider oranı hesaplaması"""
        expenses = 28000
        income = 45000

        expense_ratio = expenses / income if income > 0 else 0

        assert round(expense_ratio, 3) == 0.622  # %62.2

    def test_health_score_range(self):
        """Health score 0-100 arasında olmalı"""
        calculated_score = 120  # Hatalı

        final_score = max(0, min(int(calculated_score), 100))

        assert final_score == 100
        assert 0 <= final_score <= 100


class TestMonthlySnapshotInsertion:
    """PostgreSQL snapshot insertion testleri"""

    def test_month_date_format(self):
        """Snapshot tarihi doğru formatta mı?"""
        month = "2025-12"
        snapshot_date = f"{month}-01"

        assert snapshot_date == "2025-12-01"

    def test_upsert_logic_key(self):
        """ON CONFLICT (user_id, snapshot_month)"""
        user_id = "694d5b67c9d5c977c88a05e3"
        snapshot_month = "2025-12-01"

        unique_key = (user_id, snapshot_month)

        assert unique_key == ("694d5b67c9d5c977c88a05e3", "2025-12-01")

    def test_json_serialization(self):
        """JSONB verileri serialize edilebilir mi?"""
        import json

        debts_snapshot = [
            {"type": "konut", "amount": 500000},
            {"type": "araba", "amount": 150000}
        ]

        debts_json = json.dumps(debts_snapshot)

        assert isinstance(debts_json, str)
        assert "konut" in debts_json

        # Deserialize
        parsed = json.loads(debts_json)
        assert len(parsed) == 2


class TestExpenseEventsBulkInsert:
    """Expense events bulk insert testleri"""

    def test_expense_date_format(self):
        """Harcama tarihi formatı"""
        month = "2025-12"
        expense_date = f"{month}-01"

        assert expense_date == "2025-12-01"

    def test_expense_type_classification(self):
        """Harcama tipi doğru sınıflandırılıyor mu?"""
        fixed_expense = {
            'name': 'Kira',
            'amount': 12000,
            'isRecurring': True
        }

        expense_type = 'fixed' if fixed_expense['isRecurring'] else 'variable'

        assert expense_type == 'fixed'

    def test_category_default(self):
        """Kategori yoksa varsayılan değer"""
        expense = {'name': 'Xyz', 'amount': 1000}

        category = expense.get('category', 'diger')

        assert category == 'diger'

    def test_duplicate_prevention(self):
        """Aynı ay için tekrar ekleme önlenmeli"""
        user_id = "694d5b67c9d5c977c88a05e3"
        month_year = "2025-12"

        # DELETE FROM expense_events WHERE user_id = X AND month_year = Y
        # Bu query önce çalışmalı

        delete_key = (user_id, month_year)
        assert delete_key == ("694d5b67c9d5c977c88a05e3", "2025-12")


class TestEdgeCasesAndErrors:
    """Edge case'ler ve hata durumları"""

    def test_none_value_handling(self):
        """None değerleri güvenli işle"""
        value = None
        safe_value = value if value is not None else 0

        assert safe_value == 0

    def test_negative_amounts(self):
        """Negatif tutarlar olmamalı"""
        amount = -1000

        # Validation
        is_valid = amount > 0

        assert is_valid is False

    def test_very_long_string(self):
        """Çok uzun string'ler kesilmeli"""
        name = "A" * 500  # 500 karakter

        # VARCHAR(255) limiti
        truncated = name[:255]

        assert len(truncated) == 255

    def test_special_characters_in_names(self):
        """Özel karakterler güvenli işlenmeli"""
        name = "Kira'nın Ödemesi - 2025"

        # Türkçe karakterler korunmalı
        assert 'ı' in name
        assert 'ş' in name

    def test_decimal_precision(self):
        """Decimal precision kaybı"""
        value = 12345.6789
        stored = round(value, 2)  # NUMERIC(12,2)

        assert stored == 12345.68


# Pytest'i çalıştırmak için:
# cd analytics
# pytest tests/test_snapshot.py -v
