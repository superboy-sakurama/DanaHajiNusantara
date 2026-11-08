import { Router, Request, Response } from 'express';
import {
  getSheetsConfigStatus,
  testSheetsConnection,
  updateSheetsConfig,
  resetSheetsConfig,
} from '../googleSheets.ts';
import { requireAuth, requireAdmin } from '../auth.ts';

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: getSheetsConfigStatus(),
  });
});

router.post('/test', async (req: Request, res: Response) => {
  const result = await testSheetsConnection();
  res.json({
    success: result.success,
    data: result,
  });
});

router.post('/config', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { sheetId, apiKey, clientEmail, privateKey } = req.body;

  updateSheetsConfig({
    sheetId,
    apiKey,
    clientEmail,
    privateKey,
  });

  res.json({
    success: true,
    message: 'Konfigurasi Google Sheets berhasil diperbarui!',
    data: getSheetsConfigStatus(),
  });
});

router.post('/reset', requireAuth, requireAdmin, (req: Request, res: Response) => {
  resetSheetsConfig();
  res.json({
    success: true,
    message: 'Konfigurasi berhasil direset kembali ke Mode Data Lokal.',
    data: getSheetsConfigStatus(),
  });
});

export default router;
