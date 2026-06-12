import React from 'react'

export default function AccessDenied({ userEmail, onLogout }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 glass-panel-gold p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden border border-amber-500/20 text-center">
        
        {/* Subtle decorative gold/amber glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-500/5 rounded-full blur-3xl -z-10"></div>

        <div>
          {/* Lock / Warning Symbol */}
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-slate-900/80 border border-red-500/30 shadow-lg shadow-red-500/5">
            <svg
              className="h-10 w-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
            Akses Ditolak
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Terhubung sebagai <span className="text-amber-400 font-medium">{userEmail}</span>
          </p>
        </div>

        <div className="py-4 border-t border-b border-slate-800 my-6">
          <p className="text-slate-300 font-medium leading-relaxed">
            Akses Ditolak: Akun Anda tidak memiliki izin untuk mengakses CMS KMB Widyodaya.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Hubungi administrator organisasi Anda untuk memperbarui tingkat hirarki akun Anda.
          </p>
        </div>

        <div>
          <button
            onClick={onLogout}
            className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-lg text-sm font-semibold text-slate-200 bg-slate-800/50 hover:bg-slate-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            Keluar & Gunakan Akun Lain
          </button>
        </div>
      </div>
    </div>
  )
}
