from datetime import datetime
from config.postgres import get_pg_connection
import json
import sys
from pathlib import Path

# Parent directory'yi path'e ekle
sys.path.append(str(Path(__file__).parent.parent.parent))

# Credit Score Hesaplayıcı
from services.credit_scoring import CreditScoreCalculator
from services.anomaly.detector import AnomalyDetector

# Finansal Sağlık Hesaplayıcıları
try:
    from services.financial_health.calculators import (
        calculate_liquidity,
        calculate_savings_health,
        calculate_debt_management,
        calculate_spending_discipline
    )
    ADVANCED_SCORING_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Advanced scoring unavailable: {e}")
    ADVANCED_SCORING_AVAILABLE = False


def calculate_advanced_health_score(current_data: dict) -> int:
    """
    Profesyonel finansal sağlık skoru hesaplama.
    Node.js'ten gelen hazır veriyi kullanır.
    """
    try:
        # Tekil veri listesi
        data_list = [current_data]
        
        liquidity_score = calculate_liquidity(data_list)
        savings_score = calculate_savings_health(data_list)
        debt_score = calculate_debt_management(data_list)
        discipline_score = calculate_spending_discipline(data_list)
        
        # Ağırlıklı Ortalama
        total_score = (
            liquidity_score * 0.30 +
            savings_score * 0.30 +
            debt_score * 0.25 +
            discipline_score * 0.15
        )
        
        return max(0, min(int(total_score), 100))
        
    except Exception as e:
        print(f"⚠️ Advanced scoring failed: {e}")
        return 50 # Hata durumunda varsayılan skor

def process_monthly_snapshot(data):
    """
    Node.js'ten gelen veriyi işler, hesaplar ve PostgreSQL'e kaydeder.
    MongoDB bağımlılığı yoktur.
    """
    print(f"🚀 Processing snapshot for user: {data.userId} - {data.monthName} {data.year}")

    # 1. Financial Health Score Hesapla
    health_calc_data = {
        'total_income': data.income,
        'total_expense': data.expenses,
        'cumulative_savings': data.cumulativeSavings,
        'savings_ratio': (data.savings / data.income) if data.income > 0 else 0,
        'expense_ratio': (data.expenses / data.income) if data.income > 0 else 0,
        'budget_adherence': {},
        'expense_breakdown': {},
        'savings_streak': 0 
    }
    
    financial_health_score = calculate_advanced_health_score(health_calc_data)

    # 2. Credit Score Hesapla
    # Pydantic modelini dict'e çevirip veriyoruz (eğer gerekirse)
    # CreditScoreCalculator implementasyonuna göre data direkt geçilebilir
    calculator = CreditScoreCalculator(data)
    credit_result = calculator.calculate()

    # 2.5. Expense Events'i Kaydet (Anomaly Detection için gerekli)
    # Eğer data içinde detaylı harcama verisi varsa, expense_events tablosuna yaz
    conn = get_pg_connection()
    cursor = conn.cursor()
    
    try:
        # Önce bu ayın eski verilerini temizle (Duplicate önlemek için)
        expense_date = f"{data.month}-01"
        cursor.execute("DELETE FROM expense_events WHERE user_id = %s AND month_year = %s", (data.userId, data.month))
        
        # Fixed Expenses Ekle
        if hasattr(data, 'fixedExpenses'):
            for expense in data.fixedExpenses:
                # Pydantic model veya dict kontrolü
                exp_dict = expense.dict() if hasattr(expense, 'dict') else expense
                cursor.execute("""
                    INSERT INTO expense_events (
                        user_id, expense_date, month_year,
                        name, amount, category, expense_type,
                        is_recurring, frequency, day_of_month,
                        total_income, total_expense, savings
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'fixed', %s, %s, %s, %s, %s, %s)
                """, (data.userId, expense_date, data.month, exp_dict.get('name'), float(exp_dict.get('amount', 0)), exp_dict.get('category', 'diger'), 
                      exp_dict.get('isRecurring', False), exp_dict.get('frequency'), exp_dict.get('dayOfMonth'), 
                      data.income, data.expenses, data.savings))

        # Variable Expenses Ekle
        if hasattr(data, 'variableExpenses'):
            for expense in data.variableExpenses:
                exp_dict = expense.dict() if hasattr(expense, 'dict') else expense
                cursor.execute("""
                    INSERT INTO expense_events (
                        user_id, expense_date, month_year,
                        name, amount, category, expense_type, is_recurring,
                        total_income, total_expense, savings
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'variable', False, %s, %s, %s)
                """, (data.userId, expense_date, data.month, exp_dict.get('name'), float(exp_dict.get('amount', 0)), exp_dict.get('category', 'diger'), 
                      data.income, data.expenses, data.savings))
        
        conn.commit()
    except Exception as e:
        print(f"⚠️ Expense events insert warning: {e}")
        conn.rollback()

    # 3. Veritabanına Kaydet
    snapshot_date = f"{data.month}-01"
    
    # JSONB Hazırlığı (Helper: Pydantic ise .dict() kullan, değilse direkt al)
    def to_dict_list(items):
        return [item.dict() if hasattr(item, 'dict') else item for item in items]

    debts_json = json.dumps(to_dict_list(data.debts))
    cards_json = json.dumps(to_dict_list(data.creditCards))
    investments_json = json.dumps(to_dict_list(data.investments))
    assets_json = json.dumps(to_dict_list(data.assets))

    
    try:
        query = """
            INSERT INTO monthly_snapshots (
                user_id, snapshot_month, month_name, year,
                total_income, total_expense, savings, cumulative_savings,
                financial_health_score,
                
                credit_score, risk_category, risk_level,
                payment_history_score, debt_burden_score, 
                behavior_score, stability_score, asset_score,
                
                credit_utilization, debt_to_income, 
                on_time_payment_rate, total_debt, net_worth,
                
                debts_snapshot, credit_cards_snapshot,
                investments_snapshot, assets_snapshot,
                
                created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                NOW()
            )
            ON CONFLICT (user_id, snapshot_month) 
            DO UPDATE SET
                total_income = EXCLUDED.total_income,
                total_expense = EXCLUDED.total_expense,
                savings = EXCLUDED.savings,
                cumulative_savings = EXCLUDED.cumulative_savings,
                financial_health_score = EXCLUDED.financial_health_score,
                credit_score = EXCLUDED.credit_score,
                created_at = NOW()
        """
        
        cursor.execute(query, (
            data.userId, snapshot_date, data.monthName, data.year,
            data.income, data.expenses, data.savings, data.cumulativeSavings,
            financial_health_score,
            
            credit_result['score'],
            credit_result['risk_category'],
            credit_result['risk_level'],
            credit_result['breakdown']['payment_history'],
            credit_result['breakdown']['debt_burden'],
            credit_result['breakdown']['behavior'],
            credit_result['breakdown']['stability'],
            credit_result['breakdown']['asset'],
            
            credit_result['metrics']['credit_utilization'],
            credit_result['metrics']['debt_to_income'],
            credit_result['metrics']['on_time_payment_rate'],
            credit_result['metrics']['total_debt'],
            credit_result['metrics']['net_worth'],
            
            debts_json, cards_json, investments_json, assets_json
        ))
        
        conn.commit()
        print("✅ Snapshot saved/updated in PostgreSQL")
        
        # 4. Anomaly Detection Çalıştır (Veriler artık DB'de)
        print("🔍 Triggering anomaly detection...")
        detector = AnomalyDetector(data.userId, conn)
        alerts = detector.detect_all()
        detector.save_alerts_to_db()
        
        return {
            "success": True,
            "financialHealthScore": financial_health_score,
            "creditScore": credit_result['score'],
            "riskCategory": credit_result['risk_category'],
            "riskLevel": credit_result['risk_level'],
            "anomalies": {
                "count": len(alerts),
                "alerts": alerts
            }
        }
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Database error: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()