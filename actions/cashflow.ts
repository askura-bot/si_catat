'use server';

import { supabase } from '@/lib/supabase';
import type { Period, PeriodSummary } from '@/types/database';

// ============================================================
// Si Catat — Cashflow Engine (Server Actions)
//
// Logika perhitungan kas bulanan & rollover saldo otomatis.
// Semua fungsi berjalan di server — aman dari manipulasi client.
//
// Rumus inti (sesuai PRD):
//   Saldo Awal Bulan N  = Σ Pemasukan semua bulan < N
//                        - Σ Pengeluaran semua bulan < N
//   Total Kas Masuk      = Saldo Awal + Total Iuran Bulan Ini
//   Sisa Saldo           = Total Kas Masuk - Total Pengeluaran
// ============================================================

// ── Konstanta ────────────────────────────────────────────────

/** Nama bulan dalam bahasa Indonesia (untuk label UI) */
const MONTH_NAMES = [
  '', // index 0 tidak dipakai
  'Januari', 'Februari', 'Maret', 'April',
  'Mei', 'Juni', 'Juli', 'Agustus',
  'September', 'Oktober', 'November', 'Desember',
] as const;

// ── Helper: Waktu Indonesia ──────────────────────────────────

/**
 * Mengembalikan bulan (1-12) dan tahun saat ini
 * berdasarkan timezone Asia/Jakarta (WIB, UTC+7).
 */
function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  );
  return {
    month: now.getMonth() + 1, // getMonth() 0-indexed
    year: now.getFullYear(),
  };
}

// ============================================================
// 1. getOrCreateCurrentPeriod()
// ============================================================

/**
 * Mendeteksi bulan & tahun berjalan, lalu mengembalikan
 * record `periods` yang sesuai.
 *
 * Jika belum ada, otomatis membuat record baru (upsert).
 * Ini menjamin setiap tanggal 1, periode baru langsung aktif.
 */
export async function getOrCreateCurrentPeriod(): Promise<Period> {
  const { month, year } = getCurrentMonthYear();

  // Coba ambil periode yang sudah ada
  const { data: existing, error: selectError } = await supabase
    .from('periods')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Gagal mengambil periode: ${selectError.message}`);
  }

  if (existing) {
    return existing as Period;
  }

  // Belum ada → buat baru
  const { data: created, error: insertError } = await supabase
    .from('periods')
    .insert({ month, year })
    .select()
    .single();

  if (insertError) {
    // Handle race condition: jika dua request bersamaan
    // keduanya coba insert, yang kedua akan dapat unique violation.
    // Cukup ambil ulang yang sudah ada.
    if (insertError.code === '23505') {
      const { data: retried } = await supabase
        .from('periods')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .single();
      if (retried) return retried as Period;
    }
    throw new Error(`Gagal membuat periode baru: ${insertError.message}`);
  }

  return created as Period;
}

// ============================================================
// 2. calculateCarryOver(periodId)
// ============================================================

export async function calculateCarryOver(period: Period): Promise<number> {
  if (period.initial_balance !== null) {
    return Number(period.initial_balance);
  }

  // Ambil semua periode yang lebih lama dari periode target (terurut terbaru ke terlama)
  const { data: olderPeriods, error: periodsError } = await supabase
    .from('periods')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (periodsError) {
    throw new Error(`Gagal mengambil daftar periode: ${periodsError.message}`);
  }

  // Filter periode yang secara kronologis sebelum periode target
  const validOlderPeriods = (olderPeriods ?? [])
    .filter((p) => {
      if (p.year < period.year) return true;
      if (p.year === period.year && p.month < period.month) return true;
      return false;
    });

  // Jika tidak ada periode sebelumnya, carry-over = 0
  if (validOlderPeriods.length === 0) {
    return 0;
  }

  // Cari periode terdekat (paling baru) yang memiliki initial_balance override
  const overrideIndex = validOlderPeriods.findIndex(p => p.initial_balance !== null);
  
  let baseBalance = 0;
  let periodsToCalculate = validOlderPeriods;

  if (overrideIndex !== -1) {
    baseBalance = Number(validOlderPeriods[overrideIndex].initial_balance);
    // Kita perlu menjumlahkan pemasukan/pengeluaran mulai dari periode yang memiliki override
    // hingga periode tepat sebelum target.
    // Karena list terurut descending (0 = paling baru), maka index 0 s/d overrideIndex adalah periode yang relevan.
    periodsToCalculate = validOlderPeriods.slice(0, overrideIndex + 1);
  }

  const periodIdsToCalculate = periodsToCalculate.map(p => p.id);

  if (periodIdsToCalculate.length === 0) {
    return baseBalance;
  }

  // Total pemasukan
  const { data: incomeRows, error: incomeError } = await supabase
    .from('incomes')
    .select('amount')
    .in('period_id', periodIdsToCalculate);

  if (incomeError) {
    throw new Error(`Gagal menghitung pemasukan lama: ${incomeError.message}`);
  }

  const totalPastIncome = (incomeRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  // Total pengeluaran
  const { data: expenseRows, error: expenseError } = await supabase
    .from('expenses')
    .select('amount')
    .in('period_id', periodIdsToCalculate);

  if (expenseError) {
    throw new Error(`Gagal menghitung pengeluaran lama: ${expenseError.message}`);
  }

  const totalPastExpense = (expenseRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  return baseBalance + totalPastIncome - totalPastExpense;
}

// ============================================================
// 2b. updateInitialBalance(periodId, amount)
// ============================================================

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';

/**
 * Update atau reset saldo awal suatu periode (Admin only).
 * Jika amount === null, artinya reset ke hitungan otomatis.
 */
export async function updateInitialBalance(periodId: string, amount: number | null): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak.' };
  }

  const { error } = await supabase
    .from('periods')
    .update({ initial_balance: amount })
    .eq('id', periodId);

  if (error) {
    return { success: false, error: `Gagal memperbarui saldo awal: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

// ============================================================
// 3. getPeriodSummary(periodId)
// ============================================================

/**
 * Mengembalikan ringkasan finansial lengkap untuk satu periode.
 *
 * Return:
 *   - carry_over      : Saldo awal (sisa dari seluruh bulan sebelumnya)
 *   - total_income     : Total iuran masuk bulan ini
 *   - total_kas_masuk  : carry_over + total_income
 *   - total_expense    : Total pengeluaran bulan ini
 *   - sisa_saldo       : total_kas_masuk - total_expense
 */
export async function getPeriodSummary(
  periodId: string
): Promise<PeriodSummary> {
  // 1. Ambil data periode
  const { data: period, error: periodError } = await supabase
    .from('periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (periodError || !period) {
    throw new Error(
      `Periode tidak ditemukan: ${periodError?.message ?? 'ID tidak valid'}`
    );
  }

  const typedPeriod = period as Period;

  // 2. Hitung carry-over dari semua bulan sebelumnya
  const carry_over = await calculateCarryOver(typedPeriod);

  // 3. Total iuran masuk bulan ini
  const { data: incomeRows, error: incomeError } = await supabase
    .from('incomes')
    .select('amount')
    .eq('period_id', periodId);

  if (incomeError) {
    throw new Error(`Gagal mengambil pemasukan: ${incomeError.message}`);
  }

  const total_income = (incomeRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  // 4. Total pengeluaran bulan ini
  const { data: expenseRows, error: expenseError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('period_id', periodId);

  if (expenseError) {
    throw new Error(`Gagal mengambil pengeluaran: ${expenseError.message}`);
  }

  const total_expense = (expenseRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  // 5. Kalkulasi turunan
  const total_kas_masuk = carry_over + total_income;
  const sisa_saldo = total_kas_masuk - total_expense;

  return {
    period: typedPeriod,
    carry_over,
    total_income,
    total_kas_masuk,
    total_expense,
    sisa_saldo,
  };
}

// ============================================================
// 4. getAllPeriods() — Arsip / Filter Riwayat
// ============================================================

/** Periode dengan label display untuk UI */
export interface PeriodWithLabel extends Period {
  label: string; // contoh: "Agustus 2026"
}

/**
 * Mengambil daftar seluruh periode yang ada di database,
 * terurut dari terbaru ke terlama.
 *
 * Digunakan untuk dropdown arsip / filter riwayat bulan.
 * Menyertakan `label` human-readable (misal "Agustus 2026").
 */
export async function getAllPeriods(): Promise<PeriodWithLabel[]> {
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil daftar periode: ${error.message}`);
  }

  return (data ?? []).map((p) => ({
    ...(p as Period),
    label: `${MONTH_NAMES[p.month]} ${p.year}`,
  }));
}

// ============================================================
// 5. getCurrentPeriodSummary() — Shortcut untuk dashboard
// ============================================================

/**
 * Shortcut: ambil atau buat periode bulan ini, lalu langsung
 * hitung ringkasan finansialnya.
 *
 * Cocok dipanggil langsung dari halaman dashboard utama.
 */
export async function getCurrentPeriodSummary(): Promise<PeriodSummary> {
  const period = await getOrCreateCurrentPeriod();
  return getPeriodSummary(period.id);
}

// ============================================================
// 6. getMonthName() — Utilitas label bulan
// ============================================================

/**
 * Mengembalikan nama bulan dalam Bahasa Indonesia.
 * @param month Nomor bulan (1-12)
 */
export async function getMonthName(month: number): Promise<string> {
  return MONTH_NAMES[month] ?? '';
}

