import React, { useState } from 'react';
import {
  PackageCheck,
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Layers,
  DollarSign,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { InventoryItem, COUNTERPIECE_TYPES } from '../types';
import { db, id, tx } from '../lib/instant';

interface StockManagementProps {
  inventory: InventoryItem[];
}

export const StockManagement: React.FC<StockManagementProps> = ({ inventory }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [counterpieceType, setCounterpieceType] = useState<string>(COUNTERPIECE_TYPES[0]);
  const [reference, setReference] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(3);
  const [unitPrice, setUnitPrice] = useState<number>(150);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingItem(null);
    const randomCode = `PRD-${Math.floor(100 + Math.random() * 900)}`;
    setCode(randomCode);
    setName('');
    setCounterpieceType(COUNTERPIECE_TYPES[0]);
    setReference('');
    setStockQuantity(10);
    setMinStock(3);
    setUnitPrice(150);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setCounterpieceType(item.counterpieceType);
    setReference(item.reference);
    setStockQuantity(item.stockQuantity);
    setMinStock(item.minStock);
    setUnitPrice(item.unitPrice);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (editingItem) {
      db.transact(
        tx.inventory[editingItem.id].update({
          code: code.trim(),
          name: name.trim(),
          counterpieceType,
          reference: reference.trim(),
          stockQuantity: Number(stockQuantity),
          minStock: Number(minStock),
          unitPrice: Number(unitPrice),
        })
      );
    } else {
      const newId = id();
      db.transact(
        tx.inventory[newId].update({
          code: code.trim(),
          name: name.trim(),
          counterpieceType,
          reference: reference.trim(),
          stockQuantity: Number(stockQuantity),
          minStock: Number(minStock),
          unitPrice: Number(unitPrice),
          createdAt: Date.now(),
        })
      );
    }

    setIsModalOpen(false);
  };

  const handleAdjustStock = (itemId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    db.transact(
      tx.inventory[itemId].update({
        stockQuantity: newStock,
      })
    );
  };

  const handleDeleteItem = (itemId: string) => {
    db.transact(tx.inventory[itemId].delete());
    setDeleteConfirmId(null);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.code?.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.reference?.toLowerCase().includes(search.toLowerCase()) ||
      item.counterpieceType?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || item.counterpieceType === filterType;

    return matchesSearch && matchesType;
  });

  const lowStockItemsCount = inventory.filter((i) => i.stockQuantity <= i.minStock).length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            <span>Consulta de Stock e Inventario</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión en tiempo real de repuestos, componentes y contrapiezas disponibles.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Item a Stock</span>
        </button>
      </div>

      {/* Alert banner for low stock */}
      {lowStockItemsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Alerta de Stock Bajo:</span> Hay{' '}
            <span className="font-extrabold text-amber-700">{lowStockItemsCount}</span> producto(s) en o por
            debajo del nivel mínimo requerido.
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre, referencia..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todas las contrapiezas</option>
            {COUNTERPIECE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table view for desktop and card view for mobile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Nombre del Item</th>
                <th className="py-3.5 px-4">Tipo / Referencia</th>
                <th className="py-3.5 px-4 text-right">Precio Unit.</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.stockQuantity <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{item.code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium mr-1.5">
                          {item.counterpieceType}
                        </span>
                        <span className="font-mono text-slate-500">{item.reference || 'S/N'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${item.unitPrice?.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleAdjustStock(item.id, item.stockQuantity, -1)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Disminuir stock"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <span
                            className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                              isLow
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.stockQuantity} unid
                          </span>
                          <button
                            onClick={() => handleAdjustStock(item.id, item.stockQuantity, 1)}
                            className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                            title="Aumentar stock"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Confirm delete popup */}
                        {deleteConfirmId === item.id && (
                          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
                              <Trash2 className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                              <h3 className="font-bold text-slate-900 text-sm">¿Eliminar {item.name}?</h3>
                              <p className="text-xs text-slate-500 mt-1 mb-4">
                                Se eliminará permanentemente del inventario.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingItem ? 'Editar Producto en Stock' : 'Agregar Nuevo Producto a Stock'}
            </h2>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PRD-101"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Matriz de Corte 1/2 pulgada"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Contrapieza *
                  </label>
                  <select
                    value={counterpieceType}
                    onChange={(e) => setCounterpieceType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {COUNTERPIECE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Referencia / Modelo
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. MTR-2024"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio Unit. ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Mín.
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {editingItem ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
