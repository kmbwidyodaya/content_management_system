import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Fetching all permissions...')
  const { data: permissions, error: permError } = await supabase.from('permission').select('*')
  if (permError) {
    console.error('Error fetching permissions:', permError)
  } else {
    console.log('Permissions:', permissions)
  }

  console.log('Fetching all users...')
  const { data: users, error: userError } = await supabase.from('user').select('*')
  if (userError) {
    console.error('Error fetching users:', userError)
  } else {
    console.log('Users:', users.map(u => ({ id: u.id, user_id: u.user_id, email: u.email, hierarchy: u.hierarchy, name: u.name })))
  }
}

run()
