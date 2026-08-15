# Product Requirement Document (PRD)

## 1. Ringkasan Proyek (Project Overview)
Aplikasi **Si Catat** adalah platform pencatatan keuangan internal kontrakan berbasis web yang gratis, transparan, dan otomatis. Aplikasi ini dirancang untuk mempermudah bendahara dalam mengelola iuran bulanan yang fleksibel (mendukung cicilan), mencatat pengeluaran operasional secara *real-time*, mengalkulasi sisa saldo/defisit lintas bulan secara otomatis, serta menghasilkan rekap teks siap kirim ke grup WhatsApp.

---

## 2. Arsitektur & Tech Stack
* **Frontend & Fullstack Framework:** Next.js (App Router, React, Tailwind CSS)
* **Backend & API:** Next.js Server Actions / API Routes
* **Database:** Supabase (PostgreSQL Free Tier)
* **Deployment Platform:** Vercel (Hobby Free Plan)
* **Keep-Alive Mechanism:** GitHub Actions / Cron Job (Ping berkala agar Supabase Free Tier tidak *auto-pause*)
* **UI Design System:** Merujuk pada panduan `DESIGN.MD`

---

## 3. Peran Pengguna & Hak Akses (User Roles & Access)

| Peran | Autentikasi | Hak Akses |
| :--- | :--- | :--- |
| **User (Anak Kontrakan / Publik)** | Tanpa Login (Akses URL langsung) | • Melihat ringkasan kas bulan berjalan (Saldo Awal, Total Masuk, Total Keluar, Sisa Saldo).<br>• Melihat riwayat pengeluaran & rincian iuran per anggota.<br>• Memilih arsip bulan-bulan sebelumnya.<br>• Menyalin format rekap teks WhatsApp. |
| **Admin (Bendahara)** | Login Password Tunggal (Tanpa Gmail/OAuth) | • Seluruh hak akses User.<br>• Tambah, edit, dan nonaktifkan anggota kontrakan.<br>• Input & hapus transaksi pemasukan (iuran anggota).<br>• Input & hapus transaksi pengeluaran.<br>• Akses panel admin khusus (`/admin` atau modal login). |

---

## 4. Logika Bisnis Utama (Core Business Logic)

### A. Mekanisme Pergantian Bulan & Rollover Saldo (Otomatis per Tanggal 1)
1. **Sistem Periode Otomatis:** Sistem mendeteksi bulan dan tahun berjalan berdasarkan waktu server/lokal (indonesia). Setiap masuk tanggal 1 bulan baru, periode baru langsung aktif.
2. **Kalkulasi Saldo Awal (Carry-over Balance):**
   $$\text{Saldo Awal Bulan } N = \text{Sisa Saldo Akhir Bulan } (N - 1)$$
3. **Penanganan Saldo Defisit (Minus):**
   * Jika pada bulan sebelumnya total pengeluaran lebih besar dari pemasukan, sisa saldo akan bernilai negatif ($-\text{Rp X}$).
   * Nilai negatif tersebut otomatis menjadi saldo awal bulan baru, sehingga pemasukan iuran yang baru masuk otomatis menutupi defisit terlebih dahulu.

### B. Perhitungan Arus Kas Periode Berjalan
$$\text{Total Pemasukan Bulan Ini} = \sum \text{Iuran Anggota Masuk}$$
$$\text{Total Kas Masuk} = \text{Saldo Awal (Sisa Bulan Lalu)} + \text{Total Pemasukan Bulan Ini}$$
$$\text{Total Pengeluaran} = \sum \text{Pengeluaran Operasional}$$
$$\text{Sisa Saldo Kas} = \text{Total Kas Masuk} - \text{Total Pengeluaran}$$

### C. Fleksibilitas Iuran Anggota
* Tidak ada validasi target nominal tetap atau status kaku "Lunas / Belum Lunas".
* Anggota dapat membayar iuran secara bertahap (mencicil). Setiap setoran baru akan dijumlahkan ke total akumulasi iuran anggota tersebut pada bulan berjalan.

---

## 5. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### FR-1: Manajemen Autentikasi Admin
* **FR-1.1:** Halaman/Modal input password sederhana untuk masuk ke sesi Admin.
* **FR-1.2:** Verifikasi password dilakukan di sisi server (Server Action) menggunakan *environment variable* `ADMIN_PASSWORD`.
* **FR-1.3:** Penyimpanan sesi menggunakan HTTP-Only Cookie terenkripsi.
* **FR-1.4:** Tombol *Logout* untuk mengakhiri sesi admin.

### FR-2: Manajemen Anggota Kontrakan (Admin Only)
* **FR-2.1:** Form tambah nama anggota kontrakan baru.
* **FR-2.2:** Pengaturan status anggota (`is_active: true/false`) untuk menandai anggota yang sudah pindah tanpa menghapus riwayat transaksi masa lalu.
* **FR-2.3:** Edit nama anggota.

### FR-3: Pencatatan Pemasukan / Iuran (Admin Only)
* **FR-3.1:** Dropdown pemilihan anggota (hanya menampilkan anggota aktif).
* **FR-3.2:** Input nominal iuran (format angka/rupiah).
* **FR-3.3:** Input tanggal transaksi (default: hari ini).
* **FR-3.4:** Input catatan opsional (misal: "Cicilan 1", "Titip via Budi").
* **FR-3.5:** Riwayat transaksi iuran yang dapat dihapus/dibatalkan jika salah input.

### FR-4: Pencatatan Pengeluaran (Admin Only)
* **FR-4.1:** Input keterangan/deskripsi pengeluaran (misal: "Token Listrik", "WiFi Indihome", "Galon Aqua 2x").
* **FR-4.2:** Input nominal pengeluaran.
* **FR-4.3:** Input tanggal pengeluaran (default: hari ini).
* **FR-4.4:** Riwayat pengeluaran terurut kronologis (terbaru di atas) dengan aksi hapus transaksi.

### FR-5: Dashboard & Tampilan Publik
* **FR-5.1:** Kartu Ringkasan Finansial:
  * Saldo Awal (Sisa Bulan Lalu)
  * Total Iuran Terkumpul Bulan Ini
  * Total Kas Masuk
  * Total Pengeluaran
  * **Sisa Saldo Kas Saat Ini** (diberi tanda visual khusus jika bernilai negatif)
* **FR-5.2:** Tabel/Grid Iuran Anggota: Menampilkan seluruh nama anggota beserta total nominal yang sudah dibayarkan pada bulan terpilih.
* **FR-5.3:** Tabel Riwayat Pengeluaran: Menampilkan tanggal, deskripsi, dan nominal pengeluaran.
* **FR-5.4:** Dropdown / Filter Arsip Periode: Memungkinkan melihat riwayat kas bulan-bulan sebelumnya.

### FR-6: Generator Format Pesan WhatsApp (Share to Group)
* **FR-6.1:** Tombol *"Salin Rekap WA"* yang otomatis menyalin teks ringkasan ke *clipboard* perangkat dengan format:

```text
📢 REKAP KAS KONTRAKAN - [Nama Bulan Tahun]
------------------------------------
📥 PEMASUKAN
• Total Iuran Masuk: [Rp Nominal]
• Sisa Kas Bulan Lalu: [Rp Nominal]
Total Masuk = [Rp Total Kas Masuk]

📤 PENGELUARAN [Nama Bulan]
• [Keterangan 1] = [Nominal]
• [Keterangan 2] = [Nominal]
• [Keterangan N] = [Nominal]

Total Pengeluaran = [Rp Total Pengeluaran]
------------------------------------
💰 SISA SALDO: [Rp Sisa Saldo]