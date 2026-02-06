document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        // ──────────────────────────────────────────────
        // State Dasar & UI
        // ──────────────────────────────────────────────
        sidebarOpen: window.innerWidth >= 1024,
        darkMode: localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        currentPage: 'dashboard',
        notificationsOpen: false,
        profileOpen: false,
        profileModalOpen: false,
        activeTab: 'profile',
        saving: false,
        exporting: false,          // ← PASTIKAN INI ADA
        exportFormat: '',
        detailAsramaOpen: false,
        selectedDetailAsrama: null,
        assigning: false,              // loading state untuk tombol assign
        selectedPenghuni: null,
        pageLoading: true,

        isExporting() {
            return this.exporting || false;
        },
        getExportFormat() {
            return this.exportFormat || '';
        },
        // ──────────────────────────────────────────────
        // Data Utama
        // ──────────────────────────────────────────────
        penghuni: [],
        barak: [],
        asramaList: [],
        inventaris: [],

        userProfile: {
            name: 'Richy Rizaldo',
            email: 'richy.rizaldo@example.com',
            phone: '0812-3456-7890',
            photo: ''
        },

        settings: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            emailNotifications: true
        },

        // ──────────────────────────────────────────────
        // Modals & Filters
        // ──────────────────────────────────────────────
        modalOpen: false,
        isEditMode: false,
        form: {},

        riwayatOpen: false,
        selectedPenghuni: null,
        selectedRiwayat: [],

        assignModalOpen: false,
        selectedKamar: null,
        selectedPenghuniId: '',

        detailKamarOpen: false,
        selectedDetailBarak: null,

        riwayatKamarOpen: false,
        selectedKamarRiwayat: null,
        selectedRiwayatKamar: [],

        asramaModalOpen: false,
        isEditAsrama: false,
        asramaForm: {},

        inventarisModalOpen: false,
        isEditInventaris: false,
        inventarisForm: {},
        daftarKamarPilihan: [],

        // Filters & Pagination
        searchQuery: '',
        filterJenjang: '',
        filterTahun: '',
        filterStatus: '',
        currentPageTable: 1,
        itemsPerPage: 10,

        filterStatusKamar: '',
        currentPageKamar: 1,
        itemsPerPageKamar: 6,

        filterJenisAsrama: '',
        filterStatusAsrama: '',

        filterBarakInventaris: '',
        filterJenisInventaris: '',

        filterPeriode: 'bulan',
        filterTahunLaporan: new Date().getFullYear().toString(),

        // ──────────────────────────────────────────────
        // Getter Wajib & Pendukung
        // ──────────────────────────────────────────────
        get totalKamarComputed() {
            return this.barak.reduce((sum, b) => sum + (b.daftarKamar?.length || 0), 0);
        },

        get selectedPenghuniDetail() {
            if (!this.selectedPenghuniId) return null;
            return this.penghuni.find(p => p.nik === this.selectedPenghuniId) || null;
        },

        get availableYears() {
            const years = [...new Set(this.penghuni.map(p => Number(p.tahun_masuk)).filter(y => !isNaN(y)))];
            return years.length ? years.sort((a, b) => b - a) : [new Date().getFullYear()];
        },

        get availableYearsLaporan() {
            const current = new Date().getFullYear();
            return Array.from({ length: 10 }, (_, i) => current - i);
        },

        get penghuniAktifList() {
            return this.penghuni
                .filter(p => p.status === 'aktif')
                .sort((a, b) => a.nama.localeCompare(b.nama));
        },

        // ← Getter baru yang paling cocok untuk dropdown assign
        get penghuniBisaDiassign() {
            return this.penghuni
                .filter(p => p.status === 'aktif' && !p.kamarSaatIni)
                .sort((a, b) => a.nama.localeCompare(b.nama));
        },

        // ──────────────────────────────────────────────
        // Getter untuk Asrama (sudah lengkap & aman)
        // ──────────────────────────────────────────────
        get filteredAsrama() {
            return this.asramaList.map(a => ({
                ...a,
                hunian: a.kapasitas > 0 ? Math.round((a.penghuniSaatIni / a.kapasitas) * 100) : 0
            })).filter(a => {
                let match = true;
                if (this.filterJenisAsrama) match = match && a.jenis === this.filterJenisAsrama;
                if (this.filterStatusAsrama) match = match && a.status === this.filterStatusAsrama;
                return match;
            });
        },

        get totalKapasitas() {
            return this.asramaList.reduce((sum, a) => sum + (Number(a.kapasitas) || 0), 0);
        },

        get totalPenghuni() {
            return this.asramaList.reduce((sum, a) => sum + (Number(a.penghuniSaatIni) || 0), 0);
        },

        get hunianPersen() {
            return this.totalKapasitas > 0 ? Math.round((this.totalPenghuni / this.totalKapasitas) * 100) : 0;
        },

        // ──────────────────────────────────────────────
        // Getter untuk Laporan & Statistik
        // ──────────────────────────────────────────────
        get alumniTahunIni() {
            const th = new Date().getFullYear();
            return this.penghuni.filter(p =>
                p.status === 'alumni' &&
                Number(p.tahun_masuk) + 3 <= th
            ).length;
        },

        get laporanDistrik() {
            const grouped = {};
            this.penghuni.forEach(p => {
                if (p.status === 'aktif') {
                    const d = p.distrik || 'Lainnya';
                    grouped[d] = (grouped[d] || 0) + 1;
                }
            });
            return Object.entries(grouped)
                .map(([distrik, jumlah]) => ({ distrik, jumlah }))
                .sort((a, b) => b.jumlah - a.jumlah);
        },

        get laporanJenjang() {
            const grouped = {};
            this.penghuni.forEach(p => {
                if (p.status === 'aktif') {
                    const j = p.jenjang || 'Lainnya';
                    grouped[j] = (grouped[j] || 0) + 1;
                }
            });
            return Object.entries(grouped)
                .map(([jenjang, jumlah]) => ({ jenjang, jumlah }))
                .sort((a, b) => b.jumlah - a.jumlah);
        },

        // ──────────────────────────────────────────────
        // Getter untuk Inventaris (lengkap & aman)
        // ──────────────────────────────────────────────
        get filteredInventaris() {
            let res = this.inventaris;
            if (this.filterBarakInventaris) res = res.filter(i => i.barakId == this.filterBarakInventaris);
            if (this.filterJenisInventaris) res = res.filter(i => i.jenis === this.filterJenisInventaris);
            return res;
        },

        get totalBaik() {
            return this.inventaris.reduce((s, i) => s + (Number(i.baik) || 0), 0);
        },

        get totalRusakRingan() {
            return this.inventaris.reduce((s, i) => s + (Number(i.rusakRingan) || 0), 0);
        },

        get totalRusakBerat() {
            return this.inventaris.reduce((s, i) => s + (Number(i.rusakBerat) || 0), 0);
        },

        get totalInventaris() {
            return this.totalBaik + this.totalRusakRingan + this.totalRusakBerat;
        },

        get persenBaik() {
            return this.totalInventaris ? Math.round((this.totalBaik / this.totalInventaris) * 100) : 0;
        },

        get persenRusakRingan() {
            return this.totalInventaris ? Math.round((this.totalRusakRingan / this.totalInventaris) * 100) : 0;
        },

        get persenRusakBerat() {
            return this.totalInventaris ? Math.round((this.totalRusakBerat / this.totalInventaris) * 100) : 0;
        },

        // ──────────────────────────────────────────────
        // Storage
        // ──────────────────────────────────────────────
        STORAGE_KEYS: {
            PENGHUNI: 'simasra_penghuni',
            BARAK: 'simasra_barak',
            ASRAMA: 'simasra_asrama',
            INVENTARIS: 'simasra_inventaris',
            USER_PROFILE: 'simasra_user_profile',
            USER_SETTINGS: 'simasra_user_settings'
        },

        loadUserData() {
            try {
                const profile = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
                if (profile) this.userProfile = JSON.parse(profile);

                const settings = localStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
                if (settings) this.settings = JSON.parse(settings);
            } catch (e) {
                console.error('Gagal memuat profil/pengaturan:', e);
            }
        },

        saveUserData() {
            try {
                localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.userProfile));
                localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(this.settings));
            } catch (e) {
                console.error('Gagal menyimpan profil/pengaturan:', e);
            }
        },

        // ──────────────────────────────────────────────
        // Memuat semua data dari localStorage dengan pengecekan ketat
        // ──────────────────────────────────────────────
        loadFromStorage() {
            try {
                // Helper function untuk memuat array dengan fallback aman
                const loadArray = (key, defaultValue = []) => {
                    const stored = localStorage.getItem(key);
                    if (stored === null) return defaultValue;

                    try {
                        const parsed = JSON.parse(stored);
                        // Pastikan hasilnya array (jika bukan → reset ke default)
                        return Array.isArray(parsed) ? parsed : defaultValue;
                    } catch (parseError) {
                        console.warn(`Data di localStorage key "${key}" rusak atau bukan JSON valid. Reset ke default.`, parseError);
                        return defaultValue;
                    }
                };

                // Muat masing-masing data dengan pengecekan tipe
                this.penghuni = loadArray(this.STORAGE_KEYS.PENGHUNI, []);
                this.barak = loadArray(this.STORAGE_KEYS.BARAK, []);
                this.asramaList = loadArray(this.STORAGE_KEYS.ASRAMA, []);
                this.inventaris = loadArray(this.STORAGE_KEYS.INVENTARIS, []);

                // Optional: Validasi struktur data minimal (opsional tapi sangat membantu debugging)
                if (this.barak.length > 0 && !this.barak.every(b => typeof b.id === 'number' && Array.isArray(b.daftarKamar))) {
                    console.warn('Beberapa data barak memiliki struktur tidak valid. Mungkin perlu reset data.');
                }

                // Jika semua array kosong → inisialisasi data awal (opsional)
                if (
                    this.penghuni.length === 0 &&
                    this.barak.length === 0 &&
                    this.asramaList.length === 0 &&
                    this.inventaris.length === 0
                ) {
                    console.log('Tidak ada data tersimpan → memuat data awal');
                    this.resetInitialData();
                }

                console.log('Data berhasil dimuat dari localStorage:', {
                    penghuni: this.penghuni.length,
                    barak: this.barak.length,
                    asrama: this.asramaList.length,
                    inventaris: this.inventaris.length
                });
            } catch (e) {
                console.error('Gagal memuat data dari localStorage:', e);
                // Fallback: reset semua ke array kosong agar aplikasi tetap berjalan
                this.penghuni = [];
                this.barak = [];
                this.asramaList = [];
                this.inventaris = [];

                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Memuat Data',
                    text: 'Data penyimpanan rusak atau tidak dapat dibaca. Aplikasi akan menggunakan data kosong. Silakan tambah data baru.',
                    confirmButtonText: 'OK'
                });
            }
            // Validasi tambahan setelah load barak
            this.barak = this.barak.map((b, index) => {
                if (b.id == null) {
                    console.warn(`Barak index ${index} tidak punya ID → assign ID baru`);
                    b.id = Date.now() + index;  // atau gunakan UUID jika punya library
                }
                if (!Array.isArray(b.daftarKamar)) {
                    b.daftarKamar = [];
                }
                return b;
            });

            // Simpan kembali jika ada perubahan (opsional)
            if (this.barak.some(b => b.id == null)) {
                this.saveToStorage();
            }
        },

        saveToStorage() {
            try {
                localStorage.setItem(this.STORAGE_KEYS.PENGHUNI, JSON.stringify(this.penghuni));
                localStorage.setItem(this.STORAGE_KEYS.BARAK, JSON.stringify(this.barak));
                localStorage.setItem(this.STORAGE_KEYS.ASRAMA, JSON.stringify(this.asramaList));
                localStorage.setItem(this.STORAGE_KEYS.INVENTARIS, JSON.stringify(this.inventaris));
            } catch (e) {
                console.error('Gagal menyimpan:', e);
                Swal.fire('Peringatan', 'Gagal menyimpan data. Cek kuota penyimpanan browser.', 'warning');
            }
        },

        // ──────────────────────────────────────────────
        // Init
        // ──────────────────────────────────────────────
        init() {
            this.loadFromStorage();
            this.loadUserData();

            if (this.penghuni.length === 0 && this.barak.length === 0) {
                this.resetInitialData();
            }

            this.updateDarkMode();


            this.$watch('penghuni', () => this.saveToStorage());
            this.$watch('barak', () => this.saveToStorage());
            this.$watch('asramaList', () => this.saveToStorage());
            this.$watch('inventaris', () => this.saveToStorage());
            this.$watch('userProfile', () => this.saveUserData());
            this.$watch('settings', () => this.saveUserData());

            this.$watch('darkMode', () => {
                this.updateDarkMode();
                this.saveUserData();

            });
            this.$watch('selectedPenghuniId', (newNik) => {
                if (newNik) {
                    const found = this.penghuni.find(p => p.nik === newNik);
                    this.selectedPenghuni = found || null;
                } else {
                    this.selectedPenghuni = null;
                }
            });
            console.log('SIMASRA initialized');

            this.$nextTick(() => {
                // Delay kecil untuk memastikan semua transisi & watcher selesai
                setTimeout(() => {
                    const loader = document.getElementById('page-loader');
                    if (loader) {
                        loader.style.opacity = '0';
                        setTimeout(() => {
                            loader.remove();
                        }, 800); // waktu fade-out selesai
                    }
                }, 3000);
            });


        },

        resetInitialData() {
            this.penghuni = [
                { nik: "9102017501010001", nama: "Yohanis Duwiri", nisn_nim: "123456789012", distrik: "Tigi", jenjang: "SMA", tahun_masuk: 2023, status: "aktif", jenis_kelamin: "Laki-laki", no_hp: "0812xxxxxxx", kamarSaatIni: null },
                { nik: "9102026805020002", nama: "Maria Kogoya", nisn_nim: "987654321098", distrik: "Deiyai", jenjang: "Mahasiswa", tahun_masuk: 2022, status: "aktif", jenis_kelamin: "Perempuan", no_hp: "0821xxxxxxx", kamarSaatIni: null },
                { nik: "9102035508030003", nama: "Daniel Wonda", nisn_nim: "", distrik: "Tigi Barat", jenjang: "SMA", tahun_masuk: 2021, status: "alumni", jenis_kelamin: "Laki-laki", no_hp: "", kamarSaatIni: null },
                { nik: "9102044409040004", nama: "Siska Tabuni", nisn_nim: "1122334455", distrik: "Paniai", jenjang: "Mahasiswa", tahun_masuk: 2024, status: "aktif", jenis_kelamin: "Perempuan", no_hp: "0852xxxxxxx", kamarSaatIni: null },
            ];

            this.barak = [
                {
                    id: 1, lantai: 1, sisi: "Barak Kiri", rentangKamar: "001–007", kapasitas: 7, terisi: 0, status: "kosong",
                    daftarKamar: Array(7).fill().map((_, i) => ({
                        nomor: `10${i + 1}`,
                        status: "kosong",
                        penghuniNIK: null,
                        tanggalMasuk: null,
                        riwayat: []
                    }))
                },
                {
                    id: 2, lantai: 1, sisi: "Barak Kanan", rentangKamar: "008–014", kapasitas: 7, terisi: 0, status: "kosong",
                    daftarKamar: Array(7).fill().map((_, i) => ({
                        nomor: `10${i + 8}`,
                        status: "kosong",
                        penghuniNIK: null,
                        tanggalMasuk: null
                    }))
                },
                // tambahkan barak lain jika diperlukan
            ];

            this.asramaList = [
                { id: 1, nama: "Asrama Putra Tigi", jenis: "Putra", distrik: "Tigi", kapasitas: 120, penghuniSaatIni: 0, status: "aktif" },
                { id: 2, nama: "Asrama Putri Deiyai", jenis: "Putri", distrik: "Deiyai", kapasitas: 100, penghuniSaatIni: 0, status: "aktif" },
                { id: 3, nama: "Asrama Campur Paniai", jenis: "Campur", distrik: "Paniai", kapasitas: 80, penghuniSaatIni: 0, status: "aktif" },
            ];

            this.inventaris = [];
            this.saveToStorage();
        },

        // ──────────────────────────────────────────────
        // Dark Mode
        // ──────────────────────────────────────────────
        updateDarkMode() {
            document.documentElement.classList.toggle('dark', this.darkMode);
            localStorage.theme = this.darkMode ? 'dark' : 'light';
        },

        toggleDarkMode() {
            this.darkMode = !this.darkMode;
        },

        // ──────────────────────────────────────────────
        // Penghuni CRUD
        // ──────────────────────────────────────────────
        get filteredPenghuni() {
            let result = this.penghuni;
            const q = this.searchQuery.toLowerCase().trim();
            if (q) {
                result = result.filter(p =>
                    (p.nik || '').toLowerCase().includes(q) ||
                    (p.nama || '').toLowerCase().includes(q) ||
                    (p.nisn_nim || '').toLowerCase().includes(q) ||
                    (p.distrik || '').toLowerCase().includes(q)
                );
            }
            if (this.filterJenjang) result = result.filter(p => p.jenjang === this.filterJenjang);
            if (this.filterTahun) result = result.filter(p => Number(p.tahun_masuk) === Number(this.filterTahun));
            if (this.filterStatus) result = result.filter(p => p.status === this.filterStatus);
            return result;
        },

        openAddModal() {
            this.isEditMode = false;
            this.form = {
                nik: '', nama: '', nisn_nim: '', distrik: '', jenjang: 'SMA',
                tahun_masuk: new Date().getFullYear(), jenis_kelamin: '', no_hp: '', status: 'aktif',
                kamarSaatIni: null
            };
            this.modalOpen = true;
        },

        openEditModal(penghuni) {
            this.isEditMode = true;
            this.form = { ...penghuni };
            this.modalOpen = true;
        },

        savePenghuni() {
            if (!this.form.nik?.trim()) {
                return Swal.fire('Error', 'NIK wajib diisi', 'error');
            }

            if (!this.isEditMode && this.penghuni.some(p => p.nik === this.form.nik.trim())) {
                return Swal.fire('Error', 'NIK sudah terdaftar!', 'error');
            }

            Swal.fire({
                title: this.isEditMode ? 'Simpan Perubahan?' : 'Tambah Penghuni Baru?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (this.isEditMode) {
                        const idx = this.penghuni.findIndex(p => p.nik === this.form.nik);
                        if (idx !== -1) this.penghuni[idx] = { ...this.form };
                    } else {
                        this.penghuni.unshift({ ...this.form });
                    }
                    this.modalOpen = false;
                    Swal.fire('Berhasil', 'Data tersimpan', 'success');
                }
            });
        },

        deletePenghuni(penghuni) {
            Swal.fire({
                title: 'Hapus Penghuni?',
                text: `Yakin menghapus data penghuni ${penghuni.nama} (${penghuni.nik})?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Ya, Hapus'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.penghuni = this.penghuni.filter(p => p.nik !== penghuni.nik);
                    Swal.fire('Terhapus!', 'Data penghuni telah dihapus.', 'success');
                }
            });
        },
        // ──────────────────────────────────────────────
        // Assign Penghuni ke Barak (Versi Final - Aman & Konsisten)
        // ──────────────────────────────────────────────
        assignPenghuni() {
            // 1. Pengecekan awal wajib (harus selalu ada)
            if (!this.selectedKamar) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Barak Hilang',
                    text: 'Data barak belum dipilih atau hilang. Tutup modal dan coba lagi.',
                    confirmButtonText: 'OK'
                });
                console.error('[assignPenghuni] selectedKamar kosong atau null');
                return;
            }

            if (!this.selectedPenghuniId) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Penghuni Belum Dipilih',
                    text: 'Silakan pilih salah satu penghuni terlebih dahulu.',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // 2. Pastikan this.barak adalah array
            if (!Array.isArray(this.barak)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Kesalahan Sistem',
                    text: 'Data daftar barak tidak valid. Silakan refresh halaman atau hubungi pengembang.',
                    confirmButtonText: 'OK'
                });
                console.error('[assignPenghuni] this.barak bukan array:', this.barak);
                return;
            }

            // 3. Cari penghuni berdasarkan NIK
            const penghuni = this.penghuni.find(p => p.nik === this.selectedPenghuniId);
            if (!penghuni) {
                Swal.fire({
                    icon: 'error',
                    title: 'Penghuni Tidak Ditemukan',
                    text: `NIK ${this.selectedPenghuniId} tidak ada di daftar penghuni.`,
                    confirmButtonText: 'OK'
                });
                console.warn('[assignPenghuni] Penghuni dengan NIK tidak ditemukan:', this.selectedPenghuniId);
                return;
            }

            // 4. Validasi status & kamar saat ini
            if (penghuni.status !== 'aktif') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Status Tidak Valid',
                    text: 'Hanya penghuni dengan status "aktif" yang dapat ditempatkan.',
                    confirmButtonText: 'OK'
                });
                return;
            }

            if (penghuni.kamarSaatIni) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sudah Ditempatkan',
                    text: `${penghuni.nama} sudah menempati kamar lain.`,
                    confirmButtonText: 'OK'
                });
                return;
            }

            // 5. Cari barak yang sesuai dengan selectedKamar.id
            const barakId = this.selectedKamar.id;
            if (barakId == null) {
                Swal.fire({
                    icon: 'error',
                    title: 'ID Barak Tidak Valid',
                    text: 'ID barak tidak ditemukan atau undefined. Tutup modal dan coba lagi.',
                    confirmButtonText: 'OK'
                });
                console.error('[assignPenghuni] selectedKamar.id undefined:', this.selectedKamar);
                return;
            }

            const barak = this.barak.find(b => b.id === barakId);
            if (!barak) {
                Swal.fire({
                    icon: 'error',
                    title: 'Barak Tidak Ditemukan',
                    text: `Barak dengan ID ${barakId} tidak ada di daftar sistem.`,
                    confirmButtonText: 'OK'
                });
                console.error('[assignPenghuni] Barak tidak ditemukan untuk id:', barakId, 'Data barak saat ini:', this.barak);
                return;
            }

            // 6. Pastikan barak punya daftarKamar yang valid
            if (!Array.isArray(barak.daftarKamar)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Barak Rusak',
                    text: 'Daftar kamar di barak ini tidak valid.',
                    confirmButtonText: 'OK'
                });
                console.error('[assignPenghuni] barak.daftarKamar bukan array:', barak);
                return;
            }

            // 7. Cari kamar kosong
            const kamarKosong = barak.daftarKamar.find(k => k.status === 'kosong');
            if (!kamarKosong) {
                Swal.fire({
                    icon: 'error',
                    title: 'Tidak Ada Kamar Kosong',
                    text: `Semua kamar di ${barak.sisi} Lantai ${barak.lantai} sudah terisi.`,
                    confirmButtonText: 'OK'
                });
                return;
            }

            // 8. Konfirmasi user
            Swal.fire({
                title: 'Konfirmasi Penempatan',
                html: `
            <div class="text-left">
                <p><strong>Penghuni:</strong> ${penghuni.nama} (${penghuni.nik})</p>
                <p><strong>Ditempatkan di:</strong> Kamar ${kamarKosong.nomor}</p>
                <p><strong>Barak:</strong> ${barak.sisi} – Lantai ${barak.lantai}</p>
                <p class="mt-3 text-sm text-gray-500">Tindakan ini akan mengubah status kamar dan penghuni.</p>
            </div>
        `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Tempatkan',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (!result.isConfirmed) return;

                const tanggal = new Date().toISOString().split('T')[0];

                // Tambahkan ke riwayat kamar
                kamarKosong.riwayat = kamarKosong.riwayat || [];  // pastikan array
                kamarKosong.riwayat.push({
                    nik: penghuni.nik,
                    nama: penghuni.nama,
                    tanggalMasuk: tanggal,
                    tanggalKeluar: null,  // akan diisi saat keluar
                    status: 'aktif'
                });

                // Update kamar & penghuni seperti biasa
                kamarKosong.status = 'terisi';
                kamarKosong.penghuniNIK = penghuni.nik;
                kamarKosong.tanggalMasuk = tanggal;

                // Update penghuni
                penghuni.kamarSaatIni = {
                    barakId: barak.id,
                    nomorKamar: kamarKosong.nomor,
                    tanggalMasuk: tanggal
                };

                // Update status barak
                barak.terisi = barak.daftarKamar.filter(k => k.status === 'terisi').length;
                barak.status = barak.terisi >= barak.kapasitas ? 'penuh' : 'terisi_sebagian';

                // Tutup modal & reset form
                this.assignModalOpen = false;
                this.selectedPenghuniId = '';
                this.selectedKamar = null; // reset agar aman untuk pemakaian berikutnya

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: `${penghuni.nama} berhasil ditempatkan di kamar ${kamarKosong.nomor}`,
                    timer: 2500,
                    showConfirmButton: false
                });

                // Update occupancy & simpan
                this.recalculateOccupancy();
                this.saveToStorage();
            });
        },

        kosongkanKamar(barak, kamar) {
            if (kamar.status !== 'terisi') return;

            const penghuni = this.penghuni.find(p => p.nik === kamar.penghuniNIK);
            const nama = penghuni ? penghuni.nama : '(data hilang)';

            Swal.fire({
                title: 'Kosongkan Kamar?',
                text: `Keluarkan ${nama} dari kamar ${kamar.nomor}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Ya, Keluarkan'
            }).then(result => {
                if (!result.isConfirmed) return;

                // Update riwayat sebelum kosongkan
                const lastRiwayat = kamar.riwayat?.[kamar.riwayat.length - 1];
                if (lastRiwayat && !lastRiwayat.tanggalKeluar) {
                    lastRiwayat.tanggalKeluar = new Date().toISOString().split('T')[0];
                    lastRiwayat.status = 'keluar';
                }

                // Kosongkan kamar
                kamar.status = 'kosong';
                kamar.penghuniNIK = null;
                kamar.tanggalMasuk = null;

                // Update penghuni
                if (penghuni && penghuni.kamarSaatIni?.nomorKamar === kamar.nomor) {
                    penghuni.kamarSaatIni = null;
                }

                this.recalculateOccupancy();
                this.saveToStorage();  // penting agar riwayat tersimpan
                Swal.fire('Berhasil', `Kamar ${kamar.nomor} telah dikosongkan`, 'success');
            });
        },

        // ──────────────────────────────────────────────
        // Barak & Occupancy
        // ──────────────────────────────────────────────
        recalculateOccupancy() {
            this.barak.forEach(b => {
                b.terisi = b.daftarKamar.filter(k => k.status === 'terisi').length;
                b.status = b.terisi === 0 ? 'kosong' :
                    b.terisi < b.kapasitas ? 'terisi_sebagian' : 'penuh';
            });

            const occupancy = {};
            this.barak.forEach(b => {
                if (b.asramaId) {
                    occupancy[b.asramaId] = (occupancy[b.asramaId] || 0) + b.terisi;
                }
            });

            this.asramaList.forEach(a => {
                a.penghuniSaatIni = occupancy[a.id] || 0;
            });
        },

        get filteredBarak() {
            let result = this.barak;
            if (this.filterStatusKamar) result = result.filter(b => b.status === this.filterStatusKamar);
            return result;
        },

        get kamarKosongTotal() {
            return this.barak.reduce((sum, b) => sum + b.daftarKamar.filter(k => k.status === 'kosong').length, 0);
        },

        openAssignModal(barak) {
            console.log('openAssignModal dipanggil dengan parameter:', barak);

            // Jika parameter adalah array (kesalahan umum), ambil yang pertama atau beri error
            if (Array.isArray(barak)) {
                console.warn('openAssignModal menerima array barak, seharusnya objek tunggal');
                if (barak.length > 0) {
                    barak = barak[0];  // fallback ambil yang pertama (opsional, bisa dihapus)
                    Swal.fire('Peringatan', 'Data barak yang dipilih tidak tepat, menggunakan barak pertama.', 'warning');
                } else {
                    Swal.fire('Error', 'Tidak ada barak yang valid untuk di-assign', 'error');
                    return;
                }
            }

            if (!barak || typeof barak !== 'object' || barak.id == null) {
                Swal.fire({
                    icon: 'error',
                    title: 'Data Barak Tidak Valid',
                    text: 'Pilih barak dari daftar dengan benar.',
                    confirmButtonText: 'OK'
                });
                console.error('Parameter barak invalid:', barak);
                return;
            }

            if (!Array.isArray(barak.daftarKamar)) {
                Swal.fire('Error', 'Barak ini tidak memiliki daftar kamar', 'error');
                return;
            }

            this.selectedKamar = { ...barak };
            this.selectedPenghuniId = '';
            this.assignModalOpen = true;
        },

        openDetailKamarModal(barak) {
            this.selectedDetailBarak = barak;
            this.detailKamarOpen = true;
        },

        showRiwayatKamar(barak) {
            if (!barak || !Array.isArray(barak.daftarKamar)) {
                Swal.fire('Error', 'Data barak tidak valid', 'error');
                return;
            }

            this.selectedKamarRiwayat = barak;

            // Kumpulkan semua riwayat dari semua kamar di barak ini
            const allRiwayat = [];
            barak.daftarKamar.forEach(kamar => {
                if (kamar.riwayat && Array.isArray(kamar.riwayat)) {
                    kamar.riwayat.forEach(entry => {
                        allRiwayat.push({
                            kamar: kamar.nomor,
                            penghuni: entry.nama || '(nama hilang)',
                            periode: entry.tanggalKeluar
                                ? `${entry.tanggalMasuk} – ${entry.tanggalKeluar}`
                                : `${entry.tanggalMasuk} – Sekarang`,
                            status: entry.status || (entry.tanggalKeluar ? 'keluar' : 'aktif')
                        });
                    });
                }
            });

            // Sort berdasarkan tanggal masuk terbaru (opsional)
            allRiwayat.sort((a, b) => new Date(b.periode.split(' – ')[0]) - new Date(a.periode.split(' – ')[0]));

            this.selectedRiwayatKamar = allRiwayat;

            this.riwayatKamarOpen = true;
        },

        // ──────────────────────────────────────────────
        // Fungsi Riwayat Penghuni
        // ──────────────────────────────────────────────
        showRiwayat(penghuni) {
            if (!penghuni) {
                return Swal.fire('Error', 'Data penghuni tidak ditemukan', 'error');
            }

            this.selectedPenghuni = penghuni;
            this.selectedRiwayat = []; // Reset dulu

            // Contoh data riwayat sementara (nanti ganti dengan data real dari storage atau log)
            // Di masa depan: load dari array riwayat yang tersimpan di penghuni atau kamar
            this.selectedRiwayat = [
                {
                    kamar: penghuni.kamarSaatIni ? penghuni.kamarSaatIni.nomorKamar : '-',
                    barak: penghuni.kamarSaatIni ? this.barak.find(b => b.id === penghuni.kamarSaatIni.barakId)?.sisi || '-' : '-',
                    tanggalMasuk: penghuni.kamarSaatIni?.tanggalMasuk || '-',
                    tanggalKeluar: null,
                    status: 'Saat Ini'
                },
                // Tambah riwayat lama jika sudah implementasi history
                // Contoh dummy:
                // { kamar: '102', barak: 'Barak Kiri Lt 1', tanggalMasuk: '2023-01-15', tanggalKeluar: '2024-06-30', status: 'Riwayat' }
            ];

            // Jika ingin lebih realistis, cek riwayat dari kamar yang pernah ditempati
            if (penghuni.kamarSaatIni) {
                const barak = this.barak.find(b => b.id === penghuni.kamarSaatIni.barakId);
                if (barak) {
                    const kamar = barak.daftarKamar.find(k => k.nomor === penghuni.kamarSaatIni.nomorKamar);
                    if (kamar && kamar.riwayat) {
                        this.selectedRiwayat = kamar.riwayat.map(r => ({
                            kamar: r.nomorKamar || penghuni.kamarSaatIni.nomorKamar,
                            barak: barak.sisi + ' Lt ' + barak.lantai,
                            tanggalMasuk: r.tanggalMasuk,
                            tanggalKeluar: r.tanggalKeluar || 'Sekarang',
                            status: r.tanggalKeluar ? 'Riwayat' : 'Saat Ini'
                        }));
                    }
                }
            }

            this.riwayatOpen = true;
        },
        // ──────────────────────────────────────────────
        // Getter UI & Statistik Barak
        // ──────────────────────────────────────────────
        get totalBarak() {
            return this.barak.length;
        },

        get barakTerisi() {
            return this.barak.filter(b =>
                b.status !== 'kosong' && b.status !== 'maintenance'
            ).length;
        },

        get barakKosong() {
            return this.barak.filter(b => b.status === 'kosong').length;
        },

        getKamarSaatIni(penghuni) {
            if (!penghuni.kamarSaatIni) return 'Belum ditempatkan';
            const barak = this.barak.find(b => b.id === penghuni.kamarSaatIni.barakId);
            if (!barak) return 'Data kamar hilang';
            return `${penghuni.kamarSaatIni.nomorKamar} — ${barak.sisi} Lt ${barak.lantai}`;
        },

        // ──────────────────────────────────────────────
        // Fungsi UI Dasar
        // ──────────────────────────────────────────────
        toggleNotifications() {
            this.notificationsOpen = !this.notificationsOpen;
            this.profileOpen = false;
        },

        toggleProfile() {
            this.profileOpen = !this.profileOpen;
            this.notificationsOpen = false;
        },

        closeDropdowns(event) {
            if (!event.target.closest('.dropdown')) {
                this.notificationsOpen = false;
                this.profileOpen = false;
            }
        },

        setPage(page) {
            this.pageLoading = true;
            this.currentPage = page;
            if (window.innerWidth < 1024) {
                this.sidebarOpen = false;
            }
            // Delay kecil untuk simulasi loading
            setTimeout(() => {
                this.pageLoading = false;
            }, 600);
        },


        // ──────────────────────────────────────────────
        // Fungsi Asrama (CRUD)
        // ──────────────────────────────────────────────
        openAddAsramaModal() {
            this.isEditAsrama = false;
            this.asramaForm = {
                nama: '',
                jenis: '',
                distrik: '',
                kapasitas: '',
                status: 'aktif'
            };
            this.asramaModalOpen = true;
        },

        openEditAsramaModal(asrama) {
            this.isEditAsrama = true;
            this.asramaForm = { ...asrama };
            this.asramaModalOpen = true;
        },

        saveAsrama() {
            if (!this.asramaForm.nama?.trim()) {
                return Swal.fire('Error', 'Nama asrama wajib diisi', 'error');
            }
            if (!this.asramaForm.kapasitas || isNaN(this.asramaForm.kapasitas) || this.asramaForm.kapasitas <= 0) {
                return Swal.fire('Error', 'Kapasitas harus angka lebih dari 0', 'error');
            }

            Swal.fire({
                title: this.isEditAsrama ? 'Simpan perubahan asrama?' : 'Tambah asrama baru?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then((result) => {
                if (!result.isConfirmed) return;

                if (this.isEditAsrama) {
                    const idx = this.asramaList.findIndex(a => a.id === this.asramaForm.id);
                    if (idx !== -1) {
                        this.asramaList[idx] = { ...this.asramaForm };
                    }
                } else {
                    this.asramaList.push({
                        id: this.asramaList.length + 1,
                        ...this.asramaForm,
                        penghuniSaatIni: 0
                    });
                }

                this.asramaModalOpen = false;
                Swal.fire('Sukses', 'Data asrama tersimpan', 'success');
            });
        },

        // ──────────────────────────────────────────────
        // Fungsi Detail Asrama (Modal Detail)
        // ──────────────────────────────────────────────
        showDetailAsrama(asrama) {
            if (!asrama) {
                return Swal.fire('Error', 'Data asrama tidak ditemukan', 'error');
            }

            this.selectedDetailAsrama = { ...asrama }; // copy object agar aman diedit jika perlu

            // Hitung ulang data tambahan jika diperlukan (opsional)
            this.selectedDetailAsrama.hunian = asrama.kapasitas > 0
                ? Math.round((asrama.penghuniSaatIni / asrama.kapasitas) * 100)
                : 0;

            // Buka modal
            this.detailAsramaOpen = true;  // ← pastikan state ini ada di Alpine
        },

        // ──────────────────────────────────────────────
        // Fungsi Inventaris (CRUD)
        // ──────────────────────────────────────────────
        openAddInventarisModal() {
            this.isEditInventaris = false;
            this.inventarisForm = {
                barakId: '',
                nomorKamar: '',
                jenis: '',
                jumlahTotal: '',
                baik: '',
                rusakRingan: '',
                rusakBerat: '',
                catatan: ''
            };
            this.daftarKamarPilihan = [];
            this.inventarisModalOpen = true;
        },

        openEditInventarisModal(item) {
            this.isEditInventaris = true;
            this.inventarisForm = { ...item };
            this.updateDaftarKamar();
            this.inventarisModalOpen = true;
        },

        updateDaftarKamar() {
            this.daftarKamarPilihan = [];
            if (!this.inventarisForm.barakId) return;

            const barak = this.barak.find(b => b.id == this.inventarisForm.barakId);
            if (barak?.daftarKamar) {
                this.daftarKamarPilihan = barak.daftarKamar;
            }
        },

        saveInventaris() {
            if (!this.inventarisForm.barakId || !this.inventarisForm.jenis?.trim()) {
                return Swal.fire('Error', 'Barak dan jenis inventaris wajib diisi', 'error');
            }

            Swal.fire({
                title: this.isEditInventaris ? 'Simpan perubahan?' : 'Tambah inventaris?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then((result) => {
                if (!result.isConfirmed) return;

                const barak = this.barak.find(b => b.id == this.inventarisForm.barakId);
                const barakName = barak ? `${barak.sisi} – Lt ${barak.lantai}` : 'Tidak diketahui';

                if (this.isEditInventaris) {
                    const idx = this.inventaris.findIndex(i => i.id === this.inventarisForm.id);
                    if (idx !== -1) {
                        this.inventaris[idx] = { ...this.inventarisForm, barak: barakName };
                    }
                } else {
                    this.inventaris.push({
                        id: this.inventaris.length + 1,
                        barak: barakName,
                        ...this.inventarisForm
                    });
                }

                this.inventarisModalOpen = false;
                Swal.fire('Sukses', 'Data inventaris tersimpan', 'success');
            });
        },

        // ──────────────────────────────────────────────
        // Fungsi Laporan & Statistik (lanjutan)
        // ──────────────────────────────────────────────
        get penghuniAktif() {
            return this.penghuni.filter(p => p.status === 'aktif').length;
        },

        get kamarKosong() {
            return this.barak.reduce((sum, b) => sum + b.daftarKamar.filter(k => k.status === 'kosong').length, 0);
        },

        // ──────────────────────────────────────────────
        // Fungsi Profil & Pengaturan (sudah lengkap sebelumnya, hanya ditata ulang)
        // ──────────────────────────────────────────────
        openProfileModal(tab = 'profile') {
            this.activeTab = tab;
            this.profileModalOpen = true;
        },

        uploadPhoto(event) {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/')) {
                return Swal.fire('Error', 'Hanya file gambar yang diperbolehkan', 'error');
            }
            const reader = new FileReader();
            reader.onload = e => this.userProfile.photo = e.target.result;
            reader.readAsDataURL(file);
        },

        // ──────────────────────────────────────────────
        // Fungsi Logout & Reset
        // ──────────────────────────────────────────────
        handleLogout() {
            Swal.fire({
                title: 'Keluar dari sistem?',
                text: "Anda akan dialihkan ke halaman login",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33'
            }).then(r => {
                if (r.isConfirmed) {
                    localStorage.removeItem('isLoggedIn');
                    window.location.href = 'login.html';
                }
            });
        },

        // ──────────────────────────────────────────────
        // Fungsi Reset Semua Data (sudah ada, hanya ditata lebih rapi)
        // ──────────────────────────────────────────────
        confirmResetAll() {
            Swal.fire({
                title: 'HAPUS SEMUA DATA?',
                html: 'Tindakan ini <b>tidak dapat dibatalkan</b>!<br>Ketik <b>deiyai2026</b> untuk konfirmasi',
                input: 'text',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Hapus Permanen',
                preConfirm: (kode) => {
                    if (kode?.trim() !== 'deiyai2026') {
                        Swal.showValidationMessage('Kode konfirmasi salah');
                        return false;
                    }
                    return true;
                }
            }).then(result => {
                if (result.isConfirmed) {
                    localStorage.clear();
                    Swal.fire({
                        title: 'Data dihapus',
                        text: 'Aplikasi akan dimuat ulang...',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => location.reload(true));
                }
            });
        },

        // ──────────────────────────────────────────────
        // Getter Pendukung UI (sudah ada sebagian, ditambah sedikit)
        // ──────────────────────────────────────────────
        get penghuniTotal() {
            return this.penghuni.length;
        },

        get penghuniDitempatkan() {
            return this.penghuni.filter(p => p.kamarSaatIni !== null).length;
        },

        // Jika ada fungsi lain yang masih ingin ditambahkan (misal print laporan, export CSV, dll),
        // bisa dilanjutkan di sini
        // ──────────────────────────────────────────────
        // EXPORT DATA - PDF & EXCEL (VERSI FINAL AKURAT & KONSISTEN)
        // ──────────────────────────────────────────────
        exportPDF() {
            this.exporting = true;
            this.exportFormat = 'PDF';

            try {
                const { jsPDF } = window.jspdf;
                if (!jsPDF) throw new Error('jsPDF tidak terload');

                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                // Header Laporan
                doc.setFontSize(18);
                doc.setTextColor(37, 99, 235);
                doc.text("Laporan SIMASRA - Asrama Kabupaten Deiyai", pageWidth / 2, 20, { align: "center" });

                doc.setFontSize(11);
                doc.setTextColor(100);
                doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 30, { align: "center" });

                let yPos = 45;

                // Ringkasan Statistik
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text("Ringkasan Statistik Saat Ini", 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                const summary = [
                    ["Penghuni Aktif", this.penghuniAktif || 0],
                    ["Tingkat Hunian", `${this.hunianPersen || 0}%`],
                    ["Alumni Tahun Ini", this.alumniTahunIni || 0],
                    ["Kamar Kosong", this.kamarKosong || 0],
                    ["Total Barak", this.totalBarak || 0],
                    ["Total Kamar", this.totalKamarComputed || 0]
                ];

                doc.autoTable({
                    startY: yPos,
                    head: [['Kategori', 'Jumlah']],
                    body: summary,
                    theme: 'grid',
                    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                    styles: { fontSize: 10, cellPadding: 4 },
                    margin: { left: 20, right: 20 },
                    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40, halign: 'center' } }
                });

                yPos = doc.lastAutoTable.finalY + 20;

                // Penghuni per Distrik
                if (this.laporanDistrik?.length > 0) {
                    doc.setFontSize(14);
                    doc.text("Penghuni Aktif per Distrik", 20, yPos);
                    yPos += 8;

                    const distrikData = this.laporanDistrik.map(d => [d.distrik, d.jumlah]);
                    doc.autoTable({
                        startY: yPos,
                        head: [['Distrik', 'Jumlah Orang']],
                        body: distrikData,
                        theme: 'striped',
                        headStyles: { fillColor: [66, 139, 202] },
                        styles: { fontSize: 10, cellPadding: 3 },
                        margin: { left: 20, right: 20 }
                    });
                    yPos = doc.lastAutoTable.finalY + 15;
                }

                // Penghuni per Jenjang
                if (this.laporanJenjang?.length > 0) {
                    doc.setFontSize(14);
                    doc.text("Penghuni per Jenjang Pendidikan", 20, yPos);
                    yPos += 8;

                    const jenjangData = this.laporanJenjang.map(j => [j.jenjang, j.jumlah]);
                    doc.autoTable({
                        startY: yPos,
                        head: [['Jenjang', 'Jumlah Orang']],
                        body: jenjangData,
                        theme: 'striped',
                        headStyles: { fillColor: [66, 139, 202] },
                        styles: { fontSize: 10, cellPadding: 3 },
                        margin: { left: 20, right: 20 }
                    });
                }

                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    doc.text(`Halaman ${i} dari ${pageCount} • SIMASRA © ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 10, { align: "center" });
                }

                doc.save(`laporan_simasra_${new Date().toISOString().split('T')[0]}.pdf`);
            } catch (err) {
                console.error('Gagal export PDF:', err);
                Swal.fire('Error', 'Gagal membuat file PDF. Cek console atau koneksi CDN.', 'error');
            } finally {
                this.exporting = false;
                this.exportFormat = '';
            }
        },

        exportExcel() {
            this.exporting = true;
            this.exportFormat = 'Excel';

            try {
                if (typeof XLSX === 'undefined') throw new Error('SheetJS tidak terload');

                const wb = XLSX.utils.book_new();

                // Sheet 1: Ringkasan Statistik
                const summaryData = [
                    ["Kategori", "Jumlah"],
                    ["Penghuni Aktif Saat Ini", this.penghuniAktif || 0],
                    ["Tingkat Hunian", `${this.hunianPersen || 0}%`],
                    ["Alumni Tahun Ini", this.alumniTahunIni || 0],
                    ["Kamar Kosong", this.kamarKosong || 0],
                    ["Total Barak", this.totalBarak || 0],
                    ["Total Kamar", this.totalKamarComputed || 0]
                ];
                const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

                // Sheet 2: Penghuni per Distrik
                if (this.laporanDistrik?.length > 0) {
                    const distrikData = [["Distrik", "Jumlah Orang"], ...this.laporanDistrik.map(d => [d.distrik, d.jumlah])];
                    const wsDistrik = XLSX.utils.aoa_to_sheet(distrikData);
                    XLSX.utils.book_append_sheet(wb, wsDistrik, "Distrik");
                }

                // Sheet 3: Penghuni per Jenjang
                if (this.laporanJenjang?.length > 0) {
                    const jenjangData = [["Jenjang", "Jumlah Orang"], ...this.laporanJenjang.map(j => [j.jenjang, j.jumlah])];
                    const wsJenjang = XLSX.utils.aoa_to_sheet(jenjangData);
                    XLSX.utils.book_append_sheet(wb, wsJenjang, "Jenjang");
                }

                // Auto lebar kolom
                [wsSummary, wb.Sheets["Distrik"], wb.Sheets["Jenjang"]].forEach(ws => {
                    if (ws) {
                        const range = XLSX.utils.decode_range(ws['!ref']);
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            let maxWidth = 10;
                            for (let R = range.s.r; R <= range.e.r; ++R) {
                                const cell = ws[XLSX.utils.encode_cell({ c: C, r: R })];
                                if (cell && cell.v) {
                                    const len = cell.v.toString().length;
                                    if (len > maxWidth) maxWidth = len;
                                }
                            }
                            ws['!cols'] = ws['!cols'] || [];
                            ws['!cols'][C] = { wch: maxWidth + 2 };
                        }
                    }
                });

                const filename = `laporan_simasra_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(wb, filename);

                Swal.fire('Sukses', `File Excel "${filename}" telah diunduh`, 'success');
            } catch (err) {
                console.error('Gagal export Excel:', err);
                Swal.fire('Error', 'Gagal membuat file Excel. Cek koneksi CDN SheetJS.', 'error');
            } finally {
                this.exporting = false;
                this.exportFormat = '';
            }
        },

        isExporting() { return this.exporting || false; },
        getExportFormat() { return this.exportFormat || ''; },

        backupAllData() {
            const backup = {
                penghuni: this.penghuni,
                barak: this.barak,
                asramaList: this.asramaList,
                inventaris: this.inventaris,
                userProfile: this.userProfile,
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simasra_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Swal.fire('Sukses', 'Backup data berhasil diunduh', 'success');
        },


        // ──────────────────────────────────────────────
        // Generate Laporan (Custom / Ringkasan)
        // ──────────────────────────────────────────────
        generateLaporan() {
            // Optional: Tampilkan loading
            this.exporting = true;
            this.exportFormat = 'Laporan';

            Swal.fire({
                title: 'Generate Laporan',
                html: 'Pilih jenis laporan yang ingin dibuat:',
                showCancelButton: true,
                confirmButtonText: 'Lanjutkan',
                cancelButtonText: 'Batal',
                showDenyButton: true,
                denyButtonText: 'Statistik Bulanan',
                confirmButtonColor: '#2563eb',
                denyButtonColor: '#059669',
            }).then((result) => {
                if (result.isConfirmed) {
                    // Contoh: Generate laporan lengkap (semua data)
                    this.generateFullReport();
                } else if (result.isDenied) {
                    // Contoh: Generate statistik bulanan/tahunan
                    this.generateMonthlyStats();
                }
            }).finally(() => {
                this.exporting = false;
                this.exportFormat = '';
            });
        },

        // Helper: Generate laporan lengkap (bisa custom)
        generateFullReport() {
            // Logika custom, misal gabungkan data penghuni + asrama + inventaris
            const reportData = {
                tanggal: new Date().toLocaleDateString('id-ID'),
                totalPenghuni: this.penghuniAktif,
                totalAsrama: this.asramaList.length,
                hunianRataRata: this.hunianPersen,
                inventarisBaik: this.totalBaik,
                inventarisRusak: this.totalRusakRingan + this.totalRusakBerat,
                // Tambah data lain sesuai kebutuhan
            };

            Swal.fire({
                title: 'Laporan Lengkap Siap!',
                html: `
            <p>Total Penghuni Aktif: <strong>${reportData.totalPenghuni}</strong></p>
            <p>Persentase Hunian: <strong>${reportData.hunianRataRata}%</strong></p>
            <p>Inventaris Baik: <strong>${reportData.inventarisBaik}</strong></p>
            <p>Inventaris Rusak: <strong>${reportData.inventarisRusak}</strong></p>
        `,
                icon: 'success',
                confirmButtonText: 'Download PDF',
            }).then((res) => {
                if (res.isConfirmed) {
                    // Panggil exportPDF yang sudah ada, atau custom
                    this.exportPDF();
                }
            });
        },

        // Helper: Generate statistik bulanan/tahunan (contoh sederhana)
        generateMonthlyStats() {
            const tahun = this.filterTahunLaporan || new Date().getFullYear().toString();
            const filtered = this.penghuni.filter(p => p.tahun_masuk == tahun && p.status === 'aktif');

            Swal.fire({
                title: `Statistik Tahun ${tahun}`,
                html: `
            <ul class="text-left">
                <li>Penghuni Aktif: <strong>${filtered.length}</strong></li>
                <li>Alumni Tahun Ini: <strong>${this.alumniTahunIni}</strong></li>
                <li>Distrik Terbanyak: <strong>${this.laporanDistrik[0]?.distrik || '-'}</strong></li>
            </ul>
        `,
                icon: 'info',
                confirmButtonText: 'OK',
            });
        },
    }));
});

