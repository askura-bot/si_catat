'use server';

import { cookies } from 'next/headers';

// ============================================================
// Si Catat — Auth Server Actions
// Login & Logout via password tunggal (tanpa email/OAuth).
// Password dicocokkan dengan process.env.ADMIN_PASSWORD.
// Session disimpan dalam HTTP-only cookie selama 7 hari.
// ============================================================

const COOKIE_NAME = 'admin_session';
const SESSION_VALUE = 'authenticated';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari dalam detik

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Login admin/bendahara.
 * Menerima FormData dengan field "password".
 */
export async function loginAction(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const password = formData.get('password');

  if (!password || typeof password !== 'string') {
    return { success: false, error: 'Password wajib diisi.' };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD belum di-set di environment variables.');
    return { success: false, error: 'Konfigurasi server bermasalah.' };
  }

  if (password !== adminPassword) {
    return { success: false, error: 'Password salah. Coba lagi.' };
  }

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  return { success: true };
}

/**
 * Server Action: Logout admin.
 * Menghapus cookie session.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
