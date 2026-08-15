-- ============================================================
-- Migrasi: Tambahan Saldo Awal Manual
-- 
-- Fitur untuk mengatur saldo awal (sisa bulan lalu) secara manual.
-- Jika initial_balance bernilai NULL, maka akan dihitung otomatis
-- (akumulasi dari bulan-bulan sebelumnya).
-- Jika diisi angka (termasuk 0 atau minus), akan menggunakan angka tersebut.
-- ============================================================

ALTER TABLE periods 
ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12, 2) DEFAULT NULL;

COMMENT ON COLUMN periods.initial_balance IS 'Saldo awal manual. Jika NULL, akan dihitung otomatis dari akumulasi bulan-bulan sebelumnya.';
