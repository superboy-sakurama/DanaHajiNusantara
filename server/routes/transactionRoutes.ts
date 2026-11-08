import { Router, Response } from 'express';
import {
  getTransactionsFromStore,
  addTransactionToStore,
  updateTransactionInStore,
  deleteTransactionFromStore,
} from '../googleSheets.ts';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.ts';
import { validateTransactionForm } from '../../src/utils/finance.ts';

const router = Router();

// GET all transactions - Accessible by both Admin and Anggota
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await getTransactionsFromStore();
    res.json({
      success: true,
      data: list,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Gagal memuat data transaksi.',
    });
  }
});

// POST new transaction - ADMIN ONLY
router.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tanggal, jenis, nominal, sumber_dana, nama_penerima, keterangan, kategori } = req.body;

    const validation = validateTransactionForm({
      tanggal,
      jenis,
      nominal: Number(nominal),
      sumber_dana,
      nama_penerima,
      keterangan,
    });

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: Object.values(validation.errors).join(', '),
        errors: validation.errors,
      });
      return;
    }

    const created = await addTransactionToStore({
      tanggal,
      jenis,
      nominal: Math.abs(Number(nominal)),
      sumber_dana: jenis === 'penerimaan' ? sumber_dana : undefined,
      nama_penerima: jenis === 'pengeluaran' ? nama_penerima : undefined,
      keterangan,
      kategori: kategori ? String(kategori).trim() : undefined,
      dibuat_oleh: req.user?.nama_lengkap || req.user?.username || 'Admin Petugas Haji',
    });

    res.status(201).json({
      success: true,
      message: `Transaksi ${jenis === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'} berhasil disimpan ke sistem!`,
      data: created,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Gagal menambahkan transaksi baru.',
    });
  }
});

// PUT update transaction - ADMIN ONLY
router.put('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tanggal, jenis, nominal, sumber_dana, nama_penerima, keterangan, kategori } = req.body;

    const validation = validateTransactionForm({
      tanggal,
      jenis,
      nominal: Number(nominal),
      sumber_dana,
      nama_penerima,
      keterangan,
    });

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: Object.values(validation.errors).join(', '),
        errors: validation.errors,
      });
      return;
    }

    const updated = await updateTransactionInStore(id, {
      tanggal,
      jenis,
      nominal: Math.abs(Number(nominal)),
      sumber_dana: jenis === 'penerimaan' ? sumber_dana : undefined,
      nama_penerima: jenis === 'pengeluaran' ? nama_penerima : undefined,
      kategori: kategori ? String(kategori).trim() : undefined,
      keterangan,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: `Transaksi dengan ID ${id} tidak ditemukan.`,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui!',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Gagal memperbarui transaksi.',
    });
  }
});

// DELETE transaction - ADMIN ONLY
router.delete('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteTransactionFromStore(id);

    if (!success) {
      res.status(404).json({
        success: false,
        error: `Transaksi dengan ID ${id} tidak ditemukan.`,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus transaksi.',
    });
  }
});

export default router;
