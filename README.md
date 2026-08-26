# SIMASRA — Sistem Informasi Manajemen Asrama

## Asrama Kabupaten Deiyai · Kota Studi Jayapura

![Version](https://img.shields.io/badge/versi-2.1.0-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-production-green?style=flat-square)
![License](https://img.shields.io/badge/lisensi-MIT-purple?style=flat-square)
![Tech](https://img.shields.io/badge/tech-HTML%20%7C%20AlpineJS%20%7C%20TailwindCSS-cyan?style=flat-square)

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Struktur Data](#-struktur-data)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur File](#-struktur-file)
- [Cara Menjalankan](#-cara-menjalankan)
- [Akun Default](#-akun-default)
- [Alur Sistem (Ringkasan DFD)](#-alur-sistem-ringkasan-dfd)
- [Modul Sistem](#-modul-sistem)
- [Validasi & Aturan Bisnis](#-validasi--aturan-bisnis)
- [Ekspor & Backup](#-ekspor--backup)
- [Keterbatasan & Catatan](#-keterbatasan--catatan)
- [Kontributor](#-kontributor)

---

## 🏠 Tentang Proyek

**SIMASRA** (Sistem Informasi Manajemen Asrama) adalah aplikasi web berbasis _frontend-only_ yang dirancang khusus untuk membantu pengurus Asrama Kabupaten Deiyai di Kota Studi Jayapura dalam mengelola:

- Data penghuni asrama (siswa SMA/SMK/MA dan mahasiswa)
- Manajemen kamar dan barak secara real-time
- Pencatatan inventaris fasilitas
- Pelaporan statistik dan ekspor dokumen

Sistem berjalan **sepenuhnya di browser** tanpa memerlukan server backend — semua data disimpan di `localStorage` browser. Cocok untuk lingkungan dengan keterbatasan infrastruktur internet.

---

## ✨ Fitur Utama

| No  | Fitur                       | Deskripsi                                                                   |
| --- | --------------------------- | --------------------------------------------------------------------------- |
| 1   | **Autentikasi Login**       | Login dengan username/password, opsi "Ingat Saya", dark mode                |
| 2   | **Dashboard Ringkasan**     | Statistik penghuni aktif, tingkat hunian, kamar kosong, grafik donut        |
| 3   | **Manajemen Penghuni**      | CRUD penghuni, filter multi-kolom, riwayat penempatan per NIK               |
| 4   | **Manajemen Kamar & Barak** | CRUD barak, kamar multi-penghuni (maks. 3/kamar), assign/keluarkan penghuni |
| 5   | **Inventaris**              | Pencatatan inventaris per barak/kamar, kondisi baik/rusak ringan/berat      |
| 6   | **Laporan & Statistik**     | Grafik distrik, jenjang, inventaris; ekspor PDF & Excel; backup JSON        |
| 7   | **Dark Mode**               | Toggle gelap/terang, tersimpan di `localStorage`                            |
| 8   | **Profil & Pengaturan**     | Edit profil pengurus, upload foto, ganti kata sandi                         |
| 9   | **Reset Data**              | Konfirmasi kode unik `deiyai2026` sebelum hapus semua data                  |
| 10  | **Responsif**               | Tampilan mobile-friendly dengan sidebar collapsible                         |

---

## 🏗 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client-Side Only)               │
│                                                                 │
│  ┌──────────┐    ┌──────────────────────────────────────────┐   │
│  │ login.html│    │              index.html                  │   │
│  │          │───▶│  Alpine.js x-data="app"                  │   │
│  │ AlpineJS │    │  ┌─────────┬──────────┬───────┬───────┐  │   │
│  └──────────┘    │  │Dashboard│ Penghuni │ Kamar │Laporan│  │   │
│                  │  └─────────┴──────────┴───────┴───────┘  │   │
│                  │               ▼                           │   │
│                  │  ┌────────────────────────────────────┐   │   │
│                  │  │         script.js (Alpine Store)   │   │   │
│                  │  │  - State Management                │   │   │
│                  │  │  - Business Logic                  │   │   │
│                  │  │  - Chart Rendering (Chart.js)      │   │   │
│                  │  │  - Export (jsPDF, SheetJS)         │   │   │
│                  │  └────────────┬───────────────────────┘   │   │
│                  └──────────────┼───────────────────────────┘   │
│                                 ▼                               │
│              ┌──────────────────────────────────┐               │
│              │         localStorage              │               │
│              │  simasra_penghuni    (Array JSON) │               │
│              │  simasra_barak       (Array JSON) │               │
│              │  simasra_inventaris  (Array JSON) │               │
│              │  simasra_user_profile (Object)    │               │
│              │  simasra_user_settings (Object)   │               │
│              └──────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Struktur Data

### Entitas Penghuni

```json
{
  "nik": "9102017501010001",
  "nama": "Yohanis Duwiri",
  "nisn_nim": "123456789012",
  "distrik": "Tigi",
  "jenjang": "SMA",
  "tahun_masuk": 2023,
  "status": "aktif",
  "jenis_kelamin": "Laki-laki",
  "no_hp": "0812xxxxxxx",
  "kamarSaatIni": {
    "barakId": 1,
    "nomorKamar": "101",
    "tanggalMasuk": "2024-01-15"
  },
  "tanggalKeluar": null
}
```

### Entitas Barak

```json
{
  "id": 1,
  "lantai": 1,
  "sisi": "Barak Kiri",
  "kapasitas": 7,
  "terisi": 2,
  "status": "terisi_sebagian",
  "rentangKamar": "101–107",
  "daftarKamar": [
    {
      "nomor": "101",
      "status": "terisi_sebagian",
      "penghuniList": ["9102017501010001"],
      "tanggalMasuk": null,
      "riwayat": [
        {
          "nik": "9102017501010001",
          "nama": "Yohanis Duwiri",
          "tanggalMasuk": "2024-01-15",
          "tanggalKeluar": null,
          "status": "aktif"
        }
      ]
    }
  ]
}
```

### Entitas Inventaris

```json
{
  "id": 1706789012345,
  "barakId": 1,
  "barak": "Barak Kiri – Lt.1",
  "nomorKamar": "101",
  "jenis": "tempat tidur",
  "jumlahTotal": 3,
  "baik": 2,
  "rusakRingan": 1,
  "rusakBerat": 0,
  "catatan": "Kasur perlu diganti"
}
```

---

## 🛠 Teknologi yang Digunakan

| Teknologi           | Versi       | Fungsi                            |
| ------------------- | ----------- | --------------------------------- |
| **HTML5**           | —           | Struktur halaman                  |
| **Tailwind CSS**    | CDN         | Styling utility-first             |
| **Alpine.js**       | 3.x         | Reaktivitas UI & state management |
| **Chart.js**        | 4.4.0       | Grafik donut statistik            |
| **jsPDF**           | 2.5.1       | Ekspor laporan PDF                |
| **jsPDF AutoTable** | 3.8.3       | Tabel otomatis di PDF             |
| **SheetJS (XLSX)**  | 0.20.3      | Ekspor laporan Excel              |
| **SweetAlert2**     | 11          | Dialog konfirmasi & notifikasi    |
| **Font Awesome**    | 6.5.0       | Ikon antarmuka                    |
| **Google Fonts**    | —           | DM Sans, Plus Jakarta Sans        |
| **localStorage**    | Browser API | Persistensi data lokal            |

---

## 📁 Struktur File

```
simasra/
├── index.html              # Halaman utama dashboard (semua modul)
├── login.html              # Halaman autentikasi
├── asset/
│   ├── css/
│   │   ├── style.css       # Gaya global dashboard
│   │   └── login.css       # Gaya halaman login
│   ├── js/
│   │   └── script.js       # Logic Alpine.js (Alpine.data('app', ...))
│   └── img/
│       ├── logo-login.png  # Logo asrama
│       └── android-chrome-192x192.png  # Favicon
└── README.md
```

---

## 🚀 Cara Menjalankan

### Metode 1 — Buka Langsung di Browser

```bash
# Cukup buka file index.html di browser modern (Chrome/Edge/Firefox)
# Tidak memerlukan instalasi apapun
open index.html   # macOS
start index.html  # Windows
```

### Metode 2 — Local Server (Disarankan untuk Development)

```bash
# Menggunakan Python
python -m http.server 8080

# Menggunakan Node.js (npx)
npx serve .

# Lalu buka browser: http://localhost:8080/login.html
```

> **Catatan:** Pastikan browser mengizinkan akses `localStorage`. Mode Incognito atau pengaturan privasi ketat dapat membatasi penyimpanan data.

---

## 🔐 Akun Default

| Username   | Password      | Keterangan      |
| ---------- | ------------- | --------------- |
| `admin`    | `simasra2026` | Administrator   |
| `pengurus` | `deiyai2026`  | Pengurus Asrama |

> **Keamanan:** Kredensial saat ini hardcoded di `login.html`. Untuk produksi nyata, disarankan mengintegrasikan dengan backend autentikasi.

---

## 🔄 Alur Sistem (Ringkasan DFD)

```
[Pengurus] ──login──▶ [Autentikasi] ──▶ [Dashboard]
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    ▼                         ▼                          ▼
           [Kelola Penghuni]        [Kelola Kamar/Barak]       [Kelola Inventaris]
                    │                         │                          │
                    ▼                         ▼                          ▼
           [Data Penghuni]          [Data Barak & Kamar]       [Data Inventaris]
                    │                         │                          │
                    └─────────────────────────┴──────────────────────────┘
                                              │
                                              ▼
                                    [Laporan & Statistik]
                                              │
                             ┌────────────────┼────────────────┐
                             ▼                ▼                ▼
                        [Export PDF]    [Export Excel]   [Backup JSON]
```

---

## 📚 Modul Sistem

### 1. Modul Autentikasi (`login.html`)

- Validasi username & password dengan daftar akun lokal
- Opsi "Ingat Saya" menggunakan `localStorage`
- Redirect otomatis ke dashboard setelah login berhasil
- Proteksi halaman: redirect ke `login.html` jika belum login

### 2. Modul Dashboard (`currentPage === 'dashboard'`)

- Kartu statistik: penghuni aktif, tingkat hunian, total kamar, kamar kosong
- Grafik donut status penghuni dan hunian kamar (Chart.js)
- Bar chart penghuni per distrik (top 5)
- Feed aktivitas terbaru (statis ilustratif)

### 3. Modul Data Penghuni (`currentPage === 'penghuni'`)

- Tabel dengan pagination (10 baris/halaman)
- Filter: pencarian teks, jenjang, tahun masuk, status
- Form tambah/edit penghuni (NIK, nama, NISN/NIM, distrik, jenjang, dll.)
- Validasi NIK unik saat penambahan
- Otomatis kosongkan kamar saat status berubah dari "aktif"
- Modal riwayat penempatan per penghuni

### 4. Modul Manajemen Kamar (`currentPage === 'kamar'`)

- Tabel barak dengan pagination (6 baris/halaman)
- Status barak: `kosong` | `terisi_sebagian` | `penuh` | `maintenance`
- **Multi-penghuni per kamar**: maks. `MAX_PENGHUNI_PER_KAMAR` (default: 3)
- Modal assign penghuni: pilih penghuni → pilih barak → pilih kamar (visual grid)
- Modal detail kamar: lihat semua penghuni per kamar, tombol keluarkan individual
- Riwayat penempatan per barak
- CRUD barak dengan penyesuaian kapasitas otomatis

### 5. Modul Inventaris (`currentPage === 'inventaris'`)

- CRUD inventaris per barak/kamar
- Filter berdasarkan barak dan jenis barang
- Ringkasan kondisi: baik, rusak ringan, rusak berat (persentase)

### 6. Modul Laporan (`currentPage === 'laporan'`)

- Grafik per distrik, per jenjang, kondisi inventaris
- Filter periode dan tahun
- Ekspor PDF (jsPDF + AutoTable)
- Ekspor Excel (SheetJS) dengan multi-sheet
- Backup JSON seluruh data

---

## ✅ Validasi & Aturan Bisnis

| Aturan              | Detail                                                             |
| ------------------- | ------------------------------------------------------------------ |
| NIK unik            | Tidak boleh ada dua penghuni dengan NIK sama                       |
| Penghuni aktif saja | Hanya penghuni berstatus "aktif" yang bisa di-assign ke kamar      |
| Satu kamar aktif    | Penghuni tidak bisa di-assign jika sudah memiliki kamar aktif      |
| Batas per kamar     | Maksimal `MAX_PENGHUNI_PER_KAMAR` (3) penghuni per kamar           |
| Hapus barak         | Barak hanya bisa dihapus jika semua kamar kosong                   |
| Kurangi kapasitas   | Kamar yang berisi penghuni tidak bisa dihapus saat edit kapasitas  |
| Reset data          | Wajib mengetik kode `deiyai2026` untuk konfirmasi                  |
| Status auto-update  | Status kamar & barak diperbarui otomatis setiap perubahan penghuni |

---

## 📤 Ekspor & Backup

### Ekspor PDF

- Header dengan nama sistem dan tanggal
- Tabel ringkasan statistik
- Tabel penghuni per distrik
- Tabel penghuni per jenjang
- Nomor halaman otomatis

### Ekspor Excel (Multi-sheet)

- Sheet `Ringkasan` — statistik utama
- Sheet `Data Penghuni` — seluruh data penghuni
- Sheet `Per Distrik` — rekap per distrik
- Sheet `Inventaris` — seluruh data inventaris

### Backup JSON

- Format JSON terstruktur dengan timestamp
- Mencakup: penghuni, barak, inventaris, profil pengguna
- Dapat diimpor ulang secara manual (fitur restore belum tersedia di UI)

---

## ⚠️ Keterbatasan & Catatan

1. **Penyimpanan Lokal**: Data hanya ada di browser yang sama. Membersihkan cache/data browser akan menghapus semua data.
2. **Tidak Ada Sinkronisasi**: Data tidak tersinkron antar perangkat/browser berbeda.
3. **Batas localStorage**: Umumnya 5–10 MB per domain. Sistem menampilkan peringatan jika penyimpanan penuh.
4. **Autentikasi Sederhana**: Credential disimpan langsung di kode — tidak aman untuk lingkungan produksi multi-pengguna.
5. **Aktivitas Terbaru**: Feed aktivitas di dashboard bersifat statis/ilustratif, bukan log dinamis.
6. **Restore Backup**: Fitur impor backup JSON belum tersedia di antarmuka — harus dilakukan manual via `localStorage`.

---

## 👤 Kontributor

| Nama              | Peran                             |
| ----------------- | --------------------------------- |
| **Richy Rizaldo** | Pengurus Asrama / Pengguna Sistem |
| Pengembang        | Developer Frontend                |

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal **Asrama Kabupaten Deiyai, Kota Studi Jayapura**.
Dilarang mendistribusikan atau menggunakan untuk keperluan komersial tanpa izin.

---

_SIMASRA v2.1 © 2026 — Asrama Kabupaten Deiyai, Jayapura_
