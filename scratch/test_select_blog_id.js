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

  const payload = {
    title: 'Workaround Title Test',
    subtitle: 'Workaround Subtitle Test',
    text: 'Workaround text content test'
  }

  console.log('Testing insert with select("blog_id")...')
  const { data, error } = await supabase.from('blog_management').insert([payload]).select('blog_id')
  if (error) {
    console.log('Insert with select("blog_id") failed:', error)
  } else {
    console.log('Insert with select("blog_id") SUCCEEDED! Data:', data)
    
    // Clean up
    if (data && data[0] && data[0].blog_id) {
      console.log('Cleaning up inserted row:', data[0].blog_id)
      await supabase.from('blog_management').delete().eq('blog_id', data[0].blog_id)
    }
  }

  await supabase.auth.signOut()
}

run()
