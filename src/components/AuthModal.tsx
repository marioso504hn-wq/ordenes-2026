import React, { useState } from 'react';
import { Mail, Key, LogIn, LogOut, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { db } from '../lib/instant';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user } = db.useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentEmail, setSentEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico válido');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(true);
      setSuccessMsg(`Código enviado a ${email}. Revisa tu bandeja de entrada.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al enviar el código de verificación.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setErrorMsg('Por favor ingrese el código recibido');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      await db.auth.signInWithMagicCode({ email, code });
      setSuccessMsg('¡Sesión iniciada correctamente con InstantDB Auth!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Código incorrecto o expirado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await db.auth.signOut();
      setSentEmail(false);
      setEmail('');
      setCode('');
      setSuccessMsg('Sesión cerrada');
    } catch (err: any) {
      setErrorMsg('Error al cerrar sesión');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Autenticación InstantDB</h3>
            <p className="text-xs text-slate-5-00">Acceso seguro con Magic Code por email</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500 font-medium">Usuario Autenticado:</span>
              <p className="text-sm font-semibold text-slate-900 mt-1 break-all">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-100/60 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sesión Activa en InstantDB</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div>
            {!sentEmail ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ingeniero@empresa.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Enviando Código...' : 'Enviar Código Mágico'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de 6 dígitos enviado a {email}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      required
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSentEmail(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cambiar email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {loading ? 'Verificando...' : 'Verificar e Ingresar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
