import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Logging in as admin ivanibrahim07@gmail.com...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ivanibrahim07@gmail.com',
    password: 'Rahasia1!'
  })
  if (authError) {
    console.error('Admin login failed:', authError.message)
    return
  }
  console.log('Admin login successful! Setting change_pw = true for testerkmb@gmail.com...')
  
  const { data: updateData, error: updateError } = await supabase
    .from('user')
    .update({ change_pw: true })
    .eq('email', 'testerkmb@gmail.com')
    .select()

  if (updateError) {
    console.error('UPDATE FAILED:', updateError.message)
  } else {
    console.log('UPDATE SUCCESSFUL! Result:', updateData)
  }

  await supabase.auth.signOut()
}
test()
