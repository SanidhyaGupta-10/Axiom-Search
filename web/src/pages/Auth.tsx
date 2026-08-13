import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!)

function Auth() {
  return (
    <div>
      
    </div>
  )
}

export default Auth
