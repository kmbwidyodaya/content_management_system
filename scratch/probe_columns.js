import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiihdvginfyqaltdifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaWloZHZnaW5meXFhbHRkaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjE4MzQsImV4cCI6MjA5Njc5NzgzNH0.h_5bBZazUshrWgFetUKEjsAg0O5STKG0ktpTF8pgcdA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const columnsToProbe = [
  'request_id',
  'description',
  'created_at',
  'status',
  'link',
  'user_id',
  'judul',
  'nama',
  'deskripsi',
  'catatan',
  'keterangan'
]

async function probe() {
  console.log('Probing columns for design_request table...')
  const existingCols = []
  
  for (const col of columnsToProbe) {
    const { error } = await supabase.from('design_request').select(col).limit(1)
    if (!error) {
      existingCols.push(col)
      console.log(`Column exists: ${col}`)
    } else {
      if (error.code !== 'PGRST204') {
        console.log(`Column ${col} query error:`, error.message, error.code)
      }
    }
  }

  console.log('Resulting existing columns:', existingCols)
}

probe()
