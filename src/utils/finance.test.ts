import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  parseRupiah,
  calculateFinancialSummary,
  filterTransactions,
  validateTransactionForm,
  formatTanggalIndo,
} from './finance.ts';
import { Transaction } from '../types/index.ts';

test('formatRupiah formats positive, negative and zero amounts correctly', () => {
  assert.equal(formatRupiah(0), 'Rp\u00a00');
  assert.equal(formatRupiah(1500000).replace(/\s/g, ' '), 'Rp 1.500.000');
  assert.equal(formatRupiah(-250000).replace(/\s/g, ' '), '-Rp 250.000');
});

test('parseRupiah parses string representations to integer correctly', () => {
  assert.equal(parseRupiah('Rp 1.500.000'), 1500000);
  assert.equal(parseRupiah('250000'), 250000);
  assert.equal(parseRupiah(''), 0);
  assert.equal(parseRupiah(750000), 750000);
});

test('calculateFinancialSummary calculates realtime balance correctly', () => {
  const dummyTransactions: Transaction[] = [
    {
      id: 'tx-1',
      tanggal: '2026-05-01',
      jenis: 'penerimaan',
      nominal: 10000000,
      sumber_dana: 'Dana Operasional Dinkes',
      keterangan: 'Pencairan Tahap 1',
    },
    {
      id: 'tx-2',
      tanggal: '2026-05-03',
      jenis: 'pengeluaran',
      nominal: 3500000,
      nama_penerima: 'Apotek Mandiri',
      keterangan: 'Obat-obatan Darurat',
    },
    {
      id: 'tx-3',
      tanggal: '2026-05-05',
      jenis: 'penerimaan',
      nominal: 2000000,
      sumber_dana: 'Iuran Posko',
      keterangan: 'Kas Tambahan',
    },
  ];

  const saldoAwal = 5000000;
  const summary = calculateFinancialSummary(saldoAwal, dummyTransactions, '2026');

  assert.equal(summary.saldoAwalTahunLalu, 5000000);
  assert.equal(summary.totalPenerimaan, 12000000);
  assert.equal(summary.totalPengeluaran, 3500000);
  // Saldo realtime = 5.000.000 + 12.000.000 - 3.500.000 = 13.500.000
  assert.equal(summary.saldoRealtime, 13500000);
});

test('filterTransactions filters by type, month, and search query correctly', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      tanggal: '2026-05-10',
      jenis: 'penerimaan',
      nominal: 5000000,
      sumber_dana: 'Bantuan Kemenkes',
      keterangan: 'Subsidi Tim Kloter',
    },
    {
      id: 'tx-2',
      tanggal: '2026-05-15',
      jenis: 'pengeluaran',
      nominal: 1200000,
      nama_penerima: 'Toko Al-Madinah',
      keterangan: 'Pembelian Tensi & Stetoskop',
    },
    {
      id: 'tx-3',
      tanggal: '2026-06-01',
      jenis: 'pengeluaran',
      nominal: 800000,
      nama_penerima: 'Katering Makkah',
      keterangan: 'Logistik Petugas Posko',
    },
  ];

  // Test filter by jenis
  const onlyPenerimaan = filterTransactions(transactions, { jenis: 'penerimaan' });
  assert.equal(onlyPenerimaan.length, 1);
  assert.equal(onlyPenerimaan[0].id, 'tx-1');

  // Test filter by month
  const mayTransactions = filterTransactions(transactions, { month: '2026-05' });
  assert.equal(mayTransactions.length, 2);

  // Test search query
  const searchTensi = filterTransactions(transactions, { search: 'Tensi' });
  assert.equal(searchTensi.length, 1);
  assert.equal(searchTensi[0].id, 'tx-2');
});

test('validateTransactionForm enforces required fields per transaction type', () => {
  // Empty form
  const emptyRes = validateTransactionForm({});
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.errors.tanggal);
  assert.ok(emptyRes.errors.jenis);

  // Invalid penerimaan without sumber_dana
  const invalidPenerimaan = validateTransactionForm({
    tanggal: '2026-05-10',
    jenis: 'penerimaan',
    nominal: 100000,
    keterangan: 'Tes',
  });
  assert.equal(invalidPenerimaan.valid, false);
  assert.ok(invalidPenerimaan.errors.sumber_dana);

  // Valid pengeluaran
  const validPengeluaran = validateTransactionForm({
    tanggal: '2026-05-10',
    jenis: 'pengeluaran',
    nominal: 100000,
    nama_penerima: 'Apotek',
    keterangan: 'Obat P3K',
  });
  assert.equal(validPengeluaran.valid, true);
  assert.equal(Object.keys(validPengeluaran.errors).length, 0);
});

test('formatTanggalIndo formats date strings properly', () => {
  assert.equal(formatTanggalIndo('2026-05-14'), '14 Mei 2026');
  assert.equal(formatTanggalIndo('2026-12-31'), '31 Desember 2026');
});
