import React, { useState } from 'react';
import { Database, Key, Check, RefreshCw, X, ExternalLink } from 'lucide-react';
import { CURRENT_APP_ID, setStoredAppId } from '../lib/instant';

interface AppIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppIdModal: React.FC<AppIdModalProps> = ({ isOpen, onClose }) => {
  const [appIdInput, setAppIdInput] = useState(CURRENT_APP_ID);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredAppId(appIdInput);
  };

  const handleReset = () => {
    setStoredAppId('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(CURRENT_APP_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Configuración InstantDB App ID</h3>
            <p className="text-xs text-slate-500">Base de datos en tiempo real sincronizada con InstantDB</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span className="font-semibold text-slate-700">App ID Activo en Ejecución:</span>
            <button
              onClick={handleCopy}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Key className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 break-all">
            {CURRENT_APP_ID}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Conectar tu propio InstantDB App ID (Opcional)
            </label>
            <input
              type="text"
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
              placeholder="e.g. 7f920251-512c-4a37-b4db-b27b9c9f4e24"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Puedes crear tu proyecto gratuito en{' '}
              <a
                href="https://instantdb.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                InstantDB.com <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              y colocar aquí tu App ID para sincronizar tu propia base de datos.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-1/3 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              type="submit"
              className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Guardar y Recargar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
