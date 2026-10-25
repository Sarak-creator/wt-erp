import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Check process.env first, then fallback to localStorage if configured in client
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined' && (!supabaseUrl || supabaseUrl.includes('mock'))) {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl && savedKey) {
      supabaseUrl = savedUrl;
      supabaseAnonKey = savedKey;
    }
  }

  return createBrowserClient(
    supabaseUrl || 'https://mock-pure-water.supabase.co',
    supabaseAnonKey || 'mock-anon-key-pure-water-erp'
  );
}
