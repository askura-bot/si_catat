// ============================================================
// Si Catat — TypeScript Database Type Definitions
// Tipe data untuk setiap tabel di Supabase/PostgreSQL
// ============================================================

/**
 * Tabel `members`
 * Anggota kontrakan. Soft-delete via is_active = false.
 */
export interface Member {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string; // ISO 8601 timestamptz
}

/** Payload untuk INSERT member baru */
export interface MemberInsert {
  name: string;
  is_active?: boolean;
}

/** Payload untuk UPDATE member */
export interface MemberUpdate {
  name?: string;
  is_active?: boolean;
}

// ============================================================

/**
 * Tabel `periods`
 * Periode kas bulanan. Unique constraint pada (month, year).
 */
export interface Period {
  id: string;
  month: number; // 1–12
  year: number;  // >= 2020
  created_at: string;
}

/** Payload untuk INSERT period baru */
export interface PeriodInsert {
  month: number;
  year: number;
}

// ============================================================

/**
 * Tabel `incomes`
 * Pemasukan / iuran dari anggota. Satu anggota bisa banyak baris
 * per periode (cicilan).
 */
export interface Income {
  id: string;
  period_id: string;
  member_id: string;
  amount: number;
  date: string;       // YYYY-MM-DD
  note: string | null;
  created_at: string;
}

/** Payload untuk INSERT income baru */
export interface IncomeInsert {
  period_id: string;
  member_id: string;
  amount: number;
  date?: string;
  note?: string | null;
}

// ============================================================

/**
 * Tabel `expenses`
 * Pengeluaran operasional kontrakan.
 */
export interface Expense {
  id: string;
  period_id: string;
  description: string;
  amount: number;
  date: string;       // YYYY-MM-DD
  created_at: string;
}

/** Payload untuk INSERT expense baru */
export interface ExpenseInsert {
  period_id: string;
  description: string;
  amount: number;
  date?: string;
}

// ============================================================
// Joined / computed types (berguna untuk UI)
// ============================================================

/** Income dengan relasi member (untuk tampilan tabel iuran) */
export interface IncomeWithMember extends Income {
  member: Pick<Member, 'id' | 'name'>;
}

/** Ringkasan iuran per anggota dalam satu periode */
export interface MemberIncomeSummary {
  member_id: string;
  member_name: string;
  total_amount: number;
}

/** Ringkasan finansial satu periode */
export interface PeriodSummary {
  period: Period;
  carry_over: number;    // Saldo awal (sisa bulan lalu)
  total_income: number;  // Total iuran bulan ini
  total_kas_masuk: number; // carry_over + total_income
  total_expense: number; // Total pengeluaran bulan ini
  sisa_saldo: number;    // total_kas_masuk - total_expense
}
