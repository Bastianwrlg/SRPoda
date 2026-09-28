import React from 'react';
import { 
  X, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { RealtimeSyncState } from '../types';

interface SyncLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: RealtimeSyncState;
  onTriggerSync: () => void;
  onToggleOnline: () => void;
}

export const SyncLogsModal: React.FC<SyncLogsModalProps> = ({
  isOpen,
  onClose,
  syncState,
  onTriggerSync,
  onToggleOnline
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pusat Sinkronisasi Real-Time PODA
              </h3>
              <p className="text-xs text-slate-500">
                Penyelarasan data dua arah antara aplikasi Sales Rep dan Server Pusat PODA E-Liquid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Dashboard Panel */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Status Koneksi</span>
              <div className="flex items-center gap-2">
                {syncState.isOnline ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700">Terhubung (Online)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-xs sm:text-sm font-bold text-rose-600">Terputus (Offline)</span>
                  </>
                )}
              </div>
              <button
                onClick={onToggleOnline}
                className="mt-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                {syncState.isOnline ? "Simulasikan Mode Offline" : "Kembalikan ke Mode Online"}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Penyelarasan Terakhir</span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{syncState.lastSyncTime}</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">Sinkron otomatis tiap 30 detik</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Antrean Tertunda</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold ${syncState.pendingSyncCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {syncState.pendingSyncCount} Item
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">
                {syncState.pendingSyncCount > 0 ? "Menunggu koneksi stabil" : "Semua data aman tersinkron"}
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Kirim & Terima Pembaruan</h4>
              <p className="text-[11px] text-slate-600">
                Picu sinkronisasi manual untuk memastikan semua stok dan laporan terbaru telah tersimpan di cloud.
              </p>
            </div>
            <button
              onClick={onTriggerSync}
              disabled={syncState.isSyncing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>

          {/* Live Sync Event Streams */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Log Aktivitas Sinkronisasi Real-Time
              </h4>
              <span className="text-[11px] text-slate-500">
                {syncState.logs.length} catatan aktivitas
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {syncState.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="mt-0.5">
                    {log.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    {log.type === 'info' && <Server className="w-4 h-4 text-sky-600" />}
                    {log.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                    {log.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-slate-800 font-medium">{log.message}</p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
