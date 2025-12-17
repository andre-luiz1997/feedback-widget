
import { createClient } from '@supabase/supabase-js';

// As credenciais do Supabase foram fornecidas.
const supabaseUrl = 'https://ijosvnafrchqrlnsxfhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb3N2bmFmcmNocXJsbnN4Zmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDY5MTksImV4cCI6MjA4MTQ4MjkxOX0.ZGgeU7BAZhN89Jd3c-DvB-N8aVOlE9Ob71rU7TcHqpE';

export const supabase = createClient(supabaseUrl, supabaseKey);
