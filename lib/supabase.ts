import { createClient } from '@supabase/supabase-js';

// ============================================================
// Si Catat — Supabase Client Helper
// Singleton client untuk digunakan di seluruh aplikasi.
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
    'sudah diatur di file .env.local'
  );
}

/**
 * Supabase client instance.
 *
 * Gunakan di Server Components, Server Actions, dan Client Components.
 * Karena `NEXT_PUBLIC_*` tersedia di kedua sisi, satu instance sudah cukup
 * untuk kebutuhan aplikasi Si Catat yang RLS-nya terbuka (allow all).
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
