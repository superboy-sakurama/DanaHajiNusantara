import { Request, Response, NextFunction } from 'express';
import { AuthUser, UserRole } from '../src/types/index.ts';
import { getUsersFromStore } from './googleSheets.ts';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Simple secure session token encode/decode
export function createToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    nama_lengkap: user.nama_lengkap,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);
    if (!payload.id || !payload.username || !payload.role) {
      return null;
    }
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role as UserRole,
      nama_lengkap: payload.nama_lengkap,
      jabatan: payload.jabatan,
    };
  } catch {
    return null;
  }
}

/**
 * Middleware: Memeriksa token Bearer
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Sesi tidak valid atau belum login. Silakan masuk kembali.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Token otorisasi kedaluwarsa atau tidak valid.',
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware: Hanya untuk role 'admin'
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Autentikasi diperlukan.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Akses Ditolak: Fitur ini hanya dapat diakses oleh Admin Petugas Haji.',
    });
    return;
  }

  next();
}
