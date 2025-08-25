import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmitmxanetbifwzllmrn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaXRteGFuZXRiaWZ3emxsbXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDIyMDMsImV4cCI6MjA2NzgxODIwM30.DbhEVs4de9s2ScegcfpKJLJaFiNFASLYI-pYlAqLSjk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);