DESAIN DAN IMPLEMENTASI SISTEM
4.1. Desain Sistem
SIMASRA (Sistem Informasi Manajemen Asrama Kabupaten Deiyai) merupakan aplikasi web berbasis client-side yang dirancang untuk memudahkan pengelolaan data asrama secara offline. Sistem ini dibangun menggunakan arsitektur Single Page Application (SPA) dengan pendekatan ringan, responsif, dan mudah di-maintenance.
Teknologi yang Digunakan:

Frontend : HTML5, Tailwind CSS, Alpine.js v3
Visualisasi Data : Chart.js
Export Laporan : jsPDF + jsPDF-AutoTable dan SheetJS (XLSX)
Penyimpanan Data : LocalStorage Browser
Desain : Responsif dan mendukung Dark Mode

4.2. Fitur Utama Sistem
Sistem SIMASRA memiliki fitur-fitur utama sebagai berikut:

Dashboard dengan statistik hunian real-time dan grafik interaktif.
Manajemen Data Penghuni (CRUD lengkap dengan fitur pencarian dan filter).
Manajemen Barak dan Kamar dengan sistem multi-penghuni (maksimal 3 orang per kamar).
Proses Assign Penghuni ke Kamar dengan visualisasi slot kosong/terisi.
Manajemen Inventaris barang asrama.
Riwayat Penempatan Penghuni dan Riwayat Kamar.
Laporan dan Statistik dengan fitur export ke PDF serta Excel.
Backup data, reset sistem, dan pengaturan akun pengurus.

4.3. Desain Struktur Data
Karena sistem menggunakan LocalStorage, data disimpan dalam format JSON. Berikut adalah struktur data utama yang digunakan:

1. Data Penghuni
   JSON{
   "nik": "9102017501010001",
   "nama": "Yohanis Duwiri",
   "jenjang": "SMA",
   "distrik": "Tigi",
   "tahun_masuk": 2023,
   "status": "aktif",
   "kamarSaatIni": {
   "barakId": 1,
   "nomorKamar": "101",
   "tanggalMasuk": "2025-03-01"
   }
   }
2. Data Barak dan Kamar (Multi-Penghuni)
   JSON{
   "id": 1,
   "lantai": 1,
   "sisi": "Barak Putra Kiri",
   "kapasitas": 7,
   "terisi": 5,
   "status": "terisi_sebagian",
   "daftarKamar": [
   {
   "nomor": "101",
   "status": "terisi_sebagian",
   "penghuniList": ["9102017501010001", "9102026805020002"],
   "riwayat": [ ... ]
   }
   ]
   }
   4.4. Implementasi Fitur Kunci
   4.4.1. Konstanta Sistem
   JavaScript// script.js
   MAX_PENGHUNI_PER_KAMAR: 3, // Maksimal 3 penghuni per kamar (dapat disesuaikan)
   4.4.2. Logika Assign Penghuni ke Kamar
   JavaScriptassignPenghuni() {
   if (!this.\_kamarBisaDisisi(kamar)) {
   return Swal.fire('Error', `Kamar sudah penuh (maksimal ${this.MAX_PENGHUNI_PER_KAMAR} orang)`, 'error');
   }
   // Proses penempatan dan pencatatan riwayat
   }
   4.4.3. Fitur Export Laporan

Export laporan ke PDF menggunakan jsPDF + AutoTable
Export laporan ke Excel menggunakan SheetJS
Fitur Backup Data dalam format JSON

4.5. Antarmuka Pengguna
Antarmuka SIMASRA dirancang modern, responsif, dan user-friendly dengan dukungan dark mode. Sistem dapat diakses dengan nyaman melalui komputer desktop maupun perangkat mobile.

LAMPIRAN
Lampiran 1 – Struktur Folder Project
textSIMASRA/
├── index.html ← Halaman utama aplikasi
├── login.html ← Halaman autentikasi
├── README.md
├── asset/
│ ├── css/
│ │ ├── style.css
│ │ └── login.css
│ ├── js/
│ │ └── script.js ← Logic utama Alpine.js
│ └── img/
│ ├── logo-login.png
│ └── android-chrome-192x192.png
Lampiran 2 – Kode Sumber Penting

1. Konstanta Utama SIMASRA (script.js)
   JavaScriptMAX_PENGHUNI_PER_KAMAR: 3,

STORAGE_KEYS: {
PENGHUNI: 'simasra_penghuni',
BARAK: 'simasra_barak',
INVENTARIS: 'simasra_inventaris',
USER_PROFILE: 'simasra_user_profile'
}, 2. Struktur Data Barak dan Kamar
JavaScript{
id: 1,
lantai: 1,
sisi: "Barak Putra Kiri",
kapasitas: 7,
daftarKamar: [
{
nomor: "101",
status: "terisi_sebagian",
penghuniList: ["9102017501010001", "9102026805020002"],
riwayat: []
}
]
} 3. Fungsi Assign Penghuni ke Kamar
JavaScriptassignPenghuni() {
// Validasi slot kamar + proses penempatan + update riwayat
} 4. Fungsi Export Laporan
JavaScriptexportPDF() { ... }
exportExcel() { ... }
backupAllData() { ... }
Lampiran 3 – Screenshot Tampilan Sistem
(Silakan tambahkan screenshot berikut saat menyusun proposal)

Halaman Login SIMASRA
Dashboard Utama
Halaman Data Penghuni
Manajemen Kamar & Proses Assign Penghuni
Halaman Laporan & Statistik

Lampiran 4 – README.md
SIMASRA v2.1
Sistem Informasi Manajemen Asrama Kabupaten Deiyai
Kota Studi Jayapura, Papua
Fitur Unggulan:

Sistem multi-penghuni per kamar (maksimal 3 orang)
Riwayat penempatan penghuni dan kamar yang lengkap
Export laporan ke PDF dan Excel
Fitur backup data
Dark mode dan desain responsif
