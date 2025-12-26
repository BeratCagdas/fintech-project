# analytics/services/anomaly/detector.py (GÜNCELLE)

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pymongo import MongoClient
from bson import ObjectId
import os

class AnomalyDetector:
    """
    PostgreSQL expense_events + MongoDB current finance data ile
    anomali tespiti yapar
    """

    def __init__(self, user_id: str, pg_connection):
        self.user_id = user_id
        self.pg_conn = pg_connection
        self.alerts = []
        self.mongo_db = self._get_mongo_connection()

    def _get_mongo_connection(self):
        """MongoDB bağlantısı al"""
        try:
            mongo_uri = os.getenv("MONGO_URI")
            if not mongo_uri:
                print("⚠️ MONGO_URI bulunamadı, sadece PostgreSQL kullanılacak")
                return None
            client = MongoClient(mongo_uri)
            return client['test']
        except Exception as e:
            print(f"⚠️ MongoDB bağlantı hatası: {e}")
            return None

    def _get_current_finance_data(self):
        """MongoDB'den mevcut finansal verileri çek"""
        if not self.mongo_db:
            return None

        try:
            user = self.mongo_db.users.find_one({"_id": ObjectId(self.user_id)})
            if not user:
                return None

            finance = user.get('finance', {})

            # Kategori bazlı harcamaları hesapla
            category_totals = {}

            # Fixed expenses
            for exp in finance.get('fixedExpenses', []):
                if exp.get('isActive', True):
                    category = exp.get('category', 'diger')
                    amount = exp.get('amount', 0)
                    category_totals[category] = category_totals.get(category, 0) + amount

            # Variable expenses
            for exp in finance.get('variableExpenses', []):
                category = exp.get('category', 'diger')
                amount = exp.get('amount', 0)
                category_totals[category] = category_totals.get(category, 0) + amount

            total_expenses = sum(category_totals.values())

            print(f"📊 MongoDB Current Finance: Total=₺{total_expenses:,.0f}, Categories={len(category_totals)}")
            print(f"   Kategori detayları: {category_totals}")

            return {
                'total_expenses': total_expenses,
                'category_totals': category_totals
            }
        except Exception as e:
            print(f"⚠️ MongoDB veri okuma hatası: {e}")
            return None

    def detect_all(self) -> List[Dict]:
        """Tüm anomali türlerini kontrol et"""
        print(f"🔍 Anomaly detection başlıyor: {self.user_id}")
        
        # 1. Kategori bazlı anomaliler (PostgreSQL)
        self._detect_category_anomalies()
        
        # 2. Toplam harcama anomalisi (PostgreSQL)
        self._detect_total_spending_anomaly()
        
        # 3. Recurring expense değişimleri (PostgreSQL)
        self._detect_recurring_changes()
        
        print(f"✅ {len(self.alerts)} anomali tespit edildi")
        
        return self.alerts
    
    def _detect_category_anomalies(self):
        """
        PostgreSQL expense_events + MongoDB current finance ile kategori bazlı anomaliler
        """
        try:
            # MongoDB'den mevcut ay verilerini al
            current_finance = self._get_current_finance_data()

            cur = self.pg_conn.cursor()

            # Son 6 ayın kategori bazlı toplamlarını al
            query = """
                SELECT
                    month_year,
                    category,
                    SUM(amount) as total_amount
                FROM expense_events
                WHERE user_id = %s
                AND month_year IN (
                    SELECT DISTINCT month_year
                    FROM expense_events
                    WHERE user_id = %s
                    ORDER BY month_year DESC
                    LIMIT 6
                )
                GROUP BY month_year, category
                ORDER BY month_year DESC, category
            """

            cur.execute(query, (self.user_id, self.user_id))
            rows = cur.fetchall()
            cur.close()

            # MongoDB current finance verisi yoksa ve PostgreSQL'de de yeterli veri yoksa skip
            if len(rows) < 3 and not current_finance:
                print("⚠️ En az 3 ay veri gerekli")
                return
            
            # Kategorilere göre grupla
            category_data = {}
            month_order = []
            for row in rows:
                month_year = row[0]
                category = row[1]
                amount = float(row[2])

                if month_year not in month_order:
                    month_order.append(month_year)

                if category not in category_data:
                    category_data[category] = {}
                category_data[category][month_year] = amount

            # MongoDB current finance verisini ekle (en yeni ay olarak)
            if current_finance and current_finance['category_totals']:
                current_month = datetime.now().strftime('%Y-%m')

                # Eğer current_month zaten PostgreSQL'de varsa, MongoDB verisini blend et
                for category, amount in current_finance['category_totals'].items():
                    if category not in category_data:
                        category_data[category] = {}

                    # MongoDB değeri ile PostgreSQL değerini blend et
                    if current_month in month_order:
                        # Zaten var, ortalama al
                        existing = category_data[category].get(current_month, 0)
                        category_data[category][current_month] = (existing + amount) / 2
                        print(f"   🔄 Blend: {category} - PG:{existing:,.0f} + Mongo:{amount:,.0f} = {category_data[category][current_month]:,.0f}")
                    else:
                        # Yeni ay, MongoDB verisini kullan
                        category_data[category][current_month] = amount
                        if current_month not in month_order:
                            month_order.insert(0, current_month)  # En başa ekle (en yeni)
                        print(f"   ✅ MongoDB: {category} = ₺{amount:,.0f}")

            print(f"\n📊 Toplam {len(category_data)} kategori bulundu")
            print(f"📅 Ayların sırası: {month_order}")

            # Her kategori için anomali kontrolü
            for category, month_amounts in category_data.items():
                             
                print(f"\n   🔍 {category.upper()}:")
                print(f"      Toplam {len(month_amounts)} ay verisi var")

                amounts = []
                for month in month_order:  # EN YENİ → EN ESKİ sırasıyla
                    if month in month_amounts:
                        amounts.append(month_amounts[month])
                        print(f"      {month}: ₺{month_amounts[month]:,.0f}")
                    else: 
                        print(f"      {month}: YOK")

                print(f"      → amounts array: {amounts}")

                if len(amounts) < 3:  # ✅ Şimdi list, len() çalışır
                    print(f"      ⚠️ Sadece {len(amounts)} ay - SKIP")
                    continue
                
                # En son ay vs geçmiş aylar
                current = amounts[0]
                historical = amounts[1:]
                
                mean = np.mean(historical)
                std = np.std(historical)

                print(f"      📈 current={current:,.0f}, mean={mean:,.0f}, std={std:,.1f}")
                
                if std == 0:
                    if abs(current - mean) > 0.01:
                        # Std 0 ise ama değişim varsa, bu sonsuz bir anomalidir.
                        # Yapay bir z-score atıyoruz.
                        z_score = 10.0 if current > mean else -10.0
                        print(f"      → Std=0 ama değişim var! Yapay Z-score: {z_score}")
                    else:
                        print(f"      → Std=0 ve değişim yok, SKIP")
                        continue
                else:
                    z_score = (current - mean) / std

                print(f"      → Z-score: {z_score:.2f}")
                
                # Anomali tespiti (|Z| > 2)
                if abs(z_score) > 2:
                    deviation = ((current - mean) / mean) * 100
                    severity = self._calculate_severity(abs(z_score))

                    print(f"      ✅ ANOMALI! severity={severity}")
                    
                    alert = {
                        "type": "category_spike" if z_score > 0 else "category_drop",
                        "severity": severity,
                        "category": category,
                        "current_value": round(current, 2),
                        "expected_value": round(mean, 2),
                        "deviation_percentage": round(deviation, 2),
                        "z_score": round(z_score, 2),
                        "title": f"{category.title()} Kategorisinde {'Artış' if z_score > 0 else 'Düşüş'}!",
                        "description": f"{category.title()} harcamanız normalde ₺{mean:,.0f} iken bu ay ₺{current:,.0f} - %{abs(deviation):.0f} {'artış' if z_score > 0 else 'düşüş'}!",
                        "recommendation": self._get_category_recommendation(category, z_score, current, mean)
                    }
                    
                    self.alerts.append(alert)
                    print(f"  ⚠️ {category}: ₺{current:,.0f} (Z={z_score:.2f})")
        
        except Exception as e:
            print(f"❌ Category anomaly error: {e}")
            import traceback
            traceback.print_exc()
    
    def _detect_recurring_changes(self):
        """
        Recurring expense'lerde değişiklik tespit et
        Her ay düzenli ödenen bir gider bu ay eksik mi?
        """
        try:
            cur = self.pg_conn.cursor()
            
            # Son 2 ayı çek
            query = """
                SELECT DISTINCT
                    month_year,
                    name,
                    amount
                FROM expense_events
                WHERE user_id = %s
                AND is_recurring = TRUE
                AND expense_type = 'fixed'
                AND month_year IN (
                    SELECT DISTINCT month_year
                    FROM expense_events
                    WHERE user_id = %s
                    ORDER BY month_year DESC
                    LIMIT 2
                )
                ORDER BY month_year DESC, name
            """
            
            cur.execute(query, (self.user_id, self.user_id))
            rows = cur.fetchall()
            cur.close()
            
            if len(rows) < 2:
                return
            
            # Ayları ayır
            months = {}
            for row in rows:
                month_year = row[0]
                name = row[1]
                amount = float(row[2])
                
                if month_year not in months:
                    months[month_year] = {}
                months[month_year][name] = amount
            
            month_list = sorted(months.keys(), reverse=True)
            if len(month_list) < 2:
                return
            
            current_month = months[month_list[0]]
            previous_month = months[month_list[1]]
            
            # Geçen ayda olan ama bu ay olmayan recurring'leri bul
            for name, amount in previous_month.items():
                if name not in current_month and amount > 0:
                    alert = {
                        "type": "pattern_change",
                        "severity": "medium",
                        "category": "recurring",
                        "current_value": 0,
                        "expected_value": amount,
                        "deviation_percentage": -100,
                        "title": f"Düzenli Ödeme Eksik: {name}",
                        "description": f"'{name}' ödemesi geçen ay ₺{amount:,.0f} idi, bu ay yapılmadı.",
                        "recommendation": "Ödemeyi unutmuş olabilir misiniz? Kontrol edin."
                    }
                    
                    self.alerts.append(alert)
                    print(f"  ⚠️ Eksik recurring: {name}")
        
        except Exception as e:
            print(f"❌ Recurring changes error: {e}")
    
    def _detect_total_spending_anomaly(self):
        """PostgreSQL + MongoDB'den toplam harcama anomalisi"""
        try:
            # MongoDB'den mevcut ay toplam harcamasını al
            current_finance = self._get_current_finance_data()

            cur = self.pg_conn.cursor()

            query = """
                SELECT total_expense
                FROM monthly_snapshots
                WHERE user_id = %s
                ORDER BY snapshot_month DESC
                LIMIT 6
            """

            cur.execute(query, (self.user_id,))
            rows = cur.fetchall()
            cur.close()

            expenses = [float(row[0]) for row in rows if row[0]]

            # MongoDB current finance verisini ekle
            if current_finance and current_finance['total_expenses'] > 0:
                # En başa ekle (en yeni ay)
                expenses.insert(0, current_finance['total_expenses'])
                print(f"📊 MongoDB Total Expense eklendi: ₺{current_finance['total_expenses']:,.0f}")

            if len(expenses) < 3:
                return
            
            current = expenses[0]
            historical = expenses[1:]
            
            mean = np.mean(historical)
            std = np.std(historical)
            
            if std == 0:
                return
            
            z_score = (current - mean) / std
            
            if abs(z_score) > 2:
                deviation = ((current - mean) / mean) * 100
                severity = self._calculate_severity(abs(z_score))
                
                alert = {
                    "type": "total_spike" if z_score > 0 else "total_drop",
                    "severity": severity,
                    "category": None,
                    "current_value": round(current, 2),
                    "expected_value": round(mean, 2),
                    "deviation_percentage": round(deviation, 2),
                    "z_score": round(z_score, 2),
                    "title": f"Toplam Harcamada {'Artış' if z_score > 0 else 'Düşüş'}!",
                    "description": f"Aylık harcamanız normalde ₺{mean:,.0f} iken bu ay ₺{current:,.0f} - %{abs(deviation):.0f} {'artış' if z_score > 0 else 'düşüş'}!",
                    "recommendation": "Bütçenizi gözden geçirin ve gereksiz harcamaları belirleyin." if z_score > 0 else "Harika! Harcamalarınızı azalttınız."
                }
                
                self.alerts.append(alert)
                print(f"  ⚠️ Toplam: ₺{current:,.0f} (Z={z_score:.2f})")
        
        except Exception as e:
            print(f"❌ Total spending error: {e}")
    
    def _calculate_severity(self, z_score: float) -> str:
        """Z-score → severity"""
        if z_score > 4:
            return "critical"
        elif z_score > 3:
            return "high"
        elif z_score > 2:
            return "medium"
        else:
            return "low"
    
    def _get_category_recommendation(self, category: str, z_score: float, current: float, mean: float) -> str:
        """Kategoriye özel öneri"""
        if z_score > 0:
            diff = current - mean
            
            recommendations = {
                "kira": f"Kira harcamanız ₺{diff:,.0f} arttı. Yeni bir eve mi taşındınız?",
                "faturalar": f"Fatura harcamanız ₺{diff:,.0f} arttı. Enerji tasarrufu yapmayı deneyin.",
                "market": f"Market harcamanız ₺{diff:,.0f} arttı. Alışveriş listesi yapın ve plansız alımlardan kaçının.",
                "yemek": f"Dışarıda yeme harcamanız ₺{diff:,.0f} arttı. Ev yemeği hazırlamayı düşünün.",
                "eglence": f"Eğlence harcamanız ₺{diff:,.0f} arttı. Aylık eğlence bütçesi belirleyin.",
                "giyim": f"Giyim harcamanız ₺{diff:,.0f} arttı. İhtiyaç mı yoksa istek mi ayırt edin.",
                "ulasim": f"Ulaşım harcamanız ₺{diff:,.0f} arttı. Toplu taşıma kullanmayı düşünün.",
                "saglik": f"Sağlık harcamanız ₺{diff:,.0f} arttı. Düzenli kontroller önemli.",
                "egitim": f"Eğitim harcamanız ₺{diff:,.0f} arttı. Yatırımdır, devam edin.",
                "abonelik": f"Abonelik harcamanız ₺{diff:,.0f} arttı. Kullanmadığınız abonelikleri iptal edin.",
                "kredi": f"Kredi ödemeleriniz ₺{diff:,.0f} arttı. Borç yükünüzü kontrol edin.",
                "sigorta": f"Sigorta harcamanız ₺{diff:,.0f} arttı. Poliçelerinizi gözden geçirin.",
                "diger": f"Diğer harcamalarınız ₺{diff:,.0f} arttı. Bütçenizi gözden geçirin."
            }
            
            return recommendations.get(category, f"{category.title()} harcamanız ₺{diff:,.0f} arttı.")
        else:
            return f"Harika! {category.title()} harcamanızı azalttınız!"
    
    def save_alerts_to_db(self):
        """Alerts'i PostgreSQL'e kaydet"""
        if not self.alerts:
            print("💬 Kaydedilecek anomali yok")
            return
        
        try:
            cur = self.pg_conn.cursor()
            
            for alert in self.alerts:

                current_value = float(alert['current_value']) if alert.get('current_value') is not None else None
                expected_value = float(alert['expected_value']) if alert.get('expected_value') is not None else None
                deviation_percentage = float(alert['deviation_percentage']) if alert.get('deviation_percentage') is not None else None

                # ✅ FIX: Numeric Overflow Önleme (NUMERIC(5,2) limiti: 999.99)
                # %2000 gibi devasa artışlar veritabanı sınırını aşıyor, bu yüzden sabitliyoruz.
                if deviation_percentage is not None:
                    if deviation_percentage > 999.99:
                        deviation_percentage = 999.99
                    elif deviation_percentage < -999.99:
                        deviation_percentage = -999.99

                # ✅ DUPLICATE CHECK: Aynı ay içinde aynı anomali zaten varsa tekrar kaydetme
                category = alert.get('category')
                check_query = """
                    SELECT 1 FROM anomaly_alerts 
                    WHERE user_id = %s 
                    AND alert_type = %s 
                    AND (category = %s OR (category IS NULL AND %s IS NULL))
                    AND detection_date >= DATE_TRUNC('month', CURRENT_DATE)
                """
                cur.execute(check_query, (self.user_id, alert['type'], category, category))
                if cur.fetchone():
                    print(f"      → Duplicate alert skipped: {alert['type']} - {category}")
                    continue

                cur.execute("""
                    INSERT INTO anomaly_alerts (
                        user_id, alert_type, severity, category,
                        current_value, expected_value, deviation_percentage,
                        title, description, recommendation,
                        detection_date
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE
                    )
                """, (
                    self.user_id,
                    alert['type'],
                    alert['severity'],
                    alert.get('category'),
                    current_value,
                    expected_value,
                    deviation_percentage,                   
                    alert['title'],
                    alert['description'],
                    alert.get('recommendation')
                ))
            
            self.pg_conn.commit()
            cur.close()
            
            print(f"✅ {len(self.alerts)} alert PostgreSQL'e kaydedildi")
            
        except Exception as e:
            print(f"❌ Alert save error: {e}")
            self.pg_conn.rollback()