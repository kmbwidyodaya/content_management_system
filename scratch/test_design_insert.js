import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Signing in with testerkmb@gmail.com...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testerkmb@gmail.com',
    password: 'test1234'
  })

  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }
  
  const userId = authData.user.id
  console.log('Inserting into design_request...')
  const { data, error } = await supabase
    .from('design_request')
    .insert([
      {
        description: 'Test design request description',
        link: 'https://example.com/reference',
        status: 'Pending',
        user_id: userId
      }
    ])
    .select()

  if (error) {
    console.error('Insert failed:', error)
  } else {
    console.log('Insert succeeded! Created row:', data)
    
    // Clean up
    console.log('Cleaning up...')
    const { error: delError } = await supabase
      .from('design_request')
      .delete()
      .eq('request_id', data[0].request_id)
    console.log('Cleanup result error:', delError)
  }

  await supabase.auth.signOut()
}

test()
