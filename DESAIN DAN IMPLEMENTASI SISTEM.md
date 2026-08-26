# LAPORAN AUDIT & POTONGAN KODE PROPOSAL

## SIMASRA v2.1 — Sistem Informasi Manajemen Asrama Kabupaten Deiyai

---

# BAGIAN I — HASIL AUDIT SISTEM

## 1.1 Ringkasan Eksekutif

| Aspek                | Nilai        | Keterangan                                   |
| -------------------- | ------------ | -------------------------------------------- |
| **Konsistensi Data** | ✅ Baik      | Satu sumber kebenaran di `localStorage`      |
| **Validasi Input**   | ✅ Baik      | NIK unik, field wajib, batas kamar           |
| **Aturan Bisnis**    | ✅ Konsisten | Status otomatis, multi-penghuni per kamar    |
| **Performa**         | ✅ Baik      | Debounce chart, lazy pagination              |
| **Migrasi Data**     | ✅ Ditangani | Format lama `penghuniNIK` → `penghuniList[]` |
| **Dark Mode**        | ✅ Konsisten | Tersimpan, diterapkan ke Chart.js            |
| **Proteksi Rute**    | ✅ Ada       | Redirect ke login.html jika belum login      |
| **Ekspor**           | ✅ Lengkap   | PDF, Excel multi-sheet, JSON backup          |

## 1.2 Temuan Audit Detail

### ✅ KEKUATAN SISTEM

**1. Migrasi Data Format Lama → Baru (script.js baris ~160–175)**
Sistem menangani migrasi otomatis dari format kamar tunggal (`penghuniNIK`) ke format multi-penghuni (`penghuniList[]`) saat data lama dimuat dari `localStorage`. Ini memastikan kompatibilitas mundur.

**2. Status Kamar & Barak Otomatis**
Fungsi `_updateStatusKamar()` dan `_updateStatusBarak()` dipanggil setiap kali terjadi perubahan, memastikan status selalu konsisten tanpa perlu pembaruan manual.

**3. Validasi Aturan Bisnis Berlapis**

- Penghuni harus `status === 'aktif'` untuk dapat di-assign
- Penghuni tidak boleh memiliki kamar aktif lain
- Kamar tidak boleh melebihi `MAX_PENGHUNI_PER_KAMAR` (default: 3)
- NIK harus unik di seluruh data

**4. Konsistensi Dua Arah saat Keluarkan Penghuni**
Saat penghuni dikeluarkan dari kamar, sistem memperbarui KEDUA sisi: `barak[].daftarKamar[].penghuniList` DAN `penghuni[].kamarSaatIni = null`.

**5. Manajemen Chart Aman**
`_destroyChart()` dipanggil sebelum render ulang untuk mencegah memory leak Canvas.

### ⚠️ CATATAN & REKOMENDASI

**1. Kredensial Hardcoded (login.html)**

```javascript
// KONDISI SAAT INI - perlu perbaikan untuk produksi:
const users = { admin: "simasra2026", pengurus: "deiyai2026" };
// REKOMENDASI: Pindahkan ke server-side authentication
```

**2. Tidak Ada Validasi Format NIK**
NIK Papua memiliki format 16 digit. Saat ini input bebas. Tambahkan:

```javascript
// Rekomendasi validasi NIK 16 digit:
if (!/^\d{16}$/.test(this.form.nik.trim())) {
  return Swal.fire("Error", "NIK harus 16 digit angka", "error");
}
```

**3. Feed Aktivitas Statis (index.html)**
Bagian "Aktivitas Terbaru" di dashboard menampilkan data statis hardcoded. Untuk versi berikutnya, buat log aktivitas dinamis dari `localStorage`.

**4. Tidak Ada Validasi Jumlah Kondisi Inventaris**
`baik + rusakRingan + rusakBerat` tidak divalidasi agar sama dengan `jumlahTotal`. Tambahkan:

```javascript
// Rekomendasi:
const total =
  Number(this.inventarisForm.baik) +
  Number(this.inventarisForm.rusakRingan) +
  Number(this.inventarisForm.rusakBerat);
if (total > Number(this.inventarisForm.jumlahTotal)) {
  return Swal.fire("Error", "Total kondisi melebihi jumlah barang", "error");
}
```

**5. Tidak Ada Fitur Restore Backup**
Backup JSON tersedia tetapi tidak ada fungsi impor melalui UI. Tambahkan tombol "Restore Backup" yang menerima file JSON.

## 1.3 Tabel Konsistensi Fungsional

| Fitur                | login.html | index.html    | script.js       | Status    |
| -------------------- | ---------- | ------------- | --------------- | --------- |
| Autentikasi          | ✅ Lengkap | ✅ Guard      | —               | Konsisten |
| CRUD Penghuni        | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| Assign Kamar         | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| Multi-penghuni/kamar | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| Riwayat Penghuni     | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| Riwayat Kamar        | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| CRUD Barak           | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| CRUD Inventaris      | —          | ✅ Lengkap    | ✅ Lengkap      | Konsisten |
| Dashboard Chart      | —          | ✅ Canvas     | ✅ Chart.js     | Konsisten |
| Laporan Chart        | —          | ✅ Canvas     | ✅ Chart.js     | Konsisten |
| Export PDF           | —          | ✅ Tombol     | ✅ jsPDF        | Konsisten |
| Export Excel         | —          | ✅ Tombol     | ✅ SheetJS      | Konsisten |
| Backup JSON          | —          | ✅ Tombol     | ✅ Blob         | Konsisten |
| Dark Mode            | ✅ Toggle  | ✅ Toggle     | ✅ Toggle       | Konsisten |
| Profil Pengurus      | —          | ✅ Modal      | ✅ CRUD         | Konsisten |
| Persistensi Data     | —          | ✅ Watch      | ✅ localStorage | Konsisten |
| Reset Data           | —          | ✅ Konfirmasi | ✅ Kode unik    | Konsisten |

---

# BAGIAN II — POTONGAN KODE WAJIB PROPOSAL

## 2.1 Inisialisasi Sistem & Penyimpanan Data (script.js)

### A. Deklarasi Konstanta dan State Utama

```javascript
document.addEventListener("alpine:init", () => {
  Alpine.data("app", () => ({
    // ── KONSTANTA ATURAN BISNIS ────────────────────────────────
    MAX_PENGHUNI_PER_KAMAR: 3,

    // ── STATE DATA UTAMA ────────────────────────────────────────
    penghuni: [], // Array objek Penghuni
    barak: [], // Array objek Barak (berisi daftarKamar[])
    inventaris: [], // Array objek Inventaris

    // ── KUNCI PENYIMPANAN localStorage ─────────────────────────
    STORAGE_KEYS: {
      PENGHUNI: "simasra_penghuni",
      BARAK: "simasra_barak",
      INVENTARIS: "simasra_inventaris",
      USER_PROFILE: "simasra_user_profile",
      USER_SETTINGS: "simasra_user_settings",
    },
  }));
});
```

### B. Fungsi Pemuatan & Migrasi Data

```javascript
loadFromStorage() {
  const loadArr = key => {
    try {
      const s = localStorage.getItem(key);
      if (!s) return null;
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : null;
    } catch { return null; }
  };

  this.penghuni  = loadArr(this.STORAGE_KEYS.PENGHUNI)   || [];
  this.barak     = loadArr(this.STORAGE_KEYS.BARAK)       || [];
  this.inventaris = loadArr(this.STORAGE_KEYS.INVENTARIS) || [];

  // ── MIGRASI: format lama (penghuniNIK) → format baru (penghuniList[])
  this.barak = this.barak.map((b, idx) => {
    if (b.id == null) b.id = Date.now() + idx;
    if (!Array.isArray(b.daftarKamar)) b.daftarKamar = [];
    b.daftarKamar = b.daftarKamar.map(k => {
      k.riwayat = Array.isArray(k.riwayat) ? k.riwayat : [];
      if (!Array.isArray(k.penghuniList)) {
        // Migrasi format lama: satu NIK string → array
        k.penghuniList = (k.penghuniNIK && k.penghuniNIK !== null)
          ? [k.penghuniNIK] : [];
      }
      delete k.penghuniNIK; // Hapus field lama
      this._updateStatusKamar(k);
      return k;
    });
    this._updateStatusBarak(b);
    return b;
  });

  if (!this.penghuni.length && !this.barak.length) {
    this.resetInitialData(); // Muat data awal jika kosong
    return;
  }
  this.saveToStorage();
},
```

---

## 2.2 Logika Aturan Bisnis Kamar (script.js)

### C. Helper Status Kamar Multi-Penghuni

```javascript
// Hitung jumlah penghuni di kamar
_jumlahPenghuniKamar(kamar) {
  return (kamar.penghuniList || []).length;
},

// Cek apakah kamar masih bisa menerima penghuni baru
_kamarBisaDisisi(kamar) {
  return this._jumlahPenghuniKamar(kamar) < this.MAX_PENGHUNI_PER_KAMAR;
},

// Update status kamar berdasarkan jumlah penghuni
_updateStatusKamar(kamar) {
  const jml = this._jumlahPenghuniKamar(kamar);
  if (jml === 0)                          kamar.status = 'kosong';
  else if (jml >= this.MAX_PENGHUNI_PER_KAMAR) kamar.status = 'penuh';
  else                                    kamar.status = 'terisi_sebagian';
  return kamar;
},

// Update status barak berdasarkan status seluruh kamarnya
_updateStatusBarak(barak) {
  const kamarList = barak.daftarKamar || [];
  // Hitung total penghuni di barak
  barak.terisi = kamarList.reduce(
    (s, k) => s + this._jumlahPenghuniKamar(k), 0
  );
  const adaIsi    = kamarList.some(k => k.status !== 'kosong');
  const semuaPenuh = kamarList.length > 0 &&
                     kamarList.every(k => k.status === 'penuh');
  if (!adaIsi)       barak.status = 'kosong';
  else if (semuaPenuh) barak.status = 'penuh';
  else               barak.status = 'terisi_sebagian';
  return barak;
},
```

---

## 2.3 Proses Assign Penghuni ke Kamar (script.js)

### D. Validasi & Eksekusi Assign

```javascript
assignPenghuni() {
  // ── Validasi input ──────────────────────────────────────────
  if (!this.selectedPenghuniId)
    return Swal.fire('Peringatan', 'Pilih penghuni terlebih dahulu.', 'warning');
  if (!this.assignSelectedBarakId)
    return Swal.fire('Peringatan', 'Pilih barak terlebih dahulu.', 'warning');
  if (!this.assignSelectedKamarNomor)
    return Swal.fire('Peringatan', 'Pilih kamar terlebih dahulu.', 'warning');

  const penghuni = this.penghuni.find(p => p.nik === this.selectedPenghuniId);
  if (!penghuni) return Swal.fire('Error', 'Penghuni tidak ditemukan.', 'error');

  // ── Validasi aturan bisnis ──────────────────────────────────
  if (penghuni.status !== 'aktif')
    return Swal.fire('Peringatan', 'Hanya penghuni aktif yang bisa ditempatkan.', 'warning');
  if (penghuni.kamarSaatIni)
    return Swal.fire('Peringatan', `${penghuni.nama} sudah menempati kamar lain.`, 'warning');

  const barakIdx = this.barak.findIndex(
    b => String(b.id) === String(this.assignSelectedBarakId)
  );
  const barak  = this.barak[barakIdx];
  const kamarIdx = barak.daftarKamar.findIndex(
    k => k.nomor === this.assignSelectedKamarNomor
  );
  const kamar = barak.daftarKamar[kamarIdx];

  // ── Validasi kapasitas kamar ────────────────────────────────
  if (!this._kamarBisaDisisi(kamar)) {
    return Swal.fire('Error',
      `Kamar ${kamar.nomor} sudah penuh (maks. ${this.MAX_PENGHUNI_PER_KAMAR} penghuni).`,
      'error'
    );
  }

  // ── Eksekusi assign setelah konfirmasi ──────────────────────
  Swal.fire({ /* ...konfirmasi... */ }).then(r => {
    if (!r.isConfirmed) return;

    const tanggal   = new Date().toISOString().split('T')[0];
    const newBarak  = JSON.parse(JSON.stringify(this.barak)); // Deep copy
    const tBarak    = newBarak[barakIdx];
    const tKamar    = tBarak.daftarKamar[kamarIdx];

    // Tambahkan NIK ke daftar penghuni kamar
    tKamar.penghuniList = tKamar.penghuniList || [];
    tKamar.penghuniList.push(penghuni.nik);

    // Catat riwayat masuk
    tKamar.riwayat = tKamar.riwayat || [];
    tKamar.riwayat.push({
      nik: penghuni.nik, nama: penghuni.nama,
      tanggalMasuk: tanggal, tanggalKeluar: null, status: 'aktif'
    });

    // Update status kamar dan barak
    this._updateStatusKamar(tKamar);
    this._updateStatusBarak(tBarak);
    this.barak = newBarak;

    // Update referensi kamar di data penghuni
    this.penghuni = this.penghuni.map(p =>
      p.nik === penghuni.nik
        ? { ...p, kamarSaatIni: {
            barakId: tBarak.id,
            nomorKamar: tKamar.nomor,
            tanggalMasuk: tanggal
          }}
        : p
    );
  });
},
```

---

## 2.4 CRUD Penghuni (script.js)

### E. Simpan Data Penghuni (Tambah & Edit)

```javascript
savePenghuni() {
  // Validasi field wajib
  if (!this.form.nik?.trim())
    return Swal.fire('Error', 'NIK wajib diisi', 'error');
  if (!this.form.nama?.trim())
    return Swal.fire('Error', 'Nama wajib diisi', 'error');

  // Validasi NIK unik (hanya saat tambah baru)
  if (!this.isEditMode && this.penghuni.some(p => p.nik === this.form.nik.trim()))
    return Swal.fire('Error', 'NIK sudah terdaftar!', 'error');

  Swal.fire({
    title: this.isEditMode ? 'Simpan Perubahan?' : 'Tambah Penghuni Baru?',
    icon: 'question', showCancelButton: true,
    confirmButtonColor: '#3b82f6', cancelButtonText: 'Batal',
    confirmButtonText: 'Ya, Simpan'
  }).then(r => {
    if (!r.isConfirmed) return;
    const data = { ...this.form };
    data.nik = data.nik.trim();

    // Jika status berubah dari aktif → non-aktif, kosongkan kamar otomatis
    if (this.isEditMode && data.status !== 'aktif') {
      const lama = this.penghuni.find(p => p.nik === data.nik);
      if (lama?.status === 'aktif' && lama?.kamarSaatIni) {
        this._kosongkanKamarDariPenghuni(lama.nik);
        data.kamarSaatIni = null;
      }
      if (!data.tanggalKeluar)
        data.tanggalKeluar = new Date().toISOString().split('T')[0];
    }

    // Simpan: update jika edit, insert jika tambah
    this.penghuni = this.isEditMode
      ? this.penghuni.map(p => p.nik === data.nik ? data : p)
      : [data, ...this.penghuni];

    this.modalOpen = false;
    Swal.fire({ icon: 'success', title: 'Berhasil!',
                text: 'Data tersimpan', timer: 1500, showConfirmButton: false });
  });
},
```

---

## 2.5 Sistem Laporan & Ekspor (script.js)

### F. Ekspor PDF dengan jsPDF

```javascript
exportPDF() {
  this.exporting = true; this.exportFormat = 'PDF';
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pw  = doc.internal.pageSize.getWidth();
    const ph  = doc.internal.pageSize.getHeight();

    // Header laporan
    doc.setFontSize(18); doc.setTextColor(37, 99, 235);
    doc.text('Laporan SIMASRA – Asrama Kabupaten Deiyai', pw / 2, 20, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}`, pw / 2, 29, { align: 'center' });

    // Tabel ringkasan statistik
    let y = 42;
    doc.setFontSize(13); doc.setTextColor(0);
    doc.text('Ringkasan Statistik', 20, y); y += 8;
    doc.autoTable({
      startY: y,
      head: [['Kategori', 'Jumlah']],
      body: [
        ['Penghuni Aktif',         this.penghuniAktif],
        ['Tingkat Hunian',         `${this.hunianPersen}%`],
        ['Alumni Tahun Ini',       this.alumniTahunIni],
        ['Kamar Kosong (0 penghuni)', this.kamarKosong],
        ['Slot Tersedia',          this.slotTersedia],
        ['Total Barak',            this.totalBarak],
        ['Total Kamar',            this.totalKamarComputed],
        ['Kapasitas per Kamar',    `Maks. ${this.MAX_PENGHUNI_PER_KAMAR} orang`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    // Nomor halaman
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(9); doc.setTextColor(150);
      doc.text(`Hal ${i}/${pages} • SIMASRA © ${new Date().getFullYear()}`,
               pw / 2, ph - 10, { align: 'center' });
    }

    doc.save(`laporan_simasra_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    Swal.fire('Error', 'Gagal membuat PDF.', 'error');
  } finally {
    this.exporting = false; this.exportFormat = '';
  }
},
```

### G. Ekspor Excel Multi-Sheet dengan SheetJS

```javascript
exportExcel() {
  this.exporting = true; this.exportFormat = 'Excel';
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Kategori', 'Jumlah'],
      ['Penghuni Aktif',    this.penghuniAktif],
      ['Tingkat Hunian (%)', this.hunianPersen],
      ['Alumni Tahun Ini',  this.alumniTahunIni],
      ['Kamar Kosong',      this.kamarKosong],
      ['Slot Tersedia',     this.slotTersedia],
    ]), 'Ringkasan');

    // Sheet 2: Data Penghuni lengkap
    if (this.penghuni.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['NIK', 'Nama', 'Jenjang', 'Distrik', 'Tahun Masuk',
         'Status', 'Kamar Saat Ini', 'Tanggal Keluar'],
        ...this.penghuni.map(p => [
          p.nik, p.nama, p.jenjang, p.distrik, p.tahun_masuk,
          p.status, this.getKamarSaatIni(p) || '-', p.tanggalKeluar || '-'
        ])
      ]), 'Data Penghuni');
    }

    // Sheet 3: Per Distrik
    if (this.laporanDistrik.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Distrik', 'Jumlah'],
        ...this.laporanDistrik.map(d => [d.distrik, d.jumlah])
      ]), 'Per Distrik');
    }

    // Sheet 4: Inventaris
    if (this.inventaris.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Barak', 'Kamar', 'Jenis', 'Total', 'Baik', 'Rusak Ringan',
         'Rusak Berat', 'Catatan'],
        ...this.inventaris.map(i => [
          i.barak, i.nomorKamar || '-', i.jenis, i.jumlahTotal,
          i.baik, i.rusakRingan, i.rusakBerat, i.catatan || ''
        ])
      ]), 'Inventaris');
    }

    XLSX.writeFile(wb, `laporan_simasra_${new Date().toISOString().split('T')[0]}.xlsx`);
    Swal.fire({ icon: 'success', title: 'Excel Diunduh!', timer: 1500, showConfirmButton: false });
  } catch (err) {
    Swal.fire('Error', 'Gagal membuat Excel.', 'error');
  } finally {
    this.exporting = false; this.exportFormat = '';
  }
},
```

---

## 2.6 Sistem Autentikasi (login.html)

### H. Logika Login dengan AlpineJS

```javascript
Alpine.data("loginApp", () => ({
  darkMode:
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches),
  showPassword: false,
  loading: false,
  errorMessage: "",
  form: {
    username: localStorage.getItem("rememberedUser") || "",
    password: "",
    remember: !!localStorage.getItem("rememberedUser"),
  },

  async handleLogin() {
    this.errorMessage = "";

    // Validasi field tidak kosong
    if (!this.form.username.trim() || !this.form.password.trim()) {
      this.errorMessage = "Username dan kata sandi wajib diisi.";
      return;
    }

    this.loading = true;
    await new Promise((r) => setTimeout(r, 800)); // Simulasi delay

    // Daftar akun sistem
    const users = { admin: "simasra2026", pengurus: "deiyai2026" };
    const u = this.form.username.trim().toLowerCase();
    const p = this.form.password.trim();

    if (users[u] && users[u] === p) {
      // Login berhasil: set flag sesi
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loggedInUser", u);

      // Opsi "Ingat Saya"
      if (this.form.remember) localStorage.setItem("rememberedUser", u);
      else localStorage.removeItem("rememberedUser");

      await Swal.fire({
        title: "Login Berhasil!",
        text: `Selamat datang kembali, ${u.toUpperCase()}!`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      window.location.replace("index.html");
    } else {
      this.errorMessage = "Username atau kata sandi salah. Silakan coba lagi.";
    }
    this.loading = false;
  },
}));
```

---

## 2.7 Komponen Chart Dashboard (script.js)

### I. Render Grafik Donut Interaktif

```javascript
renderDonutChart(canvasId, labels, data, colors, centerText = '') {
  if (!this._isCanvasReady(canvasId)) return;
  const canvas = document.getElementById(canvasId);
  this._destroyChart(canvasId); // Hapus instance lama

  const total = data.reduce((a, b) => a + b, 0);
  if (total === 0) return; // Jangan render jika data kosong

  const isDark    = this.darkMode;
  const textColor = isDark ? '#e2e8f0' : '#1e293b';

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor:     isDark ? '#1e293b' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            font: { size: 12, family: "'DM Sans', sans-serif" },
            padding: 16,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              ` ${ctx.label}: ${ctx.parsed} ` +
              `(${total > 0 ? Math.round((ctx.parsed / total) * 100) : 0}%)`
          }
        }
      },
      animation: { animateRotate: true, duration: 600, easing: 'easeInOutQuart' }
    },
    // Plugin: teks di tengah donut
    plugins: [{
      id: 'centerText_' + canvasId,
      afterDraw(chart) {
        if (!centerText) return;
        const { ctx, chartArea } = chart;
        const cx = chartArea.left + chartArea.width / 2;
        const cy = chartArea.top + chartArea.height / 2 - 10;
        ctx.save();
        ctx.font = `bold 28px 'DM Sans', sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(centerText, cx, cy);
        ctx.font = `13px 'DM Sans', sans-serif`;
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('Total', cx, cy + 22);
        ctx.restore();
      }
    }]
  });
  this.chartInstances[canvasId] = chart; // Simpan referensi
},
```

---

## 2.8 Getter Computed untuk Statistik (script.js)

### J. Kalkulasi Statistik Real-time

```javascript
// Persentase tingkat hunian berdasarkan slot aktual
get hunianPersen() {
  const totalSlot = this.barak.reduce((s, b) =>
    s + (b.daftarKamar || []).length * this.MAX_PENGHUNI_PER_KAMAR, 0);
  const terisi = this.penghuni
    .filter(p => p.status === 'aktif' && p.kamarSaatIni).length;
  return totalSlot > 0 ? Math.round((terisi / totalSlot) * 100) : 0;
},

// Slot tersedia (bukan kamar kosong, tapi slot individu)
get slotTersedia() {
  return this.barak.reduce((s, b) =>
    s + (b.daftarKamar || []).reduce((ss, k) =>
      ss + Math.max(0, this.MAX_PENGHUNI_PER_KAMAR - this._jumlahPenghuniKamar(k)), 0), 0);
},

// Rekap per distrik (penghuni aktif saja)
get laporanDistrik() {
  const g = {};
  this.penghuni.forEach(p => {
    if (p.status === 'aktif') {
      const d = p.distrik || 'Lainnya';
      g[d] = (g[d] || 0) + 1;
    }
  });
  return Object.entries(g)
    .map(([distrik, jumlah]) => ({ distrik, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah); // Urutkan terbanyak
},

// Data untuk grafik hunian (terisi vs kosong)
get laporanHunianBarak() {
  const terisi   = this.penghuni
    .filter(p => p.status === 'aktif' && p.kamarSaatIni).length;
  const totalSlot = this.barak.reduce((s, b) =>
    s + (b.daftarKamar || []).length * this.MAX_PENGHUNI_PER_KAMAR, 0);
  return [
    { label: 'Terisi', jumlah: terisi,                         warna: '#3b82f6' },
    { label: 'Kosong', jumlah: Math.max(0, totalSlot - terisi), warna: '#e2e8f0' }
  ];
},
```

---

## 2.9 Template HTML Utama (index.html)

### K. Struktur Kartu Statistik Dashboard

```html
<!-- Kartu Statistik: Penghuni Aktif -->
<div class="stat-card">
  <div class="stat-card-glow bg-blue-500"></div>
  <div class="flex items-start justify-between mb-3">
    <div
      class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30
                flex items-center justify-center"
    >
      <!-- Ikon SVG -->
    </div>
    <span
      class="text-xs font-600 text-green-600 bg-green-50
                 dark:bg-green-900/30 px-2 py-1 rounded-full"
      >Aktif</span
    >
  </div>
  <!-- Nilai dari getter Alpine.js (reaktif) -->
  <p
    class="text-3xl font-800 text-slate-800 dark:text-white"
    x-text="penghuniAktif"
  ></p>
  <p class="text-sm text-slate-500 mt-1">Penghuni Aktif</p>
</div>
```

### L. Grid Pilih Kamar di Modal Assign

```html
<!-- Grid visual pemilihan kamar (warna sesuai status) -->
<div class="kamar-select-grid">
  <template x-for="k in (assignBarakDetail?.daftarKamar||[])" :key="k.nomor">
    <button
      type="button"
      class="kamar-btn"
      :class="[
              !_kamarBisaDisisi(k) ? 'terisi' :
              (assignSelectedKamarNomor === k.nomor ? 'selected' : 'kosong')
            ]"
      :disabled="!_kamarBisaDisisi(k)"
      @click="_kamarBisaDisisi(k) && (assignSelectedKamarNomor = k.nomor)"
    >
      <!-- Nomor kamar -->
      <span x-text="k.nomor"></span>
      <!-- Indikator slot: penghuni saat ini / maksimal -->
      <span
        class="block text-xs font-400 mt-0.5 opacity-75"
        x-text="(k.penghuniList||[]).length + '/' + MAX_PENGHUNI_PER_KAMAR"
      >
      </span>
    </button>
  </template>
</div>
```

### M. Proteksi Halaman di Inisialisasi

```javascript
init() {
  // ── Proteksi rute: redirect ke login jika belum autentikasi ──
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn || isLoggedIn !== 'true') {
    window.location.replace('login.html');
    return;
  }

  // ── Muat data dari localStorage ──────────────────────────────
  this.loadFromStorage();
  this.loadUserData();
  this.updateDarkMode();

  // ── Reaktivitas: auto-save saat data berubah ─────────────────
  this.$watch('penghuni',   () => this.saveToStorage());
  this.$watch('barak',      () => {
    this.saveToStorage();
    if (this.currentPage === 'dashboard' || this.currentPage === 'laporan')
      this._scheduleChartRender(); // Re-render chart
  });
  this.$watch('inventaris', () => this.saveToStorage());
  this.$watch('darkMode',   () => {
    this.updateDarkMode();
    this.saveUserData();
    if (this.currentPage === 'dashboard' || this.currentPage === 'laporan')
      this._scheduleChartRender(); // Re-render dengan warna baru
  });

  // ── Render chart awal ─────────────────────────────────────────
  this._scheduleChartRender(600);
},
```

---

# BAGIAN III — TEKNOLOGI & DEPENDENSI

## 3.1 CDN Dependencies (index.html)

```html
<!-- Grafik interaktif -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- Ekspor PDF -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.3/jspdf.plugin.autotable.min.js"></script>

<!-- Ekspor Excel -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>

<!-- Dialog konfirmasi -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Framework reaktif -->
<script
  defer
  src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
></script>

<!-- Utility CSS -->
<script src="https://cdn.tailwindcss.com"></script>
```

---

_Dokumen ini disiapkan sebagai lampiran teknis Proposal SIMASRA v2.1_
_Asrama Kabupaten Deiyai · Kota Studi Jayapura · 2026_
