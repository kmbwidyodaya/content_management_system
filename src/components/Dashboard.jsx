import React, { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../supabaseClient'
import Beranda from './Beranda'

export default function Dashboard({ user, userProfile, onLogout, permissions = { access: true, manage_permission: false }, userPosition = '' }) {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Sidebar Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState('beranda') // 'beranda', 'konten', 'anggota', 'jabatan', 'akses'

  // Members Page State
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersSearchQuery, setMembersSearchQuery] = useState('')

  // Positions Page State
  const [positions, setPositions] = useState([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsError, setPositionsError] = useState('')

  // Permissions Page State
  const [permissionsList, setPermissionsList] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [currentContentId, setCurrentContentId] = useState(null)
  
  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formEmbedLink, setFormEmbedLink] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberHierarchy, setMemberHierarchy] = useState(4) // default to 4 (Anggota)
  const [memberAccess, setMemberAccess] = useState(false)
  const [memberSubmitting, setMemberSubmitting] = useState(false)

  // Edit Member Modal State
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [editMemberName, setEditMemberName] = useState('')
  const [editMemberHierarchy, setEditMemberHierarchy] = useState(4)
  const [editMemberAccess, setEditMemberAccess] = useState(false)
  const [editMemberPassword, setEditMemberPassword] = useState('')
  const [editMemberSubmitting, setEditMemberSubmitting] = useState(false)

  // Edit Position Modal State
  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState(null)
  const [editPositionName, setEditPositionName] = useState('')
  const [editPositionSubmitting, setEditPositionSubmitting] = useState(false)

  // Edit Permission Modal State
  const [isEditPermissionModalOpen, setIsEditPermissionModalOpen] = useState(false)
  const [editingPermissionRow, setEditingPermissionRow] = useState(null)
  const [editManageUser, setEditManageUser] = useState(false)
  const [editManagePermission, setEditManagePermission] = useState(false)
  const [editPermissionSubmitting, setEditPermissionSubmitting] = useState(false)

  // Add Position Modal State
  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false)
  const [addPositionHierarchy, setAddPositionHierarchy] = useState('')
  const [addPositionName, setAddPositionName] = useState('')
  const [addPositionSubmitting, setAddPositionSubmitting] = useState(false)

  // Add Permission Modal State
  const [isAddPermissionModalOpen, setIsAddPermissionModalOpen] = useState(false)
  const [addPermissionHierarchy, setAddPermissionHierarchy] = useState('')
  const [addManageUser, setAddManageUser] = useState(false)
  const [addManagePermission, setAddManagePermission] = useState(false)
  const [addPermissionSubmitting, setAddPermissionSubmitting] = useState(false)

  // Fetch Contents
  const fetchContents = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { data, error } = await supabase
        .from('content_management')
        .select('*')
        .order('content_id', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (err) {
      console.error(err)
      setErrorMsg('Gagal memuat konten dari database. Pastikan koneksi dan tabel database sudah benar.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch Members (from public.user)
  const fetchMembers = async () => {
    setMembersLoading(true)
    setErrorMsg('')
    try {
      let { data, error } = await supabase
        .from('user')
        .select('*')
        .order('hierarchy', { ascending: true })

      if (error) {
        console.warn('Failed to fetch members with hierarchy order, trying fallback:', error)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user')
          .select('*')
        if (fallbackError) throw fallbackError
        data = fallbackData
      }
      setMembers(data || [])
    } catch (err) {
      console.error(err)
      setErrorMsg('Gagal memuat daftar anggota dari tabel public.user.')
    } finally {
      setMembersLoading(false)
    }
  }

  // Toggle access status for user
  const handleToggleMemberAccess = async (userId, currentAccess) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('user')
        .update({ access: !currentAccess })
        .eq('user_id', userId)

      if (error) throw error
      setSuccessMsg('Status akses anggota berhasil diperbarui!')
      fetchMembers()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal memperbarui akses anggota: ${err.message}`)
    }
  }

  // Add new member to public.user table
  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberSubmitting(true)
    setErrorMsg('')
    try {
      const payload = {
        user_id: memberUserId.trim(),
        name: memberName.trim(),
        email: memberEmail.trim(),
        hierarchy: Number(memberHierarchy),
        access: memberAccess
      }

      const { error } = await supabase
        .from('user')
        .insert([payload])

      if (error) {
        if (error.code === '42703') { // Column does not exist
          console.warn('Email column does not exist in user table, retrying without email field.')
          const { email, ...safePayload } = payload
          const { error: fallbackErr } = await supabase
            .from('user')
            .insert([safePayload])
          if (fallbackErr) throw fallbackErr
        } else {
          throw error
        }
      }

      setSuccessMsg('Anggota baru berhasil ditambahkan!')
      setIsMemberModalOpen(false)
      // Reset form
      setMemberUserId('')
      setMemberName('')
      setMemberEmail('')
      setMemberHierarchy(4)
      setMemberAccess(false)

      fetchMembers()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal menambahkan anggota baru: ${err.message}`)
    } finally {
      setMemberSubmitting(false)
    }
  }

  // Helper untuk pengecekan izin kelola hak akses
  const cek_akses_manage_permission = () => {
    return permissions.manage_permission === true
  }

  // Edit member details in public.user table
  const handleEditMember = async (e) => {
    e.preventDefault()
    if (!editingMember) return
    setEditMemberSubmitting(true)
    setErrorMsg('')
    try {
      // Step 1: Admin forces password reset for member (if field is filled)
      if (editMemberPassword.trim() !== '') {
        if (!supabaseAdmin) {
          throw new Error('Supabase Service Role Key tidak terkonfigurasi. Silakan tambahkan VITE_SUPABASE_SERVICE_ROLE_KEY di berkas .env Anda agar Admin API dapat dijalankan.')
        }

        if (editMemberPassword.trim().length < 6) {
          throw new Error('Kata sandi baru minimal harus 6 karakter.')
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          editingMember.user_id,
          { password: editMemberPassword.trim() }
        )

        if (resetError) {
          throw new Error(`Gagal mereset kata sandi anggota: ${resetError.message}`)
        }
      }

      // Step 2: Update member profile database columns
      const { error } = await supabase
        .from('user')
        .update({
          name: editMemberName.trim(),
          hierarchy: Number(editMemberHierarchy),
          access: editMemberAccess
        })
        .eq('user_id', editingMember.user_id)

      if (error) throw error

      setSuccessMsg('Data anggota berhasil diperbarui!')
      setIsEditMemberModalOpen(false)
      setEditingMember(null)
      setEditMemberName('')
      setEditMemberPassword('')
      fetchMembers()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal memperbarui data anggota: ${err.message}`)
    } finally {
      setEditMemberSubmitting(false)
    }
  }

  // Edit position name in public.position table
  const handleEditPosition = async (e) => {
    e.preventDefault()
    if (!editingPosition) return
    setEditPositionSubmitting(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('position')
        .update({
          position: editPositionName.trim()
        })
        .eq('hierarchy', editingPosition.hierarchy)

      if (error) throw error

      setSuccessMsg('Nama jabatan berhasil diperbarui!')
      setIsEditPositionModalOpen(false)
      setEditingPosition(null)
      fetchPositions()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal memperbarui nama jabatan: ${err.message}`)
    } finally {
      setEditPositionSubmitting(false)
    }
  }

  // Edit combined permissions
  const handleEditPermissionRow = async (e) => {
    e.preventDefault()
    if (!editingPermissionRow) return
    setEditPermissionSubmitting(true)
    setErrorMsg('')
    try {
      // update or insert in permission table
      const { error: permError } = await supabase
        .from('permission')
        .upsert({
          hierarchy: Number(editingPermissionRow.hierarchy),
          manage_user: editManageUser
        })

      if (permError) throw permError

      // update or insert in administrator table
      const { error: adminError } = await supabase
        .from('administrator')
        .upsert({
          hierarchy: Number(editingPermissionRow.hierarchy),
          manage_permission: editManagePermission
        })

      if (adminError) throw adminError

      setSuccessMsg('Izin hak akses berhasil diperbarui!')
      setIsEditPermissionModalOpen(false)
      setEditingPermissionRow(null)
      fetchPermissionsList()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal memperbarui izin hak akses: ${err.message}`)
    } finally {
      setEditPermissionSubmitting(false)
    }
  }

  // Add new position to public.position table
  const handleAddPosition = async (e) => {
    e.preventDefault()
    setAddPositionSubmitting(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('position')
        .insert([
          {
            hierarchy: Number(addPositionHierarchy),
            position: addPositionName.trim()
          }
        ])

      if (error) throw error

      setSuccessMsg('Jabatan baru berhasil ditambahkan!')
      setIsAddPositionModalOpen(false)
      setAddPositionHierarchy('')
      setAddPositionName('')
      fetchPositions()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal menambahkan jabatan baru: ${err.message}`)
    } finally {
      setAddPositionSubmitting(false)
    }
  }

  // Add new permission rule
  const handleAddPermission = async (e) => {
    e.preventDefault()
    setAddPermissionSubmitting(true)
    setErrorMsg('')
    try {
      // insert to permission table
      const { error: permError } = await supabase
        .from('permission')
        .insert([
          {
            hierarchy: Number(addPermissionHierarchy),
            manage_user: addManageUser
          }
        ])

      if (permError) throw permError

      // insert to administrator table
      const { error: adminError } = await supabase
        .from('administrator')
        .insert([
          {
            hierarchy: Number(addPermissionHierarchy),
            manage_permission: addManagePermission
          }
        ])

      if (adminError) throw adminError

      setSuccessMsg('Aturan akses baru berhasil ditambahkan!')
      setIsAddPermissionModalOpen(false)
      setAddPermissionHierarchy('')
      setAddManageUser(false)
      setAddManagePermission(false)
      fetchPermissionsList()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal menambahkan aturan akses baru: ${err.message}`)
    } finally {
      setAddPermissionSubmitting(false)
    }
  }

  // Fetch Positions (from public.position)
  const fetchPositions = async () => {
    setPositionsLoading(true)
    setPositionsError('')
    try {
      const { data, error } = await supabase
        .from('position')
        .select('*')
        .order('hierarchy', { ascending: true })

      if (error) throw error
      setPositions(data || [])
    } catch (err) {
      console.error(err)
      setPositionsError('Gagal memuat data jabatan dari tabel public.position.')
    } finally {
      setPositionsLoading(false)
    }
  }

  // Fetch Combined Permissions & Administrators List
  const fetchPermissionsList = async () => {
    setPermissionsLoading(true)
    setPermissionsError('')
    try {
      const { data: permData, error: permError } = await supabase
        .from('permission')
        .select('*')

      const { data: adminData, error: adminError } = await supabase
        .from('administrator')
        .select('*')

      if (permError) throw permError
      if (adminError) throw adminError

      // Combine both lists based on 'hierarchy' column (BIGINT) using JS outer join
      const allHierarchies = Array.from(new Set([
        ...(permData || []).map((p) => String(p.hierarchy)),
        ...(adminData || []).map((a) => String(a.hierarchy))
      ]))

      const combined = allHierarchies.map((h) => {
        const p = (permData || []).find((x) => String(x.hierarchy) === h)
        const a = (adminData || []).find((x) => String(x.hierarchy) === h)
        return {
          hierarchy: h,
          manage_user: p ? p.manage_user === true : false,
          manage_permission: a ? a.manage_permission === true : false
        }
      }).sort((a, b) => Number(a.hierarchy) - Number(b.hierarchy))

      setPermissionsList(combined)
    } catch (err) {
      console.error(err)
      setPermissionsError('Gagal memuat data hak akses dan administrator.')
    } finally {
      setPermissionsLoading(false)
    }
  }

  // Load relevant data on activeMenu change
  useEffect(() => {
    if (activeMenu === 'konten') {
      fetchContents()
    } else if (activeMenu === 'anggota') {
      fetchMembers()
    } else if (activeMenu === 'jabatan') {
      fetchPositions()
    } else if (activeMenu === 'akses') {
      fetchPermissionsList()
    }
  }, [activeMenu])

  // Auto-dismiss Success Message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create')
    setCurrentContentId(null)
    setFormTitle('')
    setFormEmbedLink('')
    setFormDescription('')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (content) => {
    setModalMode('edit')
    setCurrentContentId(content.content_id)
    setFormTitle(content.title || '')
    setFormEmbedLink(content.embed_link || '')
    setFormDescription(content.description || '')
    setIsModalOpen(true)
  }

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false)
    setFormTitle('')
    setFormEmbedLink('')
    setFormDescription('')
  }

  // Create or Update content
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    setErrorMsg('')

    try {
      if (modalMode === 'create') {
        const { data, error } = await supabase
          .from('content_management')
          .insert([
            {
              title: formTitle,
              embed_link: formEmbedLink,
              description: formDescription
            }
          ])
          .select()

        if (error) throw error
        setSuccessMsg('Konten berhasil diterbitkan!')
      } else {
        const { data, error } = await supabase
          .from('content_management')
          .update({
            title: formTitle,
            embed_link: formEmbedLink,
            description: formDescription
          })
          .eq('content_id', currentContentId)
          .select()

        if (error) throw error
        setSuccessMsg('Konten berhasil diperbarui!')
      }

      closeModal()
      fetchContents()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal menyimpan konten: ${err.message || 'Terjadi kesalahan'}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete Content
  const handleDelete = async (contentId, title) => {
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus konten "${title}"?`)
    if (!isConfirmed) return

    try {
      const { error } = await supabase
        .from('content_management')
        .delete()
        .eq('content_id', contentId)

      if (error) throw error
      setSuccessMsg('Konten berhasil dihapus!')
      fetchContents()
    } catch (err) {
      console.error(err)
      setErrorMsg(`Gagal menghapus konten: ${err.message || 'Terjadi kesalahan'}`)
    }
  }

  // Filter contents by Search Query
  const filteredContents = contents.filter((c) => {
    const titleMatch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    const descMatch = (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const linkMatch = (c.embed_link || '').toLowerCase().includes(searchQuery.toLowerCase())
    return titleMatch || descMatch || linkMatch
  })

  // Filter members by Search Query
  const filteredMembers = members.filter((m) => {
    const emailMatch = (m.email || '').toLowerCase().includes(membersSearchQuery.toLowerCase())
    const idMatch = (m.user_id || '').toLowerCase().includes(membersSearchQuery.toLowerCase())
    return emailMatch || idMatch
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-12">
      {/* Toast Notification for Success */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 transition-all duration-300 animate-bounce">
          <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        ></div>
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {/* Widyodaya Logo */}
            <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-amber-50/50 border border-amber-200/50 shadow-xs">
              <img src="/widyodaya.svg" alt="Logo KMB Widyodaya" className="h-7.5 w-7.5 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              KMB Widyodaya
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            title="Tutup Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {/* Beranda: Always visible (requires access) */}
          {permissions.access && (
            <button
              onClick={() => {
                setActiveMenu('beranda');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                activeMenu === 'beranda'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Beranda</span>
            </button>
          )}

          {/* Kelola Konten: Always visible (requires access) */}
          {permissions.access && (
            <button
              onClick={() => {
                setActiveMenu('konten');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                activeMenu === 'konten'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Kelola Konten</span>
            </button>
          )}

          {/* Kelola Anggota: Visible if permissions.access === true */}
          {permissions.access && (
            <button
              onClick={() => {
                setActiveMenu('anggota');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                activeMenu === 'anggota'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Kelola Anggota</span>
            </button>
          )}

          {/* Kelola Jabatan: Visible if permissions.manage_permission === true */}
          {permissions.manage_permission && (
            <button
              onClick={() => {
                setActiveMenu('jabatan');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                activeMenu === 'jabatan'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Kelola Jabatan (Position)</span>
            </button>
          )}

          {/* Kelola Hak Akses: Visible if permissions.manage_permission === true */}
          {permissions.manage_permission && (
            <button
              onClick={() => {
                setActiveMenu('akses');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                activeMenu === 'akses'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-8-3a2 2 0 012-2m-2 4a2 2 0 012-2m-8-3a2 2 0 012-2m-2 4a2 2 0 012-2m18 1a6 6 0 01-10.124 4.376L3 21l1.624-5.876A6 6 0 1121 12z" />
              </svg>
              <span>Kelola Hak Akses</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              {userProfile?.name ? userProfile.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-900 font-bold truncate">{userProfile?.name || 'Nama Belum Diatur'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <p className="text-xs text-amber-600 font-semibold truncate">{userPosition || 'Anggota'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all cursor-pointer mr-1"
              title="Buka Menu Navigasi"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Widyodaya Logo */}
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-50/50 border border-amber-200/50 shadow-xs">
              <img src="/widyodaya.svg" alt="Logo KMB Widyodaya" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              CMS KMB Widyodaya
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm text-slate-700 font-semibold">{userProfile?.name || user.email}</span>
              <span className="text-xs text-amber-600 font-medium">{userPosition || 'Anggota'}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Error Alert inside main container */}
        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* -------------------- TAB: BERANDA -------------------- */}
        {activeMenu === 'beranda' && (
          <Beranda user={user} />
        )}

        {/* -------------------- TAB: KELOLA KONTEN -------------------- */}
        {activeMenu === 'konten' && (
          <>
            {/* Dashboard Title & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 m-0">
                  Kelola Konten
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Tambahkan, perbarui, atau hapus konten publikasi KMB Widyodaya.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari konten..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm"
                  />
                </div>

                {/* Create Button */}
                {permissions.content_management && (
                  <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Tambah Konten</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content List Table */}
            <div className="mt-8">
              {loading ? (
                /* Shimmer loading layout for Table */
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Judul Konten</th>
                        <th className="px-6 py-4">Deskripsi</th>
                        <th className="px-6 py-4">Embed Link</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3].map((n) => (
                        <tr key={n}>
                          <td className="px-6 py-4"><div className="h-4 w-8 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-40 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-60 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-48 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4 text-right"><div className="h-8 w-24 shimmer-bg rounded ml-auto"></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredContents.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-xl py-16 px-4 border border-slate-200 text-center max-w-xl mx-auto mt-12 shadow-sm">
                  <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold text-slate-800">Tidak ada konten ditemukan</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                    {searchQuery ? 'Tidak ada konten yang cocok dengan pencarian Anda.' : 'Belum ada konten di database. Klik tombol "Tambah Konten" untuk mulai menerbitkan.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-amber-600 hover:text-amber-500 font-semibold text-sm"
                    >
                      Clear pencarian
                    </button>
                  )}
                </div>
              ) : (
                /* Table Row List of Contents */
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Judul Konten</th>
                        <th className="px-6 py-4">Deskripsi</th>
                        <th className="px-6 py-4">Embed Link</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredContents.map((content) => (
                        <tr key={content.content_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-500">
                            {content.content_id}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {content.title}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={content.description}>
                            {content.description || <span className="text-slate-400 italic">Tidak ada deskripsi</span>}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            {content.embed_link ? (
                              <div className="flex items-center space-x-1.5">
                                <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded truncate max-w-[200px]" title={content.embed_link}>
                                  {content.embed_link}
                                </code>
                                <a
                                  href={content.embed_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-amber-500 transition-colors flex-shrink-0"
                                  title="Buka Link Semat"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Tidak ada link</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(content)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(content.content_id, content.title)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-transparent rounded-md text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------- TAB: KELOLA ANGGOTA -------------------- */}
        {activeMenu === 'anggota' && (
          <>
            {/* Dashboard Title & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 m-0">
                  Kelola Anggota
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Aktifkan atau nonaktifkan status izin akses CMS pengguna organisasi (Tabel: public.user).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari anggota..."
                    value={membersSearchQuery}
                    onChange={(e) => setMembersSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm"
                  />
                </div>

                {/* Add Member Button */}
                {permissions.manage_user && (
                  <button
                    onClick={() => setIsMemberModalOpen(true)}
                    className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Tambah Anggota</span>
                  </button>
                )}
              </div>
            </div>

            {/* Members List Table */}
            <div className="mt-8">
              {membersLoading ? (
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">No</th>
                        <th className="px-6 py-4">User ID (Supabase)</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Hierarki (ID)</th>
                        <th className="px-6 py-4 text-center">Status Akses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3].map((n) => (
                        <tr key={n}>
                          <td className="px-6 py-4"><div className="h-4 w-8 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-56 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-44 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-20 shimmer-bg rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-8 w-24 shimmer-bg rounded mx-auto"></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="bg-white rounded-xl py-16 px-4 border border-slate-200 text-center max-w-xl mx-auto mt-12 shadow-sm">
                  <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold text-slate-800">Tidak ada anggota ditemukan</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                    Tidak ada data anggota di dalam tabel `public.user`.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">No</th>
                        <th className="px-6 py-4">User ID (Supabase)</th>
                        <th className="px-6 py-4">Nama Lengkap</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Hierarki (ID)</th>
                        <th className="px-6 py-4 text-center">Status Akses CMS</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMembers.map((member, index) => (
                        <tr key={member.user_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                            {member.user_id}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {member.name || <span className="text-slate-400 italic">Belum Diatur</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {member.email || <span className="text-slate-400 italic">Tidak Tersedia</span>}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600 font-semibold">
                            {member.hierarchy !== null && member.hierarchy !== undefined ? String(member.hierarchy) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleToggleMemberAccess(member.user_id, member.access)}
                              className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                                member.access
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${member.access ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              {member.access ? 'Aktif (Diizinkan)' : 'Nonaktif (Ditolak)'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              disabled={!permissions.manage_user}
                              onClick={() => {
                                setEditingMember(member)
                                setEditMemberName(member.name || '')
                                setEditMemberHierarchy(member.hierarchy || 4)
                                setEditMemberAccess(member.access === true)
                                setIsEditMemberModalOpen(true)
                              }}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold transition-all shadow-sm ${
                                permissions.manage_user
                                  ? 'text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                                  : 'text-slate-300 bg-slate-50 cursor-not-allowed border-slate-100'
                              }`}
                              title={permissions.manage_user ? "Edit Anggota" : "Izin Edit Ditolak"}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------- TAB: KELOLA JABATAN -------------------- */}
        {activeMenu === 'jabatan' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 m-0">
                  Kelola Jabatan (Position)
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Daftar tingkat hierarki jabatan organisasi (Tabel: public.position).
                </p>
              </div>
              {cek_akses_manage_permission() && (
                <button
                  onClick={() => setIsAddPositionModalOpen(true)}
                  className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah Jabatan</span>
                </button>
              )}
            </div>

            <div className="mt-8">
              {positionsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
                </div>
              ) : positionsError ? (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 shadow-sm text-red-800 text-sm">
                  {positionsError}
                </div>
              ) : positions.length === 0 ? (
                <div className="bg-white rounded-xl py-16 px-4 border border-slate-200 text-center max-w-xl mx-auto shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800">Belum ada data jabatan</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Tabel `position` kosong atau tidak memiliki entri data.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Tingkat Hierarki (ID)</th>
                        <th className="px-6 py-4">Nama Jabatan</th>
                        {cek_akses_manage_permission() && <th className="px-6 py-4 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {positions.map((pos) => (
                        <tr key={pos.hierarchy} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">{String(pos.hierarchy)}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {pos.position || (Number(pos.hierarchy) === 1 ? 'Owner' : Number(pos.hierarchy) === 2 ? 'Website Admin' : Number(pos.hierarchy) === 3 ? 'Content Manager' : Number(pos.hierarchy) === 4 ? 'Regular Admin' : `Level ${pos.hierarchy}`)}
                          </td>
                          {cek_akses_manage_permission() && (
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => {
                                  setEditingPosition(pos)
                                  setEditPositionName(pos.position || (Number(pos.hierarchy) === 1 ? 'Owner' : Number(pos.hierarchy) === 2 ? 'Website Admin' : Number(pos.hierarchy) === 3 ? 'Content Manager' : Number(pos.hierarchy) === 4 ? 'Regular Admin' : `Level ${pos.hierarchy}`))
                                  setIsEditPositionModalOpen(true)
                                }}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------- TAB: KELOLA HAK AKSES -------------------- */}
        {activeMenu === 'akses' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 m-0">
                  Kelola Hak Akses
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Gabungan data otorisasi dan kontrol perizinan administrator (Tabel: public.permission & public.administrator).
                </p>
              </div>
              {cek_akses_manage_permission() && (
                <button
                  onClick={() => setIsAddPermissionModalOpen(true)}
                  className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah Aturan Akses</span>
                </button>
              )}
            </div>

            <div className="mt-8">
              {permissionsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
                </div>
              ) : permissionsError ? (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 shadow-sm text-red-800 text-sm">
                  {permissionsError}
                </div>
              ) : permissionsList.length === 0 ? (
                <div className="bg-white rounded-xl py-16 px-4 border border-slate-200 text-center max-w-xl mx-auto shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800">Belum ada data hak akses</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Tabel `permission` atau `administrator` kosong.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Tingkat Hierarki (ID)</th>
                        <th className="px-6 py-4 text-center">Izin Kelola Anggota (public.permission)</th>
                        <th className="px-6 py-4 text-center">Izin Kelola Hak Akses (public.administrator)</th>
                        {cek_akses_manage_permission() && <th className="px-6 py-4 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {permissionsList.map((perm) => (
                        <tr key={perm.hierarchy} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">{String(perm.hierarchy)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              perm.manage_user
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {perm.manage_user ? 'Ya (TRUE)' : 'Tidak (FALSE)'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              perm.manage_permission
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {perm.manage_permission ? 'Ya (TRUE)' : 'Tidak (FALSE)'}
                            </span>
                          </td>
                          {cek_akses_manage_permission() && (
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => {
                                  setEditingPermissionRow(perm)
                                  setEditManageUser(perm.manage_user === true)
                                  setEditManagePermission(perm.manage_permission === true)
                                  setIsEditPermissionModalOpen(true)
                                }}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal Overlay for Create & Edit (Only for Content tab) */}
      {isModalOpen && activeMenu === 'konten' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === 'create' ? 'Terbitkan Konten Baru' : 'Edit Konten'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Judul Konten <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan judul konten..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Link Semat / Embed Link <span className="text-amber-600">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://contoh.com/embed/..."
                  value={formEmbedLink}
                  onChange={(e) => setFormEmbedLink(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Harus berupa URL valid (contoh: link video YouTube, google map, atau link dokumen).
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deskripsi Konten
                </label>
                <textarea
                  rows="4"
                  placeholder="Tuliskan deskripsi konten di sini..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm resize-none"
                ></textarea>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {formSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>{modalMode === 'create' ? 'Terbitkan Konten' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overlay for Add Member (Only for Anggota tab) */}
      {isMemberModalOpen && activeMenu === 'anggota' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Tambah Anggota Baru
              </h2>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddMember} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  User ID Supabase (UUID) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan UUID user dari Supabase Auth..."
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Lengkap <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap anggota..."
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-amber-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@domain.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hierarki Jabatan <span className="text-amber-600">*</span>
                </label>
                <select
                  value={memberHierarchy}
                  onChange={(e) => setMemberHierarchy(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm cursor-pointer"
                >
                  <option value={1}>1 - Owner</option>
                  <option value={2}>2 - Website Admin</option>
                  <option value={3}>3 - Website Moderator</option>
                  <option value={4}>4 - Anggota / Staf</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="memberAccess"
                  checked={memberAccess}
                  onChange={(e) => setMemberAccess(e.target.checked)}
                  className="h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="memberAccess" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Izin Akses CMS (access)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={memberSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {memberSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Anggota</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overlay for Edit Member (Only for Anggota tab) */}
      {isEditMemberModalOpen && activeMenu === 'anggota' && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Anggota
              </h2>
              <button
                onClick={() => {
                  setIsEditMemberModalOpen(false)
                  setEditingMember(null)
                  setEditMemberPassword('')
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditMember} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  User ID Supabase (UUID)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingMember.user_id}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-505 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Lengkap <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap anggota..."
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={editingMember.email}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              {/* Reset Password Field - Only visible/editable if user has manage_user permission */}
              {permissions.manage_user && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reset Password Anggota (Opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi baru anggota..."
                    value={editMemberPassword}
                    onChange={(e) => setEditMemberPassword(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Kosongkan kolom ini jika tidak ingin mengubah kata sandi anggota.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hierarki Jabatan <span className="text-amber-600">*</span>
                </label>
                <select
                  value={editMemberHierarchy}
                  onChange={(e) => setEditMemberHierarchy(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm cursor-pointer"
                >
                  <option value={1}>1 - Owner</option>
                  <option value={2}>2 - Website Admin</option>
                  <option value={3}>3 - Website Moderator</option>
                  <option value={4}>4 - Anggota / Staf</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="editMemberAccess"
                  checked={editMemberAccess}
                  onChange={(e) => setEditMemberAccess(e.target.checked)}
                  className="h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="editMemberAccess" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Izin Akses CMS (access)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMemberModalOpen(false)
                    setEditingMember(null)
                    setEditMemberPassword('')
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editMemberSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editMemberSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
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

      {/* Modal Overlay for Edit Position (Only for Jabatan tab) */}
      {isEditPositionModalOpen && activeMenu === 'jabatan' && editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Nama Jabatan
              </h2>
              <button
                onClick={() => {
                  setIsEditPositionModalOpen(false)
                  setEditingPosition(null)
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditPosition} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Tingkat Hierarki (ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPosition.hierarchy}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Jabatan <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama jabatan..."
                  value={editPositionName}
                  onChange={(e) => setEditPositionName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditPositionModalOpen(false)
                    setEditingPosition(null)
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editPositionSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editPositionSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
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

      {/* Modal Overlay for Edit Permission (Only for Akses tab) */}
      {isEditPermissionModalOpen && activeMenu === 'akses' && editingPermissionRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Hak Akses & Perizinan
              </h2>
              <button
                onClick={() => {
                  setIsEditPermissionModalOpen(false)
                  setEditingPermissionRow(null)
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditPermissionRow} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-505 mb-1">
                  Tingkat Hierarki (ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPermissionRow.hierarchy}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-505 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col space-y-4 pt-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editManageUser"
                    checked={editManageUser}
                    onChange={(e) => setEditManageUser(e.target.checked)}
                    className="h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="editManageUser" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Izin Kelola Anggota (public.permission.manage_user)
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editManagePermission"
                    checked={editManagePermission}
                    onChange={(e) => setEditManagePermission(e.target.checked)}
                    className="h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="editManagePermission" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Izin Kelola Hak Akses (public.administrator.manage_permission)
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditPermissionModalOpen(false)
                    setEditingPermissionRow(null)
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editPermissionSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editPermissionSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
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

      {/* Modal Overlay for Add Position (Only for Jabatan tab) */}
      {isAddPositionModalOpen && activeMenu === 'jabatan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Tambah Jabatan Baru
              </h2>
              <button
                onClick={() => setIsAddPositionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPosition} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tingkat Hierarki (ID) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan angka hierarki (misal: 5)..."
                  value={addPositionHierarchy}
                  onChange={(e) => setAddPositionHierarchy(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Jabatan <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama jabatan baru..."
                  value={addPositionName}
                  onChange={(e) => setAddPositionName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsAddPositionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addPositionSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {addPositionSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Jabatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overlay for Add Permission (Only for Akses tab) */}
      {isAddPermissionModalOpen && activeMenu === 'akses' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Tambah Aturan Akses
              </h2>
              <button
                onClick={() => setIsAddPermissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPermission} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tingkat Hierarki (ID) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Masukkan angka hierarki (misal: 5)..."
                  value={addPermissionHierarchy}
                  onChange={(e) => setAddPermissionHierarchy(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm font-mono"
                />
              </div>

              <div className="flex flex-col space-y-4 pt-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="addManageUser"
                    checked={addManageUser}
                    onChange={(e) => setAddManageUser(e.target.checked)}
                    className="h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="addManageUser" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Izin Kelola Anggota (manage_user)
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="addManagePermission"
                    checked={addManagePermission}
                    onChange={(e) => setAddManagePermission(e.target.checked)}
                    className="h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="addManagePermission" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Izin Kelola Hak Akses (manage_permission)
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsAddPermissionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addPermissionSubmitting}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {addPermissionSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Aturan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
