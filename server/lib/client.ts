import { createClient } from '@supabase/supabase-js'

export function createSupbaseClient() {
  return createClient(
    'https://zwrwmxdnrawabxmuvxhe.supabase.co',
     process.env.SUPABSE_API_SECRET!
  );
}
