'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/auth';
import type { Income, MemberIncomeSummary } from '@/types/database';

// ============================================================
// Si Catat — Income / Iuran Server Actions
//
// Pencatatan pemasukan iuran anggota kontrakan.
// Mendukung cicilan: satu anggota bisa punya banyak baris per bulan.
// ============================================================

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ── Queries ──────────────────────────────────────────────────

/**
 * Ambil semua anggota aktif beserta total akumulasi iuran
 * pada suatu periode.
 *
 * Mengembalikan SEMUA anggota aktif, termasuk yang belum bayar
 * (total_amount = 0).
 */
export async function getMembersWithTotalPaid(
  periodId: string
): Promise<MemberIncomeSummary[]> {
  // 1. Ambil semua anggota aktif
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (membersError) {
    throw new Error(`Gagal mengambil anggota: ${membersError.message}`);
  }

  // 2. Ambil semua income pada periode ini
  const { data: incomes, error: incomesError } = await supabase
    .from('incomes')
    .select('member_id, amount')
    .eq('period_id', periodId);

  if (incomesError) {
    throw new Error(`Gagal mengambil iuran: ${incomesError.message}`);
  }

  // 3. Hitung total per anggota
  const totalsMap = new Map<string, number>();
  for (const inc of incomes ?? []) {
    const prev = totalsMap.get(inc.member_id) ?? 0;
    totalsMap.set(inc.member_id, prev + Number(inc.amount));
  }

  // 4. Gabungkan: semua anggota aktif + total iuran mereka
  return (members ?? []).map((m) => ({
    member_id: m.id,
    member_name: m.name,
    total_amount: totalsMap.get(m.id) ?? 0,
  }));
}

/**
 * Ambil riwayat transaksi iuran pada suatu periode,
 * terurut dari terbaru.
 */
export async function getIncomesByPeriod(
  periodId: string
): Promise<(Income & { member_name: string })[]> {
  // Supabase foreign key join: members.name via member_id
  const { data, error } = await supabase
    .from('incomes')
    .select('*, members!inner(name)')
    .eq('period_id', periodId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil riwayat iuran: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    period_id: row.period_id,
    member_id: row.member_id,
    amount: Number(row.amount),
    date: row.date,
    note: row.note,
    created_at: row.created_at,
    member_name: row.members?.name ?? 'Unknown',
  }));
}

// ── Mutations (Admin Only) ───────────────────────────────────

/**
 * Catat setoran iuran baru.
 * Nominal bisa berapa saja (mendukung cicilan).
 * Otomatis menambah total akumulasi iuran anggota pada bulan ini.
 */
export async function addIncome(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  const periodId = formData.get('period_id');
  const memberId = formData.get('member_id');
  const amountRaw = formData.get('amount');
  const date = formData.get('date');
  const note = formData.get('note');

  // Validasi
  if (!periodId || typeof periodId !== 'string') {
    return { success: false, error: 'Periode tidak valid.' };
  }
  if (!memberId || typeof memberId !== 'string') {
    return { success: false, error: 'Pilih anggota terlebih dahulu.' };
  }
  if (!amountRaw || typeof amountRaw !== 'string') {
    return { success: false, error: 'Nominal iuran wajib diisi.' };
  }

  // Parse nominal: hapus karakter non-angka (titik ribuan, dsb)
  const amount = Number(amountRaw.replace(/[^0-9]/g, ''));
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Nominal harus lebih dari 0.' };
  }

  const dateStr = date && typeof date === 'string' ? date : undefined;
  const noteStr =
    note && typeof note === 'string' && note.trim().length > 0
      ? note.trim()
      : null;

  const { error } = await supabase.from('incomes').insert({
    period_id: periodId,
    member_id: memberId,
    amount,
    ...(dateStr ? { date: dateStr } : {}),
    note: noteStr,
  });

  if (error) {
    return { success: false, error: `Gagal mencatat iuran: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Hapus transaksi iuran (jika salah input).
 * Admin only.
 */
export async function deleteIncome(incomeId: string): Promise<ActionResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  if (!incomeId) {
    return { success: false, error: 'ID transaksi tidak valid.' };
  }

  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', incomeId);

  if (error) {
    return { success: false, error: `Gagal menghapus iuran: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}
