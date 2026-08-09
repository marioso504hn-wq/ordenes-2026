import React from 'react';
import { Printer, CheckCircle, X, Wrench, Building2, User, CreditCard } from 'lucide-react';
import { Sale, SaleTicketItem } from '../types';

interface TicketPrintViewProps {
  sale: Sale;
  onClose: () => void;
}

export const TicketPrintView: React.FC<TicketPrintViewProps> = ({ sale, onClose }) => {
  let items: SaleTicketItem[] = [];
  try {
    items = JSON.parse(sale.itemsJson || '[]');
  } catch (e) {
    items = [];
  }

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta Débito/Crédito';
      case 'transfer':
        return 'Transferencia Bancaria';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative my-8 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none">
        {/* Non-printable Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket / Factura Emitida</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt Content */}
        <div className="ticket-printable text-slate-900 font-mono text-xs space-y-4">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 font-sans font-extrabold text-base text-slate-900">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>MecaPro Industrial</span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Servicios Mecánicos & Fabricación de Contrapiezas
            </p>
            <p className="text-[10px] text-slate-400 font-sans">NIT/RUC: 900.842.110-3 • Tel: +56 9 8765 4321</p>
            <div className="pt-2 flex justify-between text-[11px]">
              <span className="font-bold">N° Ticket: {sale.ticketNumber}</span>
              <span className="text-slate-500">{formattedDate}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="text-[11px] space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-bold text-slate-900">{sale.customerName || 'Consumidor Final'}</span>
            </div>
            {sale.taxId && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">RUT/NIT/DNI:</span>
                <span className="font-mono text-slate-800">{sale.taxId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Medio de Pago:</span>
              <span className="font-medium text-indigo-700">{getPaymentMethodLabel(sale.paymentMethod)}</span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-semibold">
                  <th className="py-1">Cant. / Item</th>
                  <th className="py-1 text-right">P.Unit</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-2">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.quantity} x ${item.unitPrice.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-1.5 text-right font-mono align-top text-slate-700">
                      ${item.unitPrice.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 text-right font-mono font-bold align-top text-slate-900">
                      ${item.total.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">${sale.subtotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (19%):</span>
              <span className="font-mono">${sale.taxAmount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-300">
              <span>TOTAL FACTURADO:</span>
              <span className="font-mono text-indigo-700">
                ${sale.totalAmount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-sans space-y-1">
            <p className="font-semibold text-slate-700">¡Gracias por su preferencia!</p>
            <p>Garantía de repuestos y mecanizados por 30 días.</p>
            <div className="pt-2 text-[9px] text-slate-400 font-mono">
              Sincronizado con InstantDB Realtime • MecaPro v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
