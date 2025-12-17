
import { createClient } from '@supabase/supabase-js';

// As credenciais do Supabase foram fornecidas como fallback.
const defaultSupabaseUrl = 'https://ijosvnafrchqrlnsxfhx.supabase.co';
const defaultSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb3N2bmFmcmNocXJsbnN4Zmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDY5MTksImV4cCI6MjA4MTQ4MjkxOX0.ZGgeU7BAZhN89Jd3c-DvB-N8aVOlE9Ob71rU7TcHqpE';

// Tenta obter as credenciais do localStorage
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabaseUrl') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('supabaseApiKey') : null;

const supabaseUrl = storedUrl || defaultSupabaseUrl;
const supabaseKey = storedKey || defaultSupabaseKey;

export const supabase = createClient(supabaseUrl, supabaseKey);