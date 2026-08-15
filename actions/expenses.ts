'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/auth';
import type { Expense } from '@/types/database';

// ============================================================
// Si Catat — Expense Server Actions
//
// Pencatatan pengeluaran operasional kontrakan.
// ============================================================

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ── Queries ──────────────────────────────────────────────────

/**
 * Ambil riwayat pengeluaran pada suatu periode,
 * terurut dari terbaru.
 */
export async function getExpenses(periodId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('period_id', periodId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil data pengeluaran: ${error.message}`);
  }

  return (data ?? []) as Expense[];
}

// ── Mutations (Admin Only) ───────────────────────────────────

/**
 * Catat pengeluaran operasional baru.
 */
export async function addExpense(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  const periodId = formData.get('period_id');
  const description = formData.get('description');
  const amountRaw = formData.get('amount');
  const date = formData.get('date');

  // Validasi
  if (!periodId || typeof periodId !== 'string') {
    return { success: false, error: 'Periode tidak valid.' };
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return { success: false, error: 'Keterangan pengeluaran wajib diisi.' };
  }
  if (!amountRaw || typeof amountRaw !== 'string') {
    return { success: false, error: 'Nominal wajib diisi.' };
  }

  // Parse nominal
  const amount = Number(amountRaw.replace(/[^0-9]/g, ''));
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Nominal harus lebih dari 0.' };
  }

  const dateStr = date && typeof date === 'string' ? date : undefined;

  const { error } = await supabase.from('expenses').insert({
    period_id: periodId,
    description: description.trim(),
    amount,
    ...(dateStr ? { date: dateStr } : {}),
  });

  if (error) {
    return { success: false, error: `Gagal mencatat pengeluaran: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Hapus transaksi pengeluaran.
 */
export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  if (!expenseId) {
    return { success: false, error: 'ID transaksi tidak valid.' };
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) {
    return { success: false, error: `Gagal menghapus pengeluaran: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}
