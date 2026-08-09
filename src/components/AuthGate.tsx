import React, { useState } from 'react';
import { Wrench, UserPlus, LogIn, Lock, User, ShieldCheck, Mail, CheckCircle, Clock, AlertTriangle, KeyRound, Bell } from 'lucide-react';
import { mergeUsersWithDb, registerNewUser } from '../lib/authUtils';
import { db } from '../lib/instant';

interface AuthGateProps {
  onAuthenticate: (userName: string) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticate }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingNotice, setPendingNotice] = useState<{
    userName: string;
    email: string;
    code: string;
  } | null>(null);

  // Real-time query to InstantDB userAccounts
  const { data } = db.useQuery({
    userAccounts: {},
  });

  const rawDbUsers = (data?.userAccounts as any[]) || [];
  const allUsers = mergeUsersWithDb(rawDbUsers);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setPendingNotice(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Por favor ingrese su nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor defina una contraseña.');
      return;
    }

    const existing = allUsers.find((u) => u.name.toLowerCase() === cleanName.toLowerCase());

    if (existing) {
      setErrorMsg(`El usuario "${cleanName}" ya existe en el sistema. Por favor inicie sesión.`);
      return;
    }

    // Special case for Mario master admin
    if (cleanName.toLowerCase() === 'mario') {
      if (password !== 'marioso1318') {
        setErrorMsg('Para registrarse o ingresar como Mario (Administrador), la contraseña maestra es "marioso1318".');
        return;
      }
      registerNewUser(cleanName, email, password);
      setSuccessMsg('¡Acreditado como Administrador Principal (Mario)! Accediendo...');
      setTimeout(() => onAuthenticate('Mario'), 600);
      return;
    }

    // Register normal user -> Writes to InstantDB in real-time so Mario receives notification
    const { user, verificationCode } = registerNewUser(cleanName, email, password);

    setPendingNotice({
      userName: user.name,
      email: user.email || `${user.name.toLowerCase()}@emdep.com`,
      code: verificationCode,
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setPendingNotice(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Por favor ingrese su nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor ingrese su contraseña.');
      return;
    }

    // Direct Super Admin Check for Mario
    if (cleanName.toLowerCase() === 'mario') {
      if (password === 'marioso1318') {
        setSuccessMsg('¡Bienvenido Administrador Principal (Mario)!');
        setTimeout(() => onAuthenticate('Mario'), 600);
        return;
      } else {
        setErrorMsg('Contraseña incorrecta para Mario Administrador.');
        return;
      }
    }

    const found = allUsers.find((u) => u.name.toLowerCase() === cleanName.toLowerCase());

    if (!found) {
      setErrorMsg('Usuario no encontrado en el registro. Por favor regístrese primero.');
      return;
    }

    if (found.password && found.password !== password) {
      setErrorMsg('Contraseña incorrecta. Inténtelo de nuevo.');
      return;
    }

    // CHECK APPROVAL STATUS
    if (found.status === 'pending') {
      setErrorMsg(`🔒 Tu cuenta "${found.name}" está PENDIENTE DE APROBACIÓN por el administrador Mario. Mario debe autorizar tu acceso en la plataforma.`);
      return;
    }

    if (found.status === 'rejected') {
      setErrorMsg(`❌ Tu solicitud de acceso fue rechazada por el administrador Mario.`);
      return;
    }

    setSuccessMsg(`¡Bienvenido de nuevo, ${found.name}!`);
    setTimeout(() => {
      onAuthenticate(found.name);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-8 relative overflow-hidden space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 mb-1">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">EMDEP</h1>
          <p className="text-xs font-semibold text-slate-500">
            Sistema de Gestión de Órdenes e Ingeniería
          </p>
          <div className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            🛡️ Aprobación Requerida por Administrador Mario
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMsg('');
              setSuccessMsg('');
              setPendingNotice(null);
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isRegisterMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMsg('');
              setSuccessMsg('');
              setPendingNotice(null);
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isRegisterMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrarse</span>
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-rose-600 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Acceso Denegado / Pendiente</span>
            </div>
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Pending Notice Modal Card */}
        {pendingNotice && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-black text-amber-900 uppercase">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
              <span>Solicitud Enviada en Tiempo Real a Mario</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 font-mono text-[11px]">
              <div><strong className="text-slate-600">Usuario:</strong> {pendingNotice.userName}</div>
              <div><strong className="text-slate-600">Correo:</strong> {pendingNotice.email}</div>
              <div className="pt-1 text-indigo-900 font-bold flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Código de Notificación:</span>
                <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded text-xs tracking-widest">{pendingNotice.code}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-amber-800">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Se ha enviado la notificación en tiempo real a la pantalla del Administrador <strong>Mario</strong>. Tan pronto Mario apruebe tu cuenta, podrás ingresar.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPendingNotice(null);
                setIsRegisterMode(false);
              }}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Entendido, Ir a Iniciar Sesión
            </button>
          </div>
        )}

        {/* Form */}
        {!pendingNotice && (
          <>
            {isRegisterMode ? (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Nombre de Usuario / Ingeniero *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos, Juan, Pedro..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Correo Electrónico (Para recibir notificaciones)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enviar Solicitud de Registro</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    Nombre de Usuario *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Mario, Gladys, Rolvin..."
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
                  <span>Ingresar al Sistema</span>
                </button>
              </form>
            )}
          </>
        )}

        <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium space-y-1">
          <div>🔑 Administrador Principal: <strong>Mario</strong> (Clave: marioso1318)</div>
          <div>🛡️ Aprobación requerida por Mario para nuevos registros.</div>
        </div>
      </div>
    </div>
  );
};
