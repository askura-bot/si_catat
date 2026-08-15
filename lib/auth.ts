import { cookies } from 'next/headers';

// ============================================================
// Si Catat — Auth Helper (Server-side only)
// Fungsi untuk memeriksa status login admin dari cookie.
// Gunakan di Server Components, Server Actions, dan Middleware.
// ============================================================

const COOKIE_NAME = 'admin_session';
const SESSION_VALUE = 'authenticated';

/**
 * Cek apakah user saat ini login sebagai admin (bendahara).
 * Mengembalikan `true` jika cookie session valid.
 *
 * Contoh penggunaan di Server Component:
 * ```ts
 * const isAdmin = await checkIsAdmin();
 * ```
 */
export async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === SESSION_VALUE;
}
