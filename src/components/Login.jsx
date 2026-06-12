import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data?.user) {
        onLoginSuccess(data.user)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk. Periksa kembali email dan sandi Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden border border-slate-100">
        
        {/* Subtle decorative gold glow behind logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>

        <div>
          {/* Logo container using widyodaya.svg */}
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-amber-50/50 border border-amber-200/50 shadow-xs">
            <img
              src="/widyodaya.svg"
              alt="Logo KMB Widyodaya"
              className="h-16 w-16 object-contain"
            />
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            KMB Widyodaya
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            Content Management System
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-xs">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-850 font-semibold">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-xs space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all duration-200 text-sm"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all duration-200 text-sm"
                placeholder="••••••••"
              />
            </div>
            
            {/* Lupa Password Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                className="text-xs text-amber-600 hover:text-amber-500 font-semibold transition-colors cursor-pointer focus:outline-none"
              >
                Lupa Password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-amber-500 transition-all duration-200 shadow-md shadow-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              {loading ? 'Menghubungkan...' : 'Masuk ke Dashboard'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal for Forgot Password Info */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-2xl text-center">
            
            {/* Info gold glow icon */}
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-amber-50 border border-amber-200/50 shadow-xs">
              <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">Pemulihan Kata Sandi</h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
              Mohon untuk menghubungi administrator Anda untuk membantu pemulihan password.
            </p>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 transition-all duration-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
