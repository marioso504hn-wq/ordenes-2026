import React, { useState } from 'react';
import { Wrench, UserPlus, LogIn, Lock, User, ShieldCheck, Mail, CheckCircle } from 'lucide-react';

interface AuthGateProps {
  onAuthenticate: (userName: string) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticate }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true); // Default to Registration first as requested
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Get registered users from localStorage
  const getRegisteredUsers = (): Array<{ name: string; email?: string; password?: string }> => {
    try {
      const stored = localStorage.getItem('emdep_registered_users');
      return stored ? JSON.parse(stored) : [
        { name: 'Gladys', password: '123' },
        { name: 'Rolvin', password: '123' },
        { name: 'Mario', password: '123' },
      ];
    } catch {
      return [{ name: 'Gladys', password: '123' }];
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor ingrese su nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor defina una contraseña.');
      return;
    }

    const users = getRegisteredUsers();
    const existing = users.find((u) => u.name.toLowerCase() === name.trim().toLowerCase());

    if (existing) {
      setErrorMsg(`El usuario "${name.trim()}" ya existe. Por favor inicie sesión.`);
      return;
    }

    const newUser = { name: name.trim(), email: email.trim(), password };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('emdep_registered_users', JSON.stringify(updatedUsers));

    setSuccessMsg(`¡Registro exitoso para ${name.trim()}! Ingresando al sistema...`);
    setTimeout(() => {
      onAuthenticate(name.trim());
    }, 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor ingrese su nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor ingrese su contraseña.');
      return;
    }

    const users = getRegisteredUsers();
    const found = users.find((u) => u.name.toLowerCase() === name.trim().toLowerCase());

    if (!found) {
      setErrorMsg('Usuario no encontrado. Por favor regístrese primero.');
      return;
    }

    if (found.password && found.password !== password) {
      setErrorMsg('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }

    setSuccessMsg(`¡Bienvenido de nuevo, ${found.name}!`);
    setTimeout(() => {
      onAuthenticate(found.name);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-8 relative overflow-hidden space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 mb-2">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">EMDEP</h1>
          <p className="text-xs font-semibold text-slate-500">
            Sistema de Gestión de Órdenes e Ingeniería Industrial
          </p>
        </div>

        {/* Tab switcher: Registration FIRST, then Login */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isRegisterMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>1. Registrarse</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isRegisterMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>2. Ingresar</span>
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        {isRegisterMode ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Nombre de Usuario / Ingeniero *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Gladys, Rolvin, Mario..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Contraseña de Acceso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Registrarme e Ingresar</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Nombre de Usuario *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre de usuario"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          🔒 Acceso restringido. Registre su usuario para acceder al sistema EMDEP.
        </div>
      </div>
    </div>
  );
};
