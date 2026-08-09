import React, { useState } from 'react';
import { Receipt, Search, Printer, Calendar, DollarSign, Eye, Trash2 } from 'lucide-react';
import { Sale } from '../types';
import { TicketPrintView } from './TicketPrintView';
import { db, tx } from '../lib/instant';

interface SalesHistoryProps {
  sales: Sale[];
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(
    (s) =>
      s.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.taxId?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  const handleDeleteSale = (saleId: string) => {
    if (confirm('¿Eliminar registro de venta?')) {
      db.transact(tx.sales[saleId].delete());
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket Modal */}
      {selectedSale && (
        <TicketPrintView sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}

      {/* Top Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <span>Historial de Ventas y Facturación</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro histórico de tickets emitidos, comprobantes y total facturado.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Facturado</span>
            <span className="text-sm font-mono font-extrabold text-indigo-700">
              ${totalRevenue.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° Ticket, Cliente o RUT/NIT..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">N° Ticket</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Medio de Pago</th>
                <th className="py-3.5 px-4 text-right">Monto Total</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay comprobantes de venta registrados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {sale.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(sale.createdAt).toLocaleString('es-CL', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {sale.customerName}
                      {sale.taxId && <span className="text-slate-400 font-mono text-[11px] block">{sale.taxId}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 capitalize">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      ${sale.totalAmount?.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver Ticket</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
