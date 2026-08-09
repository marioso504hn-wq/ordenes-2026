import React, { useState, useEffect } from 'react';
import { db, id, tx } from './lib/instant';
import { Header } from './components/Header';
import { OrderManagement } from './components/OrderManagement';
import { AuthGate } from './components/AuthGate';
import { AppIdModal } from './components/AppIdModal';
import { Order, Customer } from './types';
import { Loader2, Database, AlertCircle } from 'lucide-react';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(() => {
    return sessionStorage.getItem('emdep_active_user') || null;
  });
  const [appIdModalOpen, setAppIdModalOpen] = useState(false);

  // InstantDB Query to read all real-time collections
  const { isLoading, error, data } = db.useQuery({
    orders: {},
    customers: {},
  });

  const rawOrders = (data?.orders as Order[]) || [];
  const rawCustomers = (data?.customers as Customer[]) || [];

  // Auto-seed initial demo data if database is empty on first load
  useEffect(() => {
    if (data && !isLoading) {
      const hasOrders = rawOrders.length > 0;
      const hasCustomers = rawCustomers.length > 0;

      if (!hasOrders && !hasCustomers) {
        const seedTxs = [];

        // 1. Seed Initial Customers
        const defaultClientsList = [
          'Lier 213',
          'Lier 214',
          'Yasaki Nicaragua',
          'Yasaki Guatemala',
          'Active',
        ];

        defaultClientsList.forEach((cName, idx) => {
          const cId = id();
          seedTxs.push(
            tx.customers[cId].update({
              name: cName,
              email: `contacto@${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
              phone: '+505 8888 000' + idx,
              createdAt: Date.now() - (idx + 1) * 3600000,
            })
          );
        });

        // 2. Seed Initial Sample Orders
        const ord1Id = id();
        const ord2Id = id();
        const now = Date.now();

        seedTxs.push(
          tx.orders[ord1Id].update({
            customerName: 'Lier 213',
            otNumber: '2026 HN-12923U',
            project: 'P708',
            engineerInCharge: 'Rolvin',
            destinoFabricacion: 'HN',
            counterpieceType: 'PULL',
            carpetaURL: '',
            dueDate: now + 5 * 86400000,
            fechaEntrega: new Date(now + 5 * 86400000).toISOString(),
            status: 'activa',
            createdAt: now - 3600000,
            creadoPor: 'Gladys',
            itemsJson: JSON.stringify([
              {
                id: '1',
                reference: 'EJ-REF-001',
                pieceType: 'Pieza Neumática',
                itemName: 'Pieza Neumática',
                ots: [{ otNum: 1, fechaEnvio: new Date(now + 3 * 86400000).toISOString(), status: 'activa' }],
              },
            ]),
            comentariosJson: JSON.stringify([]),
          }),
          tx.orders[ord2Id].update({
            customerName: 'Yasaki Nicaragua',
            otNumber: '2026 NI-4022A',
            project: 'YAK-90',
            engineerInCharge: 'Ing. Carlos Mendoza',
            destinoFabricacion: 'NI',
            counterpieceType: 'Neumática',
            carpetaURL: '',
            dueDate: now + 2 * 86400000,
            fechaEntrega: new Date(now + 2 * 86400000).toISOString(),
            status: 'activa',
            createdAt: now - 7200000,
            creadoPor: 'Mario',
            itemsJson: JSON.stringify([
              {
                id: '1',
                reference: 'REF-YAK-08',
                pieceType: 'Canaleta de Cobre',
                itemName: 'Canaleta de Cobre',
                ots: [{ otNum: 1, fechaEnvio: new Date(now + 2 * 86400000).toISOString(), status: 'activa' }],
              },
            ]),
            comentariosJson: JSON.stringify([]),
          })
        );

        db.transact(seedTxs);
      }
    }
  }, [data, isLoading]);

  const pendingOrdersCount = rawOrders.filter(
    (o) => o.status === 'activa' || o.status === 'pending' || o.status === 'in_progress'
  ).length;

  const handleAuthenticate = (userName: string) => {
    setAuthenticatedUser(userName);
    sessionStorage.setItem('emdep_active_user', userName);
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    sessionStorage.removeItem('emdep_active_user');
  };

  // IF NOT AUTHENTICATED: Show AuthGate Screen FIRST (Mandatory Registration/Login)
  if (!authenticatedUser) {
    return <AuthGate onAuthenticate={handleAuthenticate} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        currentUser={authenticatedUser}
        onLogout={handleLogout}
        pendingOrdersCount={pendingOrdersCount}
        onOpenAppIdModal={() => setAppIdModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">
              Conectando con InstantDB Realtime (App ID: 70f52acf-c1c4-4341-b94f-d8e3a95fdf58)...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-900 my-4 text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="font-bold text-sm">Error de conexión con InstantDB</h3>
            <p className="text-xs text-rose-700 mt-1 mb-4">{error.message}</p>
            <button
              onClick={() => setAppIdModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Configurar InstantDB App ID
            </button>
          </div>
        )}

        {/* Order Management App */}
        {!isLoading && !error && (
          <OrderManagement
            orders={rawOrders}
            customers={rawCustomers}
            currentUser={authenticatedUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sincronizado en tiempo real con InstantDB (ID: 70f52acf-c1c4-4341-b94f-d8e3a95fdf58)</span>
          </div>
          <div>
            <span>EMDEP © {new Date().getFullYear()} • Sistema de Gestión de Órdenes de Trabajo</span>
          </div>
        </div>
      </footer>

      {/* InstantDB App ID Modal */}
      <AppIdModal isOpen={appIdModalOpen} onClose={() => setAppIdModalOpen(false)} />
    </div>
  );
}
