import { createClient } from '@supabase/supabase-js'

// The one Supabase client. The publishable key is public by design; library defaults keep the
// session in browser storage and refresh the access token automatically.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
