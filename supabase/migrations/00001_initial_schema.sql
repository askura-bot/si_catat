-- ============================================================
-- Si Catat — Initial Database Schema
-- Jalankan SQL ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Ekstensi UUID (biasanya sudah aktif di Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABEL: members
-- Menyimpan data anggota kontrakan.
-- Anggota yang pindah di-set is_active = false (soft-delete).
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  members            IS 'Daftar anggota kontrakan';
COMMENT ON COLUMN members.name       IS 'Nama anggota';
COMMENT ON COLUMN members.is_active  IS 'Status aktif (false = sudah pindah, tetap simpan riwayat)';

-- ============================================================
-- 3. TABEL: periods
-- Periode bulanan kas. Satu baris per kombinasi bulan+tahun.
-- ============================================================
CREATE TABLE IF NOT EXISTS periods (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  month      INT         NOT NULL CHECK (month BETWEEN 1 AND 12),
  year       INT         NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT periods_month_year_unique UNIQUE (month, year)
);

COMMENT ON TABLE  periods       IS 'Periode kas bulanan (bulan + tahun)';
COMMENT ON COLUMN periods.month IS 'Bulan (1-12)';
COMMENT ON COLUMN periods.year  IS 'Tahun';

-- ============================================================
-- 4. TABEL: incomes
-- Pemasukan / iuran dari anggota.
-- Satu anggota bisa punya banyak baris per bulan (cicilan).
-- ============================================================
CREATE TABLE IF NOT EXISTS incomes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id  UUID        NOT NULL REFERENCES periods (id) ON DELETE CASCADE,
  member_id  UUID        NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  amount     NUMERIC     NOT NULL CHECK (amount > 0),
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  incomes           IS 'Catatan pemasukan / iuran anggota';
COMMENT ON COLUMN incomes.amount    IS 'Nominal iuran (harus > 0)';
COMMENT ON COLUMN incomes.note      IS 'Catatan opsional, misal: "Cicilan 1"';

-- Indeks untuk query per periode & per anggota
CREATE INDEX IF NOT EXISTS idx_incomes_period  ON incomes (period_id);
CREATE INDEX IF NOT EXISTS idx_incomes_member  ON incomes (member_id);

-- ============================================================
-- 5. TABEL: expenses
-- Pengeluaran operasional kontrakan.
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id   UUID        NOT NULL REFERENCES periods (id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  amount      NUMERIC     NOT NULL CHECK (amount > 0),
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  expenses             IS 'Catatan pengeluaran operasional';
COMMENT ON COLUMN expenses.description IS 'Keterangan pengeluaran, misal: "Token Listrik"';
COMMENT ON COLUMN expenses.amount      IS 'Nominal pengeluaran (harus > 0)';

-- Indeks untuk query per periode
CREATE INDEX IF NOT EXISTS idx_expenses_period ON expenses (period_id);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Aktifkan RLS, lalu buat policy ALLOW ALL untuk akses publik.
-- Aplikasi ini menggunakan anon key (publishable) dengan
-- proteksi admin via server-side password, bukan RLS.
-- ============================================================

ALTER TABLE members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi untuk anon & authenticated
CREATE POLICY "Allow all access to members"  ON members  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to periods"  ON periods  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to incomes"  ON incomes  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Selesai! Setelah menjalankan SQL ini, pastikan:
-- 1. Tabel members, periods, incomes, expenses sudah muncul
--    di menu Table Editor Supabase.
-- 2. RLS aktif dengan policy "Allow all access" di setiap tabel.
-- ============================================================
