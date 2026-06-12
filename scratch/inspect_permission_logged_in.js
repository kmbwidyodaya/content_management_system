import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Signing in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ivanibrahim07@gmail.com',
    password: 'Rahasia1!'
  })

  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }

  console.log('Sign in successful. User ID:', authData.user.id)

  console.log('Fetching permissions...')
  const { data: permissions, error: permError } = await supabase.from('permission').select('*')
  if (permError) {
    console.error('Error fetching permissions:', permError)
  } else {
    console.log('Permissions row count:', permissions.length)
    console.log('Permissions data:', permissions)
  }

  // Sign out
  await supabase.auth.signOut()
}

run()
