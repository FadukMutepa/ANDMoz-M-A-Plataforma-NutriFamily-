import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const isSupabaseConfigured =
  (envUrl.startsWith('https://') || envUrl.startsWith('http://')) && envKey.length > 10;

// Fallback seguro apenas para permitir inicialização e testes directos na interface
// caso VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ainda não tenham sido definidos.
const FALLBACK_SUPABASE_URL = 'https://nutrifamily-demo.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'demo-anon-key-placeholder';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? envUrl : FALLBACK_SUPABASE_URL,
  isSupabaseConfigured ? envKey : FALLBACK_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  }
);
