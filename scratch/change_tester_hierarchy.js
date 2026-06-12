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

  console.log('Setting tester hierarchy to 5 (Anggota)...')
  const { data, error } = await supabase
    .from('user')
    .update({ hierarchy: 5 })
    .eq('email', 'testerkmb@gmail.com')
    .select()

  if (error) {
    console.error('Update failed:', error)
  } else {
    console.log('Update successful! Row is now:', data)
  }

  await supabase.auth.signOut()
}

run()
