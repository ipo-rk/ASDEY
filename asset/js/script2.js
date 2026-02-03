document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        // ──────────────────────────────────────────────
        // Properti Dasar & Utility
        // ──────────────────────────────────────────────
        sidebarOpen: window.innerWidth >= 1024,
        darkMode: localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        currentPage: 'dashboard',
        notificationsOpen: false,
        profileOpen: false,

        init() {
            this.updateDarkMode();
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.updateDarkMode());
            window.addEventListener('resize', () => {
                this.sidebarOpen = window.innerWidth >= 1024;
            });
        },

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
        // Data Penghuni
        // ──────────────────────────────────────────────
        penghuni: [
            { nik: "9102017501010001", nama: "Yohanis Duwiri", nisn_nim: "123456789012", distrik: "Tigi", jenjang: "SMA", tahun_masuk: 2023, status: "aktif", jenis_kelamin: "Laki-laki", no_hp: "0812xxxxxxx" },
            { nik: "9102026805020002", nama: "Maria Kogoya", nisn_nim: "987654321098", distrik: "Deiyai", jenjang: "Mahasiswa", tahun_masuk: 2022, status: "aktif", jenis_kelamin: "Perempuan", no_hp: "0821xxxxxxx" },
            { nik: "9102035508030003", nama: "Daniel Wonda", nisn_nim: "", distrik: "Tigi Barat", jenjang: "SMA", tahun_masuk: 2021, status: "alumni", jenis_kelamin: "Laki-laki", no_hp: "" },
            { nik: "9102044409040004", nama: "Siska Tabuni", nisn_nim: "1122334455", distrik: "Paniai", jenjang: "Mahasiswa", tahun_masuk: 2024, status: "aktif", jenis_kelamin: "Perempuan", no_hp: "0852xxxxxxx" },
            { nik: "9102053307050005", nama: "Benny Yeimo", nisn_nim: "9988776655", distrik: "Nabire", jenjang: "SMA", tahun_masuk: 2023, status: "keluar", jenis_kelamin: "Laki-laki", no_hp: "" },
        ],

        searchQuery: '',
        filterJenjang: '',
        filterTahun: '',
        filterStatus: '',
        currentPageTable: 1,
        itemsPerPage: 10,

        modalOpen: false,
        isEditMode: false,
        form: {
            nik: '',
            nama: '',
            nisn_nim: '',
            distrik: '',
            jenjang: 'SMA',
            tahun_masuk: new Date().getFullYear(),
            jenis_kelamin: '',
            no_hp: '',
            status: 'aktif'
        },

        riwayatOpen: false,
        selectedPenghuni: null,
        selectedRiwayat: [],

        get filteredPenghuni() {
            let result = this.penghuni;
            const q = this.searchQuery.toLowerCase().trim();
            if (q) {
                result = result.filter(p =>
                    p.nik.toLowerCase().includes(q) ||
                    p.nama.toLowerCase().includes(q) ||
                    (p.nisn_nim && p.nisn_nim.toLowerCase().includes(q)) ||
                    p.distrik.toLowerCase().includes(q)
                );
            }
            if (this.filterJenjang) result = result.filter(p => p.jenjang === this.filterJenjang);
            if (this.filterTahun) result = result.filter(p => p.tahun_masuk == this.filterTahun);
            if (this.filterStatus) result = result.filter(p => p.status === this.filterStatus);
            return result;
        },

        get availableYears() {
            return [...new Set(this.penghuni.map(p => p.tahun_masuk))].sort((a, b) => b - a);
        },

        openAddModal() {
            this.isEditMode = false;
            this.form = {
                nik: '',
                nama: '',
                nisn_nim: '',
                distrik: '',
                jenjang: 'SMA',
                tahun_masuk: new Date().getFullYear(),
                jenis_kelamin: '',
                no_hp: '',
                status: 'aktif'
            };
            this.modalOpen = true;
        },

        openEditModal(penghuni) {
            this.isEditMode = true;
            this.form = { ...penghuni };
            this.modalOpen = true;
        },

        savePenghuni() {
            Swal.fire({
                title: this.isEditMode ? 'Simpan Perubahan?' : 'Tambah Penghuni Baru?',
                text: this.isEditMode ? "Data akan diperbarui." : "Data baru akan ditambahkan.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Simpan!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (this.isEditMode) {
                        const index = this.penghuni.findIndex(p => p.nik === this.form.nik);
                        if (index !== -1) this.penghuni[index] = { ...this.form };
                    } else {
                        this.penghuni.unshift({ ...this.form });
                    }
                    Swal.fire({
                        title: 'Berhasil!',
                        text: this.isEditMode ? 'Data penghuni berhasil diperbarui.' : 'Penghuni baru berhasil ditambahkan.',
                        icon: 'success',
                        confirmButtonColor: '#2563eb'
                    });
                    this.modalOpen = false;
                }
            });
        },

        showRiwayat(penghuni) {
            this.selectedPenghuni = penghuni;
            this.selectedRiwayat = [
                { barak: `Barak Kiri – Lantai 1`, kamar: "101", periode: "1 Agustus 2023 – sekarang", status: "aktif" },
                { barak: `Asrama Sentral Deiyai`, kamar: "205", periode: "15 Januari 2023 – 31 Juli 2023", status: "pindah" }
            ];
            this.riwayatOpen = true;
        },

        get penghuniAktif() {
            return this.penghuni.filter(p => p.status === 'aktif');
        },

        // ──────────────────────────────────────────────
        // Barak / Kamar
        // ──────────────────────────────────────────────
        barak: [
            {
                id: 1,
                lantai: 1,
                sisi: "Barak Kiri",
                rentangKamar: "101–107",
                kapasitas: 14,
                terisi: 12,
                status: "terisi_sebagian",
                daftarKamar: [
                    { nomor: "101", status: "terisi", penghuni: "Yohanis Duwiri" },
                    { nomor: "102", status: "terisi", penghuni: "Maria Kogoya" },
                    { nomor: "103", status: "kosong" },
                    { nomor: "104", status: "terisi", penghuni: "Daniel Wonda" },
                    { nomor: "105", status: "kosong" },
                    { nomor: "106", status: "terisi", penghuni: "Siska Tabuni" },
                    { nomor: "107", status: "terisi", penghuni: "Benny Yeimo" }
                ]
            },
            {
                id: 2,
                lantai: 1,
                sisi: "Barak Kanan",
                rentangKamar: "108–114",
                kapasitas: 14,
                terisi: 14,
                status: "penuh",
                daftarKamar: Array(7).fill().map((_, i) => ({
                    nomor: `10${i + 8}`,
                    status: "terisi",
                    penghuni: "Penghuni Kanan " + (i + 1)
                }))
            },
            {
                id: 3,
                lantai: 2,
                sisi: "Barak Kiri",
                rentangKamar: "201–207",
                kapasitas: 14,
                terisi: 0,
                status: "kosong",
                daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `20${i + 1}`, status: "kosong" }))
            },
            {
                id: 4,
                lantai: 2,
                sisi: "Barak Kanan",
                rentangKamar: "208–214",
                kapasitas: 14,
                terisi: 10,
                status: "terisi_sebagian",
                daftarKamar: [
                    ...Array(10).fill().map((_, i) => ({ nomor: `20${i + 8}`, status: "terisi", penghuni: "Penghuni " + (i + 1) })),
                    ...Array(4).fill().map((_, i) => ({ nomor: `21${i + 2}`, status: "kosong" }))
                ]
            },
            {
                id: 5,
                lantai: 3,
                sisi: "Barak Kiri",
                rentangKamar: "301–307",
                kapasitas: 14,
                terisi: 14,
                status: "penuh",
                daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `30${i + 1}`, status: "terisi", penghuni: "Penghuni Lantai 3 Kiri " + (i + 1) }))
            },
            {
                id: 6,
                lantai: 3,
                sisi: "Barak Kanan",
                rentangKamar: "308–314",
                kapasitas: 14,
                terisi: 0,
                status: "maintenance",
                daftarKamar: Array(7).fill().map((_, i) => ({ nomor: `31${i + 1}`, status: "maintenance" }))
            }
        ],


        filterStatusKamar: '',
        currentPageKamar: 1,
        itemsPerPageKamar: 10,

        assignModalOpen: false,
        selectedKamar: null,
        selectedPenghuniId: '',

        riwayatKamarOpen: false,
        selectedKamarRiwayat: null,
        selectedRiwayatKamar: [],

        detailKamarOpen: false,
        selectedDetailBarak: null,

        get filteredBarak() {
            let result = this.barak;
            if (this.filterStatusKamar) result = result.filter(b => b.status === this.filterStatusKamar);
            return result;
        },

        get totalBarak() { return this.barak.length; },
        get barakTerisi() { return this.barak.filter(b => b.status !== 'kosong' && b.status !== 'maintenance').length; },
        get barakKosong() { return this.barak.filter(b => b.status === 'kosong').length; },

        openAssignModal(barak = null) {
            this.selectedKamar = barak || null;
            this.selectedPenghuniId = '';
            this.assignModalOpen = true;
        },

        assignPenghuni() {
            if (!this.selectedPenghuniId || !this.selectedKamar) return;
            const penghuni = this.penghuni.find(p => p.nik === this.selectedPenghuniId);
            if (!penghuni) return;

            const barakIndex = this.barak.findIndex(b => b.id === this.selectedKamar.id);
            if (barakIndex !== -1) {
                this.barak[barakIndex].terisi += 1;
                if (this.barak[barakIndex].terisi >= this.barak[barakIndex].kapasitas) {
                    this.barak[barakIndex].status = 'penuh';
                } else if (this.barak[barakIndex].terisi > 0) {
                    this.barak[barakIndex].status = 'terisi_sebagian';
                }
            }
            this.assignModalOpen = false;
        },

        showRiwayatKamar(barak) {
            this.selectedKamarRiwayat = barak;
            this.selectedRiwayatKamar = [
                { penghuni: "Yohanis Duwiri", periode: "1 Agustus 2023 – sekarang" },
                { penghuni: "Maria Kogoya", periode: "15 Maret 2023 – 30 Juli 2023" }
            ];
            this.riwayatKamarOpen = true;
        },

        openDetailKamarModal(barak) {
            this.selectedDetailBarak = barak;
            this.detailKamarOpen = true;
        },

        // ... (semua method barak tetap sama: filteredBarak, openAssignModal, assignPenghuni, dll.)

        // ──────────────────────────────────────────────
        // Manajemen Asrama
        // ──────────────────────────────────────────────
        asramaList: [
            { id: 1, nama: "Asrama Putra Tigi", jenis: "Putra", distrik: "Tigi", kapasitas: 120, penghuniSaatIni: 105, status: "aktif" },
            { id: 2, nama: "Asrama Putri Deiyai", jenis: "Putri", distrik: "Deiyai", kapasitas: 100, penghuniSaatIni: 92, status: "aktif" },
            { id: 3, nama: "Asrama Campur Paniai", jenis: "Campur", distrik: "Paniai", kapasitas: 80, penghuniSaatIni: 45, status: "aktif" },
            { id: 4, nama: "Asrama Putra Nabire", jenis: "Putra", distrik: "Nabire", kapasitas: 90, penghuniSaatIni: 0, status: "renovasi" },
        ],

        filterJenisAsrama: '',
        filterStatusAsrama: '',

        asramaModalOpen: false,
        isEditAsrama: false,
        asramaForm: {
            nama: '',
            jenis: '',
            distrik: '',
            kapasitas: '',
            status: 'aktif'
        },

        get filteredAsrama() {
            return this.asramaList.map(asrama => ({
                ...asrama,
                hunian: asrama.kapasitas > 0 ? Math.round((asrama.penghuniSaatIni / asrama.kapasitas) * 100) : 0
            })).filter(asrama => {
                let match = true;
                if (this.filterJenisAsrama) match = match && asrama.jenis === this.filterJenisAsrama;
                if (this.filterStatusAsrama) match = match && asrama.status === this.filterStatusAsrama;
                return match;
            });
        },

        get totalKapasitas() {
            return this.asramaList.reduce((sum, a) => sum + a.kapasitas, 0);
        },

        get totalPenghuni() {
            return this.asramaList.reduce((sum, a) => sum + a.penghuniSaatIni, 0);
        },

        get hunianPersen() {
            const kapasitas = this.totalKapasitas;
            return kapasitas > 0 ? Math.round((this.totalPenghuni / kapasitas) * 100) : 0;
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

        saveAsrama() {
            Swal.fire({
                title: this.isEditAsrama ? 'Simpan Perubahan Asrama?' : 'Tambah Asrama Baru?',
                text: this.isEditAsrama ? "Data asrama akan diperbarui." : "Asrama baru akan ditambahkan ke sistem.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Simpan!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (this.isEditAsrama) {
                        const index = this.asramaList.findIndex(a => a.id === this.asramaForm.id);
                        if (index !== -1) this.asramaList[index] = { ...this.asramaForm };
                    } else {
                        this.asramaList.push({
                            id: this.asramaList.length + 1,
                            ...this.asramaForm
                        });
                    }
                    Swal.fire({
                        title: 'Berhasil!',
                        text: this.isEditAsrama ? 'Data asrama berhasil diperbarui.' : 'Asrama baru berhasil ditambahkan.',
                        icon: 'success',
                        confirmButtonColor: '#2563eb'
                    });
                    this.asramaModalOpen = false;
                }
            });
        },

        showDetailAsrama(asrama) {
            Swal.fire({
                title: `Detail Asrama: ${asrama.nama}`,
                html: `
                    <div style="text-align: left; font-size: 1.1rem;">
                        <p><strong>Jenis:</strong> ${asrama.jenis}</p>
                        <p><strong>Lokasi/Distrik:</strong> ${asrama.distrik}</p>
                        <p><strong>Kapasitas:</strong> ${asrama.kapasitas} orang</p>
                        <p><strong>Penghuni Saat Ini:</strong> ${asrama.penghuniSaatIni} orang</p>
                        <p><strong>Tingkat Hunian:</strong> <span style="color: ${asrama.hunian >= 90 ? '#dc2626' : asrama.hunian >= 70 ? '#d97706' : '#16a34a'};">${asrama.hunian}%</span></p>
                        <p><strong>Status:</strong> ${asrama.status.charAt(0).toUpperCase() + asrama.status.slice(1)}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Tutup'
            });
        },


        // ──────────────────────────────────────────────
        // Manajemen Inventaris
        // ──────────────────────────────────────────────
        inventaris: [
            { id: 1, barakId: 1, barak: "Barak Kiri – Lantai 1", jenis: "tempat tidur", jumlahTotal: 14, baik: 12, rusakRingan: 2, rusakBerat: 0, catatan: "2 unit perlu ganti kasur" },
            { id: 2, barakId: 1, barak: "Barak Kiri – Lantai 1", jenis: "lemari", jumlahTotal: 14, baik: 13, rusakRingan: 1, rusakBerat: 0, catatan: "-" },
            { id: 3, barakId: 2, barak: "Barak Kanan – Lantai 1", jenis: "meja", jumlahTotal: 14, baik: 10, rusakRingan: 3, rusakBerat: 1, catatan: "1 unit patah kaki" },
            { id: 4, barakId: 3, barak: "Barak Kiri – Lantai 2", jenis: "kipas", jumlahTotal: 7, baik: 7, rusakRingan: 0, rusakBerat: 0, catatan: "Semua berfungsi" },
            // tambahkan sesuai kebutuhan (minimal 1 item per barak)
        ],

        filterBarakInventaris: '',
        filterJenisInventaris: '',

        inventarisModalOpen: false,
        isEditInventaris: false,
        inventarisForm: {
            barakId: '',
            jenis: '',
            jumlahTotal: '',
            baik: '',
            rusakRingan: '',
            rusakBerat: '',
            catatan: ''
        },

        get filteredInventaris() {
            let result = this.inventaris;

            if (this.filterBarakInventaris) {
                result = result.filter(i => i.barakId == this.filterBarakInventaris);
            }
            if (this.filterJenisInventaris) {
                result = result.filter(i => i.jenis === this.filterJenisInventaris);
            }

            return result;
        },

        get totalBaik() {
            return this.inventaris.reduce((sum, i) => sum + i.baik, 0);
        },
        get totalRusakRingan() {
            return this.inventaris.reduce((sum, i) => sum + i.rusakRingan, 0);
        },
        get totalRusakBerat() {
            return this.inventaris.reduce((sum, i) => sum + i.rusakBerat, 0);
        },
        get totalInventaris() {
            return this.totalBaik + this.totalRusakRingan + this.totalRusakBerat;
        },
        get persenBaik() {
            return this.totalInventaris > 0 ? Math.round((this.totalBaik / this.totalInventaris) * 100) : 0;
        },
        get persenRusakRingan() {
            return this.totalInventaris > 0 ? Math.round((this.totalRusakRingan / this.totalInventaris) * 100) : 0;
        },
        get persenRusakBerat() {
            return this.totalInventaris > 0 ? Math.round((this.totalRusakBerat / this.totalInventaris) * 100) : 0;
        },

        openAddInventarisModal() {
            this.isEditInventaris = false;
            this.inventarisForm = { barakId: '', jenis: '', jumlahTotal: '', baik: '', rusakRingan: '', rusakBerat: '', catatan: '' };
            this.inventarisModalOpen = true;
        },

        openEditInventarisModal(item) {
            this.isEditInventaris = true;
            this.inventarisForm = { ...item };
            this.inventarisModalOpen = true;
        },


        saveInventaris() {
            Swal.fire({
                title: this.isEditInventaris ? 'Simpan Perubahan Inventaris?' : 'Tambah Inventaris Baru?',
                text: "Data inventaris akan disimpan.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Simpan!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    // ... (kode saveInventaris seperti sebelumnya)
                    Swal.fire({
                        title: 'Berhasil!',
                        text: this.isEditInventaris ? 'Data inventaris berhasil diperbarui.' : 'Inventaris baru berhasil ditambahkan.',
                        icon: 'success',
                        confirmButtonColor: '#2563eb'
                    });
                    this.inventarisModalOpen = false;
                }
            });
        },


        // ──────────────────────────────────────────────
        // Laporan & Statistik
        // ──────────────────────────────────────────────
        filterPeriode: 'bulan',
        filterTahunLaporan: new Date().getFullYear().toString(),

        get penghuniAktif() {
            return this.penghuni.filter(p => p.status === 'aktif').length;
        },

        get hunianPersen() {
            const totalKapasitas = this.barak.reduce((sum, b) => sum + b.kapasitas, 0);
            const totalTerisi = this.barak.reduce((sum, b) => sum + b.terisi, 0);
            return totalKapasitas > 0 ? Math.round((totalTerisi / totalKapasitas) * 100) : 0;
        },

        get alumniTahunIni() {
            const tahunIni = new Date().getFullYear();
            return this.penghuni.filter(p => p.status === 'alumni' && p.tahun_masuk + 3 <= tahunIni).length; // asumsi 3 tahun studi SMA
        },

        get kamarKosong() {
            return this.barak.filter(b => b.status === 'kosong').length;
        },

        get availableYearsLaporan() {
            return [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
        },

        get laporanDistrik() {
            const grouped = {};
            this.penghuni.forEach(p => {
                if (p.status === 'aktif') {
                    grouped[p.distrik] = (grouped[p.distrik] || 0) + 1;
                }
            });
            return Object.entries(grouped).map(([distrik, jumlah]) => ({ distrik, jumlah }));
        },

        get laporanJenjang() {
            const grouped = {};
            this.penghuni.forEach(p => {
                if (p.status === 'aktif') {
                    grouped[p.jenjang] = (grouped[p.jenjang] || 0) + 1;
                }
            });
            return Object.entries(grouped).map(([jenjang, jumlah]) => ({ jenjang, jumlah }));
        },

        // Contoh di laporan
        generateLaporan() {
            Swal.fire({
                title: 'Generate Laporan?',
                text: `Laporan ${this.filterPeriode} tahun ${this.filterTahunLaporan} akan dibuat.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Generate!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Sedang Memproses...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    setTimeout(() => {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: `Laporan ${this.filterPeriode} tahun ${this.filterTahunLaporan} telah digenerate.`,
                            icon: 'success',
                            confirmButtonColor: '#2563eb'
                        });
                    }, 1500); // simulasi delay
                }
            });
        },

        exportPDF() {
            Swal.fire({
                title: 'Export ke PDF?',
                text: "File PDF akan diunduh.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Export!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Sedang Memproses...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    setTimeout(() => {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: 'File PDF telah berhasil diekspor.',
                            icon: 'success',
                            confirmButtonColor: '#2563eb'
                        });
                    }, 1200);
                }
            });
        },

        exportExcel() {
            // Sama seperti exportPDF, tapi teks disesuaikan
            Swal.fire({
                title: 'Export ke Excel?',
                text: "File Excel akan diunduh.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Export!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Sedang Memproses...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    setTimeout(() => {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: 'File Excel telah berhasil diekspor.',
                            icon: 'success',
                            confirmButtonColor: '#2563eb'
                        });
                    }, 1200);
                }
            });
        },

        // ... (tutup object app)
    }));
});