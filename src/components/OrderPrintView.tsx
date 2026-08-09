import React from 'react';
import { Printer, X, Wrench, Calendar, Hash, User, Briefcase, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Order, OrderItem } from '../types';

interface OrderPrintViewProps {
  order: Order;
  onClose: () => void;
}

export const OrderPrintView: React.FC<OrderPrintViewProps> = ({ order, onClose }) => {
  let parsedItems: OrderItem[] = [];
  if (order.itemsJson) {
    try {
      parsedItems = JSON.parse(order.itemsJson);
    } catch {
      parsedItems = [];
    }
  }

  // Fallback single item if no batch items list
  if (parsedItems.length === 0) {
    parsedItems = [
      {
        id: '1',
        reference: order.itemReference || 'N/A',
        itemName: order.itemName || 'Pieza Mecanizada',
        quantity: order.quantity || 1,
        pieceType: order.counterpieceType || 'N/A',
        notes: order.notes,
      },
    ];
  }

  const handlePrint = () => {
    window.print();
  };

  const formattedCreated = new Date(order.createdAt).toLocaleString('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formattedDueDate = order.dueDate
    ? new Date(order.dueDate).toLocaleDateString('es-NI', {
        dateStyle: 'full',
      })
    : 'Sin fecha asignada';

  const isOverdue = order.dueDate && Date.now() > order.dueDate && order.status !== 'completed' && order.status !== 'delivered';

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'pending':
        return 'EN ESPERA DE PRODUCCIÓN';
      case 'in_progress':
        return 'EN PROCESO DE MECANIZADO';
      case 'completed':
        return 'COMPLETADO / CONTROL CALIDAD';
      case 'delivered':
        return 'ENTREGADO AL CLIENTE';
      default:
        return st.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-8 relative my-6 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none">
        
        {/* Top Control Bar - Hidden during printing */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">
              Vista Previa de Hoja de Orden de Trabajo (OT)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Hoja de Orden</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE WORK ORDER SHEET */}
        <div className="work-order-sheet text-slate-900 font-sans space-y-6">
          
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-2xl text-slate-900 tracking-tight">
                <Wrench className="w-7 h-7 text-indigo-600 print:text-slate-900" />
                <span>MecaPro Industrial</span>
              </div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                Orden de Trabajo & Mecanizado de Alta Precisión
              </p>
              <p className="text-[11px] text-slate-500">
                Gestión de Clientes, Proyectos y Lotes de Referencias
              </p>
            </div>

            <div className="text-right border-l-2 sm:border-l-0 border-indigo-600 pl-3 sm:pl-0">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-widest mb-1 print:bg-slate-900">
                HOJA DE ORDEN DE TRABAJO
              </div>
              <div className="text-xl font-black font-mono text-indigo-600 print:text-slate-900">
                N° {order.otNumber}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Emisión: <span className="font-semibold text-slate-700">{formattedCreated}</span>
              </div>
            </div>
          </div>

          {/* Key Order Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                CLIENTE:
              </span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                {order.customerName || 'No especificado'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                PROYECTO:
              </span>
              <span className="font-bold text-indigo-700 print:text-slate-900 text-sm block mt-0.5">
                {order.project || 'General / N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                INGENIERO A CARGO:
              </span>
              <span className="font-bold text-slate-900 text-xs block mt-0.5">
                {order.engineerInCharge || 'Sin asignar'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                ESTADO ACTUAL:
              </span>
              <span className="font-bold text-slate-900 text-xs block mt-0.5">
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          {/* Due Date & Warning Alert */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            isOverdue 
              ? 'bg-rose-50 border-rose-300 text-rose-900' 
              : 'bg-indigo-50/60 border-indigo-100 text-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold">FECHA DE VENCIMIENTO ACORDADA: </span>
                <span className="font-semibold text-slate-900">{formattedDueDate}</span>
              </div>
            </div>
            {isOverdue && (
              <div className="inline-flex items-center gap-1 bg-rose-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">
                <AlertTriangle className="w-3 h-3" />
                <span>¡ORDEN EN ALERTA DE VENCIMIENTO!</span>
              </div>
            )}
          </div>

          {/* References Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-600" />
                <span>Detalle de Referencias e Ítems ({parsedItems.length} en total)</span>
              </h3>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">N°</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Referencia</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nombre / Pieza</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Tipo de Pieza</th>
                    <th className="py-2.5 px-3 text-center w-20">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {parsedItems.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-900 print:text-slate-900">
                        {item.reference || order.itemReference || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium">
                        {item.itemName || order.itemName || 'Pieza de mecanizado'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700 border border-slate-200">
                          {item.pieceType || order.counterpieceType || 'Pieza'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                        {item.quantity || order.quantity || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Notes Section */}
          {order.notes && (
            <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1">
              <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] block">
                OBSERVACIONES & ESPECIFICACIONES TÉCNICAS DE FABRICACIÓN:
              </span>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Signatures & Approval Blocks */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-800">{order.engineerInCharge || 'Ingeniero Responsable'}</p>
              <p className="text-[10px] text-slate-500 uppercase">Firma Ingeniero / Producción</p>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-800">Control de Calidad</p>
              <p className="text-[10px] text-slate-500 uppercase">Inspección Tolerancias / V°B°</p>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-800">{order.customerName || 'Cliente'}</p>
              <p className="text-[10px] text-slate-500 uppercase">Firma Recibido Conforme</p>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
            <span>MecaPro Industrial System • Impreso el {new Date().toLocaleDateString('es-NI')}</span>
            <span>Documento Oficial de Trabajo • OT #{order.otNumber}</span>
          </div>

        </div>
      </div>
    </div>
  );
};
