-- ===================================================
-- FINTECH ANALYTICS - PostgreSQL Table Setup
-- ===================================================
-- pgAdmin'de çalıştırmak için bu dosyayı kullanın
-- ===================================================

-- 1. MONTHLY SNAPSHOTS TABLE
-- Aylık finansal özet verileri
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

    -- Credit Score ve Risk
    credit_score INTEGER DEFAULT 0,
    risk_category VARCHAR(20),
    risk_level VARCHAR(20),

    -- Credit Score Breakdown
    payment_history_score INTEGER DEFAULT 0,
    debt_burden_score INTEGER DEFAULT 0,
    behavior_score INTEGER DEFAULT 0,
    stability_score INTEGER DEFAULT 0,
    asset_score INTEGER DEFAULT 0,

    -- Credit Metrics
    credit_utilization DOUBLE PRECISION DEFAULT 0,
    debt_to_income DOUBLE PRECISION DEFAULT 0,
    on_time_payment_rate DOUBLE PRECISION DEFAULT 0,
    total_debt NUMERIC(12,2) DEFAULT 0,
    net_worth NUMERIC(12,2) DEFAULT 0,

    -- Detaylı analiz (JSONB)
    budget_adherence JSONB,
    expense_breakdown JSONB,
    goals_snapshot JSONB,

    -- Snapshot'lar (JSONB)
    debts_snapshot JSONB,
    credit_cards_snapshot JSONB,
    investments_snapshot JSONB,
    assets_snapshot JSONB,

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


-- 2. ANOMALY ALERTS TABLE
-- Tespit edilen finansal anomaliler
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50),

    -- Sayısal değerler
    current_value NUMERIC(12,2),
    expected_value NUMERIC(12,2),
    deviation_percentage NUMERIC(5,2),

    -- Alert içeriği
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT,

    -- Zaman damgaları ve durum
    detection_date DATE NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_anomaly_user ON anomaly_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_date ON anomaly_alerts(detection_date DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_acknowledged ON anomaly_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_anomaly_user_date ON anomaly_alerts(user_id, detection_date DESC);


-- 3. EXPENSE EVENTS TABLE
-- Aylık gider olayları (anomaly detection için)
CREATE TABLE IF NOT EXISTS expense_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    expense_date DATE,

    -- Gider detayları
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    expense_type VARCHAR(20),
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(20),
    day_of_month INTEGER,

    -- Aylık toplamlar (bulk insert için)
    total_income NUMERIC(12,2) DEFAULT 0,
    total_expense NUMERIC(12,2) DEFAULT 0,
    savings NUMERIC(12,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_user ON expense_events(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_month ON expense_events(month_year);
CREATE INDEX IF NOT EXISTS idx_expense_user_month ON expense_events(user_id, month_year DESC);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expense_events(category);
CREATE INDEX IF NOT EXISTS idx_expense_recurring ON expense_events(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_expense_date ON expense_events(expense_date);


-- ===================================================
-- DOĞRULAMA SORGUSU - Tabloları kontrol et
-- ===================================================
SELECT
    'monthly_snapshots' as table_name,
    COUNT(*) as row_count
FROM monthly_snapshots
UNION ALL
SELECT 'anomaly_alerts', COUNT(*) FROM anomaly_alerts
UNION ALL
SELECT 'expense_events', COUNT(*) FROM expense_events;
