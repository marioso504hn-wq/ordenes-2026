import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Clock,
  User,
  Hash,
  Wrench,
  Layers,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  X,
  Play,
  Check,
  Package,
  Calendar,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Settings,
  FolderOpen,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  CornerDownRight,
  Filter,
  Eye,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  Order,
  OrderStatus,
  OrderItem,
  DestinoFabricacion,
  OrderComment,
  DEFAULT_PIECE_TYPES,
  DEFAULT_CUSTOMERS,
} from '../types';
import { db, id, tx } from '../lib/instant';
import { OrderTimer } from './OrderTimer';
import { OrderPrintView } from './OrderPrintView';

interface OrderManagementProps {
  orders: Order[];
  customers: { name: string }[];
  currentUser?: string;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ orders, customers, currentUser }) => {
  // Navigation sub-tabs within Order Management
  const [activeSubTab, setActiveSubTab] = useState<
    'activas' | 'mis_ordenes' | 'buscador' | 'finalizadas' | 'comentarios'
  >('activas');

  // Master Client Filter ('all' or specific client name)
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [allClients, setAllClients] = useState<string[]>(DEFAULT_CUSTOMERS);
  const [newClientInput, setNewClientInput] = useState('');
  const [isAddingClientModal, setIsAddingClientModal] = useState(false);

  // User filter ("Ver órdenes de")
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  // Filters for Órdenes Activas
  const [filterClienteActivas, setFilterClienteActivas] = useState<string>('all');
  const [filterProyectoActivas, setFilterProyectoActivas] = useState<string>('');
  const [filterFechaActivas, setFilterFechaActivas] = useState<string>(''); // YYYY-MM-DD

  // Search in Buscador Inteligente
  const [intelliSearchQuery, setIntelliSearchQuery] = useState<string>('');

  // Piece types management
  const [pieceTypes, setPieceTypes] = useState<string[]>(DEFAULT_PIECE_TYPES);
  const [isManagingTypesModal, setIsManagingTypesModal] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState('');

  // Sidebar form states (Mis Órdenes)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [formOtNum, setFormOtNum] = useState('');
  const [formProyecto, setFormProyecto] = useState('');
  const [formIngeniero, setFormIngeniero] = useState('');
  const [formDestino, setFormDestino] = useState<DestinoFabricacion>('HN');
  const [formTipoContrapieza, setFormTipoContrapieza] = useState(DEFAULT_PIECE_TYPES[0]);
  const [formCarpetaURL, setFormCarpetaURL] = useState('');
  const [formFechaEntrega, setFormFechaEntrega] = useState(''); // YYYY-MM-DDTHH:mm
  const [formBulkReferencias, setFormBulkReferencias] = useState('');
  const [formBulkTipos, setFormBulkTipos] = useState('');
  const [formBulkOTE, setFormBulkOTE] = useState<number>(1);

  // Print Modal
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Toast notification for InstantDB sync feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Collapsible state for order cards & sub OT groups
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedOtGroups, setExpandedOtGroups] = useState<Record<string, boolean>>({});

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const toggleOtGroupExpanded = (groupKey: string) => {
    setExpandedOtGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Toggle individual item completion status and persist directly in InstantDB
  const handleToggleItemStatus = (order: Order, itemIdx: number) => {
    let items: OrderItem[] = [];
    if (order.itemsJson) {
      try {
        items = JSON.parse(order.itemsJson);
      } catch {
        items = [];
      }
    }

    if (items[itemIdx]) {
      const isCurrentlyClosed = items[itemIdx].notes === 'completado' || (items[itemIdx] as any).isClosed;
      items[itemIdx].notes = isCurrentlyClosed ? 'activo' : 'completado';
      (items[itemIdx] as any).isClosed = !isCurrentlyClosed;

      db.transact(
        tx.orders[order.id].update({
          itemsJson: JSON.stringify(items),
          updatedAt: Date.now(),
        })
      );
      showToast('✓ Estado del ítem actualizado en InstantDB');
    }
  };

  // Delete confirmation overlay
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Comment input per card
  const [cardCommentText, setCardCommentText] = useState<{ [orderId: string]: string }>({});
  const [cardCommentImage, setCardCommentImage] = useState<{ [orderId: string]: string }>({});

  // Global Comment Tab Form State
  const [globalCommentOrderQuery, setGlobalCommentOrderQuery] = useState('');
  const [globalCommentSelectedOrder, setGlobalCommentSelectedOrder] = useState<Order | null>(null);
  const [globalCommentRef, setGlobalCommentRef] = useState('');
  const [globalCommentItem, setGlobalCommentItem] = useState('');
  const [globalCommentText, setGlobalCommentText] = useState('');
  const [globalCommentImage, setGlobalCommentImage] = useState<string | null>(null);
  const [globalCommentFilter, setGlobalCommentFilter] = useState('');

  // Helper flag emoji
  const getFlagEmoji = (dest?: string) => {
    if (dest === 'HN') return '🇭🇳';
    if (dest === 'NI') return '🇳🇮';
    if (dest === 'ES') return '🇪🇸';
    return '🌍';
  };

  // Sync clients with props
  useEffect(() => {
    if (customers.length > 0) {
      const merged = Array.from(new Set([...allClients, ...customers.map((c) => c.name)]));
      setAllClients(merged);
    }
  }, [customers]);

  // Extract all creators/users from orders for "Ver órdenes de" dropdown
  const allOrderUsers = Array.from(
    new Set([
      'all',
      'Gladys',
      'Rolvin',
      'Mario',
      'Ing. Carlos Mendoza',
      'Ing. Sofía Reyes',
      'Ing. Mateo Gómez',
      ...orders.map((o) => o.creadoPor || o.engineerInCharge).filter(Boolean),
    ])
  );

  // Stats calculation
  const calculateFabricationStats = () => {
    const activeOrders = orders.filter((o) => {
      const isActiva = o.status === 'activa' || o.status === 'pending' || o.status === 'in_progress';
      const matchClient = selectedClient === 'all' || o.customerName === selectedClient;
      const matchUser = selectedUserFilter === 'all' || o.creadoPor === selectedUserFilter || o.engineerInCharge === selectedUserFilter;
      return isActiva && matchClient && matchUser;
    });

    let hn = 0;
    let ni = 0;
    let es = 0;
    let totalItems = 0;

    activeOrders.forEach((o) => {
      const dest = o.destinoFabricacion || 'HN';
      let itemsCount = o.quantity || 1;
      if (o.itemsJson) {
        try {
          const parsed = JSON.parse(o.itemsJson);
          if (Array.isArray(parsed)) itemsCount = parsed.length;
        } catch {
          // fallback
        }
      }
      totalItems += itemsCount;

      if (dest === 'HN') hn += itemsCount;
      else if (dest === 'NI') ni += itemsCount;
      else if (dest === 'ES') es += itemsCount;
    });

    return { hn, ni, es, totalOrders: activeOrders.length, totalItems };
  };

  const stats = calculateFabricationStats();

  // Helper for week range
  const getWeekRangeString = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateRef = new Date(y, m - 1, d);
    const day = dateRef.getDay();
    const offsetToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(dateRef);
    mon.setDate(dateRef.getDate() + offsetToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const f = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
    return `${f(mon)} al ${f(sun)}`;
  };

  const isInSameWeek = (targetIsoDate?: string, filterYmd?: string) => {
    if (!targetIsoDate || !filterYmd) return true;
    const dt = new Date(targetIsoDate);
    if (isNaN(dt.getTime())) return false;

    const [y, m, d] = filterYmd.split('-').map(Number);
    const dateRef = new Date(y, m - 1, d);
    const day = dateRef.getDay();
    const offsetToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(dateRef);
    mon.setDate(dateRef.getDate() + offsetToMon);
    mon.setHours(0, 0, 0, 0);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    return dt >= mon && dt <= sun;
  };

  // Filtered orders for Órdenes Activas
  const activeOrdersList = orders
    .filter((o) => {
      const isActiva = o.status === 'activa' || o.status === 'pending' || o.status === 'in_progress';
      const matchClient = filterClienteActivas === 'all' || o.customerName === filterClienteActivas;
      const matchProyecto = !filterProyectoActivas || (o.project && o.project.toLowerCase().includes(filterProyectoActivas.toLowerCase()));
      const matchWeek = !filterFechaActivas || isInSameWeek(o.fechaEntrega || (o.dueDate ? new Date(o.dueDate).toISOString() : ''), filterFechaActivas);

      return isActiva && matchClient && matchProyecto && matchWeek;
    })
    .sort((a, b) => {
      const da = a.dueDate || (a.fechaEntrega ? new Date(a.fechaEntrega).getTime() : Infinity);
      const dbVal = b.dueDate || (b.fechaEntrega ? new Date(b.fechaEntrega).getTime() : Infinity);
      return da - dbVal;
    });

  // Filtered orders for Mis Órdenes
  const misOrdenesList = orders.filter((o) => {
    const isActiva = o.status === 'activa' || o.status === 'pending' || o.status === 'in_progress';
    const matchClient = selectedClient === 'all' || o.customerName === selectedClient;
    const matchUser = selectedUserFilter === 'all' || o.creadoPor === selectedUserFilter || o.engineerInCharge === selectedUserFilter;
    return isActiva && matchClient && matchUser;
  });

  // Filtered orders for Historial Cerrado
  const historialCerradoList = orders.filter((o) => {
    const isCerrada = o.status === 'finalizada' || o.status === 'completed' || o.status === 'delivered';
    const matchUser = selectedUserFilter === 'all' || o.creadoPor === selectedUserFilter || o.engineerInCharge === selectedUserFilter;
    return isCerrada && matchUser;
  });

  // Handle Form Submission
  const handleSaveOrderForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOtNum.trim()) {
      alert('Por favor ingrese el número o código de Orden.');
      return;
    }

    const refs = formBulkReferencias.split('\n').map((l) => l.trim()).filter(Boolean);
    const tipos = formBulkTipos.split('\n').map((l) => l.trim()).filter(Boolean);

    // Check for prior comments warning
    const refsToCheck = refs.length > 0 ? refs : [formOtNum];
    let foundPriorComments = false;
    orders.forEach((o) => {
      if (o.comentariosJson) {
        try {
          const coms: OrderComment[] = JSON.parse(o.comentariosJson);
          coms.forEach((c) => {
            if (c.referencia && refsToCheck.includes(c.referencia)) {
              foundPriorComments = true;
            }
          });
        } catch {
          // ignore
        }
      }
    });

    if (foundPriorComments) {
      const proceed = confirm('⚠️ ATENCIÓN: Se encontraron comentarios o dudas registradas previamente para una de las referencias ingresadas. ¿Desea continuar con el registro?');
      if (!proceed) return;
    }

    const calculatedDueDate = formFechaEntrega ? new Date(formFechaEntrega).getTime() : Date.now() + 3 * 86400000;
    const maxItemsCount = Math.max(refs.length, tipos.length);
    const parsedItems: OrderItem[] = [];

    if (maxItemsCount > 0) {
      for (let i = 0; i < maxItemsCount; i++) {
        parsedItems.push({
          id: `item-${i + 1}-${Date.now()}`,
          reference: refs[i] || `REF-${i + 1}`,
          pieceType: tipos[i] || formTipoContrapieza,
          itemName: tipos[i] || formTipoContrapieza,
          quantity: 1,
          ots: [{ otNum: formBulkOTE || 1, fechaEnvio: formFechaEntrega || new Date(calculatedDueDate).toISOString(), status: 'activa' }],
        });
      }
    }

    const finalItemsJson = parsedItems.length > 0 ? JSON.stringify(parsedItems) : '';
    const firstItemName = parsedItems.length > 0 ? parsedItems[0].itemName || 'Pieza Mecanizada' : 'Pieza Mecanizada';
    const firstRef = parsedItems.length > 0 ? parsedItems[0].reference : 'REF-GENERAL';

    if (editingOrderId) {
      db.transact(
        tx.orders[editingOrderId].update({
          otNumber: formOtNum.trim(),
          customerName: selectedClient === 'all' ? 'Lier 213' : selectedClient,
          project: formProyecto.trim() || 'General',
          engineerInCharge: formIngeniero.trim() || 'Sin asignar',
          destinoFabricacion: formDestino,
          counterpieceType: formTipoContrapieza,
          carpetaURL: formCarpetaURL.trim(),
          dueDate: calculatedDueDate,
          fechaEntrega: formFechaEntrega || new Date(calculatedDueDate).toISOString(),
          itemName: firstItemName,
          itemReference: firstRef,
          quantity: parsedItems.length || 1,
          updatedAt: Date.now(),
          itemsJson: finalItemsJson,
        })
      );
      setEditingOrderId(null);
      showToast('✓ Orden actualizada en InstantDB');
    } else {
      // Check if an existing active order with the same OT Number and Customer already exists
      const currentCustomerName = selectedClient === 'all' ? 'Lier 213' : selectedClient;
      const existingOrder = orders.find(
        (o) =>
          o.status === 'activa' &&
          o.otNumber.trim().toLowerCase() === formOtNum.trim().toLowerCase() &&
          o.customerName.trim().toLowerCase() === currentCustomerName.trim().toLowerCase()
      );

      if (existingOrder) {
        let existingItems: OrderItem[] = [];
        if (existingOrder.itemsJson) {
          try {
            existingItems = JSON.parse(existingOrder.itemsJson);
          } catch {
            existingItems = [];
          }
        }
        const mergedItems = [...existingItems, ...parsedItems];
        db.transact(
          tx.orders[existingOrder.id].update({
            itemsJson: JSON.stringify(mergedItems),
            quantity: mergedItems.length,
            updatedAt: Date.now(),
            fechaEntrega: formFechaEntrega || existingOrder.fechaEntrega,
          })
        );
        showToast(`✓ Componentes agregados a la OT ${formOtNum.trim()} en InstantDB`);
      } else {
        const newId = id();
        db.transact(
          tx.orders[newId].update({
            otNumber: formOtNum.trim(),
            customerName: currentCustomerName,
            project: formProyecto.trim() || 'General',
            engineerInCharge: formIngeniero.trim() || 'Sin asignar',
            destinoFabricacion: formDestino,
            counterpieceType: formTipoContrapieza,
            carpetaURL: formCarpetaURL.trim(),
            dueDate: calculatedDueDate,
            fechaEntrega: formFechaEntrega || new Date(calculatedDueDate).toISOString(),
            itemName: firstItemName,
            itemReference: firstRef,
            quantity: parsedItems.length || 1,
            status: 'activa',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            creadoPor: currentUser || (selectedUserFilter === 'all' ? 'Gladys' : selectedUserFilter),
            itemsJson: finalItemsJson,
            comentariosJson: JSON.stringify([]),
          })
        );
        showToast(`✓ Orden ${formOtNum.trim()} guardada en InstantDB`);
      }
    }

    // Reset Form
    setFormOtNum('');
    setFormProyecto('');
    setFormIngeniero('');
    setFormCarpetaURL('');
    setFormFechaEntrega('');
    setFormBulkReferencias('');
    setFormBulkTipos('');
    setFormBulkOTE(1);
  };

  const handleEditOrderClick = (order: Order) => {
    setEditingOrderId(order.id);
    setFormOtNum(order.otNumber || '');
    setFormProyecto(order.project || '');
    setFormIngeniero(order.engineerInCharge || '');
    setFormDestino((order.destinoFabricacion as DestinoFabricacion) || 'HN');
    setFormTipoContrapieza(order.counterpieceType || pieceTypes[0]);
    setFormCarpetaURL(order.carpetaURL || '');
    if (order.fechaEntrega) {
      setFormFechaEntrega(order.fechaEntrega.slice(0, 16));
    } else if (order.dueDate) {
      setFormFechaEntrega(new Date(order.dueDate).toISOString().slice(0, 16));
    }
    setActiveSubTab('mis_ordenes');
    setIsSidebarOpen(true);
  };

  const handleCloseOrder = (orderId: string) => {
    db.transact(
      tx.orders[orderId].update({
        status: 'finalizada',
        updatedAt: Date.now(),
      })
    );
    showToast('✓ Orden finalizada en InstantDB');
  };

  const handleDeleteOrder = (orderId: string) => {
    db.transact(tx.orders[orderId].delete());
    setDeleteConfirmId(null);
    showToast('✓ Orden eliminada de InstantDB');
  };

  // Add Comment to Order
  const handleAddCardComment = (order: Order) => {
    const text = cardCommentText[order.id]?.trim();
    const img = cardCommentImage[order.id];
    if (!text && !img) return;

    let currentComments: OrderComment[] = [];
    if (order.comentariosJson) {
      try {
        currentComments = JSON.parse(order.comentariosJson);
      } catch {
        currentComments = [];
      }
    }

    const newComment: OrderComment = {
      autor: currentUser || (selectedUserFilter === 'all' ? 'Gladys' : selectedUserFilter),
      texto: text || 'Imagen adjunta',
      fecha: new Date().toISOString(),
      imagen: img,
    };

    const updated = [...currentComments, newComment];
    db.transact(
      tx.orders[order.id].update({
        comentariosJson: JSON.stringify(updated),
        updatedAt: Date.now(),
      })
    );

    setCardCommentText({ ...cardCommentText, [order.id]: '' });
    setCardCommentImage({ ...cardCommentImage, [order.id]: '' });
    showToast('✓ Comentario publicado en InstantDB');
  };

  // Add Global Comment
  const handleSaveGlobalComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalCommentSelectedOrder) {
      alert('Por favor busque y seleccione una orden.');
      return;
    }
    if (!globalCommentText.trim() && !globalCommentImage) {
      alert('Escriba el contenido del comentario.');
      return;
    }

    let currentComments: OrderComment[] = [];
    if (globalCommentSelectedOrder.comentariosJson) {
      try {
        currentComments = JSON.parse(globalCommentSelectedOrder.comentariosJson);
      } catch {
        currentComments = [];
      }
    }

    const newComment: OrderComment = {
      autor: currentUser || (selectedUserFilter === 'all' ? 'Gladys' : selectedUserFilter),
      texto: globalCommentText.trim() || 'Imagen adjunta',
      fecha: new Date().toISOString(),
      referencia: globalCommentRef.trim() || undefined,
      item: globalCommentItem.trim() || undefined,
      imagen: globalCommentImage || undefined,
    };

    const updated = [...currentComments, newComment];
    db.transact(
      tx.orders[globalCommentSelectedOrder.id].update({
        comentariosJson: JSON.stringify(updated),
        updatedAt: Date.now(),
      })
    );

    // Reset Global Comment Form
    setGlobalCommentSelectedOrder(null);
    setGlobalCommentOrderQuery('');
    setGlobalCommentRef('');
    setGlobalCommentItem('');
    setGlobalCommentText('');
    setGlobalCommentImage(null);
    showToast('✓ Comentario guardado en InstantDB');
  };

  // Image Upload Handler helper
  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round(h * (maxDim / w));
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round(w * (maxDim / h));
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Print Active Orders Summary List
  const handlePrintActiveOrdersSummary = () => {
    const list = activeOrdersList;
    if (list.length === 0) {
      alert('No hay órdenes activas que coincidan con los filtros para imprimir.');
      return;
    }

    const rows = list
      .map(
        (o) => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold;">${o.otNumber}</td>
        <td style="border: 1px solid #ccc; padding: 6px 10px;">${o.customerName}</td>
        <td style="border: 1px solid #ccc; padding: 6px 10px;">${o.project || 'General'}</td>
        <td style="border: 1px solid #ccc; padding: 6px 10px;">${
          o.fechaEntrega ? new Date(o.fechaEntrega).toLocaleString('es-NI') : 'Sin fecha'
        }</td>
        <td style="border: 1px solid #ccc; padding: 6px 10px; text-align: center;">${o.quantity || 1}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Órdenes Activas — MecaPro</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
            th { background: #f1f5f9; border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>MecaPro Industrial — Listado de Órdenes Activas</h1>
          <p>Cliente: ${filterClienteActivas} | Impreso el ${new Date().toLocaleString('es-NI')}</p>
          <table>
            <thead>
              <tr>
                <th>Código OT</th>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th>Fecha de Entrega</th>
                <th>Ítems</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  };

  // Render Order Card Helper
  const renderOrderCard = (order: Order) => {
    let parsedItems: OrderItem[] = [];
    if (order.itemsJson) {
      try {
        parsedItems = JSON.parse(order.itemsJson);
      } catch {
        parsedItems = [];
      }
    }

    if (parsedItems.length === 0) {
      parsedItems = [
        {
          id: '1',
          reference: order.itemReference || 'REF-GENERAL',
          itemName: order.itemName || 'Pieza Mecanizada',
          quantity: order.quantity || 1,
          pieceType: order.counterpieceType || 'Pull',
          ots: [
            {
              otNum: 1,
              fechaEnvio: order.fechaEntrega || (order.dueDate ? new Date(order.dueDate).toISOString() : new Date().toISOString()),
              status: 'activa',
            },
          ],
        },
      ];
    }

    let parsedComments: OrderComment[] = [];
    if (order.comentariosJson) {
      try {
        parsedComments = JSON.parse(order.comentariosJson);
      } catch {
        parsedComments = [];
      }
    }

    const isOverdue = order.dueDate && Date.now() > order.dueDate && order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'finalizada';

    return (
      <div
        key={order.id}
        className={`bg-white rounded-2xl border transition-all shadow-xs p-5 relative overflow-hidden group space-y-4 ${
          isOverdue ? 'border-rose-400 ring-2 ring-rose-500/20' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono font-bold">
                <Hash className="w-3.5 h-3.5" />
                <span>{order.otNumber}</span>
                <span className="text-base leading-none">{getFlagEmoji(order.destinoFabricacion)}</span>
              </span>

              {order.project && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>{order.project}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold uppercase">
                <Layers className="w-3 h-3 text-amber-600" />
                <span>{order.counterpieceType || 'Pull'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium pt-1">
              Cliente: <strong className="text-slate-900 font-bold">{order.customerName}</strong> | Ing:{' '}
              <strong className="text-slate-800">{order.engineerInCharge || 'Sin asignar'}</strong> | Creado por:{' '}
              <strong className="text-indigo-700">{order.creadoPor || 'Gladys'}</strong>
            </p>
          </div>

          <OrderTimer createdAt={order.createdAt} status={order.status} dueDate={order.dueDate} />
        </div>

        {/* Due Date & Action Links Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Calendar className={`w-4 h-4 ${isOverdue ? 'text-rose-600' : 'text-indigo-600'}`} />
            <span>
              Entrega: <strong>{order.fechaEntrega ? new Date(order.fechaEntrega).toLocaleString('es-NI') : 'Sin fecha'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {order.carpetaURL && (
              <button
                type="button"
                onClick={() => {
                  const url = order.carpetaURL.trim();
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    window.open(url, '_blank');
                  } else {
                    navigator.clipboard.writeText(url);
                    showToast('📁 Ruta de carpeta copiada al portapapeles');
                  }
                }}
                className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                title={order.carpetaURL}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{order.carpetaURL.startsWith('http') ? 'Abrir Enlace' : 'Copiar Ruta Carpeta'}</span>
              </button>
            )}

            <button
              onClick={() => handleEditOrderClick(order)}
              className="inline-flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => setPrintingOrder(order)}
              className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Imprimir Hoja de OT"
            >
              <Printer className="w-4 h-4" />
            </button>

            {order.status !== 'finalizada' && order.status !== 'completed' && order.status !== 'delivered' && (
              <button
                onClick={() => handleCloseOrder(order.id)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar Orden
              </button>
            )}

            <button
              onClick={() => setDeleteConfirmId(order.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar orden"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Components & OTs Section */}
        {(() => {
          const isLargeOrder = parsedItems.length > 3;
          const isExpanded = expandedOrders[order.id] ?? !isLargeOrder;

          // Group items by OT number
          const groups: Record<string, { otNum: string; items: Array<{ item: OrderItem; originalIdx: number }> }> = {};
          
          parsedItems.forEach((it, idx) => {
            const otNum = (it.ots && it.ots.length > 0 && it.ots[0].otNum) ? `OT ${it.ots[0].otNum}` : `OT General`;
            if (!groups[otNum]) {
              groups[otNum] = { otNum, items: [] };
            }
            groups[otNum].items.push({ item: it, originalIdx: idx });
          });

          const groupKeys = Object.keys(groups);

          return (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-xs">
              {/* Header Bar */}
              <div
                onClick={() => toggleOrderExpanded(order.id)}
                className="bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={`w-4 h-4 text-indigo-600 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Componentes & OTs ({parsedItems.length} ítems)
                  </span>
                  {groupKeys.length > 1 && (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      {groupKeys.length} grupos OT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    {isExpanded ? '▼ Colapsar lista' : '▶ Desplegar ítems'}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-2 space-y-2 bg-white">
                  {groupKeys.map((gKey) => {
                    const group = groups[gKey];
                    const otGroupKey = `${order.id}-${gKey}`;
                    const isOtExpanded = expandedOtGroups[otGroupKey] !== false;

                    return (
                      <div key={gKey} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {/* Sub OT Header */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOtGroupExpanded(otGroupKey);
                          }}
                          className="bg-slate-50 hover:bg-slate-100/80 px-3 py-2 flex items-center justify-between cursor-pointer border-b border-slate-100 text-xs font-bold text-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600 text-xs font-mono font-bold">
                              {isOtExpanded ? '▼' : '▶'}
                            </span>
                            <span className="font-mono text-indigo-900 font-extrabold">{group.otNum}</span>
                            <span className="text-slate-400 font-normal">({group.items.length} componentes)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">Doble clic en fila para cambiar estado</span>
                        </div>

                        {/* Sub Table */}
                        {isOtExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50/60 text-slate-400 border-b border-slate-100 font-bold text-[10px] uppercase">
                                  <th className="py-1.5 px-3 w-8 text-center">N°</th>
                                  <th className="py-1.5 px-3">Referencia</th>
                                  <th className="py-1.5 px-3">Tipo / Especificación</th>
                                  <th className="py-1.5 px-3">Fecha Envío</th>
                                  <th className="py-1.5 px-3 text-center">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.items.map(({ item: it, originalIdx }) => {
                                  const isClosed = it.notes === 'completado' || (it as any).isClosed;

                                  return (
                                    <tr
                                      key={originalIdx}
                                      onDoubleClick={() => handleToggleItemStatus(order, originalIdx)}
                                      className={`cursor-pointer transition-colors ${
                                        isClosed ? 'bg-rose-50/70 text-rose-800 line-through' : 'hover:bg-slate-50 text-slate-800'
                                      }`}
                                    >
                                      <td className="py-2 px-3 text-center font-mono text-slate-400 font-semibold">
                                        {originalIdx + 1}
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-indigo-900 flex items-center gap-1.5">
                                        <span>{it.reference}</span>
                                        <span className="text-sm">{getFlagEmoji(order.destinoFabricacion)}</span>
                                      </td>
                                      <td className="py-2 px-3 font-medium">
                                        {it.pieceType || it.itemName || 'Pieza'}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                        {it.ots && it.ots.length > 0 && it.ots[0].fechaEnvio
                                          ? new Date(it.ots[0].fechaEnvio).toLocaleString('es-NI', {
                                              dateStyle: 'short',
                                              timeStyle: 'short',
                                            })
                                          : order.fechaEntrega
                                          ? new Date(order.fechaEntrega).toLocaleDateString('es-NI')
                                          : 'Sin fecha'}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleItemStatus(order, originalIdx);
                                          }}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                            isClosed
                                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                          }`}
                                        >
                                          {isClosed ? 'Completado' : 'Pendiente'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Comments Feed inside Card */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Comentarios ({parsedComments.length})</span>
            </span>
          </div>

          {parsedComments.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {parsedComments.map((c, cIdx) => (
                <div key={cIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-700">{c.autor}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(c.fecha).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {c.referencia && (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] font-bold rounded">
                      Ref: {c.referencia}
                    </span>
                  )}
                  <p className="text-slate-800 whitespace-pre-wrap">{c.texto}</p>
                  {c.imagen && (
                    <img
                      src={c.imagen}
                      alt="Adjunto"
                      className="max-h-24 rounded-lg border border-slate-200 cursor-pointer object-cover mt-1"
                      onClick={() => window.open(c.imagen, '_blank')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Comment Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={cardCommentText[order.id] || ''}
              onChange={(e) => setCardCommentText({ ...cardCommentText, [order.id]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCardComment(order)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <label className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer" title="Adjuntar foto">
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f, (b64) => setCardCommentImage({ ...cardCommentImage, [order.id]: b64 }));
                }}
              />
            </label>

            <button
              onClick={() => handleAddCardComment(order)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Delete Confirm Overlay */}
        {deleteConfirmId === order.id && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs p-4 flex flex-col items-center justify-center text-center z-10">
            <Trash2 className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs text-white font-bold">¿Eliminar orden {order.otNumber}?</p>
            <p className="text-[11px] text-slate-300 mt-1 mb-3">Esta acción borrará la orden de la base de datos.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteOrder(order.id)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navbar Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white p-3 sm:px-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 font-black text-lg tracking-tight">
          <Wrench className="w-6 h-6 text-indigo-400" />
          <span className="uppercase">EMDEP</span>
          <span className="text-xs font-normal text-indigo-300 hidden md:inline">• Sistema Multicliente Avanzado</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { id: 'activas', label: 'Órdenes Activas' },
            { id: 'mis_ordenes', label: 'Mis Órdenes' },
            { id: 'buscador', label: 'Buscador Inteligente' },
            { id: 'finalizadas', label: 'Historial Cerrado' },
            { id: 'comentarios', label: '💬 Comentarios' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master Client Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Master Client Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Trabajando con el Cliente:
            </span>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3.5 py-2 bg-indigo-50 border-2 border-indigo-600 rounded-xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">— Todos los clientes —</option>
              {allClients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsAddingClientModal(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded-xl font-bold text-sm cursor-pointer"
              title="Agregar nuevo cliente"
            >
              +
            </button>
          </div>

          {/* Person / User Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Ver órdenes de:</span>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">— Todas las personas —</option>
              {allOrderUsers
                .filter((u) => u !== 'all')
                .map((u) => (
                  <option key={u} value={u}>
                    👤 {u}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Manufacturing KPI Stats Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
              <span>🇭🇳 HN:</span>
              <span className="text-sm">{stats.hn} ítems</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
              <span>🇳🇮 NI:</span>
              <span className="text-sm">{stats.ni} ítems</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold">
              <span>🇪🇸 ES:</span>
              <span className="text-sm">{stats.es} ítems</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold">
              <Package className="w-4 h-4 text-indigo-400" />
              <span>
                Total: {stats.totalOrders} Órdenes ({stats.totalItems} Módulos)
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsManagingTypesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Gestionar Tipos de Pieza</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Órdenes Activas */}
      {activeSubTab === 'activas' && (
        <div className="space-y-4">
          {/* Active Orders Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-600">Filtro Cliente:</span>
              <select
                value={filterClienteActivas}
                onChange={(e) => setFilterClienteActivas(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="all">— Todos los clientes —</option>
                {allClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Buscar por proyecto..."
                value={filterProyectoActivas}
                onChange={(e) => setFilterProyectoActivas(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 w-44"
              />

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Semana:</span>
                <input
                  type="date"
                  value={filterFechaActivas}
                  onChange={(e) => setFilterFechaActivas(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer"
                />
                {filterFechaActivas && (
                  <button
                    onClick={() => setFilterFechaActivas('')}
                    className="text-[11px] text-rose-600 font-bold underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handlePrintActiveOrdersSummary}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Lista</span>
            </button>
          </div>

          {filterFechaActivas && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-semibold flex items-center justify-between">
              <span>📅 Mostrando órdenes que vencen en la semana: {getWeekRangeString(filterFechaActivas)}</span>
              <button onClick={() => setFilterFechaActivas('')} className="text-rose-600 underline font-bold cursor-pointer">
                Quitar filtro semana
              </button>
            </div>
          )}

          {/* Cards Grid */}
          {activeOrdersList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-xs text-slate-500">No hay órdenes activas registradas con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrdersList.map((order) => renderOrderCard(order))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Mis Órdenes (Collapsible Sidebar Form + Cards) */}
      {activeSubTab === 'mis_ordenes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Sidebar */}
          <div className={`${isSidebarOpen ? 'lg:col-span-5' : 'lg:col-span-1'} transition-all`}>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>{editingOrderId ? 'Editar Orden' : 'Registrar Nueva Orden'}</span>
                </h3>

                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Ocultar/Mostrar Formulario"
                >
                  {isSidebarOpen ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {isSidebarOpen && (
                <form onSubmit={handleSaveOrderForm} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Código / Número de Orden *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 2026 HN-3035"
                      value={formOtNum}
                      onChange={(e) => setFormOtNum(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Proyecto / Modelo</label>
                      <input
                        type="text"
                        placeholder="Ej: P708"
                        value={formProyecto}
                        onChange={(e) => setFormProyecto(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Ingeniero Asignado</label>
                      <input
                        type="text"
                        placeholder="Ej: Rolvin"
                        value={formIngeniero}
                        onChange={(e) => setFormIngeniero(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Destino Fabricación</label>
                      <select
                        value={formDestino}
                        onChange={(e) => setFormDestino(e.target.value as DestinoFabricacion)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      >
                        <option value="HN">🇭🇳 HN</option>
                        <option value="NI">🇳🇮 NI</option>
                        <option value="ES">🇪🇸 ES</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipo de Contra-pieza</label>
                      <select
                        value={formTipoContrapieza}
                        onChange={(e) => setFormTipoContrapieza(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                      >
                        {pieceTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Ruta o Enlace de Carpeta (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: C:\Proyectos\P708 o enlace web/OneDrive"
                      value={formCarpetaURL}
                      onChange={(e) => setFormCarpetaURL(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Fecha y Hora Límite de Entrega</label>
                    <input
                      type="datetime-local"
                      value={formFechaEntrega}
                      onChange={(e) => setFormFechaEntrega(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                      Carga Rápida de Componentes + OT
                    </span>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Referencias (Una por línea)</label>
                      <textarea
                        rows={3}
                        placeholder={`REF-01\nREF-02`}
                        value={formBulkReferencias}
                        onChange={(e) => setFormBulkReferencias(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Especificación / Tipo (Una por línea)</label>
                      <textarea
                        rows={2}
                        placeholder={`Especificación 1\nEspecificación 2`}
                        value={formBulkTipos}
                        onChange={(e) => setFormBulkTipos(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Número OT</label>
                      <input
                        type="number"
                        min={1}
                        value={formBulkOTE}
                        onChange={(e) => setFormBulkOTE(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer mt-2"
                  >
                    {editingOrderId ? 'Guardar Cambios' : 'Guardar Orden Completa'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Orders Cards Feed */}
          <div className={`${isSidebarOpen ? 'lg:col-span-7' : 'lg:col-span-11'} space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                Órdenes de {selectedUserFilter === 'all' ? 'Todas las personas' : selectedUserFilter} ({misOrdenesList.length})
              </h3>
            </div>

            {misOrdenesList.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No hay órdenes registradas para la persona o cliente seleccionado.
              </div>
            ) : (
              <div className="space-y-4">{misOrdenesList.map((order) => renderOrderCard(order))}</div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Buscador Inteligente */}
      {activeSubTab === 'buscador' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Busca referencias, órdenes, clientes, personas, destinos (HN/NI/ES) o comentarios en TODA la base..."
                value={intelliSearchQuery}
                onChange={(e) => setIntelliSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {intelliSearchQuery.trim() === '' ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              Escriba una referencia o código para buscar en toda la base de datos...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders
                .filter((o) => {
                  const q = intelliSearchQuery.toLowerCase();
                  return (
                    o.otNumber.toLowerCase().includes(q) ||
                    o.customerName.toLowerCase().includes(q) ||
                    (o.project && o.project.toLowerCase().includes(q)) ||
                    (o.engineerInCharge && o.engineerInCharge.toLowerCase().includes(q)) ||
                    (o.creadoPor && o.creadoPor.toLowerCase().includes(q)) ||
                    (o.itemsJson && o.itemsJson.toLowerCase().includes(q)) ||
                    (o.comentariosJson && o.comentariosJson.toLowerCase().includes(q))
                  );
                })
                .map((order) => renderOrderCard(order))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: Historial Cerrado */}
      {activeSubTab === 'finalizadas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Historial de Órdenes Finalizadas ({historialCerradoList.length})</h3>
          </div>

          {historialCerradoList.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No hay órdenes cerradas en el historial.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{historialCerradoList.map((order) => renderOrderCard(order))}</div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: 💬 Comentarios Feed */}
      {activeSubTab === 'comentarios' && (
        <div className="space-y-6">
          {/* Post Global Comment Form */}
          <form onSubmit={handleSaveGlobalComment} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Publicar un comentario o duda</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">1. Buscar Orden</label>
                <input
                  type="text"
                  placeholder="Escriba código OT o cliente..."
                  value={globalCommentOrderQuery}
                  onChange={(e) => setGlobalCommentOrderQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />

                {globalCommentOrderQuery && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto text-xs divide-y">
                    {orders
                      .filter(
                        (o) =>
                          o.otNumber.toLowerCase().includes(globalCommentOrderQuery.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(globalCommentOrderQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setGlobalCommentSelectedOrder(o);
                            setGlobalCommentOrderQuery(`${o.otNumber} — ${o.customerName}`);
                          }}
                          className="p-2 hover:bg-indigo-50 cursor-pointer font-medium text-slate-800"
                        >
                          {o.otNumber} — {o.customerName} ({o.project || 'General'})
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Referencia (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: REF-08"
                  value={globalCommentRef}
                  onChange={(e) => setGlobalCommentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Ítem (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Ítem 3"
                  value={globalCommentItem}
                  onChange={(e) => setGlobalCommentItem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Comentario — Qué encontraste o tu duda</label>
              <textarea
                rows={2}
                placeholder="Describe el hallazgo o percance..."
                value={globalCommentText}
                onChange={(e) => setGlobalCommentText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
                <Paperclip className="w-4 h-4" />
                <span>{globalCommentImage ? 'Imagen adjuntada ✓' : 'Adjuntar Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f, (b64) => setGlobalCommentImage(b64));
                  }}
                />
              </label>

              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                Publicar Comentario
              </button>
            </div>
          </form>

          {/* Comments History Feed */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Historial General de Comentarios</h3>
              <input
                type="text"
                placeholder="Filtrar por referencia, orden, autor..."
                value={globalCommentFilter}
                onChange={(e) => setGlobalCommentFilter(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs w-56"
              />
            </div>

            <div className="space-y-3">
              {orders
                .flatMap((o) => {
                  let cList: OrderComment[] = [];
                  if (o.comentariosJson) {
                    try {
                      cList = JSON.parse(o.comentariosJson);
                    } catch {
                      cList = [];
                    }
                  }
                  return cList.map((c) => ({ order: o, comment: c }));
                })
                .filter(({ order, comment }) => {
                  if (!globalCommentFilter) return true;
                  const q = globalCommentFilter.toLowerCase();
                  return (
                    order.otNumber.toLowerCase().includes(q) ||
                    comment.autor.toLowerCase().includes(q) ||
                    comment.texto.toLowerCase().includes(q) ||
                    (comment.referencia && comment.referencia.toLowerCase().includes(q))
                  );
                })
                .sort((a, b) => new Date(b.comment.fecha).getTime() - new Date(a.comment.fecha).getTime())
                .map(({ order, comment }, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="text-indigo-600">
                        Orden {order.otNumber} ({order.customerName}) — {comment.autor}
                      </span>
                      <span className="text-slate-400 font-normal text-[10px]">
                        {new Date(comment.fecha).toLocaleString('es-NI')}
                      </span>
                    </div>
                    {comment.referencia && (
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] font-bold rounded">
                        Ref: {comment.referencia}
                      </span>
                    )}
                    <p className="text-slate-800 whitespace-pre-wrap">{comment.texto}</p>
                    {comment.imagen && (
                      <img
                        src={comment.imagen}
                        alt="Adjunto"
                        className="max-h-32 rounded-lg border border-slate-200 object-cover cursor-pointer mt-1"
                        onClick={() => window.open(comment.imagen, '_blank')}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal to add new Client */}
      {isAddingClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Agregar Nuevo Cliente</h3>
            <input
              type="text"
              placeholder="Nombre del cliente..."
              value={newClientInput}
              onChange={(e) => setNewClientInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingClientModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (newClientInput.trim()) {
                    const newClientId = id();
                    db.transact(
                      tx.customers[newClientId].update({
                        name: newClientInput.trim(),
                        createdAt: Date.now(),
                      })
                    );
                    setAllClients(Array.from(new Set([...allClients, newClientInput.trim()])));
                    setSelectedClient(newClientInput.trim());
                    setNewClientInput('');
                    setIsAddingClientModal(false);
                    showToast('✓ Cliente guardado en InstantDB');
                  }
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to manage piece types */}
      {isManagingTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Gestionar Tipos de Pieza</h3>
              <button onClick={() => setIsManagingTypesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Pull, Neumática, Antena..."
                value={newTypeInput}
                onChange={(e) => setNewTypeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
              <button
                onClick={() => {
                  if (newTypeInput.trim() && !pieceTypes.includes(newTypeInput.trim())) {
                    setPieceTypes([...pieceTypes, newTypeInput.trim()]);
                    setNewTypeInput('');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                Agregar
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {pieceTypes.map((t) => (
                <div key={t} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-800">
                  <span>{t}</span>
                  {pieceTypes.length > 1 && (
                    <button
                      onClick={() => setPieceTypes(pieceTypes.filter((x) => x !== t))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setIsManagingTypesModal(false)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {printingOrder && <OrderPrintView order={printingOrder} onClose={() => setPrintingOrder(null)} />}

      {/* InstantDB Floating Sync Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 text-xs font-bold flex items-center gap-2.5 backdrop-blur-md animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
