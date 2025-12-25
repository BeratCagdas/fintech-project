-- ===================================================
-- FINTECH ANALYTICS - PostgreSQL Table Setup
-- ===================================================
-- Run this script on your Render PostgreSQL database
-- to create all required tables for the application
-- ===================================================

-- 1. MONTHLY SNAPSHOTS TABLE
-- Stores monthly financial summaries for each user
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

COMMENT ON TABLE monthly_snapshots IS 'Monthly financial snapshots - used for analytics and historical tracking';


-- 2. ANOMALY ALERTS TABLE
-- Stores detected financial anomalies for users
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,  -- 'category_spike', 'total_spike', 'pattern_change' etc.
    severity VARCHAR(20) NOT NULL,    -- 'low', 'medium', 'high', 'critical'
    category VARCHAR(50),              -- expense category if applicable

    -- Numeric values
    current_value NUMERIC(12,2),
    expected_value NUMERIC(12,2),
    deviation_percentage NUMERIC(5,2),  -- Max 999.99%

    -- Alert content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT,

    -- Timestamps and status
    detection_date DATE NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index for faster queries
    CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_anomaly_user ON anomaly_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_date ON anomaly_alerts(detection_date DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_acknowledged ON anomaly_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_anomaly_user_date ON anomaly_alerts(user_id, detection_date DESC);

COMMENT ON TABLE anomaly_alerts IS 'Financial anomaly detection alerts for users';


-- 3. EXPENSE EVENTS TABLE
-- Stores monthly expense events for anomaly detection
CREATE TABLE IF NOT EXISTS expense_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    month_year VARCHAR(7) NOT NULL,  -- Format: '2025-01'

    -- Expense details
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    expense_type VARCHAR(20),  -- 'fixed' or 'variable'
    is_recurring BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Composite index for queries
    UNIQUE(user_id, month_year, name, category)
);

CREATE INDEX IF NOT EXISTS idx_expense_user ON expense_events(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_month ON expense_events(month_year);
CREATE INDEX IF NOT EXISTS idx_expense_user_month ON expense_events(user_id, month_year DESC);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expense_events(category);
CREATE INDEX IF NOT EXISTS idx_expense_recurring ON expense_events(is_recurring) WHERE is_recurring = TRUE;

COMMENT ON TABLE expense_events IS 'Monthly expense events used for anomaly detection and pattern analysis';


-- ===================================================
-- VERIFICATION QUERIES
-- ===================================================
-- After running this script, you can verify tables with:
--
-- List all tables:
-- \dt
--
-- Check table structure:
-- \d monthly_snapshots
-- \d anomaly_alerts
-- \d expense_events
--
-- Count rows:
-- SELECT 'monthly_snapshots' as table_name, COUNT(*) as row_count FROM monthly_snapshots
-- UNION ALL
-- SELECT 'anomaly_alerts', COUNT(*) FROM anomaly_alerts
-- UNION ALL
-- SELECT 'expense_events', COUNT(*) FROM expense_events;
-- ===================================================
