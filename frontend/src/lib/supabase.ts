import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const rawSupabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

function normalizeSupabaseUrl(value: string) {
  const trimmedValue = value.trim().replace(/\/+$/, '');
  if (!trimmedValue) return '';

  if (/^[a-z0-9-]+$/i.test(trimmedValue)) {
    return `https://${trimmedValue}.supabase.co`;
  }

  return trimmedValue;
}

function readSupabaseHost(value: string) {
  try {
    return value ? new URL(value).host : '';
  } catch {
    return '';
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = rawSupabaseAnonKey;
const supabaseUrlHost = readSupabaseHost(supabaseUrl);
const supabaseConfigError = !supabaseUrl
  ? 'VITE_SUPABASE_URL ausente.'
  : !supabaseAnonKey
    ? 'VITE_SUPABASE_ANON_KEY ausente.'
    : !supabaseUrlHost
      ? 'VITE_SUPABASE_URL invalida.'
      : null;

export const supabaseConfig = {
  url: supabaseUrl,
  host: supabaseUrlHost,
  isConfigured: !supabaseConfigError,
  error: supabaseConfigError
};

if (supabaseConfigError) {
  console.error('[Supabase] Configuracao invalida', {
    host: supabaseUrlHost || null,
    error: supabaseConfigError
  });
}

export const supabase = createClient(
  supabaseConfig.isConfigured ? supabaseUrl : 'https://invalid.supabase.co',
  supabaseConfig.isConfigured ? supabaseAnonKey : 'missing-supabase-anon-key',
  {
    auth: {
      autoRefreshToken: supabaseConfig.isConfigured,
      detectSessionInUrl: supabaseConfig.isConfigured,
      persistSession: supabaseConfig.isConfigured
    }
  }
);

export async function checkSupabaseConnection() {
  if (!supabaseConfig.isConfigured) {
    throw new Error(supabaseConfig.error ?? 'Supabase nao configurado.');
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .limit(1);

  if (error) {
    throw error;
  }

  return data;
}
