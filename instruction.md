Halo Antigravity, saya ingin membuat sebuah Dashboard CMS (Content Management System) untuk website organisasi saya yang bernama "CMS KMB Widyodaya". Aplikasi ini akan dibuat menggunakan teknologi web modern (HTML/JS dengan Tailwind CSS atau React/Next.js).

Aplikasi ini harus terhubung dengan database Supabase saya yang memiliki URL project: https://supabase.com/dashboard/project/aoiihdvginfyqaltdifi

Tolong buatkan halaman CMS ini dengan memperhatikan arsitektur, nama aplikasi, dan logika keamanan database saya berikut:

1. IDENTITAS & DESAIN (UI/UX):
- Beri nama aplikasi ini di bagian Header/Navbar: "CMS KMB Widyodaya".
- Buat tampilan yang bersih, minimalis, dan responsif menggunakan Tailwind CSS. 
- Gunakan tema warna profesional yang cocok untuk organisasi Keluarga Mahasiswa Buddhis (KMB), misalnya perpaduan warna yang tenang seperti biru tua/navy, putih, dan sedikit aksen emas/kuning lembut.

2. KONEKSI UTAMA:
Buat koneksi ke Supabase menggunakan @supabase/supabase-js. Sediakan tempat atau file konfigurasi untuk memasukkan SUPABASE_URL dan SUPABASE_ANON_KEY.

3. LOGIKA OTORISASI (AUTH):
- Buat halaman Login sederhana dengan form Email & Password menggunakan Supabase Auth.
- Setelah user berhasil login, aplikasi harus memeriksa izin akses user tersebut sebelum membuka dashboard.
- Logika pengecekan: Ambil data user dari tabel 'public.user' berdasarkan 'auth.uid()'. Dapatkan nilai 'hierarchy'-nya. Lalu periksa ke tabel 'public.permission' apakah 'hierarchy' tersebut memiliki kolom 'content_management' bernilai TRUE.
- Jika 'content_management = FALSE' atau user belum login, kunci halamannya dan tampilkan pesan peringatan: "Akses Ditolak: Akun Anda tidak memiliki izin untuk mengelola konten KMB Widyodaya".

4. DASHBOARD CMS KMB WIDYODAYA (CRUD):
Jika user lolos pengecekan dan memiliki izin 'content_management = TRUE', tampilkan halaman utama CMS dengan fitur sebagai berikut:
- READ: Tampilkan daftar konten yang sudah ada dari tabel 'public.content_management' dalam bentuk tabel atau kartu (Card Grid) yang rapi. Kolom yang ditampilkan meliputi: content_id, title, embed_link, dan description.
- CREATE: Buat sebuah formulir (Form Input) untuk menambahkan konten baru ke tabel 'public.content_management'. Input terdiri dari: Judul Konten (title), Link Semat/Embed (embed_link), dan Deskripsi Konten (description). Sediakan tombol "Terbitkan Konten".
- UPDATE & DELETE: Di setiap baris atau kartu konten, berikan tombol "Edit" untuk memperbarui data dan tombol "Hapus" untuk menghapus data berdasarkan 'content_id'.

Tolong buatkan seluruh struktur file beserta kodenya secara bertahap, dan berikan panduan mudah tentang cara menjalankan aplikasi ini di komputer lokal saya. Terima kasih!