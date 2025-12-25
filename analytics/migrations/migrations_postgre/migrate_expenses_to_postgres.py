# analytics/scripts/migrate_expenses_to_postgres.py (GÜNCELLE)

"""
MongoDB users.monthlyHistory'den
PostgreSQL expense_events'e migration
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from config.postgres import get_pg_connection
from config.mongo import get_mongo_db
from datetime import datetime

def migrate_expenses():
    """
    MongoDB users.monthlyHistory'deki TÜM verileri
    PostgreSQL expense_events'e taşı
    """
    
    print("🔄 MIGRATION BAŞLIYOR...")
    print("=" * 60)
    
    # Connections
    pg_conn = get_pg_connection()
    mongo_db = get_mongo_db()
    
    # MongoDB'dan TÜM kullanıcıları çek
    users = list(mongo_db.users.find(
        {"monthlyHistory": {"$exists": True, "$ne": []}},
        {"_id": 1, "email": 1, "monthlyHistory": 1}
    ))
    
    if not users:
        print("❌ MongoDB'da monthlyHistory verisi bulunamadı!")
        return
    
    print(f"👥 {len(users)} kullanıcı bulundu")
    
    total_expenses = 0
    total_months = 0
    
    cur = pg_conn.cursor()
    
    for user in users:
        user_id = str(user['_id'])
        email = user.get('email', 'unknown')
        monthly_history = user.get('monthlyHistory', [])
        
        if not monthly_history:
            continue
        
        print(f"\n👤 {email}")
        print(f"   📊 {len(monthly_history)} aylık veri bulundu")
        
        for month_data in monthly_history:
            month = month_data.get('month')  # "2025-11"
            year = month_data.get('year')
            
            if not month or not year:
                print(f"   ⚠️ Geçersiz ay verisi")
                continue
            
            # Tarih oluştur (ayın 1. günü)
            try:
                expense_date = datetime.strptime(f"{month}-01", "%Y-%m-%d").date()
            except:
                print(f"   ⚠️ Tarih parse edilemedi: {month}")
                continue
            
            month_year = month  # "2025-11" format
            total_months += 1
            
            print(f"   📅 {month_year}")
            
            # Fixed Expenses
            fixed_expenses = month_data.get('fixedExpenses', [])
            for expense in fixed_expenses:
                name = expense.get('name', 'Unnamed')
                amount = expense.get('amount')
                category = expense.get('category', 'diger')
                
                if not amount or amount <= 0:
                    continue
                
                try:
                    cur.execute("""
                        INSERT INTO expense_events (
                            user_id, expense_date, month_year,
                            name, amount, category, expense_type,
                            is_recurring
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        user_id, expense_date, month_year,
                        name, float(amount), category, 'fixed',
                        True  # monthlyHistory'deki fixed'ler recurring kabul ediyoruz
                    ))
                    
                    total_expenses += 1
                    print(f"      ✅ Fixed: {name} - ₺{amount:,.0f} ({category})")
                    
                except Exception as e:
                    print(f"      ❌ Error: {e}")
            
            # Variable Expenses
            variable_expenses = month_data.get('variableExpenses', [])
            for expense in variable_expenses:
                name = expense.get('name', 'Unnamed')
                amount = expense.get('amount')
                category = expense.get('category', 'diger')
                
                if not amount or amount <= 0:
                    continue
                
                try:
                    cur.execute("""
                        INSERT INTO expense_events (
                            user_id, expense_date, month_year,
                            name, amount, category, expense_type,
                            is_recurring
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        user_id, expense_date, month_year,
                        name, float(amount), category, 'variable',
                        False
                    ))
                    
                    total_expenses += 1
                    print(f"      ✅ Variable: {name} - ₺{amount:,.0f} ({category})")
                    
                except Exception as e:
                    print(f"      ❌ Error: {e}")
    
    # Commit
    pg_conn.commit()
    cur.close()
    pg_conn.close()
    
    print("\n" + "=" * 60)
    print("✅ MIGRATION TAMAMLANDI!")
    print(f"👥 {len(users)} kullanıcı")
    print(f"📅 {total_months} ay")
    print(f"💰 {total_expenses} harcama kaydı")
    print("=" * 60)

if __name__ == "__main__":
    try:
        migrate_expenses()
    except Exception as e:
        print(f"❌ Migration error: {e}")
        import traceback
        traceback.print_exc()