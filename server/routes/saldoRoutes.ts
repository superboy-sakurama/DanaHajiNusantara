import { Router, Response } from 'express';
import { getSaldoFromStore, updateSaldoInStore } from '../googleSheets.ts';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// GET current balance
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const saldo = await getSaldoFromStore();
    res.json({
      success: true,
      data: saldo,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Gagal memuat informasi saldo.',
    });
  }
});

// PUT update initial balance - ADMIN ONLY
router.put('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { saldo_awal_tahun_lalu, tahun, catatan } = req.body;

    if (saldo_awal_tahun_lalu === undefined || isNaN(Number(saldo_awal_tahun_lalu))) {
      res.status(400).json({
        success: false,
        error: 'Nominal saldo awal tahun lalu wajib berupa angka valid.',
      });
      return;
    }

    const updated = await updateSaldoInStore({
      saldo_awal_tahun_lalu: Number(saldo_awal_tahun_lalu),
      tahun,
      catatan,
    });

    res.json({
      success: true,
      message: 'Saldo awal tahun lalu berhasil diperbarui!',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Gagal memperbarui saldo awal.',
    });
  }
});

export default router;
