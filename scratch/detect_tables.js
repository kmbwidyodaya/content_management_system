import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  // Sign in first to bypass RLS
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ivanibrahim07@gmail.com',
    password: 'Rahasia1!'
  })
  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }

  const potentialTables = ['blog', 'blogs', 'post', 'posts', 'article', 'articles', 'blog_management']
  for (const table of potentialTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Table '${table}': ERROR (${error.code}) - ${error.message}`)
    } else {
      console.log(`Table '${table}': EXISTS! Data:`, data)
    }
  }

  await supabase.auth.signOut()
}

run()
