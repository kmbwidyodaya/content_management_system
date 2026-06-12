const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

async function run() {
  const response = await fetch(`${supabaseUrl}/rest/v1/blog_management`, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Range': '0-0', // Just get 1 item
      'Prefer': 'count=exact'
    }
  })
  console.log('Status:', response.status)
  console.log('Headers:', Object.fromEntries(response.headers.entries()))
  const text = await response.text()
  console.log('Body:', text)
}

run()
