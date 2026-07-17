import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vmzbajlbrkisjpmaoleg.supabase.co'
const supabaseAnonKey = 'sb_publishable_v9j1ZMmj_N_n6Wg6u82ggg_Hh6JvlRn'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)