import {
  ApiResponse,
  AuthUser,
  LoginResponse,
  SaldoRecord,
  Transaction,
  GoogleSheetsConfig,
  SheetsTestResult,
  SheetsBootstrapResult,
} from '../types/index.ts';

const TOKEN_KEY = 'haji_finance_auth_token';
const USER_KEY = 'haji_finance_user_data';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  const json = localStorage.getItem(USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: 'Respons server tidak berformat JSON yang valid',
  }));

  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}: Permintaan gagal`);
  }

  return data;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await request<ApiResponse<LoginResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!res.data) throw new Error(res.error || 'Login gagal');
    setStoredAuth(res.data.token, res.data.user);
    return res.data;
  },

  async getMe(): Promise<AuthUser> {
    const res = await request<ApiResponse<AuthUser>>('/api/auth/me');
    if (!res.data) throw new Error('Sesi tidak valid');
    return res.data;
  },

  // Saldo
  async getSaldo(): Promise<SaldoRecord> {
    const res = await request<ApiResponse<SaldoRecord>>('/api/saldo');
    return res.data!;
  },

  async updateSaldo(data: { saldo_awal_tahun_lalu: number; tahun?: string; catatan?: string }): Promise<SaldoRecord> {
    const res = await request<ApiResponse<SaldoRecord>>('/api/saldo', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  // Transaksi
  async getTransactions(): Promise<Transaction[]> {
    const res = await request<ApiResponse<Transaction[]>>('/api/transactions');
    return res.data || [];
  },

  async createTransaction(payload: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const res = await request<ApiResponse<Transaction>>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async updateTransaction(id: string, payload: Partial<Transaction>): Promise<Transaction> {
    const res = await request<ApiResponse<Transaction>>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async deleteTransaction(id: string): Promise<void> {
    await request<ApiResponse>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Sheets Config & Status
  async getSheetsStatus(): Promise<GoogleSheetsConfig> {
    const res = await request<ApiResponse<GoogleSheetsConfig>>('/api/sheets/status');
    return res.data!;
  },

  async testSheetsConnection(): Promise<SheetsTestResult> {
    const res = await request<ApiResponse<SheetsTestResult>>('/api/sheets/test', {
      method: 'POST',
    });
    return res.data!;
  },

  async updateSheetsConfig(data: {
    sheetId?: string;
    apiKey?: string;
    clientEmail?: string;
    privateKey?: string;
  }): Promise<GoogleSheetsConfig> {
    const res = await request<ApiResponse<GoogleSheetsConfig>>('/api/sheets/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async resetSheetsConfig(): Promise<GoogleSheetsConfig> {
    const res = await request<ApiResponse<GoogleSheetsConfig>>('/api/sheets/reset', {
      method: 'POST',
    });
    return res.data!;
  },

  async bootstrapSheets(): Promise<SheetsBootstrapResult> {
    const res = await request<ApiResponse<SheetsBootstrapResult>>('/api/sheets/bootstrap', {
      method: 'POST',
    });
    return res.data!;
  },
};
