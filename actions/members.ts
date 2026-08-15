'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/auth';
import type { Member } from '@/types/database';

// ============================================================
// Si Catat — Member Server Actions
//
// CRUD anggota kontrakan.
// Aksi tulis (add, toggle) memerlukan login admin.
// ============================================================

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ── Queries ──────────────────────────────────────────────────

/**
 * Ambil semua anggota (aktif & non-aktif).
 * Terurut: aktif dulu, lalu berdasarkan nama.
 */
export async function getAllMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil daftar anggota: ${error.message}`);
  }

  return (data ?? []) as Member[];
}

/**
 * Ambil hanya anggota yang aktif.
 * Digunakan untuk dropdown input iuran.
 */
export async function getActiveMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil anggota aktif: ${error.message}`);
  }

  return (data ?? []) as Member[];
}

// ── Mutations (Admin Only) ───────────────────────────────────

/**
 * Tambah anggota baru.
 * Hanya bisa dilakukan oleh admin/bendahara.
 */
export async function addMember(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Auth guard
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  const name = formData.get('name');

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: 'Nama anggota wajib diisi.' };
  }

  const trimmedName = name.trim();

  // Cek duplikasi nama (case-insensitive)
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .ilike('name', trimmedName)
    .maybeSingle();

  if (existing) {
    return { success: false, error: `Anggota "${trimmedName}" sudah terdaftar.` };
  }

  const { error } = await supabase
    .from('members')
    .insert({ name: trimmedName });

  if (error) {
    return { success: false, error: `Gagal menambah anggota: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Toggle status aktif/nonaktif anggota.
 * Nonaktifkan anggota yang sudah pindah kontrakan.
 * Riwayat transaksi tetap tersimpan.
 */
export async function toggleMemberStatus(
  memberId: string,
  isActive: boolean
): Promise<ActionResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  if (!memberId) {
    return { success: false, error: 'ID anggota tidak valid.' };
  }

  const { error } = await supabase
    .from('members')
    .update({ is_active: isActive })
    .eq('id', memberId);

  if (error) {
    return { success: false, error: `Gagal mengubah status: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

/**
 * Edit nama anggota.
 */
export async function updateMemberName(
  memberId: string,
  newName: string
): Promise<ActionResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Akses ditolak. Login sebagai admin.' };
  }

  if (!memberId || !newName.trim()) {
    return { success: false, error: 'ID dan nama anggota wajib diisi.' };
  }

  const { error } = await supabase
    .from('members')
    .update({ name: newName.trim() })
    .eq('id', memberId);

  if (error) {
    return { success: false, error: `Gagal mengubah nama: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}
