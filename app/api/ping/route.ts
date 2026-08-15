import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic to prevent Vercel from caching this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { status: 'error', message: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lakukan query paling ringan untuk membangunkan / menjaga koneksi database
    const { error } = await supabase.from('periods').select('id').limit(1);

    if (error) {
      console.error('Ping Supabase error:', error);
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ping route error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
