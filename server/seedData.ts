import { User, SaldoRecord, Transaction } from '../src/types/index.ts';

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    username: 'admin',
    password_hash: 'admin123', // Demo hash/password
    role: 'admin',
    nama_lengkap: 'dr. H. Rahmat Hidayat, M.Kes',
    jabatan: 'Ketua Tim / Bendahara Operasional Haji Puskesmas',
  },
  {
    id: 'usr-2',
    username: 'petugas',
    password_hash: 'petugas123',
    role: 'anggota',
    nama_lengkap: 'Ns. Hj. Siti Nurjanah, S.Kep',
    jabatan: 'Petugas Paramedis Posko Kesehatan Kloter',
  },
  {
    id: 'usr-3',
    username: 'anggota',
    password_hash: 'anggota123',
    role: 'anggota',
    nama_lengkap: 'Ahmad Subandi, S.Tr.Kes',
    jabatan: 'Sanitarian & Logistik Obat Haji',
  },
];

export const initialSaldo: SaldoRecord = {
  id: 'sld-2026',
  tahun: '1447 H / 2026 M',
  saldo_awal_tahun_lalu: 12500000, // Rp 12.500.000
  saldo_realtime: 12500000,
  catatan: 'Sisa saldo operasional kas Posko Kesehatan Haji Puskesmas tahun sebelumnya',
  updated_at: new Date().toISOString(),
};

export const initialTransactions: Transaction[] = [
  {
    id: 'TRX-2026-001',
    tanggal: '2026-04-10',
    jenis: 'penerimaan',
    nominal: 15000000,
    sumber_dana: 'Dinas Kesehatan Kabupaten (BOK Haji)',
    keterangan: 'Pencairan Dana Alokasi BOK Pelayanan Kesehatan Jamaah Haji Tahap 1',
    dibuat_oleh: 'dr. H. Rahmat Hidayat, M.Kes',
    created_at: '2026-04-10T08:30:00Z',
  },
  {
    id: 'TRX-2026-002',
    tanggal: '2026-04-18',
    jenis: 'pengeluaran',
    nominal: 4200000,
    nama_penerima: 'PT Kimia Farma Apotek',
    keterangan: 'Pengadaan Obat Emergensi, Oralit, Paracetamol, & Vitamin Jamaah Resiko Tinggi',
    dibuat_oleh: 'dr. H. Rahmat Hidayat, M.Kes',
    created_at: '2026-04-18T10:15:00Z',
  },
  {
    id: 'TRX-2026-003',
    tanggal: '2026-04-25',
    jenis: 'penerimaan',
    nominal: 6000000,
    sumber_dana: 'Iuran Swadaya Petugas Haji Puskesmas',
    keterangan: 'Dana kebersamaan & logistik posko darurat tim kloter',
    dibuat_oleh: 'dr. H. Rahmat Hidayat, M.Kes',
    created_at: '2026-04-25T14:00:00Z',
  },
  {
    id: 'TRX-2026-004',
    tanggal: '2026-05-02',
    jenis: 'pengeluaran',
    nominal: 2850000,
    nama_penerima: 'CV Medika Sarana Prima',
    keterangan: 'Pembelian 4 Unit Tensimeter Digital, Oximeter, Termometer Infrared & Tas Medis',
    dibuat_oleh: 'dr. H. Rahmat Hidayat, M.Kes',
    created_at: '2026-05-02T09:45:00Z',
  },
  {
    id: 'TRX-2026-005',
    tanggal: '2026-05-12',
    jenis: 'penerimaan',
    nominal: 3500000,
    sumber_dana: 'Bantuan Hibah BAZNAS Peduli Haji Sehat',
    keterangan: 'Bantuan suplemen daya tahan tubuh & masker KN95 untuk lansia',
    dibuat_oleh: 'dr. H. Rahmat Hidayat, M.Kes',
    created_at: '2026-05-12T11:20:00Z',
  },
  {
    id: 'TRX-2026-006',
    tanggal: '2026-05-20',
    jenis: 'pengeluaran',
    nominal: 1750000,
    nama_penerima: 'Koperasi Puskesmas Sehat',
    keterangan: 'Pengadaan Seragam Rompi Medis Petugas, Name Tag, & Buku Catatan Rekam Medis Haji',
    dibuat_oleh: 'dr. H. Rahmat Hidayat, M.Kes',
    created_at: '2026-05-20T13:10:00Z',
  },
];
