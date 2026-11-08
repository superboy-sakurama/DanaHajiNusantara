import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  parseRupiah,
  calculateFinancialSummary,
  filterTransactions,
  validateTransactionForm,
  formatTanggalIndo,
  calculateBudgetStatus,
  calculatePeriodExpenditure,
  getAvailableMonths,
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

test('calculateBudgetStatus accurately determines percentage, threshold status, and remaining balance', () => {
  // Scenario 1: Safe spending (< 70%)
  const safeStatus = calculateBudgetStatus(5000000, 10000000);
  assert.equal(safeStatus.percentage, 50);
  assert.equal(safeStatus.status, 'safe');
  assert.equal(safeStatus.remaining, 5000000);
  assert.equal(safeStatus.isOverBudget, false);

  // Scenario 2: Warning threshold (70% - 89%)
  const warningStatus = calculateBudgetStatus(8000000, 10000000);
  assert.equal(warningStatus.percentage, 80);
  assert.equal(warningStatus.status, 'warning');
  assert.equal(warningStatus.remaining, 2000000);
  assert.equal(warningStatus.isOverBudget, false);

  // Scenario 3: Critical threshold (>= 90%)
  const criticalStatus = calculateBudgetStatus(9500000, 10000000);
  assert.equal(criticalStatus.percentage, 95);
  assert.equal(criticalStatus.status, 'danger');
  assert.equal(criticalStatus.remaining, 500000);
  assert.equal(criticalStatus.isOverBudget, false);

  // Scenario 4: Over budget (> 100%)
  const overStatus = calculateBudgetStatus(12000000, 10000000);
  assert.equal(overStatus.percentage, 120);
  assert.equal(overStatus.status, 'danger');
  assert.equal(overStatus.remaining, -2000000);
  assert.equal(overStatus.isOverBudget, true);

  // Scenario 5: Zero limit
  const zeroStatus = calculateBudgetStatus(1000000, 0);
  assert.equal(zeroStatus.isOverBudget, true);
  assert.equal(zeroStatus.status, 'danger');
});

test('calculatePeriodExpenditure computes expenses for all and specific month filters', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      tanggal: '2026-05-10',
      jenis: 'pengeluaran',
      nominal: 2000000,
      nama_penerima: 'Penerima A',
      keterangan: 'Ket 1',
    },
    {
      id: 'tx-2',
      tanggal: '2026-05-20',
      jenis: 'pengeluaran',
      nominal: 3000000,
      nama_penerima: 'Penerima B',
      keterangan: 'Ket 2',
    },
    {
      id: 'tx-3',
      tanggal: '2026-06-05',
      jenis: 'pengeluaran',
      nominal: 1500000,
      nama_penerima: 'Penerima C',
      keterangan: 'Ket 3',
    },
    {
      id: 'tx-4',
      tanggal: '2026-05-15',
      jenis: 'penerimaan',
      nominal: 10000000,
      sumber_dana: 'Sumber A',
      keterangan: 'Penerimaan tidak boleh dihitung di pengeluaran',
    },
  ];

  // Total all expenditures
  const totalAll = calculatePeriodExpenditure(transactions, 'all');
  assert.equal(totalAll, 6500000);

  // Filter May 2026
  const totalMay = calculatePeriodExpenditure(transactions, '2026-05');
  assert.equal(totalMay, 5000000);

  // Filter June 2026
  const totalJune = calculatePeriodExpenditure(transactions, '2026-06');
  assert.equal(totalJune, 1500000);

  // Filter empty month
  const totalJuly = calculatePeriodExpenditure(transactions, '2026-07');
  assert.equal(totalJuly, 0);
});

test('getAvailableMonths extracts unique formatted months from transaction list', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      tanggal: '2026-05-10',
      jenis: 'penerimaan',
      nominal: 1000,
      keterangan: '',
    },
    {
      id: 'tx-2',
      tanggal: '2026-04-12',
      jenis: 'pengeluaran',
      nominal: 500,
      keterangan: '',
    },
  ];

  const months = getAvailableMonths(transactions);
  assert.ok(months.some((m) => m.value === '2026-05' && m.label === 'Mei 2026'));
  assert.ok(months.some((m) => m.value === '2026-04' && m.label === 'April 2026'));
});

