from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
from config.postgres import get_pg_connection
from services.credit_scoring.explainer import CreditScoreExplainer
from services.financial_health.calculators import (
    calculate_liquidity, calculate_savings_health,
    calculate_debt_management, calculate_spending_discipline
)

# ✅ YENİ SERVİSİMİZİ BURAYA İMPORT EDİYORUZ
from services.analytics.snapshot_service import process_monthly_snapshot

router = APIRouter(prefix="/api", tags=["Snapshot"])

# --- MODELLER (Node.js'ten gelen veri yapısı) ---
class DebtSnapshot(BaseModel):
    type: str
    name: str
    totalAmount: float
    remainingAmount: float
    monthlyPayment: float
    status: str = 'aktif'
    paymentHistory: Optional[List[dict]] = []

class CreditCardSnapshot(BaseModel):
    bankName: str
    limit: float
    currentDebt: float
    utilizationRate: float
    paymentHistory: Optional[List[dict]] = []
    status: str = 'aktif'

class InvestmentSnapshot(BaseModel):
    type: str
    name: str
    totalInvested: float
    currentValue: Optional[float] = None
    profitLoss: Optional[float] = 0

class AssetSnapshot(BaseModel):
    type: str
    name: str
    currentValue: float
    hasLoan: bool = False
    loanAmount: float = 0

class MonthlyHistoryItem(BaseModel):
    month: str
    monthName: str
    year: int
    income: float
    expenses: float
    savings: float
    cumulativeSavings: float

# Ana Payload Modeli
class MonthlySnapshotInput(BaseModel):
    userId: str
    month: str
    year: int
    monthName: str
    income: float
    expenses: float
    savings: float
    cumulativeSavings: float
    fixedExpenses: List[dict] = []
    variableExpenses: List[dict] = []
    debts: List[DebtSnapshot] = []
    creditCards: List[CreditCardSnapshot] = []
    investments: List[InvestmentSnapshot] = []
    assets: List[AssetSnapshot] = []
    monthlyHistory: List[MonthlyHistoryItem] = []


# --- YENİ SNAPSHOT HESAPLAMA ENDPOINTI (Node.js Burayı Çağırıyor) ---
@router.post("/calculate-monthly-snapshot")
async def calculate_monthly_snapshot(data: MonthlySnapshotInput):
    """
    Node.js'ten gelen veriyi alır, servise gönderir ve sonucu döner.
    """
    try:
        # Tüm işi servise devret
        result = process_monthly_snapshot(data)
        return result
    except Exception as e:
        print(f"❌ Snapshot Calculation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# --- HARCAMA EVENTS KAYDETME (Daha önce düzelttiğimiz endpoint) ---
@router.post("/expense-events/bulk-insert")
async def bulk_insert_expense_events(data: dict):
    try:
        user_id = data.get('userId')
        month = data.get('month')
        
        # Node.js zaten hesapladı
        total_income = float(data.get('totalIncome', 0))
        total_expense = float(data.get('totalExpense', 0))
        savings = float(data.get('savings', 0))
        
        fixed_expenses = data.get('fixedExpenses', [])
        variable_expenses = data.get('variableExpenses', [])
        
        print(f"💾 Bulk inserting expenses for {month}...")
        
        expense_date = f"{month}-01"
        pg_conn = get_pg_connection()
        cur = pg_conn.cursor()
        
        # ✅ Önce bu ayın eski verilerini temizle (Duplicate önlemek için)
        cur.execute("DELETE FROM expense_events WHERE user_id = %s AND month_year = %s", (user_id, month))
        
        total_inserted = 0
        
        # Fixed
        for expense in fixed_expenses:
            name = expense.get('name')
            amount = expense.get('amount')
            category = expense.get('category', 'diger')
            is_recurring = expense.get('isRecurring', False)
            frequency = expense.get('frequency')
            day_of_month = expense.get('dayOfMonth')
            
            if not name or not amount: continue
            
            cur.execute("""
                INSERT INTO expense_events (
                    user_id, expense_date, month_year,
                    name, amount, category, expense_type,
                    is_recurring, frequency, day_of_month,
                    total_income, total_expense, savings
                ) VALUES (%s, %s, %s, %s, %s, %s, 'fixed', %s, %s, %s, %s, %s, %s)
            """, (user_id, expense_date, month, name, float(amount), category, is_recurring, frequency, day_of_month, total_income, total_expense, savings))
            total_inserted += 1

        # Variable
        for expense in variable_expenses:
            name = expense.get('name')
            amount = expense.get('amount')
            category = expense.get('category', 'diger')
            
            if not name or not amount: continue
            
            cur.execute("""
                INSERT INTO expense_events (
                    user_id, expense_date, month_year,
                    name, amount, category, expense_type, is_recurring,
                    total_income, total_expense, savings
                ) VALUES (%s, %s, %s, %s, %s, %s, 'variable', False, %s, %s, %s)
            """, (user_id, expense_date, month, name, float(amount), category, total_income, total_expense, savings))
            total_inserted += 1
            
        pg_conn.commit()
        cur.close()
        pg_conn.close()
        
        return {"success": True, "count": total_inserted}
        
    except Exception as e:
        print(f"❌ Bulk insert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- OKUMA ENDPOINTLERİ (Frontend Bunları Kullanıyor - SAKIN SİLME) ---

@router.get("/snapshots/latest/{user_id}")
async def get_latest_snapshot(user_id: str):
    """Kullanıcının en son snapshot'ını döndür"""
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        
        query = """
            SELECT snapshot_month, financial_health_score, credit_score, risk_category, risk_level,
                   savings_ratio, expense_ratio, cumulative_savings
            FROM monthly_snapshots
            WHERE user_id = %s
            ORDER BY snapshot_month DESC LIMIT 1
        """
        cur.execute(query, (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="No snapshot found")
        
        return {
            "snapshot_month": str(row[0]),
            "financial_health_score": row[1],
            "credit_score": row[2],
            "risk_category": row[3],
            "risk_level": row[4],
            "breakdown": {
                "savings_ratio": float(row[5]) * 100 if row[5] else 0,
                "expense_ratio": float(row[6]) * 100 if row[6] else 0
            },
            "cumulative_savings": float(row[7]) if row[7] else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/credit-score/explain/{user_id}")
async def explain_credit_score(user_id: str):
    try:
        conn = get_pg_connection()
        explainer = CreditScoreExplainer(conn)
        result = explainer.explain_score(user_id)
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calculate-current-score")
async def calculate_current_month_score(request: dict):
    """Anlık basit skor hesaplama (Frontend widget'ları için)"""
    try:
        current_data = {
            'total_income': float(request.get('income', 0)),
            'total_expense': float(request.get('totalExpenses', 0)),
            'cumulative_savings': float(request.get('cumulativeSavings', 0)),
        }
        data_list = [current_data]
        
        liquidity = calculate_liquidity(data_list)
        savings = calculate_savings_health(data_list)
        debt = calculate_debt_management(data_list)
        discipline = calculate_spending_discipline(data_list)
        
        total = (liquidity * 0.3 + savings * 0.3 + debt * 0.25 + discipline * 0.15)
        
        return {"score": int(total), "breakdown": {"liquidity": liquidity, "savings": savings}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

 
            


            