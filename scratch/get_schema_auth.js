const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

async function run() {
  // 1. Sign in to get the JWT token
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

  // 2. Fetch the OpenAPI spec using the user JWT
  const responseSpec = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`
    }
  })
  const spec = await responseSpec.json()
  console.log('Root keys:', Object.keys(spec))
  if (spec.definitions) {
    console.log('blog_management spec:')
    console.log(JSON.stringify(spec.definitions.blog_management, null, 2))
  } else {
    console.log('Error or other response:', spec)
  }
}

run()
