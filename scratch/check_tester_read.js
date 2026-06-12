import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Signing in with testerkmb@gmail.com...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testerkmb@gmail.com',
    password: 'test1234'
  })

  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }

  console.log('Sign in successful. User ID:', authData.user.id)

  console.log('Fetching positions (logged in)...')
  const { data: positions, error: posError } = await supabase.from('position').select('*')
  console.log('Positions (logged in):', positions, posError)

  console.log('Fetching permissions (logged in)...')
  const { data: permissions, error: permError } = await supabase.from('permission').select('*')
  console.log('Permissions (logged in):', permissions, permError)

  // Sign out
  await supabase.auth.signOut()
}

run()
