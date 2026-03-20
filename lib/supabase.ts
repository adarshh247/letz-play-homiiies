
import { createClient } from '@supabase/supabase-js';
/*
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = envUrl && envUrl.startsWith('http') 
  ? envUrl 
  : 'https://yhbzhftnspzvepbaaqwu.supabase.co';

const supabaseAnonKey = envKey && envKey.length > 20
  ? envKey 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYnpoZnRuc3B6dmVwYmFhcXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjA2NjYsImV4cCI6MjA4MjczNjY2Nn0.1Qb024p975GsaQpZjyBgMEi6YjyMyRU7NBiu6RGfRQc';
*/
const supabaseUrl = 'https://yhbzhftnspzvepbaaqwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYnpoZnRuc3B6dmVwYmFhcXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjA2NjYsImV4cCI6MjA4MjczNjY2Nn0.1Qb024p975GsaQpZjyBgMEi6YjyMyRU7NBiu6RGfRQc';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
