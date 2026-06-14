import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import AccessDenied from './components/AccessDenied'
import Dashboard from './components/Dashboard'
import OnboardingChangePassword from './components/OnboardingChangePassword'

function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [permChecking, setPermChecking] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(null) // null, true, or false
  const [errorMessage, setErrorMessage] = useState('')
  const [userPosition, setUserPosition] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const lastUserIdRef = useRef(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [permissions, setPermissions] = useState({
    access: false,
    manage_permission: false,
    blog_management: false,
    design_management: false
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
      lastUserIdRef.current = null
      return
    }

    if (user.id === lastUserIdRef.current && isAuthorized === true) {
      return
    }

    lastUserIdRef.current = user.id

    const checkPermissions = async () => {
      setPermChecking(true)
      setErrorMessage('')
      
      let userData = {
        access: false,
        user_id: user.id,
        email: user.email,
        name: '',
        hierarchy: 4,
        change_pw: false
      }
      let currentPosName = ''

      try {
        // 1. JALUR UTAMA MASUK: Periksa kolom 'access', 'hierarchy', 'name', dan 'change_pw' di tabel 'user' secara bersamaan
        const { data: dbUser, error: dbUserError } = await supabase
          .from('user')
          .select('access, hierarchy, name, change_pw')
          .eq('user_id', user.id)
          .maybeSingle()

        if (dbUserError) {
          throw new Error(`Gagal memverifikasi izin akses di database: ${dbUserError.message}`)
        }

        if (!dbUser) {
          throw new Error('Akun Anda belum terdaftar di tabel pengguna database.')
        }

        userData.access = dbUser.access === true
        if (dbUser.name) userData.name = dbUser.name
        if (dbUser.hierarchy !== null && dbUser.hierarchy !== undefined) {
          userData.hierarchy = Number(dbUser.hierarchy)
        }
        userData.change_pw = dbUser.change_pw === true

        // Jika access FALSE, langsung batasi
        if (!userData.access) {
          setIsAuthorized(false)
          setPermChecking(false)
          return
        }

        // 2. QUERY JABATAN, ADMINISTRATOR, & PERIZINAN SECARA PARALEL (PROMISE.ALL)
        let posData = null
        let adminData = null
        let permData = null

        const fetchPermissionData = async (hierarchy) => {
          try {
            const { data, error } = await supabase
              .from('permission')
              .select('manage_user, content_management, blog_management, design_management')
              .eq('hierarchy', hierarchy)
              .maybeSingle()
            if (!error && data) return data

            // Fallback jika ada error struktur kolom
            const { data: fallbackData } = await supabase
              .from('permission')
              .select('manage_user, blog_management')
              .eq('hierarchy', hierarchy)
              .maybeSingle()
            return fallbackData || null
          } catch (e) {
            return null
          }
        }

        const safeFetch = async (queryPromise) => {
          try {
            const res = await queryPromise
            return res
          } catch (e) {
            return { data: null, error: e }
          }
        }

        try {
          const [posRes, adminRes, permResVal] = await Promise.all([
            safeFetch(supabase.from('position').select('position').eq('hierarchy', userData.hierarchy).maybeSingle()),
            safeFetch(supabase.from('administrator').select('manage_permission').eq('hierarchy', userData.hierarchy).maybeSingle()),
            fetchPermissionData(userData.hierarchy)
          ])

          posData = posRes?.data
          adminData = adminRes?.data
          permData = permResVal
        } catch (parallelErr) {
          console.warn('Gagal memuat detail perizinan secara paralel:', parallelErr)
        }

        if (posData && posData.position) {
          currentPosName = posData.position
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
            currentPosName = 'Blog Manager'
          } else if (hVal === 6) {
            currentPosName = 'Designer'
          } else {
            currentPosName = 'Anggota'
          }
        }

        // 3. AMBIL DETAIL PERIZINAN DENGAN FALLBACK JIKA DATA TIDAK DITEMUKAN DI DB
        let hasManageUser = false
        let hasManagePermission = false
        let hasContentManagement = false
        let hasBlogManagement = false
        let hasDesignManagement = false

        const hVal = Number(userData.hierarchy)
        if (hVal === 1) {
          hasManageUser = true
          hasManagePermission = true
          hasContentManagement = true
          hasBlogManagement = true
          hasDesignManagement = true
        } else if (hVal === 2) {
          hasManageUser = true
          hasManagePermission = false
          hasContentManagement = true
          hasBlogManagement = true
          hasDesignManagement = true
        } else if (hVal === 3) {
          hasManageUser = false
          hasManagePermission = false
          hasContentManagement = true
          hasBlogManagement = false
          hasDesignManagement = false
        } else if (hVal === 4) {
          hasManageUser = false
          hasManagePermission = false
          hasContentManagement = false
          hasBlogManagement = true
          hasDesignManagement = false
        } else if (hVal === 6) {
          hasManageUser = false
          hasManagePermission = false
          hasContentManagement = false
          hasBlogManagement = false
          hasDesignManagement = true
        } else {
          hasManageUser = false
          hasManagePermission = false
          hasContentManagement = false
          hasBlogManagement = false
          hasDesignManagement = false
        }

        if (adminData) {
          hasManagePermission = adminData.manage_permission === true
        }

        if (permData) {
          hasManageUser = permData.manage_user === true
          if (permData.content_management !== undefined) {
            hasContentManagement = permData.content_management === true
          }
          hasBlogManagement = permData.blog_management === true
          if (permData.design_management !== undefined) {
            hasDesignManagement = permData.design_management === true
          }
        }

        const finalPositionName = currentPosName || 'Anggota / Staf'
        const isAnggota = finalPositionName.toLowerCase().includes('anggota')

        // Simpan semua state yang diperlukan
        setUserProfile(userData)
        setUserPosition(finalPositionName)
        setPermissions({
          access: userData.access,
          manage_user: isAnggota ? false : hasManageUser,
          manage_permission: isAnggota ? false : hasManagePermission,
          content_management: isAnggota ? false : hasContentManagement,
          blog_management: isAnggota ? false : hasBlogManagement,
          design_management: isAnggota ? false : hasDesignManagement
        })

        if (userData.change_pw) {
          setMustChangePassword(true)
        } else {
          setMustChangePassword(false)
        }

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
    setMustChangePassword(false)
  }

  // 3. Inactivity Timeout (10 minutes)
  useEffect(() => {
    if (!user) return

    let timeoutId

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('Inactivity timeout reached, logging out...')
        handleLogout()
      }, 10 * 60 * 1000) // 10 minutes in ms
    }

    // Set up event listeners for user activity
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Initialize timer
    resetTimer()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [user])

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

  // If must change password, show onboarding
  if (mustChangePassword) {
    return (
      <OnboardingChangePassword
        user={user}
        onPasswordChanged={() => {
          setMustChangePassword(false)
          if (userProfile) {
            setUserProfile({ ...userProfile, change_pw: false })
          }
        }}
        onLogout={handleLogout}
      />
    )
  }

  // If authorized, show Dashboard
  if (isAuthorized === true) {
    return <Dashboard user={user} userProfile={userProfile} onLogout={handleLogout} permissions={permissions} userPosition={userPosition} />
  }

  return null
}

export default App
