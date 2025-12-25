# analytics/services/credit_scoring/calculator.py - TAM HALİ

from typing import List, Dict
import statistics

class CreditScoreCalculator:
    """
    FICO-style credit scoring calculator
    Total: 300-850 points
    """
    
    def __init__(self, data):
        self.data = data
        self.income = data.income or 0
        self.expenses = data.expenses or 0
        self.debts = data.debts or []
        self.credit_cards = data.creditCards or []
        self.investments = data.investments or []
        self.assets = data.assets or []
        self.monthly_history = data.monthlyHistory or []
        
    def calculate(self) -> Dict:
        """
        Ana hesaplama fonksiyonu
        """
        # 1. Ödeme Geçmişi (35% = 297.5 puan)
        payment_score = self._calculate_payment_history()
        
        # 2. Borç Yükü (30% = 255 puan)
        debt_score = self._calculate_debt_burden()
        
        # 3. Finansal Davranış (20% = 170 puan)
        behavior_score = self._calculate_behavior()
        
        # 4. Finansal İstikrar (10% = 85 puan)
        stability_score = self._calculate_stability()
        
        # 5. Varlık Yapısı (5% = 42.5 puan)
        asset_score = self._calculate_asset_structure()
        
        # Toplam skor (300-850)
        total_score = (
            payment_score +
            debt_score +
            behavior_score +
            stability_score +
            asset_score
        )
        
        # Sınırla 300-850 arası
        total_score = max(300, min(850, int(total_score)))
        
        # Risk kategorisi belirle
        risk_category, risk_level = self._determine_risk_category(total_score)
        
        # Detaylı metrikler
        metrics = self._calculate_metrics()
        
        return {
            'score': total_score,
            'risk_category': risk_category,
            'risk_level': risk_level,
            'breakdown': {
                'payment_history': round(payment_score, 2),
                'debt_burden': round(debt_score, 2),
                'behavior': round(behavior_score, 2),
                'stability': round(stability_score, 2),
                'asset': round(asset_score, 2)
            },
            'metrics': metrics
        }
    
    def _calculate_payment_history(self) -> float:
        """
        Ödeme Geçmişi: 35% (297.5 puan)
        - Zamanında ödeme oranı
        - Gecikme cezaları
        """
        total_payments = 0
        on_time_payments = 0
        late_days_total = 0
        
        # Borç ödemeleri
        for debt in self.debts:
            if debt.paymentHistory:
                for payment in debt.paymentHistory:
                    total_payments += 1
                    if payment.get('onTime', False):
                        on_time_payments += 1
                    else:
                        late_days_total += payment.get('daysLate', 0)
        
        # Kredi kartı ödemeleri
        for card in self.credit_cards:
            if card.paymentHistory:
                for payment in card.paymentHistory:
                    total_payments += 1
                    if payment.get('onTime', False):
                        on_time_payments += 1
                    else:
                        late_days_total += payment.get('daysLate', 0)
        
        if total_payments == 0:
            # Yeni kullanıcı - orta skor
            return 200.0
        
        # Zamanında ödeme oranı
        on_time_rate = (on_time_payments / total_payments) * 100
        
        # Base skor
        base_score = (on_time_rate / 100) * 297.5
        
        # Gecikme cezaları
        penalty = 0
        if late_days_total > 0:
            # 1-30 gün: -5 puan
            # 31-60 gün: -25 puan
            # 60+ gün: -50 puan
            if late_days_total <= 30:
                penalty = 5 * (late_days_total / 30)
            elif late_days_total <= 60:
                penalty = 25
            else:
                penalty = 50
        
        return max(0, base_score - penalty)
    
    def _calculate_debt_burden(self) -> float:
        """
        Borç Yükü: 30% (255 puan)
        - Credit utilization
        - Debt-to-income ratio
        - Total debt burden
        """
        # A) Credit Utilization (50% ağırlık)
        total_limit = sum(card.limit for card in self.credit_cards)
        total_debt = sum(card.currentDebt for card in self.credit_cards)
        
        if total_limit > 0:
            utilization = (total_debt / total_limit) * 100
            
            if utilization <= 10:
                util_score = 100
            elif utilization <= 30:
                util_score = 80
            elif utilization <= 50:
                util_score = 60
            elif utilization <= 75:
                util_score = 40
            else:
                util_score = 20
        else:
            util_score = 70  # Kart yok - nötr
        
        # B) Debt-to-Income (30% ağırlık)
        monthly_debt_payment = sum(debt.monthlyPayment for debt in self.debts)
        monthly_debt_payment += sum(card.currentDebt * 0.2 for card in self.credit_cards)  # Min payment estimate
        
        if self.income > 0:
            dti = (monthly_debt_payment / self.income) * 100
            
            if dti <= 20:
                dti_score = 100
            elif dti <= 35:
                dti_score = 80
            elif dti <= 50:
                dti_score = 50
            else:
                dti_score = 20
        else:
            dti_score = 50
        
        # C) Total Debt Burden (20% ağırlık)
        total_debt_amount = sum(debt.remainingAmount for debt in self.debts)
        total_debt_amount += total_debt
        
        annual_income = self.income * 12
        
        if annual_income > 0:
            debt_burden_ratio = total_debt_amount / annual_income
            
            if debt_burden_ratio <= 1:
                burden_score = 100
            elif debt_burden_ratio <= 2:
                burden_score = 70
            elif debt_burden_ratio <= 3:
                burden_score = 40
            else:
                burden_score = 20
        else:
            burden_score = 50
        
        # Weighted average
        weighted_score = (util_score * 0.5) + (dti_score * 0.3) + (burden_score * 0.2)
        
        # Scale to 255 points
        return (weighted_score / 100) * 255
    
    def _calculate_behavior(self) -> float:
        """
        Finansal Davranış: 20% (170 puan)
        - Savings rate
        - Budget adherence
        - Financial health trend
        """
        # A) Savings Rate (40% ağırlık)
        if self.income > 0:
            savings_rate = ((self.income - self.expenses) / self.income) * 100
            
            if savings_rate >= 20:
                savings_score = 100
            elif savings_rate >= 15:
                savings_score = 80
            elif savings_rate >= 10:
                savings_score = 60
            elif savings_rate >= 5:
                savings_score = 40
            elif savings_rate >= 0:
                savings_score = 20
            else:
                savings_score = 0
        else:
            savings_score = 50
        
        # B) Budget Adherence (30% ağırlık)
        # Basit varsayım: Eğer harcama gelirden azsa disiplinli
        if self.income > 0:
            adherence = min(100, (1 - (self.expenses / self.income)) * 100) if self.expenses < self.income else 0
            budget_score = adherence
        else:
            budget_score = 50
        
        # C) Financial Health Trend (30% ağırlık)
        if len(self.monthly_history) >= 3:
            # Son 3 ay trend'i
            recent_scores = []
            for h in self.monthly_history[-3:]:
                # monthlyHistory'deki her item bir dict gibi gelmiyor, attribute access kullan
                if hasattr(h, 'income') and hasattr(h, 'expenses'):
                    if h.income > 0:
                        savings_rate = ((h.income - h.expenses) / h.income) * 100
                        recent_scores.append(savings_rate)
            
            if len(recent_scores) >= 2:
                # Trend yükseliyor mu?
                trend = recent_scores[-1] - recent_scores[0]
                
                if trend > 5:
                    trend_score = 100  # Yükseliyor
                elif trend > 0:
                    trend_score = 80
                elif trend > -5:
                    trend_score = 60  # Stabil
                else:
                    trend_score = 40  # Düşüyor
            else:
                trend_score = 60
        else:
            trend_score = 60  # Yeterli veri yok
        
        # Weighted average
        weighted_score = (savings_score * 0.4) + (budget_score * 0.3) + (trend_score * 0.3)
        
        # Scale to 170 points
        return (weighted_score / 100) * 170
    
    def _calculate_stability(self) -> float:
        """
        Finansal İstikrar: 10% (85 puan)
        - Income consistency
        - Account age
        """
        # A) Income Consistency (60% ağırlık)
        if len(self.monthly_history) >= 3:
            incomes = []
            for h in self.monthly_history[-6:]:
                if hasattr(h, 'income'):
                    incomes.append(h.income)
            
            if len(incomes) > 1 and statistics.mean(incomes) > 0:
                std_dev = statistics.stdev(incomes)
                mean_income = statistics.mean(incomes)
                cv = (std_dev / mean_income) * 100  # Coefficient of variation
                
                if cv <= 10:
                    consistency_score = 100  # Çok stabil
                elif cv <= 25:
                    consistency_score = 70
                elif cv <= 50:
                    consistency_score = 40
                else:
                    consistency_score = 20
            else:
                consistency_score = 50
        else:
            consistency_score = 50
        
        # B) Account Age (40% ağırlık)
        account_age_months = len(self.monthly_history)
        
        if account_age_months >= 12:
            age_score = 100
        elif account_age_months >= 6:
            age_score = 70
        elif account_age_months >= 3:
            age_score = 50
        else:
            age_score = 30
        
        # Weighted average
        weighted_score = (consistency_score * 0.6) + (age_score * 0.4)
        
        # Scale to 85 points
        return (weighted_score / 100) * 85
    
    def _calculate_asset_structure(self) -> float:
        """
        Varlık Yapısı: 5% (42.5 puan)
        - Net worth positive
        - Investment portfolio
        - Asset diversification
        """
        score = 0
        
        # A) Net Worth
        total_assets = sum(asset.currentValue for asset in self.assets)
        total_investments = sum(inv.currentValue if inv.currentValue else inv.totalInvested for inv in self.investments)
        total_cash = self.data.cumulativeSavings or 0
        
        total_debts = sum(debt.remainingAmount for debt in self.debts)
        total_cc_debt = sum(card.currentDebt for card in self.credit_cards)
        total_asset_loans = sum(asset.loanAmount for asset in self.assets if asset.hasLoan)
    
        
        net_worth = (total_assets + total_investments + total_cash) - (total_debts + total_cc_debt + total_asset_loans)
        
        if net_worth > 0:
            score += 20
        
        # B) Has Investments
        if len(self.investments) > 0:
            score += 15
        
        # C) Asset Diversification
        asset_types = set()
        for inv in self.investments:
            asset_types.add(inv.type)
        for asset in self.assets:
            asset_types.add(asset.type)
        
        if len(asset_types) >= 3:
            score += 7.5
        elif len(asset_types) >= 2:
            score += 5
        
        return min(42.5, score)
    
    def _determine_risk_category(self, score: int) -> tuple:
        """
        Risk kategorisi belirle
        """
        if score >= 750:
            return ('A', 'Minimal Risk')
        elif score >= 700:
            return ('B', 'Low Risk')
        elif score >= 650:
            return ('C', 'Medium Risk')
        elif score >= 600:
            return ('D', 'High Risk')
        else:
            return ('E', 'Very High Risk')
    
    def _calculate_metrics(self) -> Dict:
        """
        Detaylı metrikler hesapla
        """
        # Credit Utilization
        total_limit = sum(card.limit for card in self.credit_cards)
        total_cc_debt = sum(card.currentDebt for card in self.credit_cards)
        credit_util = (total_cc_debt / total_limit * 100) if total_limit > 0 else 0
        
        # Debt-to-Income
        monthly_debt = sum(debt.monthlyPayment for debt in self.debts)
        dti = (monthly_debt / self.income * 100) if self.income > 0 else 0
        
        # On-time Payment Rate
        total_payments = 0
        on_time_payments = 0
        
        for debt in self.debts:
            if debt.paymentHistory:
                for payment in debt.paymentHistory:
                    total_payments += 1
                    if payment.get('onTime', False):
                        on_time_payments += 1
        
        for card in self.credit_cards:
            if card.paymentHistory:
                for payment in card.paymentHistory:
                    total_payments += 1
                    if payment.get('onTime', False):
                        on_time_payments += 1
        
        on_time_rate = (on_time_payments / total_payments * 100) if total_payments > 0 else 100
        
        # Total Debt
        total_debt = sum(debt.remainingAmount for debt in self.debts)
        total_debt += total_cc_debt
        
        # Net Worth
        total_assets = sum(asset.currentValue for asset in self.assets)
        total_investments = sum(inv.currentValue if inv.currentValue else inv.totalInvested for inv in self.investments)
        total_cash = self.data.cumulativeSavings or 0
        
        total_liabilities = total_debt + sum(asset.loanAmount for asset in self.assets if asset.hasLoan)
        
        net_worth = (total_assets + total_investments + total_cash) - total_liabilities
        
        return {
            'credit_utilization': round(credit_util, 2),
            'debt_to_income': round(dti, 2),
            'on_time_payment_rate': round(on_time_rate, 2),
            'total_debt': round(total_debt, 2),
            'net_worth': round(net_worth, 2)
        }