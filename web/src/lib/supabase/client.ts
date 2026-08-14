import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    'https://zwrwmxdnrawabxmuvxhe.supabase.co',
    'sb_publishable_IH6DkZUVYMKWxARF8pSbkw_Sda0pt0m'
  );
}
