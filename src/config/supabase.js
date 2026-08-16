import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your_project_id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Supabase Key exists:', !!supabaseAnonKey);

// Validate configuration
if (!supabaseUrl || supabaseUrl.includes('your_project_id')) {
  console.error('❌ Supabase URL not configured! Current:', supabaseUrl);
  console.error('Expected format: https://xxxxx.supabase.co');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
});

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Database health check failed:', error);
      return { healthy: false, error: error.message };
    }
    
    console.log('✅ Supabase database connected');
    return { healthy: true };
  } catch (error) {
    console.error('Database health check error:', error);
    return { healthy: false, error: error.message };
  }
};

// Export for backward compatibility
export default supabase;
// Build timestamp: 1768203032
