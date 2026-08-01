import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = envUrl && envUrl.startsWith('http') ? envUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';


const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validServiceRoleKey = serviceRoleKey && serviceRoleKey.startsWith('ey') ? serviceRoleKey : supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// supabaseAdmin uses the service role key when available (bypasses RLS)
// Falls back to anon key — works fine when RLS is disabled on tables
export const supabaseAdmin = createClient(
  supabaseUrl,
  validServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
