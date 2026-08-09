import React from 'react';
import { Database, User, Wrench, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: string | null;
  onLogout: () => void;
  onOpenAppIdModal: () => void;
  pendingOrdersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenAppIdModal,
  pendingOrdersCount,
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-md text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white uppercase">EMDEP</span>
                <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  InstantDB Realtime
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sistema Multicliente de Órdenes e Ingeniería Industrial
              </p>
            </div>
          </div>

          {/* User profile & Action buttons */}
          <div className="flex items-center gap-3">
            {pendingOrdersCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{pendingOrdersCount} OTs Activas</span>
              </div>
            )}

            <button
              onClick={onOpenAppIdModal}
              title="Configuración de InstantDB App ID"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px] hidden sm:inline">InstantDB</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">
                    {currentUser}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-2 px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
