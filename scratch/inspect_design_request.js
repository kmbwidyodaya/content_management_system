import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspect() {
  console.log('Signing in with testerkmb@gmail.com...')
  await supabase.auth.signInWithPassword({
    email: 'testerkmb@gmail.com',
    password: 'test1234'
  })

  console.log('Fetching design_request with user join...')
  const { data, error } = await supabase
    .from('design_request')
    .select('*, user:user_id(name, email)')
    .limit(1)
  if (error) {
    console.error('Error fetching design_request with join:', error)
  } else {
    console.log('Data with join:', data)
  }
}

inspect()
