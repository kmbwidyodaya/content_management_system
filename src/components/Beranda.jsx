import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Beranda({ user }) {
  const [profile, setProfile] = useState(null)
  const [positionName, setPositionName] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  
  // State for Change Password Feature
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [modalErrorMsg, setModalErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Auto-dismiss Success Message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setModalErrorMsg('')
    
    // Validation: Minimum length of 8 characters
    if (newPassword.length < 8) {
      setModalErrorMsg('Kata sandi baru harus memiliki minimal 8 karakter.')
      return
    }

    // Validation: At least one uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      setModalErrorMsg('Kata sandi baru harus mengandung minimal satu huruf besar (A-Z).')
      return
    }

    // Validation: At least one lowercase letter
    if (!/[a-z]/.test(newPassword)) {
      setModalErrorMsg('Kata sandi baru harus mengandung minimal satu huruf kecil (a-z).')
      return
    }

    // Validation: At least one number
    if (!/[0-9]/.test(newPassword)) {
      setModalErrorMsg('Kata sandi baru harus mengandung minimal satu angka (0-9).')
      return
    }

    // Validation: At least one symbol/special character
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setModalErrorMsg('Kata sandi baru harus mengandung minimal satu simbol/karakter khusus (misal: !, @, #, $, dll).')
      return
    }
    
    // Validation: Match passwords
    if (newPassword !== confirmPassword) {
      setModalErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.')
      return
    }
    
    setPasswordSubmitting(true)
    try {
      // Step 1: Re-authenticate to verify old password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      })

      if (verifyError) {
        throw new Error('Kata sandi lama salah atau tidak valid.')
      }

      // Step 2: Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setSuccessMsg('Kata sandi Anda berhasil diperbarui!')
      // Reset form & close modal
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsPasswordModalOpen(false)
    } catch (err) {
      console.error('Error updating password:', err)
      setModalErrorMsg(err.message || 'Gagal memperbarui kata sandi. Silakan coba lagi.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const fetchUserProfile = async () => {
    if (!user) return
    setLoading(true)
    setErrorMsg('')
    try {
      // 1. Coba JOIN query (menggunakan kolom 'name' dan relasi position)
      const { data: joinData, error: joinError } = await supabase
        .from('user')
        .select(`
          access,
          hierarchy,
          name,
          position (
            position
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!joinError && joinData) {
        setProfile({
          ...joinData,
          email: user.email // Gabungkan email dari auth session
        })
        
        let resolvedPos = ''
        if (joinData.position) {
          if (Array.isArray(joinData.position)) {
            resolvedPos = joinData.position[0]?.position || ''
          } else {
            resolvedPos = joinData.position.position || ''
          }
        }
        
        if (!resolvedPos) {
          const hVal = Number(joinData?.hierarchy)
          if (hVal === 1) resolvedPos = 'Owner'
          else if (hVal === 2) resolvedPos = 'Website Admin'
          else if (hVal === 3) resolvedPos = 'Content Manager'
          else if (hVal === 4) resolvedPos = 'Blog Manager'
          else if (hVal === 6) resolvedPos = 'Designer'
          else resolvedPos = 'Anggota'
        }
        
        setPositionName(resolvedPos)
      } else {
        console.warn('JOIN query failed in Beranda, using separate query fallback:', joinError)
        
        // 2. Fallback: Query tabel 'user' secara langsung untuk kolom 'access, hierarchy, name'
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('access, hierarchy, name')
          .eq('user_id', user.id)
          .maybeSingle()
          
        if (userError || !userData) {
          throw new Error('Gagal memuat profil pengguna dari database.')
        }
        
        setProfile({
          ...userData,
          email: user.email
        })
        
        // 3. Ambil data jabatan secara terpisah dari tabel 'position' berdasarkan 'hierarchy'
        const { data: posData } = await supabase
          .from('position')
          .select('position')
          .eq('hierarchy', userData.hierarchy)
          .maybeSingle()
          
        let resolvedPos = posData?.position || ''
        if (!resolvedPos) {
          const hVal = Number(userData.hierarchy)
          if (hVal === 1) resolvedPos = 'Owner'
          else if (hVal === 2) resolvedPos = 'Website Admin'
          else if (hVal === 3) resolvedPos = 'Content Manager'
          else if (hVal === 4) resolvedPos = 'Blog Manager'
          else if (hVal === 6) resolvedPos = 'Designer'
          else resolvedPos = 'Anggota'
        }
        
        setPositionName(resolvedPos)
      }
    } catch (err) {
      console.error('Error fetching profile in Beranda:', err)
      setErrorMsg(err.message || 'Terjadi kesalahan saat memuat data profil.')
    } finally {
      setLoading(false)
    }
  }

  // Pemicu query realtime ketika halaman dimuat
  useEffect(() => {
    fetchUserProfile()
  }, [user])

  // Inisial avatar
  const getInitial = () => {
    const name = profile?.name || user?.email || 'U'
    return name[0].toUpperCase()
  }

  // Nama tampilan
  const getDisplayName = () => {
    if (profile?.name && profile.name.trim() !== '') {
      return profile.name
    }
    return user?.email || 'Nama Belum Diatur'
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Notification for Success */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 transition-all duration-300 animate-bounce">
          <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Welcome Message Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 m-0">
          Selamat Datang di CMS KMB Widyodaya
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">
          Pusat kendali admin dan pengelolaan konten publikasi KMB Widyodaya.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center space-x-3 shadow-sm">
          <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-800 font-medium">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        /* Shimmer Loading for Profile Card */
        <div className="max-w-2xl bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-100/50">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="h-24 w-24 rounded-full shimmer-bg flex-shrink-0"></div>
            <div className="flex-1 space-y-3 w-full">
              <div className="h-6 w-1/3 shimmer-bg rounded"></div>
              <div className="h-4 w-1/2 shimmer-bg rounded"></div>
              <div className="h-4 w-1/4 shimmer-bg rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        /* Profile Card - Elegant Light Mode with Tailwind CSS */
        <div className="max-w-2xl bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/70 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.005]">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
            {/* Avatar container with dynamic gradient and initial */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center font-bold text-4xl shadow-md border-2 border-white">
                {getInitial()}
              </div>
              <span className="absolute bottom-0.5 right-0.5 block h-5.5 w-5.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs" title="Sesi Aktif"></span>
            </div>

            {/* Profile info list */}
            <div className="flex-1 min-w-0 w-full space-y-5 text-center sm:text-left">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Status: Terverifikasi
                </span>
                
                <h2 className="text-2xl font-bold text-slate-900 truncate tracking-tight m-0">
                  {getDisplayName()}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Anggota terdaftar sejak akun dibuat</p>
              </div>

              {/* Data Rows */}
              <div className="grid grid-cols-1 gap-3.5 pt-4 border-t border-slate-100 text-sm">
                {/* Full name detail */}
                <div className="flex flex-col sm:flex-row sm:items-center py-0.5">
                  <span className="text-slate-400 font-medium sm:w-36 flex-shrink-0">Nama Lengkap</span>
                  <span className="text-slate-800 font-semibold truncate mt-0.5 sm:mt-0">
                    {profile?.name ? profile.name : <span className="text-slate-400 italic">Nama Belum Diatur</span>}
                  </span>
                </div>

                {/* Email detail */}
                <div className="flex flex-col sm:flex-row sm:items-center py-0.5">
                  <span className="text-slate-400 font-medium sm:w-36 flex-shrink-0">Email</span>
                  <span className="text-slate-800 font-semibold truncate mt-0.5 sm:mt-0">
                    {profile?.email || user?.email || 'Belum Diatur'}
                  </span>
                </div>

                {/* Role/Position detail */}
                <div className="flex flex-col sm:flex-row sm:items-center py-0.5 border-b border-slate-100 pb-4">
                  <span className="text-slate-400 font-medium sm:w-36 flex-shrink-0">Role / Jabatan</span>
                  <span className="text-amber-600 font-bold truncate mt-0.5 sm:mt-0 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100 inline-block self-center sm:self-auto">
                    {positionName || 'Anggota'}
                  </span>
                </div>
              </div>

              {/* Ubah Kata Sandi Action Button */}
              <div className="pt-2 flex justify-center sm:justify-start">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-8-3a2 2 0 012-2m-2 4a2 2 0 012-2m18 1a6 6 0 01-10.124 4.376L3 21l1.624-5.876A6 6 0 1121 12z" />
                  </svg>
                  <span>Ubah Kata Sandi</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Info Tips / Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 m-0">Kelola Konten Video</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Terbitkan, edit, atau hapus konten video/link yang disematkan ke website utama.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-800 m-0">Kendali Hak Akses</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Kelola data hierarki jabatan, hak otorisasi akun, dan atur siapa saja yang memiliki akses login.
          </p>
        </div>
      </div>

      {/* Modal Overlay for Change Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <svg className="h-5.5 w-5.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Ubah Kata Sandi</span>
              </h2>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false)
                  setModalErrorMsg('')
                  setOldPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-5.5 w-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Error Alert */}
            {modalErrorMsg && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 flex items-center space-x-3 shadow-sm">
                <svg className="h-5.5 w-5.5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-red-800 font-medium">{modalErrorMsg}</p>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kata Sandi Lama <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi saat ini..."
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kata Sandi Baru <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 karakter (besar, kecil, & simbol)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
                
                {/* Real-time Stricter Password Rule Indicator List */}
                <div className="mt-2.5 space-y-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] sm:text-xs">
                  <p className="font-semibold text-slate-700 mb-1">Ketentuan Kata Sandi Baru:</p>
                  <div className="flex items-center space-x-2">
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${newPassword.length >= 8 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`}></span>
                    <span className={newPassword.length >= 8 ? 'text-emerald-700 font-semibold transition-colors duration-300' : 'text-slate-500'}>
                      Minimal 8 karakter {newPassword.length >= 8 && '✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`}></span>
                    <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-700 font-semibold transition-colors duration-300' : 'text-slate-500'}>
                      Minimal 1 huruf besar (A-Z) {/[A-Z]/.test(newPassword) && '✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${/[a-z]/.test(newPassword) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`}></span>
                    <span className={/[a-z]/.test(newPassword) ? 'text-emerald-700 font-semibold transition-colors duration-300' : 'text-slate-500'}>
                      Minimal 1 huruf kecil (a-z) {/[a-z]/.test(newPassword) && '✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${/[0-9]/.test(newPassword) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`}></span>
                    <span className={/[0-9]/.test(newPassword) ? 'text-emerald-700 font-semibold transition-colors duration-300' : 'text-slate-500'}>
                      Minimal 1 angka (0-9) {/[0-9]/.test(newPassword) && '✓'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`}></span>
                    <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-700 font-semibold transition-colors duration-300' : 'text-slate-500'}>
                      Minimal 1 simbol/karakter khusus (misal: !, @, #, dst.) {/[^A-Za-z0-9]/.test(newPassword) && '✓'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi kata sandi baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false)
                    setModalErrorMsg('')
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-slate-900 text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {passwordSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
