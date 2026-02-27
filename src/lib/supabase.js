import { createClient } from '@supabase/supabase-js';

// Create React App uses process.env.REACT_APP_*
// You can get these from your Supabase project dashboard:
// 1. Go to Project Settings > API
// 2. Copy the Project URL and anon/public key

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function URL - update this to your deployed function URL
export const EDGE_FUNCTION_URL = process.env.REACT_APP_EDGE_FUNCTION_URL || 'https://mnvlewewyxfjrltvnfvs.supabase.co/functions/v1/todos';
