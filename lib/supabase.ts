import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Se a Vercel mandar a URL sem o https://, isso impede que o site quebre no celular
if (!supabaseUrl.startsWith('http')) {
  console.error("ERRO: URL do Supabase inválida. Usando URL de fallback para não quebrar a tela.");
  supabaseUrl = 'https://link-falso.supabase.co';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);