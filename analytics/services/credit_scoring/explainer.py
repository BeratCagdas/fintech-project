# analytics/services/credit_scoring/explainer.py

import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class CreditScoreExplainer:
    """Credit Score açıklama ve öneri motoru"""
    
    def __init__(self, pg_connection):
        self.conn = pg_connection
    
    def explain_score(self, user_id: str) -> Dict:
        """Kullanıcının credit score'unu açıkla"""
        
        cur = self.conn.cursor()
        
        query = """
            SELECT 
                snapshot_month,
                credit_score,
                risk_category,
                risk_level,
                payment_history_score,
                debt_burden_score,
                behavior_score,
                stability_score,
                asset_score,
                credit_utilization,
                debt_to_income,
                on_time_payment_rate,
                total_debt,
                net_worth,
                debts_snapshot,
                credit_cards_snapshot
            FROM monthly_snapshots
            WHERE user_id = %s
            ORDER BY snapshot_month DESC
            LIMIT 3
        """
        
        cur.execute(query, (user_id,))
        rows = cur.fetchall()
        cur.close()
        
        if not rows:
            return {
                "success": False,
                "message": "Henüz veri yok"
            }
        
        current = self._parse_snapshot(rows[0])
        previous = self._parse_snapshot(rows[1]) if len(rows) > 1 else None
        
        # Analizler
        score_change = self._analyze_score_change(current, previous)
        breakdown_analysis = self._analyze_breakdown(current, previous)
        card_impact = self._analyze_card_impact(current, previous)
        debt_impact = self._analyze_debt_impact(current, previous)
        recommendations = self._generate_recommendations(current, previous)
        
        return {
            "success": True,
            "current": current,
            "previous": previous,
            "score_change": score_change,
            "breakdown_analysis": breakdown_analysis,
            "card_impact": card_impact,
            "debt_impact": debt_impact,
            "recommendations": recommendations
        }
    
    def _parse_snapshot(self, row) -> Dict:
        """Snapshot'ı dict'e çevir"""
        
        # 🔴 JSONB kolonları zaten list/dict olarak geliyor
        # json.loads() YAPMA!
        
        debts = row[14] if row[14] else []  # Zaten list
        cards = row[15] if row[15] else []  # Zaten list
        
        return {
            "month": str(row[0]),
            "credit_score": row[1],
            "risk_category": row[2],
            "risk_level": row[3],
            "breakdown": {
                "payment_history": float(row[4]) if row[4] else 0,
                "debt_burden": float(row[5]) if row[5] else 0,
                "behavior": float(row[6]) if row[6] else 0,
                "stability": float(row[7]) if row[7] else 0,
                "asset": float(row[8]) if row[8] else 0
            },
            "metrics": {
                "credit_utilization": float(row[9]) if row[9] else 0,
                "debt_to_income": float(row[10]) if row[10] else 0,
                "on_time_payment_rate": float(row[11]) if row[11] else 0
            },
            "total_debt": float(row[12]) if row[12] else 0,
            "net_worth": float(row[13]) if row[13] else 0,
            "debts": debts,      # 🔴 json.loads() YOK!
            "cards": cards       # 🔴 json.loads() YOK!
        }
    
    def _analyze_score_change(self, current: Dict, previous: Optional[Dict]) -> Dict:
        """Score değişimini analiz et"""
        if not previous:
            return {
                "change": 0,
                "percentage": 0,
                "direction": "neutral",
                "message": "İlk credit score hesaplamanız",
                "emoji": "🆕",
                "current_score": current["credit_score"],
                "previous_score": 0
            }
        
        change = current["credit_score"] - previous["credit_score"]
        percentage = (change / previous["credit_score"]) * 100 if previous["credit_score"] > 0 else 0
        
        if change > 0:
            direction = "up"
            emoji = "🎉"
            message = f"Tebrikler! Skorunuz {abs(change):.0f} puan arttı!"
        elif change < 0:
            direction = "down"
            emoji = "⚠️"
            message = f"Dikkat! Skorunuz {abs(change):.0f} puan düştü."
        else:
            direction = "neutral"
            emoji = "➡️"
            message = "Skorunuz değişmedi."
        
        # Risk kategorisi değişimi
        risk_change = None
        if previous["risk_category"] != current["risk_category"]:
            risk_change = {
                "from": previous["risk_category"],
                "to": current["risk_category"],
                "improved": ord(current["risk_category"]) < ord(previous["risk_category"])
            }
        
        return {
            "change": change,
            "percentage": round(percentage, 2),
            "direction": direction,
            "emoji": emoji,
            "message": message,
            "risk_change": risk_change,
            "current_score": current["credit_score"],
            "previous_score": previous["credit_score"]
        }
    
    def _analyze_breakdown(self, current: Dict, previous: Optional[Dict]) -> List[Dict]:
        """Breakdown faktörlerini analiz et"""
        factors = [
            {
                "name": "Ödeme Geçmişi",
                "key": "payment_history",
                "max": 297.5,
                "weight": "35%",
                "icon": "💳"
            },
            {
                "name": "Borç Yükü",
                "key": "debt_burden",
                "max": 255,
                "weight": "30%",
                "icon": "💰"
            },
            {
                "name": "Finansal Davranış",
                "key": "behavior",
                "max": 170,
                "weight": "20%",
                "icon": "📊"
            },
            {
                "name": "İstikrar",
                "key": "stability",
                "max": 85,
                "weight": "10%",
                "icon": "⚖️"
            },
            {
                "name": "Varlık Yapısı",
                "key": "asset",
                "max": 42.5,
                "weight": "5%",
                "icon": "🏠"
            }
        ]
        
        analysis = []
        
        for factor in factors:
            current_score = current["breakdown"][factor["key"]]
            previous_score = previous["breakdown"][factor["key"]] if previous else 0
            change = current_score - previous_score
            percentage = (current_score / factor["max"]) * 100
            
            # Durum değerlendirmesi
            if percentage >= 80:
                status = "excellent"
                status_text = "Mükemmel"
                status_color = "#10b981"
            elif percentage >= 60:
                status = "good"
                status_text = "İyi"
                status_color = "#3b82f6"
            elif percentage >= 40:
                status = "fair"
                status_text = "Orta"
                status_color = "#f59e0b"
            else:
                status = "poor"
                status_text = "Geliştirilmeli"
                status_color = "#ef4444"
            
            # Açıklama
            explanation = self._get_factor_explanation(
                factor["key"],
                current,
                previous,
                percentage
            )
            
            analysis.append({
                "name": factor["name"],
                "icon": factor["icon"],
                "weight": factor["weight"],
                "current_score": round(current_score, 1),
                "max_score": factor["max"],
                "percentage": round(percentage, 1),
                "change": round(change, 1),
                "status": status,
                "status_text": status_text,
                "status_color": status_color,
                "explanation": explanation
            })
        
        # En çok değişen faktörü highlight et
        if previous:
            analysis.sort(key=lambda x: abs(x["change"]), reverse=True)
        
        return analysis
    
    def _get_factor_explanation(self, factor_key: str, current: Dict, previous: Optional[Dict], percentage: float) -> str:
        """Faktör için açıklama üret"""
        
        if factor_key == "payment_history":
            on_time_rate = current["metrics"]["on_time_payment_rate"]
            if on_time_rate >= 90:
                return "Harika! Ödemelerinizin çoğunu zamanında yapıyorsunuz."
            elif on_time_rate >= 70:
                return "İyi gidiyorsunuz, ama birkaç gecikme var. Otomatik ödeme kurun."
            else:
                return "⚠️ Kritik: Geç ödemeler skorunuzu çok düşürüyor. Acil önlem alın!"
        
        elif factor_key == "debt_burden":
            utilization = current["metrics"]["credit_utilization"]
            dti = current["metrics"]["debt_to_income"]
            
            if utilization > 75:
                return f"⚠️ Kredi kartı kullanımı çok yüksek (%{utilization:.0f}). %30'un altına çekin."
            elif utilization > 50:
                return f"Kredi kartı kullanımı biraz yüksek (%{utilization:.0f}). %30'a indirin."
            elif dti > 50:
                return f"Borç/Gelir oranı yüksek (%{dti:.0f}). Borç azaltmaya odaklanın."
            else:
                return "Borç yükünüz dengeli görünüyor."
        
        elif factor_key == "behavior":
            if percentage >= 80:
                return "Harika tasarruf alışkanlıklarınız var!"
            elif percentage >= 60:
                return "İyi gidiyorsunuz, tasarruf oranınızı artırın."
            else:
                return "Tasarruf alışkanlıklarınızı geliştirmeniz gerekiyor."
        
        elif factor_key == "stability":
            if percentage >= 70:
                return "Finansal istikrarınız güçlü."
            else:
                return "Gelir istikrarınızı artırmaya çalışın."
        
        elif factor_key == "asset":
            net_worth = current["net_worth"]
            if net_worth > 0:
                return f"Net varlığınız pozitif (₺{net_worth:,.0f}). Devam edin!"
            else:
                return "Net varlığınızı pozitife çıkarmaya çalışın."
        
        return "Veri yetersiz."
    
    def _analyze_card_impact(self, current: Dict, previous: Optional[Dict]) -> List[Dict]:
        """Kredi kartlarının etkisini analiz et"""
        cards = current["cards"]
        
        if not cards:
            return []
        
        impacts = []
        
        for card in cards:
            utilization = card.get("utilizationRate", 0)
            limit = card.get("limit", 0)
            current_debt = card.get("currentDebt", 0)
            
            # Impact hesapla
            if utilization > 75:
                impact_score = -30
                impact_text = "Çok yüksek kullanım! Skorunuzu çok düşürüyor."
                recommendation = f"En az ₺{(current_debt - (limit * 0.3)):,.0f} ödeme yapın."
            elif utilization > 50:
                impact_score = -15
                impact_text = "Yüksek kullanım. Skorunuzu düşürüyor."
                recommendation = f"₺{(current_debt - (limit * 0.3)):,.0f} ödeme yapın."
            elif utilization > 30:
                impact_score = -5
                impact_text = "Orta kullanım. İdeal değil."
                recommendation = "Kullanımı %30'un altına çekin."
            else:
                impact_score = 5
                impact_text = "Harika! İdeal kullanım oranı."
                recommendation = "Böyle devam edin!"
            
            impacts.append({
                "bank_name": card.get("bankName", "Bilinmeyen"),
                "limit": limit,
                "current_debt": current_debt,
                "utilization": round(utilization, 1),
                "impact_score": impact_score,
                "impact_text": impact_text,
                "recommendation": recommendation
            })
        
        # Impact'e göre sırala
        impacts.sort(key=lambda x: x["impact_score"])
        
        return impacts
    
    def _analyze_debt_impact(self, current: Dict, previous: Optional[Dict]) -> List[Dict]:
        """Borçların etkisini analiz et"""
        debts = current["debts"]
        
        if not debts:
            return []
        
        impacts = []
        
        for debt in debts:
            remaining = debt.get("remainingAmount", 0)
            monthly_payment = debt.get("monthlyPayment", 0)
            payment_history = debt.get("paymentHistory", [])
            
            # On-time payment kontrolü
            late_payments = sum(1 for p in payment_history if not p.get("onTime", True))
            
            if late_payments > 0:
                impact_score = -50 * late_payments
                impact_text = f"⚠️ {late_payments} geç ödeme var!"
                recommendation = "Otomatik ödeme talimatı verin."
            else:
                impact_score = 10
                impact_text = "✅ Ödemeler zamanında"
                recommendation = "Harika! Devam edin."
            
            impacts.append({
                "name": debt.get("name", "Bilinmeyen"),
                "type": debt.get("type", ""),
                "remaining": remaining,
                "monthly_payment": monthly_payment,
                "late_payments": late_payments,
                "impact_score": impact_score,
                "impact_text": impact_text,
                "recommendation": recommendation
            })
        
        # Impact'e göre sırala
        impacts.sort(key=lambda x: x["impact_score"])
        
        return impacts
    
    def _generate_recommendations(self, current: Dict, previous: Optional[Dict]) -> List[Dict]:
        """Personalized öneriler üret"""
        recommendations = []
        
        # 1. Ödeme Geçmişi
        on_time_rate = current["metrics"]["on_time_payment_rate"]
        if on_time_rate < 100:
            recommendations.append({
                "priority": 1,
                "title": "Tüm Ödemeleri Zamanında Yapın",
                "description": "Ödeme geçmişi credit score'unuzun %35'ini oluşturur.",
                "impact": "+50 puan",
                "difficulty": "Kolay",
                "action": "Otomatik ödeme talimatı kurun",
                "icon": "💳",
                "category": "payment_history"
            })
        
        # 2. Kredi Kartı Kullanımı
        utilization = current["metrics"]["credit_utilization"]
        if utilization > 30:
            potential_gain = int((utilization - 30) * 0.8)
            recommendations.append({
                "priority": 2,
                "title": "Kredi Kartı Kullanımını Azaltın",
                "description": f"Şu an %{utilization:.0f} kullanıyorsunuz. %30'un altına çekin.",
                "impact": f"+{potential_gain} puan",
                "difficulty": "Orta",
                "action": f"En az ₺{current['total_debt'] * 0.4:,.0f} ödeme yapın",
                "icon": "💰",
                "category": "debt_burden"
            })
        
        # 3. Borç/Gelir Oranı
        dti = current["metrics"]["debt_to_income"]
        if dti > 35:
            recommendations.append({
                "priority": 3,
                "title": "Borç Yükünü Azaltın",
                "description": f"Borç/Gelir oranınız %{dti:.0f}. %35'in altına çekin.",
                "impact": "+25 puan",
                "difficulty": "Zor",
                "action": "Geliri artırın veya borçları azaltın",
                "icon": "📊",
                "category": "debt_burden"
            })
        
        # 4. Net Varlık
        if current["net_worth"] <= 0:
            recommendations.append({
                "priority": 4,
                "title": "Net Varlığınızı Pozitife Çıkarın",
                "description": "Varlıklarınız borçlarınızdan az. Bu risk olarak görülüyor.",
                "impact": "+15 puan",
                "difficulty": "Zor",
                "action": "Tasarruf artırın, borç azaltın",
                "icon": "🏠",
                "category": "asset"
            })
        
        # 5. Yatırım Çeşitliliği
        if len(current.get("cards", [])) < 2:
            recommendations.append({
                "priority": 5,
                "title": "Credit Mix'i Geliştirin",
                "description": "Farklı türde krediler olması skorunuzu artırır.",
                "impact": "+10 puan",
                "difficulty": "Orta",
                "action": "Dikkatli olun, gereksiz borçlanmayın",
                "icon": "🎯",
                "category": "behavior"
            })
        
        return recommendations