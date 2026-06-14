import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function OnboardingChangePassword({ user, onPasswordChanged, onLogout }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Password requirement states
  const [meetsLength, setMeetsLength] = useState(false)
  const [meetsUppercase, setMeetsUppercase] = useState(false)
  const [meetsLowercase, setMeetsLowercase] = useState(false)
  const [meetsNumber, setMeetsNumber] = useState(false)
  const [meetsSpecialChar, setMeetsSpecialChar] = useState(false)

  useEffect(() => {
    setMeetsLength(password.length >= 8)
    setMeetsUppercase(/[A-Z]/.test(password))
    setMeetsLowercase(/[a-z]/.test(password))
    setMeetsNumber(/[0-9]/.test(password))
    // Any character that is not a letter or a number counts as a special character
    setMeetsSpecialChar(/[^A-Za-z0-9]/.test(password))
  }, [password])

  const allRequirementsMet = meetsLength && meetsUppercase && meetsLowercase && meetsNumber && meetsSpecialChar
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allRequirementsMet) {
      setErrorMsg('Kata sandi baru Anda belum memenuhi semua ketentuan yang diwajibkan.')
      return
    }
    if (!passwordsMatch) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      })

      if (authError) throw authError

      // 2. Update change_pw status to false in public.user table
      const { error: dbError } = await supabase
        .from('user')
        .update({ change_pw: false })
        .eq('user_id', user.id)

      if (dbError) throw dbError

      setSuccessMsg('Kata sandi berhasil diperbarui! Mengalihkan Anda...')
      setTimeout(() => {
        onPasswordChanged()
      }, 1500)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Gagal memperbarui kata sandi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 text-slate-800 relative">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden border border-slate-100">
        
        {/* Subtle decorative gold glow behind logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="text-center">
          {/* Logo container using widyodaya.png */}
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-amber-50/50 border border-amber-200/50 shadow-xs">
            <img
              src="/widyodaya.png"
              alt="Logo KMB Widyodaya"
              className="h-16 w-16 object-contain"
            />
          </div>
          
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Perbarui Kata Sandi Anda
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Demi keamanan akun, silakan ubah kata sandi default Anda sebelum masuk ke Dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-xs">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-650" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-semibold">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4 shadow-xs">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-emerald-800 font-semibold">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* New Password input */}
          <div className="relative">
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
              Kata Sandi Baru <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 pr-11 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all duration-200 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="relative">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 pr-11 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all duration-200 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {password.length > 0 && confirmPassword.length > 0 && (
              <span className={`text-xs font-semibold mt-1 block ${passwordsMatch ? 'text-emerald-650' : 'text-rose-500'}`}>
                {passwordsMatch ? '✓ Kata sandi cocok' : '✗ Kata sandi tidak cocok'}
              </span>
            )}
          </div>

          {/* Interactive Password Requirements List */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Ketentuan Kata Sandi Baru
            </h3>
            
            <ul className="text-xs space-y-1.5 font-medium">
              <li className={`flex items-center space-x-2 transition-colors duration-250 ${meetsLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${meetsLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {meetsLength ? '✓' : '•'}
                </span>
                <span>Minimal 8 karakter</span>
              </li>

              <li className={`flex items-center space-x-2 transition-colors duration-250 ${meetsUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${meetsUppercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {meetsUppercase ? '✓' : '•'}
                </span>
                <span>Minimal 1 huruf besar (A-Z)</span>
              </li>

              <li className={`flex items-center space-x-2 transition-colors duration-250 ${meetsLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${meetsLowercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {meetsLowercase ? '✓' : '•'}
                </span>
                <span>Minimal 1 huruf kecil (a-z)</span>
              </li>

              <li className={`flex items-center space-x-2 transition-colors duration-250 ${meetsNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${meetsNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {meetsNumber ? '✓' : '•'}
                </span>
                <span>Minimal 1 angka (0-9)</span>
              </li>

              <li className={`flex items-center space-x-2 transition-colors duration-250 ${meetsSpecialChar ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${meetsSpecialChar ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {meetsSpecialChar ? '✓' : '•'}
                </span>
                <span>Minimal 1 simbol/karakter khusus (misal: !, @, #, dst.)</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row-reverse sm:space-x-reverse sm:space-x-3 space-y-3 sm:space-y-0">
            <button
              type="submit"
              disabled={loading || !allRequirementsMet || !passwordsMatch}
              className="w-full sm:flex-1 py-3 px-4 rounded-lg text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 shadow-md shadow-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              {loading ? 'Menyimpan...' : 'Perbarui & Masuk'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto py-3 px-5 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-sm rounded-lg transition-all cursor-pointer text-center"
            >
              Keluar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
