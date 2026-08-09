import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  Building,
  User,
  AlertCircle,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';
import { InventoryItem, CartItem, Customer, Sale, SaleTicketItem } from '../types';
import { db, id, tx } from '../lib/instant';
import { TicketPrintView } from './TicketPrintView';

interface POSModuleProps {
  inventory: InventoryItem[];
  customers: Customer[];
}

export const POSModule: React.FC<POSModuleProps> = ({ inventory, customers }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchItem, setSearchItem] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('final');
  const [customCustomerName, setCustomCustomerName] = useState('Consumidor Final');
  const [customTaxId, setCustomTaxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);

  // Add item to cart
  const addToCart = (item: InventoryItem) => {
    if (item.stockQuantity <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.inventoryId === item.id);
      if (existing) {
        if (existing.quantity >= item.stockQuantity) return prevCart; // limit to available stock
        return prevCart.map((c) =>
          c.inventoryId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        return [
          ...prevCart,
          {
            inventoryId: item.id,
            code: item.code,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: 1,
            counterpieceType: item.counterpieceType,
            reference: item.reference,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (inventoryId: string, delta: number) => {
    const invItem = inventory.find((i) => i.id === inventoryId);
    const maxStock = invItem ? invItem.stockQuantity : 999;

    setCart((prevCart) =>
      prevCart
        .map((c) => {
          if (c.inventoryId === inventoryId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > maxStock) return c;
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (inventoryId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.inventoryId !== inventoryId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const taxAmount = subtotal * 0.19; // 19% IVA
  const totalAmount = subtotal + taxAmount;

  // Handle Customer Selection
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCustomerId(val);
    if (val === 'final') {
      setCustomCustomerName('Consumidor Final');
      setCustomTaxId('');
    } else {
      const found = customers.find((c) => c.id === val);
      if (found) {
        setCustomCustomerName(found.name);
        setCustomTaxId(found.taxId);
      }
    }
  };

  // Process Checkout & Transaction in InstantDB
  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const ticketNum = `FACT-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = Date.now();

      const ticketItems: SaleTicketItem[] = cart.map((c) => ({
        code: c.code,
        name: c.name,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        total: c.unitPrice * c.quantity,
      }));

      // InstantDB atomic transaction: deduct inventory stock for each sold item + create sale record
      const txs = [];

      // 1. Create sale record
      const saleId = id();
      const newSale: Sale = {
        id: saleId,
        ticketNumber: ticketNum,
        customerName: customCustomerName,
        taxId: customTaxId,
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod,
        createdAt: now,
        itemsJson: JSON.stringify(ticketItems),
      };

      txs.push(
        tx.sales[saleId].update({
          ticketNumber: ticketNum,
          customerName: customCustomerName,
          taxId: customTaxId,
          subtotal,
          taxAmount,
          totalAmount,
          paymentMethod,
          createdAt: now,
          itemsJson: JSON.stringify(ticketItems),
        })
      );

      // 2. Deduct inventory stock
      for (const cartItem of cart) {
        const invItem = inventory.find((i) => i.id === cartItem.inventoryId);
        if (invItem) {
          const updatedStock = Math.max(0, invItem.stockQuantity - cartItem.quantity);
          txs.push(
            tx.inventory[cartItem.inventoryId].update({
              stockQuantity: updatedStock,
            })
          );
        }
      }

      // Execute transact
      db.transact(txs);

      setCreatedSale(newSale);
      setCart([]);
    } catch (err) {
      console.error('Error processing sale:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.code?.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.counterpieceType?.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Printable Ticket View Popup if checkout just completed */}
      {createdSale && <TicketPrintView sale={createdSale} onClose={() => setCreatedSale(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Product Selector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
                <span>Punto de Venta & Facturación</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona productos del stock para agregar al carrito de compra.
              </p>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="Buscar repuesto o item..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredInventory.length === 0 ? (
              <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No hay productos disponibles en el inventario.
              </div>
            ) : (
              filteredInventory.map((item) => {
                const inCart = cart.find((c) => c.inventoryId === item.id);
                const isOutOfStock = item.stockQuantity <= 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden select-none ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 bg-slate-50'
                        : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1 mb-1.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado' : `${item.stockQuantity} disp.`}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.counterpieceType} • <span className="font-mono">{item.reference || 'S/R'}</span>
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-indigo-700">
                        ${item.unitPrice?.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </span>

                      <button
                        disabled={isOutOfStock}
                        className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                          inCart
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `(${inCart.quantity})` : 'Agregar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Shopping Cart & Checkout Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-full min-h-[500px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">Carrito de Venta</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </div>

              {/* Cart List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>El carrito está vacío.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Haz clic en los productos para agregarlos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.inventoryId}
                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          ${item.unitPrice.toLocaleString('es-CL', { minimumFractionDigits: 2 })} c/u
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQuantity(item.inventoryId, -1)}
                          className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="font-mono font-bold px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.inventoryId, 1)}
                          className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-slate-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.inventoryId)}
                          className="p-1 text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Form & Totals */}
            <div className="pt-4 border-t border-slate-200 space-y-3 mt-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cliente</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="final">Consumidor Final</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.taxId ? `(${c.taxId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medio de Pago
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'cash', label: 'Efectivo', icon: Banknote },
                    { id: 'card', label: 'Tarjeta', icon: CreditCard },
                    { id: 'transfer', label: 'Transf.', icon: Building },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    const isSel = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-semibold transition-all border cursor-pointer ${
                          isSel
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-0.5" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtotal, Tax, Total */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Neto:</span>
                  <span className="font-mono">${subtotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (19%):</span>
                  <span className="font-mono">${taxAmount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>TOTAL A PAGAR:</span>
                  <span className="font-mono text-indigo-700">
                    ${totalAmount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Process Sale Button */}
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleProcessCheckout}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm mt-2"
              >
                <span>{isProcessing ? 'Procesando Venta...' : 'Procesar Venta y Generar Ticket'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
