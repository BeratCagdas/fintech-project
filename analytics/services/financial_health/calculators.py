# analytics/services/financial_health/calculators.py

def calculate_liquidity(data: list) -> float:
    """
    Likidite Skoru (0-100)
    Acil fon kapasitesi ve nakit akışı sağlığı
    """
    latest_month = data[-1]
    
    emergency_fund = latest_month.get('cumulative_savings', 0)
    monthly_expenses = latest_month.get('total_expense', 0)
    
    if monthly_expenses == 0:
        return 50
    
    coverage_months = emergency_fund / monthly_expenses
    
    if coverage_months >= 6:
        score = 100
    elif coverage_months >= 4:
        score = 90
    elif coverage_months >= 3:
        score = 75
    elif coverage_months >= 2:
        score = 60
    elif coverage_months >= 1:
        score = 40
    else:
        score = max(coverage_months * 40, 0)
    
    return min(score, 100)


def calculate_savings_health(data: list) -> float:
    """
    Tasarruf Sağlığı (0-100)
    Tasarruf oranı ve tutarlılık
    """
    savings_rates = [
        d.get('savings_ratio', 0) for d in data 
        if d.get('total_income', 0) > 0
    ]
    
    if not savings_rates:
        return 0
    
    avg_rate = sum(savings_rates) / len(savings_rates)
    
    # Base score
    if avg_rate >= 0.30:
        base_score = 100
    elif avg_rate >= 0.20:
        base_score = 85
    elif avg_rate >= 0.15:
        base_score = 70
    elif avg_rate >= 0.10:
        base_score = 55
    elif avg_rate >= 0.05:
        base_score = 35
    else:
        base_score = avg_rate * 700
    
    # Consistency bonus
    if len(savings_rates) >= 3:
        variance = sum((r - avg_rate) ** 2 for r in savings_rates) / len(savings_rates)
        consistency_bonus = max(0, 15 - (variance * 150))
    else:
        consistency_bonus = 0
    
    # Streak bonus
    latest = data[-1]
    streak = latest.get('savings_streak', 0)
    streak_bonus = min(streak * 2, 10)
    
    return min(base_score + consistency_bonus + streak_bonus, 100)


def calculate_debt_management(data: list) -> float:
    """
    Borç Yönetimi (0-100)
    Debt-to-income ratio
    """
    latest = data[-1]
    
    expense_breakdown = latest.get('expense_breakdown', {})
    debt_payments = expense_breakdown.get('fixed', {}).get('kredi', 0)
    income = latest.get('total_income', 0)
    
    if income == 0:
        return 50
    
    debt_ratio = debt_payments / income
    
    if debt_ratio == 0:
        score = 100
    elif debt_ratio <= 0.10:
        score = 95
    elif debt_ratio <= 0.20:
        score = 80
    elif debt_ratio <= 0.30:
        score = 65
    elif debt_ratio <= 0.40:
        score = 45
    else:
        score = max(0, 45 - ((debt_ratio - 0.40) * 100))
    
    return score


def calculate_spending_discipline(data: list) -> float:
    """
    Harcama Disiplini (0-100)
    Bütçe adherence performansı
    """
    latest = data[-1]
    budget_adh = latest.get('budget_adherence', {})
    
    if not budget_adh:
        return 50
    
    tracked = [
        v for v in budget_adh.values() 
        if v.get('status') != 'no_limit'
    ]
    
    if not tracked:
        return 50
    
    avg_adherence = sum(c.get('adherence_pct', 0) for c in tracked) / len(tracked)
    
    if avg_adherence <= 60:
        score = 100
    elif avg_adherence <= 75:
        score = 90
    elif avg_adherence <= 85:
        score = 80
    elif avg_adherence <= 95:
        score = 70
    elif avg_adherence <= 105:
        score = 60
    elif avg_adherence <= 120:
        score = 45
    else:
        score = max(0, 45 - ((avg_adherence - 120) * 1.5))
    
    over_budget_count = sum(1 for c in tracked if c.get('status') == 'over')
    penalty = over_budget_count * 5
    
    return max(score - penalty, 0)