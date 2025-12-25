# analytics/migrations/create_table.py
from config.postgres import get_pg_connection

def create_monthly_snapshots_table():
    conn = get_pg_connection()
    cur = conn.cursor()
    
    sql = """
    CREATE TABLE IF NOT EXISTS monthly_snapshots (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(24) NOT NULL,
        snapshot_month DATE NOT NULL,
        month_name VARCHAR(20),
        year INTEGER,
        
        -- Finansal veriler
        total_income NUMERIC(12,2) DEFAULT 0,
        total_expense NUMERIC(12,2) DEFAULT 0,
        fixed_expenses NUMERIC(12,2) DEFAULT 0,
        variable_expenses NUMERIC(12,2) DEFAULT 0,
        savings NUMERIC(12,2) DEFAULT 0,
        cumulative_savings NUMERIC(12,2) DEFAULT 0,
        
        -- Oranlar
        savings_ratio DOUBLE PRECISION DEFAULT 0,
        expense_ratio DOUBLE PRECISION DEFAULT 0,
        
        -- Sağlık skoru
        financial_health_score INTEGER DEFAULT 0,
        
        -- Detaylı analiz (JSONB)
        budget_adherence JSONB,
        expense_breakdown JSONB,
        goals_snapshot JSONB,
        
        -- Achievement metrikleri
        total_achievements INTEGER DEFAULT 0,
        savings_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        goals_completed INTEGER DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(user_id, snapshot_month)
    );
    
    CREATE INDEX IF NOT EXISTS idx_snapshots_user ON monthly_snapshots(user_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_month ON monthly_snapshots(snapshot_month);
    """
    
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    print('monthly_snapshots tablosu oluşturuldu')

if __name__ == "__main__":
    create_monthly_snapshots_table()