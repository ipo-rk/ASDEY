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
        // Getter Wajib (untuk template HTML)
        // ──────────────────────────────────────────────
        get totalKamarComputed() {
            return this.barak.reduce((sum, b) => sum + (b.daftarKamar?.length || b.kapasitas || 0), 0);
        },

        get availableYears() {
            const years = [...new Set(this.penghuni.map(p => Number(p.tahun_masuk)).filter(y => !isNaN(y)))];
            return years.length ? years.sort((a, b) => b - a) : [new Date().getFullYear()];
        },

        get availableYearsLaporan() {
            const current = new Date().getFullYear();
            return Array.from({ length: 10 }, (_, i) => current - i); // 10 tahun terakhir
        },

        get penghuniAktifList() {
            return this.penghuni.filter(p => p.status === 'aktif').sort((a, b) => a.nama.localeCompare(b.nama));
        },

        // ──────────────────────────────────────────────
        // Storage Keys & Methods
        // ──────────────────────────────────────────────
        STORAGE_KEYS: {
            PENGHUNI: 'simasra_penghuni',
            BARAK: 'simasra_barak',
            ASRAMA: 'simasra_asrama',
            INVENTARIS: 'simasra_inventaris',
            USER_PROFILE: 'simasra_user_profile',     // baru
            USER_SETTINGS: 'simasra_user_settings'    // baru
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
                console.log('Profil & pengaturan tersimpan');
            } catch (e) {
                console.error('Gagal menyimpan profil/pengaturan:', e);
            }
        },

        loadFromStorage() {
            try {
                this.penghuni = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PENGHUNI) || '[]');
                this.barak = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BARAK) || '[]');
                this.asramaList = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ASRAMA) || '[]');
                this.inventaris = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.INVENTARIS) || '[]');
            } catch (e) {
                console.error('Gagal memuat data:', e);
            }
        },

        saveToStorage() {
            try {
                localStorage.setItem(this.STORAGE_KEYS.PENGHUNI, JSON.stringify(this.penghuni));
                localStorage.setItem(this.STORAGE_KEYS.BARAK, JSON.stringify(this.barak));
                localStorage.setItem(this.STORAGE_KEYS.ASRAMA, JSON.stringify(this.asramaList));
                localStorage.setItem(this.STORAGE_KEYS.INVENTARIS, JSON.stringify(this.inventaris));
                console.log(`Data tersimpan — ${this.penghuni.length} penghuni, ${this.barak.length} barak`);
            } catch (e) {
                console.error('Gagal menyimpan ke localStorage:', e);
                Swal.fire({
                    title: 'Peringatan',
                    text: 'Gagal menyimpan data. Cek kuota penyimpanan browser.',
                    icon: 'warning'
                });
            }
        },

        // ──────────────────────────────────────────────
        // Init (hanya satu init!)
        // ──────────────────────────────────────────────
        init() {
            this.loadFromStorage();
            this.loadUserData();           // ← tambahkan ini

            if (this.penghuni.length === 0 && this.barak.length === 0) {
                this.resetInitialData();
            }

            this.updateDarkMode();

            // Auto-save data utama
            this.$watch('penghuni', () => this.saveToStorage());
            this.$watch('barak', () => this.saveToStorage());
            this.$watch('asramaList', () => this.saveToStorage());
            this.$watch('inventaris', () => this.saveToStorage());

            // Auto-save profil & settings
            this.$watch('userProfile', () => this.saveUserData());
            this.$watch('settings', () => this.saveUserData());
            this.$watch('darkMode', () => {
                this.updateDarkMode();
                this.saveUserData();     // simpan juga darkMode jika mau persist di settings
            });

            console.log('SIMASRA initialized – auto-save profil & settings aktif');
        },

        resetInitialData() {
            this.penghuni = [
                { nik: "9102017501010001", nama: "Yohanis Duwiri", nisn_nim: "123456789012", distrik: "Tigi", jenjang: "SMA", tahun_masuk: 2023, status: "aktif", jenis_kelamin: "Laki-laki", no_hp: "0812xxxxxxx" },
                { nik: "9102026805020002", nama: "Maria Kogoya", nisn_nim: "987654321098", distrik: "Deiyai", jenjang: "Mahasiswa", tahun_masuk: 2022, status: "aktif", jenis_kelamin: "Perempuan", no_hp: "0821xxxxxxx" },
                { nik: "9102035508030003", nama: "Daniel Wonda", nisn_nim: "", distrik: "Tigi Barat", jenjang: "SMA", tahun_masuk: 2021, status: "alumni", jenis_kelamin: "Laki-laki", no_hp: "" },
                { nik: "9102044409040004", nama: "Siska Tabuni", nisn_nim: "1122334455", distrik: "Paniai", jenjang: "Mahasiswa", tahun_masuk: 2024, status: "aktif", jenis_kelamin: "Perempuan", no_hp: "0852xxxxxxx" },
            ];

            this.barak = [
                { id: 1, lantai: 1, sisi: "Barak Kiri", rentangKamar: "101–107", kapasitas: 7, terisi: 0, status: "kosong", daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `10${i + 1}`, status: "kosong", penghuni: null })) },
                { id: 2, lantai: 1, sisi: "Barak Kanan", rentangKamar: "108–114", kapasitas: 7, terisi: 0, status: "kosong", daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `10${i + 8}`, status: "kosong", penghuni: null })) },
                { id: 3, lantai: 2, sisi: "Barak Kiri", rentangKamar: "201–207", kapasitas: 7, terisi: 0, status: "kosong", daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `20${i + 1}`, status: "kosong", penghuni: null })) },
                { id: 4, lantai: 2, sisi: "Barak Kanan", rentangKamar: "208–214", kapasitas: 7, terisi: 0, status: "kosong", daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `20${i + 8}`, status: "kosong", penghuni: null })) },
                { id: 5, lantai: 3, sisi: "Barak Kiri", rentangKamar: "301–307", kapasitas: 7, terisi: 0, status: "kosong", daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `30${i + 1}`, status: "kosong", penghuni: null })) },
                { id: 6, lantai: 3, sisi: "Barak Kanan", rentangKamar: "308–314", kapasitas: 7, terisi: 0, status: "maintenance", daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `31${i + 1}`, status: "maintenance", penghuni: null })) },
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
        // Dark Mode Fix (sinkronisasi ke <html>)
        // ──────────────────────────────────────────────
        updateDarkMode() {
            document.documentElement.classList.toggle('dark', this.darkMode);
            localStorage.theme = this.darkMode ? 'dark' : 'light';
        },

        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            this.updateDarkMode();
        },

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
            this.currentPage = page;
            if (window.innerWidth < 1024) this.sidebarOpen = false;
        },

        // ──────────────────────────────────────────────
        // Penghuni CRUD & Getters
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
                tahun_masuk: new Date().getFullYear(), jenis_kelamin: '', no_hp: '', status: 'aktif'
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
            }).then((result) => {                      // ← pakai (result) di sini
                if (result.isConfirmed) {
                    if (this.isEditMode) {
                        const idx = this.penghuni.findIndex(p => p.nik === this.form.nik);
                        if (idx !== -1) {
                            this.penghuni[idx] = { ...this.form };
                        }
                    } else {
                        this.penghuni.unshift({ ...this.form });
                    }

                    this.modalOpen = false;
                    Swal.fire('Berhasil!', 'Data penghuni tersimpan', 'success');

                    // Simpan ke localStorage (penting!)
                    this.saveToStorage();
                }
            }).catch(err => {
                console.error('Error di Swal confirm:', err);
            });
        },

        assignPenghuni() {
            if (!this.selectedPenghuniId || !this.selectedKamar) return;

            const penghuni = this.penghuni.find(p => p.nik === this.selectedPenghuniId);
            if (!penghuni) return Swal.fire('Error', 'Penghuni tidak ditemukan', 'error');

            const kamarKosong = this.selectedKamar.daftarKamar.find(k => k.status === 'kosong');
            if (!kamarKosong) return Swal.fire('Gagal', 'Tidak ada kamar kosong', 'error');

            Swal.fire({
                title: 'Konfirmasi Assign',
                text: `Assign ${penghuni.nama} ke ${this.selectedKamar.sisi} Lantai ${this.selectedKamar.lantai}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then((result) => {  // ← gunakan (result) secara konsisten
                if (result.isConfirmed) {
                    kamarKosong.status = 'terisi';
                    kamarKosong.penghuni = penghuni.nama;
                    this.selectedKamar.terisi = this.selectedKamar.daftarKamar.filter(k => k.status === 'terisi').length;

                    if (this.selectedKamar.terisi >= this.selectedKamar.kapasitas) {
                        this.selectedKamar.status = 'penuh';
                    } else if (this.selectedKamar.terisi > 0) {
                        this.selectedKamar.status = 'terisi_sebagian';
                    }

                    this.assignModalOpen = false;
                    Swal.fire('Berhasil', `${penghuni.nama} ditempatkan`, 'success');

                    this.recalculateOccupancy();
                    this.saveToStorage();           // simpan setelah perubahan berhasil
                }
            });
        },

        saveAsrama() {
            Swal.fire({
                title: this.isEditAsrama ? 'Simpan Perubahan?' : 'Tambah Asrama Baru?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then((result) => {  // ← ubah dari 'r' menjadi 'result' agar seragam
                if (!result.isConfirmed) return;

                if (this.isEditAsrama) {
                    const idx = this.asramaList.findIndex(a => a.id === this.asramaForm.id);
                    if (idx > -1) this.asramaList[idx] = { ...this.asramaForm };
                } else {
                    this.asramaList.push({
                        id: this.asramaList.length + 1,
                        ...this.asramaForm
                    });
                }

                this.asramaModalOpen = false;
                Swal.fire('Sukses', 'Data asrama tersimpan', 'success');

                this.saveToStorage();  // simpan setelah perubahan berhasil
            });
        },

        saveInventaris() {
            Swal.fire({
                title: this.isEditInventaris ? 'Simpan Perubahan?' : 'Tambah Inventaris?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then((result) => {  // ← ubah dari 'r' menjadi 'result' agar seragam
                if (!result.isConfirmed) return;

                const barak = this.barak.find(b => b.id == this.inventarisForm.barakId);
                const barakName = barak ? `${barak.sisi} – Lantai ${barak.lantai}` : 'Tidak diketahui';

                if (this.isEditInventaris) {
                    const idx = this.inventaris.findIndex(i => i.id === this.inventarisForm.id);
                    if (idx > -1) this.inventaris[idx] = { ...this.inventarisForm, barak: barakName };
                } else {
                    this.inventaris.push({
                        id: this.inventaris.length + 1,
                        barak: barakName,
                        ...this.inventarisForm
                    });
                }

                this.inventarisModalOpen = false;
                Swal.fire('Sukses', 'Data inventaris tersimpan', 'success');

                this.saveToStorage();  // simpan setelah perubahan berhasil
            });
        },

        saveProfile() {
            this.saving = true;
            setTimeout(() => {
                this.saving = false;
                this.saveUserData();           // auto-save via watch juga, tapi panggil manual untuk kepastian
                Swal.fire('Profil Disimpan', 'Perubahan telah disimpan', 'success');
            }, 800);
        },

        saveSettings() {
            if (this.settings.newPassword && this.settings.newPassword !== this.settings.confirmPassword) {
                return Swal.fire('Error', 'Konfirmasi kata sandi tidak cocok', 'error');
            }

            this.saving = true;
            setTimeout(() => {
                this.saving = false;
                // Reset field password setelah simpan
                this.settings.oldPassword = '';
                this.settings.newPassword = '';
                this.settings.confirmPassword = '';

                this.saveUserData();           // auto-save via watch juga
                Swal.fire('Pengaturan Disimpan', 'Perubahan telah disimpan', 'success');
            }, 800);
        },

        showRiwayat(penghuni) {
            this.selectedPenghuni = penghuni;
            this.selectedRiwayat = [
                { barak: "Barak Kiri – Lantai 1", kamar: "101", periode: "1 Agustus 2023 – sekarang", status: "aktif" },
                { barak: "Asrama Sentral Deiyai", kamar: "205", periode: "15 Januari 2023 – 31 Juli 2023", status: "pindah" }
            ];
            this.riwayatOpen = true;
        },


        // ──────────────────────────────────────────────
        // Barak & Assign (contoh lengkap)
        // ──────────────────────────────────────────────
        get filteredBarak() {
            let result = this.barak;
            if (this.filterStatusKamar) result = result.filter(b => b.status === this.filterStatusKamar);
            return result;
        },

        get totalBarak() { return this.barak.length; },
        get barakTerisi() { return this.barak.filter(b => b.status !== 'kosong' && b.status !== 'maintenance').length; },
        get barakKosong() { return this.barak.filter(b => b.status === 'kosong').length; },

        openAssignModal(barak = null) {
            this.selectedKamar = barak;
            this.selectedPenghuniId = '';
            this.assignModalOpen = true;
        },



        openDetailKamarModal(barak) {
            this.selectedDetailBarak = barak;
            this.detailKamarOpen = true;
        },

        showRiwayatKamar(barak) {
            this.selectedKamarRiwayat = barak;
            this.selectedRiwayatKamar = [
                { penghuni: "Yohanis Duwiri", periode: "1 Agustus 2023 – sekarang" },
                { penghuni: "Maria Kogoya", periode: "15 Maret 2023 – 30 Juli 2023" }
            ];
            this.riwayatKamarOpen = true;
        },

        // ──────────────────────────────────────────────
        // Asrama
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

        get totalKapasitas() { return this.asramaList.reduce((sum, a) => sum + a.kapasitas, 0); },
        get totalPenghuni() { return this.asramaList.reduce((sum, a) => sum + a.penghuniSaatIni, 0); },
        get hunianPersen() {
            return this.totalKapasitas > 0 ? Math.round((this.totalPenghuni / this.totalKapasitas) * 100) : 0;
        },

        openAddAsramaModal() {
            this.isEditAsrama = false;
            this.asramaForm = { nama: '', jenis: '', distrik: '', kapasitas: '', status: 'aktif' };
            this.asramaModalOpen = true;
        },

        openEditAsramaModal(asrama) {
            this.isEditAsrama = true;
            this.asramaForm = { ...asrama };
            this.asramaModalOpen = true;
        },



        showDetailAsrama(asrama) {
            const hunian = asrama.kapasitas > 0 ? Math.round((asrama.penghuniSaatIni / asrama.kapasitas) * 100) : 0;
            Swal.fire({
                title: `Detail: ${asrama.nama}`,
                html: `
                    <div style="text-align:left;">
                        <p><b>Jenis:</b> ${asrama.jenis}</p>
                        <p><b>Distrik:</b> ${asrama.distrik}</p>
                        <p><b>Kapasitas:</b> ${asrama.kapasitas}</p>
                        <p><b>Penghuni Saat Ini:</b> ${asrama.penghuniSaatIni}</p>
                        <p><b>Hunian:</b> <strong style="color:${hunian >= 90 ? 'red' : hunian >= 70 ? 'orange' : 'green'}">${hunian}%</strong></p>
                        <p><b>Status:</b> ${asrama.status}</p>
                    </div>
                `,
                confirmButtonColor: '#2563eb'
            });
        },

        // ──────────────────────────────────────────────
        // Inventaris
        // ──────────────────────────────────────────────
        get filteredInventaris() {
            let res = this.inventaris;
            if (this.filterBarakInventaris) res = res.filter(i => i.barakId == this.filterBarakInventaris);
            if (this.filterJenisInventaris) res = res.filter(i => i.jenis === this.filterJenisInventaris);
            return res;
        },

        get totalBaik() { return this.inventaris.reduce((s, i) => s + (i.baik || 0), 0); },
        get totalRusakRingan() { return this.inventaris.reduce((s, i) => s + (i.rusakRingan || 0), 0); },
        get totalRusakBerat() { return this.inventaris.reduce((s, i) => s + (i.rusakBerat || 0), 0); },
        get totalInventaris() { return this.totalBaik + this.totalRusakRingan + this.totalRusakBerat; },

        get persenBaik() { return this.totalInventaris ? Math.round((this.totalBaik / this.totalInventaris) * 100) : 0; },
        get persenRusakRingan() { return this.totalInventaris ? Math.round((this.totalRusakRingan / this.totalInventaris) * 100) : 0; },
        get persenRusakBerat() { return this.totalInventaris ? Math.round((this.totalRusakBerat / this.totalInventaris) * 100) : 0; },

        updateDaftarKamar() {
            this.daftarKamarPilihan = [];
            if (!this.inventarisForm.barakId) return;
            const barak = this.barak.find(b => b.id == this.inventarisForm.barakId);
            if (barak?.daftarKamar) this.daftarKamarPilihan = barak.daftarKamar;
        },

        openAddInventarisModal() {
            this.isEditInventaris = false;
            this.inventarisForm = { barakId: '', nomorKamar: '', jenis: '', jumlahTotal: '', baik: '', rusakRingan: '', rusakBerat: '', catatan: '' };
            this.daftarKamarPilihan = [];
            this.inventarisModalOpen = true;
        },

        openEditInventarisModal(item) {
            this.isEditInventaris = true;
            this.inventarisForm = { ...item };
            this.updateDaftarKamar();
            this.inventarisModalOpen = true;
        },



        // ──────────────────────────────────────────────
        // Laporan & Statistik
        // ──────────────────────────────────────────────
        get penghuniAktif() {
            return this.penghuni.filter(p => p.status === 'aktif').length;
        },

        get alumniTahunIni() {
            const th = new Date().getFullYear();
            return this.penghuni.filter(p => p.status === 'alumni' && Number(p.tahun_masuk) + 3 <= th).length;
        },

        get kamarKosong() {
            return this.barak.reduce((sum, b) => sum + b.daftarKamar.filter(k => k.status === 'kosong').length, 0);
        },

        get laporanDistrik() {
            const grouped = {};
            this.penghuni.forEach(p => {
                if (p.status === 'aktif') {
                    const d = p.distrik || 'Lainnya';
                    grouped[d] = (grouped[d] || 0) + 1;
                }
            });
            return Object.entries(grouped).map(([distrik, jumlah]) => ({ distrik, jumlah }))
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
            return Object.entries(grouped).map(([jenjang, jumlah]) => ({ jenjang, jumlah }))
                .sort((a, b) => b.jumlah - a.jumlah);
        },

        get availableYearsLaporan() {
            const currentYear = new Date().getFullYear();
            const years = [];
            for (let y = currentYear; y >= currentYear - 5; y--) { // Misal 5 tahun terakhir
                years.push(y);
            }
            return years;
        },

        generateLaporan() {
            Swal.fire({
                title: 'Generate Laporan?',
                text: `${this.filterPeriode} - ${this.filterTahunLaporan || 'semua tahun'}`,
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then(r => {
                if (r.isConfirmed) {
                    Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    setTimeout(() => {
                        Swal.fire('Selesai', 'Laporan telah digenerate (simulasi)', 'success');
                    }, 1200);
                }
            });
        },

        exportPDF() {
            Swal.fire({
                title: 'Export ke PDF?',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then(r => {
                if (r.isConfirmed) {
                    Swal.fire({ title: 'Memproses PDF...', didOpen: () => Swal.showLoading() });
                    setTimeout(() => Swal.fire('PDF siap', 'File telah diunduh (simulasi)', 'success'), 1200);
                }
            });
        },

        exportExcel() {
            Swal.fire({
                title: 'Export ke Excel?',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then(r => {
                if (r.isConfirmed) {
                    Swal.fire({ title: 'Memproses Excel...', didOpen: () => Swal.showLoading() });
                    setTimeout(() => Swal.fire('Excel siap', 'File telah diunduh (simulasi)', 'success'), 1200);
                }
            });
        },

        // ──────────────────────────────────────────────
        // Profil & Pengaturan
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

        saveProfile() {
            this.saving = true;
            setTimeout(() => {
                this.saving = false;
                Swal.fire('Profil Disimpan', '', 'success');
            }, 1200);
        },

        saveSettings() {
            if (this.settings.newPassword && this.settings.newPassword !== this.settings.confirmPassword) {
                return Swal.fire('Error', 'Konfirmasi kata sandi tidak cocok', 'error');
            }
            this.saving = true;
            setTimeout(() => {
                this.saving = false;
                this.settings.oldPassword = this.settings.newPassword = this.settings.confirmPassword = '';
                Swal.fire('Pengaturan Disimpan', '', 'success');
            }, 1200);
        },

        handleLogout() {
            Swal.fire({
                title: 'Keluar dari SIMASRA?',
                showCancelButton: true,
                confirmButtonColor: '#2563eb'
            }).then(r => {
                if (r.isConfirmed) {
                    localStorage.removeItem('isLoggedIn');
                    window.location.href = 'login.html';
                }
            });
        },

        // ──────────────────────────────────────────────
        // Perbaikan Khusus: confirmResetAll (mencegah error "e is not a function")
        // ──────────────────────────────────────────────
        // Contoh untuk confirmResetAll (ganti yang lama dengan ini)
        confirmResetAll() {
            Alpine.nextTick(() => {
                if (typeof Swal === 'undefined') {
                    alert('SweetAlert2 belum siap. Refresh halaman.');
                    return;
                }

                Swal.fire({
                    title: 'HAPUS SEMUA DATA?',
                    html: 'Ini permanen!<br>Ketik <b>deiyai2026</b>',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    preConfirm: (kode) => {
                        if (kode?.trim() !== 'deiyai2026') {
                            Swal.showValidationMessage('Kode salah!');
                            return false;
                        }
                        return true;
                    }
                }).then(result => {
                    if (result.isConfirmed) {
                        localStorage.clear();
                        Swal.fire('Dihapus', 'Data direset. Reload...', 'success', { timer: 2000 }).then(() => location.reload(true));
                    }
                });
            });
        },


        recalculateOccupancy() {
            // Update status & terisi setiap barak
            this.barak.forEach(b => {
                b.terisi = b.daftarKamar.filter(k => k.status === 'terisi').length || 0;

                if (b.terisi === 0) b.status = 'kosong';
                else if (b.terisi < b.kapasitas) b.status = 'terisi_sebagian';
                else b.status = 'penuh';
            });

            // Update penghuniSaatIni di asramaList (versi sederhana dulu)
            const totalAktif = this.penghuni.filter(p => p.status === 'aktif').length;
            this.asramaList.forEach(a => {
                a.penghuniSaatIni = totalAktif;   // nanti bisa dibuat lebih akurat dengan mapping asrama → barak
            });

            // Auto-save dipicu oleh $watch, tapi panggil manual juga aman
            // this.saveToStorage();   ← tidak wajib karena $watch sudah menangkap perubahan
        },




    }));
});
