# check_snapshot.py
from config.postgres import get_pg_connection

conn = get_pg_connection()
cur = conn.cursor()

cur.execute("""
    SELECT user_id, snapshot_month, savings, financial_health_score, 
           budget_adherence, savings_streak
    FROM monthly_snapshots
    ORDER BY created_at DESC
    LIMIT 1
""")

result = cur.fetchone()
print("Son snapshot:")
print(f"User ID: {result[0]}")
print(f"Ay: {result[1]}")
print(f"Tasarruf: {result[2]} TL")
print(f"Sağlık Skoru: {result[3]}/100")
print(f"Budget Adherence: {result[4]}")
print(f"Savings Streak: {result[5]} ay")

cur.close()
conn.close()