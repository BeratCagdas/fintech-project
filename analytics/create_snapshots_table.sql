-- Create snapshots table for monthly financial summaries
CREATE TABLE IF NOT EXISTS snapshots (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    snapshot_date DATE NOT NULL,
    month_name VARCHAR(50),

    -- Income & Expenses
    total_income DECIMAL(12, 2) DEFAULT 0,
    total_expense DECIMAL(12, 2) DEFAULT 0,
    savings DECIMAL(12, 2) DEFAULT 0,
    savings_rate DECIMAL(5, 2) DEFAULT 0,

    -- Assets & Debts
    total_assets DECIMAL(12, 2) DEFAULT 0,
    total_debt DECIMAL(12, 2) DEFAULT 0,
    net_worth DECIMAL(12, 2) DEFAULT 0,

    -- Credit Score
    credit_score INTEGER,
    risk_category VARCHAR(10),
    risk_level VARCHAR(50),

    -- Credit Score Breakdown
    payment_history_score INTEGER DEFAULT 0,
    debt_burden_score INTEGER DEFAULT 0,
    behavior_score INTEGER DEFAULT 0,
    stability_score INTEGER DEFAULT 0,
    asset_score INTEGER DEFAULT 0,

    -- Metrics
    credit_utilization DECIMAL(5, 2) DEFAULT 0,
    debt_to_income DECIMAL(5, 2) DEFAULT 0,
    on_time_payment_rate DECIMAL(5, 2) DEFAULT 0,

    -- Financial Health Score
    financial_health_score DECIMAL(5, 2),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(user_id, snapshot_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON snapshots(user_id, snapshot_date DESC);

-- Comments
COMMENT ON TABLE snapshots IS 'Monthly financial snapshots for users - historical data for analytics and forecasting';
COMMENT ON COLUMN snapshots.user_id IS 'MongoDB user _id as string';
COMMENT ON COLUMN snapshots.snapshot_date IS 'First day of the month for this snapshot';
