import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, SaldoRecord, AuthUser } from '../types/index.ts';
import { formatRupiah, formatTanggalIndo, calculateFinancialSummary } from './finance.ts';

export interface ExportPdfOptions {
  saldo: SaldoRecord;
  transactions: Transaction[];
  user: AuthUser;
  periodeTitle?: string;
  filterMonth?: string;
}

export function generateFinancialPdfReport({
  saldo,
  transactions,
  user,
  periodeTitle,
  filterMonth,
}: ExportPdfOptions): void {
  // Filter transactions if specific month requested
  const filtered = filterMonth
    ? transactions.filter((t) => t.tanggal.startsWith(filterMonth))
    : transactions;

  const penerimaanList = filtered.filter((t) => t.jenis === 'penerimaan');
  const pengeluaranList = filtered.filter((t) => t.jenis === 'pengeluaran');

  const summary = calculateFinancialSummary(
    saldo.saldo_awal_tahun_lalu,
    filtered,
    saldo.tahun
  );

  // Initialize jsPDF A4 portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- KOP SURAT RESMI PUSKESMAS & TIM HAJI ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 11, 46);
  doc.text('PEMERINTAH DAERAH DINAS KESEHATAN', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(15);
  doc.setTextColor(112, 26, 117); // Purple accent
  doc.text('UNIT PELAKSANA TEKNIS PUSKESMAS', pageWidth / 2, 23, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text('TIM PENYELENGGARA KESEHATAN HAJI INDONESIA (TKHI / PPIH)', pageWidth / 2, 29, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Sekretariat Posko Kesehatan Haji Puskesmas | Telp: (021) 789-0123 | Email: haji.puskesmas@kemenkes.go.id',
    pageWidth / 2,
    34,
    { align: 'center' }
  );

  // Garis Pembatas Kop Surat
  doc.setDrawColor(162, 28, 175);
  doc.setLineWidth(1);
  doc.line(14, 38, pageWidth - 14, 38);
  doc.setDrawColor(217, 70, 239);
  doc.setLineWidth(0.3);
  doc.line(14, 39.5, pageWidth - 14, 39.5);

  // --- JUDUL LAPORAN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 11, 46);
  doc.text('LAPORAN PERTANGGUNGJAWABAN KEUANGAN OPERASIONAL HAJI', pageWidth / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const subTitle = periodeTitle || `Musim Haji ${saldo.tahun} ${filterMonth ? `(Periode: ${filterMonth})` : ''}`;
  doc.text(subTitle, pageWidth / 2, 54, { align: 'center' });

  // Metadata Cetak
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak oleh : ${user.nama_lengkap} (${user.role.toUpperCase()})`, 14, 62);
  doc.text(`Waktu Cetak : ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, 62, { align: 'right' });

  // --- KOTAK RINGKASAN SALDO (SUMMARY BOX) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 66, pageWidth - 28, 24, 3, 3, 'FD');

  const colWidth = (pageWidth - 28) / 4;

  // 1. Saldo Awal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SALDO AWAL TAHUN LALU', 14 + colWidth * 0.5, 72, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(formatRupiah(summary.saldoAwalTahunLalu), 14 + colWidth * 0.5, 82, { align: 'center' });

  // 2. Total Penerimaan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENERIMAAN (+)', 14 + colWidth * 1.5, 72, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(formatRupiah(summary.totalPenerimaan), 14 + colWidth * 1.5, 82, { align: 'center' });

  // 3. Total Pengeluaran
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN (-)', 14 + colWidth * 2.5, 72, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(239, 68, 68); // Red
  doc.text(formatRupiah(summary.totalPengeluaran), 14 + colWidth * 2.5, 82, { align: 'center' });

  // 4. Saldo Realtime Akhir
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SISA SALDO KAS REALTIME', 14 + colWidth * 3.5, 72, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(124, 58, 237); // Purple
  doc.text(formatRupiah(summary.saldoRealtime), 14 + colWidth * 3.5, 82, { align: 'center' });

  let currentY = 96;

  // --- TABEL 1: PENERIMAAN DANA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('A. RINCIAN PENERIMAAN DANA (MASUK)', 14, currentY);

  const penerimaanRows = penerimaanList.map((item, idx) => [
    (idx + 1).toString(),
    formatTanggalIndo(item.tanggal),
    item.sumber_dana || '-',
    item.keterangan || '-',
    formatRupiah(item.nominal),
  ]);

  if (penerimaanRows.length === 0) {
    penerimaanRows.push(['-', '-', 'Belum ada transaksi penerimaan pada periode ini', '-', 'Rp 0']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Tanggal', 'Sumber Dana', 'Keterangan', 'Nominal (Rp)']],
    body: penerimaanRows,
    theme: 'grid',
    headStyles: {
      fillColor: [109, 40, 217], // Deep Purple
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 46 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    foot: [['', '', 'TOTAL PENERIMAAN', '', formatRupiah(summary.totalPenerimaan)]],
    footStyles: {
      fillColor: [243, 232, 255],
      textColor: [88, 28, 135],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 9,
    },
  });

  // Calculate dynamic position after first table
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Check if enough room for next table or add page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // --- TABEL 2: PENGELUARAN DANA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('B. RINCIAN PENGELUARAN DANA (KELUAR)', 14, currentY);

  const pengeluaranRows = pengeluaranList.map((item, idx) => [
    (idx + 1).toString(),
    formatTanggalIndo(item.tanggal),
    item.nama_penerima || '-',
    item.keterangan || '-',
    formatRupiah(item.nominal),
  ]);

  if (pengeluaranRows.length === 0) {
    pengeluaranRows.push(['-', '-', 'Belum ada transaksi pengeluaran pada periode ini', '-', 'Rp 0']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Tanggal', 'Nama Penerima', 'Keterangan', 'Nominal (Rp)']],
    body: pengeluaranRows,
    theme: 'grid',
    headStyles: {
      fillColor: [219, 39, 119], // Pink/Fuchsia
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 46 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    foot: [['', '', 'TOTAL PENGELUARAN', '', formatRupiah(summary.totalPengeluaran)]],
    footStyles: {
      fillColor: [253, 242, 248],
      textColor: [157, 23, 77],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 9,
    },
  });

  // Calculate dynamic position after second table
  let signY = (doc as any).lastAutoTable.finalY + 14;

  if (signY > 235) {
    doc.addPage();
    signY = 25;
  }

  // --- LEMBAR PENGESAHAN / TANDA TANGAN ---
  const todayFormatted = formatTanggalIndo(new Date().toISOString().split('T')[0]);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const leftSignX = 25;
  const rightSignX = pageWidth - 65;

  doc.text(`Mengetahui,`, leftSignX, signY, { align: 'center' });
  doc.text(`Ketua Tim Kesehatan Haji`, leftSignX, signY + 5, { align: 'center' });
  doc.text(`UPTD Puskesmas`, leftSignX, signY + 9, { align: 'center' });

  doc.text(`Makkah / Tempat, ${todayFormatted}`, rightSignX, signY, { align: 'center' });
  doc.text(`Bendahara Operasional Haji`, rightSignX, signY + 5, { align: 'center' });
  doc.text(`Petugas Kesehatan Kloter`, rightSignX, signY + 9, { align: 'center' });

  // Garis tanda tangan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);

  doc.text(`dr. H. Rahmat Hidayat, M.Kes`, leftSignX, signY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIP. 19780514 200501 1 008`, leftSignX, signY + 38, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(user.nama_lengkap, rightSignX, signY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIP. 19850920 201001 2 015`, rightSignX, signY + 38, { align: 'center' });

  // Save / trigger browser download
  const cleanDate = new Date().toISOString().split('T')[0];
  doc.save(`Laporan_Keuangan_Haji_Puskesmas_${cleanDate}.pdf`);
}
