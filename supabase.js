// supabase.js
// Conexão com o banco Supabase


// Seu projeto Supabase (dados fornecidos por você)
const SUPABASE_URL = "https://mqlhexjnvmjzxpyzmzur.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw";

// Inicializa o cliente globalmente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
