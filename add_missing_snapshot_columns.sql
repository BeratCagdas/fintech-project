-- ===================================================
-- ADD MISSING COLUMNS TO monthly_snapshots
-- ===================================================
-- Bu dosyayı pgAdmin'de çalıştırın
-- ===================================================

-- Credit Score İlgili Kolonlar
DO $$
BEGIN
    -- credit_score kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'credit_score'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN credit_score INTEGER DEFAULT 0;
    END IF;

    -- risk_category kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'risk_category'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN risk_category VARCHAR(20);
    END IF;

    -- risk_level kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN risk_level VARCHAR(20);
    END IF;

    -- payment_history_score kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'payment_history_score'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN payment_history_score INTEGER DEFAULT 0;
    END IF;

    -- debt_burden_score kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'debt_burden_score'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN debt_burden_score INTEGER DEFAULT 0;
    END IF;

    -- behavior_score kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'behavior_score'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN behavior_score INTEGER DEFAULT 0;
    END IF;

    -- stability_score kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'stability_score'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN stability_score INTEGER DEFAULT 0;
    END IF;

    -- asset_score kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'asset_score'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN asset_score INTEGER DEFAULT 0;
    END IF;

    -- credit_utilization kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'credit_utilization'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN credit_utilization DOUBLE PRECISION DEFAULT 0;
    END IF;

    -- debt_to_income kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'debt_to_income'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN debt_to_income DOUBLE PRECISION DEFAULT 0;
    END IF;

    -- on_time_payment_rate kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'on_time_payment_rate'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN on_time_payment_rate DOUBLE PRECISION DEFAULT 0;
    END IF;

    -- total_debt kolonu (FORECAST İÇİN GEREKLİ)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'total_debt'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN total_debt NUMERIC(12,2) DEFAULT 0;
    END IF;

    -- net_worth kolonu (FORECAST İÇİN GEREKLİ)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'net_worth'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN net_worth NUMERIC(12,2) DEFAULT 0;
    END IF;

    -- debts_snapshot JSONB kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'debts_snapshot'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN debts_snapshot JSONB;
    END IF;

    -- credit_cards_snapshot JSONB kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'credit_cards_snapshot'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN credit_cards_snapshot JSONB;
    END IF;

    -- investments_snapshot JSONB kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'investments_snapshot'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN investments_snapshot JSONB;
    END IF;

    -- assets_snapshot JSONB kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_snapshots' AND column_name = 'assets_snapshot'
    ) THEN
        ALTER TABLE monthly_snapshots ADD COLUMN assets_snapshot JSONB;
    END IF;

END $$;

-- ===================================================
-- DOĞRULAMA - Tüm kolonları listele
-- ===================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'monthly_snapshots'
ORDER BY ordinal_position;
