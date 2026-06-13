import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  console.log('Signing in with testerkmb@gmail.com...')
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'testerkmb@gmail.com',
    password: 'test1234'
  })

  if (authError) {
    console.error('Sign in failed:', authError.message)
    return
  }
  console.log('Sign in successful.')

  console.log('Querying blog_management for "Test Blog Author"...')
  const { data: blogs, error: blogErr } = await supabase
    .from('blog_management')
    .select('blog_id, title, author_name')
    .eq('title', 'Test Blog Author')
  
  if (blogErr) {
    console.error('Blog query error:', blogErr)
  } else {
    console.log('Blogs found:', blogs)
  }

  console.log('Querying all content_management entries...')
  const { data: videos, error: videoErr } = await supabase
    .from('content_management')
    .select('content_id, title, author_name')

  if (videoErr) {
    console.error('Video query error:', videoErr)
  } else {
    console.log('Videos found:', videos)
  }

  await supabase.auth.signOut()
}

check()
