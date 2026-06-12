import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Signing in as admin...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ivanibrahim07@gmail.com',
    password: 'Rahasia1!'
  })

  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }

  console.log('Deleting test blog post with title "Test Blog by AI"...')
  const { data, error } = await supabase
    .from('blog_management')
    .delete()
    .eq('title', 'Test Blog by AI')
    .select()

  if (error) {
    console.error('Deletion failed:', error)
  } else {
    console.log('Deletion successful! Deleted row:', data)
  }

  await supabase.auth.signOut()
}

run()
