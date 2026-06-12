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

  console.log('Inserting blank row in blog_management...')
  const { data, error } = await supabase.from('blog_management').insert({}).select()
  if (error) {
    console.log('Insert returned error (this is helpful to inspect columns):', error)
  } else {
    console.log('Successfully inserted row! Columns are:')
    console.log(data)
    
    // Clean up: delete the inserted row
    if (data && data[0] && data[0].id) {
      console.log('Deleting test row...')
      await supabase.from('blog_management').delete().eq('id', data[0].id)
    } else if (data && data[0] && data[0].blog_id) {
      console.log('Deleting test row by blog_id...')
      await supabase.from('blog_management').delete().eq('blog_id', data[0].blog_id)
    }
  }

  await supabase.auth.signOut()
}

run()
