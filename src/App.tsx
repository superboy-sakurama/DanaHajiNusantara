/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { PenerimaanPage } from './pages/PenerimaanPage.tsx';
import { PengeluaranPage } from './pages/PengeluaranPage.tsx';
import { LaporanPage } from './pages/LaporanPage.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav, NavTab } from './components/BottomNav.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { SaldoModal } from './components/SaldoModal.tsx';
import { GoogleSheetModal } from './components/GoogleSheetModal.tsx';
import { ExportPdfModal } from './components/ExportPdfModal.tsx';
import { api } from './utils/api.ts';
import { Transaction, SaldoRecord, GoogleSheetsConfig, TransactionType } from './types/index.ts';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function MainAppShell() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // App Data State
  const [saldo, setSaldo] = useState<SaldoRecord>({
    id: 'sld-2026',
    tahun: '1447 H / 2026 M',
    saldo_awal_tahun_lalu: 12500000,
    saldo_realtime: 12500000,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Modals state
  const [isTrxModalOpen, setIsTrxModalOpen] = useState<boolean>(false);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [defaultTrxType, setDefaultTrxType] = useState<TransactionType>('penerimaan');

  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadAllData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [saldoData, trxList, sheetsStatus] = await Promise.all([
        api.getSaldo(),
        api.getTransactions(),
        api.getSheetsStatus(),
      ]);
      setSaldo(saldoData);
      setTransactions(trxList);
      setSheetConfig(sheetsStatus);
    } catch (err: any) {
      console.warn('Initial data load notice:', err.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Handlers for transactions
  const handleOpenAddModal = (type: TransactionType = 'penerimaan') => {
    setEditingTrx(null);
    setDefaultTrxType(type);
    setIsTrxModalOpen(true);
  };

  const handleEditTransaction = (trx: Transaction) => {
    setEditingTrx(trx);
    setDefaultTrxType(trx.jenis);
    setIsTrxModalOpen(true);
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'created_at'>) => {
    if (editingTrx) {
      const updated = await api.updateTransaction(editingTrx.id, data);
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast('Transaksi berhasil diperbarui!');
    } else {
      const created = await api.createTransaction(data);
      setTransactions((prev) => [created, ...prev]);
      showToast('Transaksi baru berhasil dicatat!');
    }
    // Refresh balance from server
    const updatedSaldo = await api.getSaldo();
    setSaldo(updatedSaldo);
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaksi berhasil dihapus.');
    const updatedSaldo = await api.getSaldo();
    setSaldo(updatedSaldo);
  };

  const handleUpdateSaldoAwal = async (payload: {
    saldo_awal_tahun_lalu: number;
    tahun?: string;
    catatan?: string;
  }) => {
    const updated = await api.updateSaldo(payload);
    setSaldo(updated);
    showToast('Saldo awal tahun lalu berhasil disimpan!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <span className="text-xs text-purple-200">Memuat Sistem Keuangan Haji...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#110726] to-[#260b1c] text-slate-100 flex flex-col font-sans relative selection:bg-pink-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in transition-all bg-slate-900/90 border-white/20 text-white">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        sheetConfig={sheetConfig}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-12">
        {loadingData ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-purple-300">
            <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
            <span>Menyinkronkan data keuangan...</span>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                user={user}
                isAdmin={isAdmin}
                saldo={saldo}
                transactions={transactions}
                onOpenAddModal={(type) => handleOpenAddModal(type || 'penerimaan')}
                onOpenSaldoModal={() => setIsSaldoModalOpen(true)}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'penerimaan' && (
              <PenerimaanPage
                transactions={transactions}
                isAdmin={isAdmin}
                onOpenAddModal={() => handleOpenAddModal('penerimaan')}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentTab === 'pengeluaran' && (
              <PengeluaranPage
                transactions={transactions}
                isAdmin={isAdmin}
                onOpenAddModal={() => handleOpenAddModal('pengeluaran')}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentTab === 'laporan' && (
              <LaporanPage
                saldo={saldo}
                transactions={transactions}
                user={user}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        isAdmin={isAdmin}
        onOpenAddModal={() => handleOpenAddModal('penerimaan')}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTrxModalOpen}
        onClose={() => setIsTrxModalOpen(false)}
        onSubmit={handleSaveTransaction}
        initialData={editingTrx}
        defaultType={defaultTrxType}
      />

      <SaldoModal
        isOpen={isSaldoModalOpen}
        onClose={() => setIsSaldoModalOpen(false)}
        currentSaldo={saldo}
        onUpdateSaldo={handleUpdateSaldoAwal}
      />

      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        config={sheetConfig}
        isAdmin={isAdmin}
        onConfigUpdated={loadAllData}
      />

      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        saldo={saldo}
        currentUser={user}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppShell />
    </AuthProvider>
  );
}
