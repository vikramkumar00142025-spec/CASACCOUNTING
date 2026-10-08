import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseUrl.startsWith('http')
  );
};

let client: SupabaseClient | null = null;

if (typeof window !== 'undefined' || (supabaseUrl && supabaseAnonKey)) {
  if (isSupabaseConfigured()) {
    try {
      client = createClient(supabaseUrl!, supabaseAnonKey!);
    } catch (e) {
      console.warn('Supabase client initialization skipped/failed:', e);
    }
  }
}

export const supabase = client;

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are not configured in environment variables.',
    };
  }

  try {
    const { error } = await supabase!.from('companies').select('count', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
}
