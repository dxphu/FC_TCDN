import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://kfrujicfzninlpmkwcfd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcnVqaWNmem5pbmxwbWt3Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjM0MzksImV4cCI6MjA4OTg5OTQzOX0.9tmR8uHDB3i8xMnk_kbbxIsBHcbpTCYj6_GHX4WkpZE";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
