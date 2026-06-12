const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

async function run() {
  // 1. Sign in to get JWT token
  const responseLogin = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'ivanibrahim07@gmail.com',
      password: 'Rahasia1!'
    })
  })
  const loginData = await responseLogin.json()
  const token = loginData.access_token
  console.log('Got JWT Token:', token ? 'YES' : 'NO')

  if (!token) return

  // 2. Perform raw POST request to blog_management
  const payload = {
    title: 'Raw Title Test',
    subtitle: 'Raw Subtitle Test',
    text: 'Raw text content test'
  }

  const responseInsert = await fetch(`${supabaseUrl}/rest/v1/blog_management`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal' // Avoid fetching representation to see if that works
    },
    body: JSON.stringify(payload)
  })

  console.log('Insert Status:', responseInsert.status)
  const text = await responseInsert.text()
  console.log('Insert Response Body:', text)
}

run()
