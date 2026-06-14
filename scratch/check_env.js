console.log('Env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('ROLE') || k.includes('KEY')))
console.log('SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
