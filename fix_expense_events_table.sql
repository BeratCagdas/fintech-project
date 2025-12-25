-- ===================================================
-- FIX: expense_events Tablosuna Eksik Kolonları Ekle
-- ===================================================
-- Bu script'i pgAdmin veya psql ile çalıştırın
-- ===================================================

-- Önce mevcut tabloyu kontrol et
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'expense_events'
ORDER BY ordinal_position;

-- Eksik kolonları ekle (eğer yoksa)
DO $$
BEGIN
    -- expense_date kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_events' AND column_name = 'expense_date'
    ) THEN
        ALTER TABLE expense_events ADD COLUMN expense_date DATE;
        RAISE NOTICE 'expense_date kolonu eklendi';
    END IF;

    -- total_income kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_events' AND column_name = 'total_income'
    ) THEN
        ALTER TABLE expense_events ADD COLUMN total_income NUMERIC(12,2) DEFAULT 0;
        RAISE NOTICE 'total_income kolonu eklendi';
    END IF;

    -- total_expense kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_events' AND column_name = 'total_expense'
    ) THEN
        ALTER TABLE expense_events ADD COLUMN total_expense NUMERIC(12,2) DEFAULT 0;
        RAISE NOTICE 'total_expense kolonu eklendi';
    END IF;

    -- savings kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_events' AND column_name = 'savings'
    ) THEN
        ALTER TABLE expense_events ADD COLUMN savings NUMERIC(12,2) DEFAULT 0;
        RAISE NOTICE 'savings kolonu eklendi';
    END IF;

    -- frequency kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_events' AND column_name = 'frequency'
    ) THEN
        ALTER TABLE expense_events ADD COLUMN frequency VARCHAR(20);
        RAISE NOTICE 'frequency kolonu eklendi';
    END IF;

    -- day_of_month kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_events' AND column_name = 'day_of_month'
    ) THEN
        ALTER TABLE expense_events ADD COLUMN day_of_month INTEGER;
        RAISE NOTICE 'day_of_month kolonu eklendi';
    END IF;
END $$;

-- Tekrar kontrol et
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'expense_events'
ORDER BY ordinal_position;

-- İşlem tamamlandı mesajı
SELECT 'expense_events tablosu güncellendi! ✅' as message;
