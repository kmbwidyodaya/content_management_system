import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ivanibrahim07@gmail.com',
    password: 'Rahasia1!'
  })
  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }

  const columns = ['writer_id', 'creator_id', 'created_by', 'member_id', 'users_id', 'admin_id', 'id_users']
  
  for (const col of columns) {
    const { error } = await supabase.from('blog_management').select(col).limit(1)
    if (error) {
      console.log(`Column '${col}': NOT FOUND / ERROR (${error.code}) - ${error.message}`)
    } else {
      console.log(`Column '${col}': EXISTS!`)
    }
  }

  await supabase.auth.signOut()
}

run()
