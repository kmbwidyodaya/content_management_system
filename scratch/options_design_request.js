const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

async function run() {
  const response = await fetch(`${supabaseUrl}/rest/v1/design_request`, {
    method: 'OPTIONS',
    headers: {
      'apikey': supabaseAnonKey
    }
  })
  console.log('Status:', response.status)
  for (const [key, val] of response.headers.entries()) {
    console.log(`${key}: ${val}`)
  }
}

run()
