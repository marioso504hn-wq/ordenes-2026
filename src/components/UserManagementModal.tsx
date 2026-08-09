import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, UserX, Trash2, CheckCircle2, Clock, Mail, KeyRound, AlertTriangle } from 'lucide-react';
import { UserAccount } from '../types';
import { mergeUsersWithDb, updateUserStatus, deleteUserAccount } from '../lib/authUtils';
import { db } from '../lib/instant';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  // Real-time InstantDB query for instant synchronization across browsers
  const { data } = db.useQuery({
    userAccounts: {},
  });

  if (!isOpen) return null;

  const rawDbUsers = (data?.userAccounts as any[]) || [];
  const users = mergeUsersWithDb(rawDbUsers);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');

  const handleApprove = (u: UserAccount) => {
    updateUserStatus(u.id, 'approved');
    showToast(`✓ Usuario "${u.name}" APROBADO EXITOSAMENTE. Ahora puede iniciar sesión.`);
  };

  const handleReject = (u: UserAccount) => {
    updateUserStatus(u.id, 'rejected');
    showToast(`✕ Solicitud de "${u.name}" fue rechazada.`);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserAccount(userToDelete.id);
      setUserToDelete(null);
      showToast(`🗑️ Usuario "${userToDelete.name}" eliminado del sistema.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 relative overflow-hidden space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  Panel de Aprobación • Administrador Mario
                </h2>
                {pendingUsers.length > 0 && (
                  <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                    {pendingUsers.length} PENDIENTE{pendingUsers.length > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Sincronización en tiempo real de nuevos usuarios y permisos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-6 flex-1 pr-1">
          {/* Section 1: Pending Access Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Solicitudes Pendientes de Aprobación ({pendingUsers.length})</span>
              </h3>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl text-center text-xs font-bold text-emerald-800">
                ✅ No hay nuevas solicitudes pendientes en este momento. Todas están al día.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <span>👤 {u.name}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase font-black">
                          Solicitud Nueva
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {u.email}
                        </span>
                        {u.verificationCode && (
                          <span className="flex items-center gap-1 text-indigo-900 font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                            <KeyRound className="w-3 h-3 text-indigo-600" />
                            Código: {u.verificationCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleApprove(u)}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Aprobar Usuario</span>
                      </button>

                      <button
                        onClick={() => handleReject(u)}
                        className="flex-1 sm:flex-initial px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: All Registered Users & Deletion */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Todos los Usuarios en el Sistema ({users.length})</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Correo</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isMario = u.name.toLowerCase() === 'mario';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <span>{u.name}</span>
                          {isMario && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ADMIN PRINCIPAL
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>

                        <td className="py-2.5 px-3 text-center">
                          {u.status === 'approved' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ Aprobado
                            </span>
                          ) : u.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                              ⏳ Pendiente
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              ✕ Rechazado
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {!isMario && (
                            <div className="inline-flex items-center gap-1.5">
                              {u.status !== 'approved' && (
                                <button
                                  onClick={() => handleApprove(u)}
                                  className="px-2 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer"
                                  title="Aprobar acceso"
                                >
                                  Aprobar
                                </button>
                              )}

                              <button
                                onClick={() => setUserToDelete(u)}
                                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold border border-rose-200 cursor-pointer flex items-center gap-1"
                                title="Eliminar usuario permanentemente"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Sub-Modal */}
        {userToDelete && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-rose-200">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>¿Eliminar usuario "{userToDelete.name}"?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta acción eliminará la cuenta del usuario permanentemente. No podrá ingresar al sistema a menos que vuelva a registrarse.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Sí, Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
