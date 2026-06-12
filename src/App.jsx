import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import AccessDenied from './components/AccessDenied'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [permChecking, setPermChecking] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(null) // null, true, or false
  const [errorMessage, setErrorMessage] = useState('')
  const [userPosition, setUserPosition] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [permissions, setPermissions] = useState({
    access: false,
    manage_permission: false
  })

  // 1. Listen to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setAuthLoading(false)
        if (!session) {
          setIsAuthorized(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 2. Perform hierarchy check whenever user logs in
  useEffect(() => {
    if (!user) {
      setIsAuthorized(null)
      return
    }

    const checkPermissions = async () => {
      setPermChecking(true)
      setErrorMessage('')
      
      let userData = {
        access: false,
        user_id: user.id,
        email: user.email,
        name: '',
        hierarchy: 4
      }
      let currentPosName = ''

      try {
        // 1. JALUR UTAMA MASUK: Periksa kolom 'access' di tabel 'user'
        const { data: dbUser, error: dbUserError } = await supabase
          .from('user')
          .select('access')
          .eq('user_id', user.id)
          .maybeSingle()

        if (dbUserError) {
          throw new Error(`Gagal memverifikasi izin akses di database: ${dbUserError.message}`)
        }

        if (!dbUser) {
          throw new Error('Akun Anda belum terdaftar di tabel pengguna database.')
        }

        userData.access = dbUser.access === true

        // Jika access FALSE, langsung batasi
        if (!userData.access) {
          setIsAuthorized(false)
          setPermChecking(false)
          return
        }

        // 2. QUERY CADANGAN DETAIL PROFIL (FAIL-SAFE) - Menggunakan kolom 'name' (bukan 'full_name' / 'email')
        try {
          const { data: profileData } = await supabase
            .from('user')
            .select('hierarchy, name')
            .eq('user_id', user.id)
            .maybeSingle()

          if (profileData) {
            if (profileData.name) userData.name = profileData.name
            if (profileData.hierarchy !== null && profileData.hierarchy !== undefined) {
              userData.hierarchy = Number(profileData.hierarchy)
            }
          }
        } catch (profileErr) {
          console.warn('Gagal memuat detail profil tambahan (opsional):', profileErr)
        }

        // 3. AMBIL JABATAN SECARA DINAMIS DARI TABEL POSITION (FAIL-SAFE)
        try {
          const { data: posData, error: posError } = await supabase
            .from('position')
            .select('position')
            .eq('hierarchy', userData.hierarchy)
            .maybeSingle()
          
          if (!posError && posData && posData.position) {
            currentPosName = posData.position
          }
        } catch (posErr) {
          console.warn('Gagal memuat nama jabatan (opsional):', posErr)
        }

        if (!currentPosName) {
          const hVal = Number(userData.hierarchy)
          if (hVal === 1) {
            currentPosName = 'Owner'
          } else if (hVal === 2) {
            currentPosName = 'Website Admin'
          } else if (hVal === 3) {
            currentPosName = 'Content Manager'
          } else if (hVal === 4) {
            currentPosName = 'Regular Admin'
          } else {
            currentPosName = `Level ${userData.hierarchy}`
          }
        }

        // 4. AMBIL DETAIL PERIZINAN (FAIL-SAFE)
        let hasManageUser = false
        let hasManagePermission = false
        let hasContentManagement = false

        try {
          const { data: adminData } = await supabase
            .from('administrator')
            .select('manage_permission')
            .eq('hierarchy', userData.hierarchy)
            .maybeSingle()
          if (adminData) {
            hasManagePermission = adminData.manage_permission === true
          }
        } catch (adminErr) {
          console.warn('Gagal memuat izin administrator (opsional):', adminErr)
        }

        try {
          const { data: permData } = await supabase
            .from('permission')
            .select('manage_user, content_management')
            .eq('hierarchy', userData.hierarchy)
            .maybeSingle()
          if (permData) {
            hasManageUser = permData.manage_user === true
            hasContentManagement = permData.content_management === true
          } else {
            const { data: permFallback } = await supabase
              .from('permission')
              .select('manage_user')
              .eq('hierarchy', userData.hierarchy)
              .maybeSingle()
            if (permFallback) {
              hasManageUser = permFallback.manage_user === true
            }
            hasContentManagement = true
          }
        } catch (permErr) {
          console.warn('Gagal memuat detail perizinan (opsional):', permErr)
          hasContentManagement = true
        }

        // Simpan semua state yang diperlukan
        setUserProfile(userData)
        setUserPosition(currentPosName || 'Anggota / Staf')
        setPermissions({
          access: userData.access,
          manage_user: hasManageUser,
          manage_permission: hasManagePermission,
          content_management: hasContentManagement
        })

        // Karena access = TRUE, buka dashboard
        setIsAuthorized(true)

      } catch (err) {
        console.error('Permission check failed:', err)
        setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memverifikasi izin.')
        setIsAuthorized(false)
      } finally {
        setPermChecking(false)
      }
    }

    checkPermissions()
  }, [user])

  // Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsAuthorized(null)
  }

  // Loader screen
  if (authLoading || permChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        {/* Loading Spinner */}
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <div className="absolute rounded-full h-6 w-6 bg-amber-500/10"></div>
        </div>
        <p className="text-slate-400 text-sm font-semibold tracking-wider animate-pulse">
          {authLoading ? 'Memuat Sesi...' : 'Memverifikasi Akses Organisasi...'}
        </p>
      </div>
    )
  }

  // If user is not logged in, show Login
  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />
  }

  // If unauthorized (or check failed)
  if (isAuthorized === false) {
    return (
      <div className="space-y-6">
        <AccessDenied userEmail={user.email} onLogout={handleLogout} />

      </div>
    )
  }

  // If authorized, show Dashboard
  if (isAuthorized === true) {
    return <Dashboard user={user} userProfile={userProfile} onLogout={handleLogout} permissions={permissions} userPosition={userPosition} />
  }

  return null
}

export default App
