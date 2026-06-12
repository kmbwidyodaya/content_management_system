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

  const columns = [
    'blog_id', 'title', 'text', 'created_at',
    'id', 'updated_at', 'deleted_at', 'status', 'published', 'is_published', 'draft',
    'slug', 'category', 'category_id', 'tags', 'tag_id', 'views', 'likes', 'shares',
    'image', 'image_url', 'cover_image', 'thumbnail', 'photo', 'url',
    'description', 'summary', 'excerpt', 'body', 'content', 'main_text', 'sub_title',
    'author', 'author_id', 'author_name', 'writer', 'writer_id', 'writer_name',
    'user_id', 'users_id', 'created_by', 'updated_by', 'admin_id', 'member_id',
    'email', 'name', 'hierarchy', 'link', 'embed_link', 'access', 'role', 'position',
    'blog_title', 'blog_text', 'blog_content', 'post_id', 'post_title', 'post_body'
  ]
  
  const existing = []
  
  for (const col of columns) {
    const { error } = await supabase.from('blog_management').select(col).limit(1)
    if (!error) {
      existing.push(col)
    }
  }

  console.log('Existing columns in blog_management:', existing)
  await supabase.auth.signOut()
}

run()
