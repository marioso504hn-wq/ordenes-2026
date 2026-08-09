export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'activa' | 'finalizada';

export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  password?: string;
  status: UserStatus;
  verificationCode?: string;
  createdAt: number;
  role?: 'admin' | 'user';
}

export type DestinoFabricacion = 'HN' | 'NI' | 'ES';

export interface OTSubItem {
  otNum: number;
  fechaEnvio?: string;
  status?: string;
}

export interface EMDEPItem {
  referencia: string;
  tipoPieza: string;
  ots?: OTSubItem[];
}

export interface CommentReply {
  autor: string;
  texto: string;
  fecha: string;
}

export interface OrderComment {
  autor: string;
  texto: string;
  fecha: string;
  referencia?: string;
  item?: string;
  imagen?: string;
  respuestas?: CommentReply[];
}

export interface OrderItem {
  id: string;
  reference: string;
  itemName?: string;
  quantity?: number;
  pieceType?: string;
  notes?: string;
  ots?: OTSubItem[];
}

export interface Order {
  id: string;
  customerName: string;
  otNumber: string; // Orden de Trabajo / Código
  project?: string; // Proyecto asociado
  itemName: string;
  quantity: number;
  itemReference: string;
  counterpieceType: string; // Tipo de pieza / contrapieza (Pull, Neumática, Antena, Puntera, etc.)
  engineerInCharge: string; // Ingeniero a cargo
  destinoFabricacion?: DestinoFabricacion | string; // HN, NI, ES
  carpetaURL?: string; // Enlace carpeta virtual OneDrive/Local
  creadoPor?: string; // Persona que registró la orden (Gladys, Rolvin, Mario, etc.)
  status: OrderStatus;
  createdAt: number;
  updatedAt?: number;
  dueDate?: number; // Fecha de Vencimiento (timestamp ms)
  fechaEntrega?: string; // ISO date string
  notes?: string;
  itemsJson?: string; // JSON string array of OrderItem[] or EMDEPItem[]
  comentariosJson?: string; // JSON string array of OrderComment[]
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  counterpieceType: string;
  reference: string;
  stockQuantity: number;
  minStock: number;
  unitPrice: number;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string; // NIT / RUC / RUT / DNI
  createdAt: number;
}

export interface CartItem {
  inventoryId: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  counterpieceType: string;
  reference: string;
}

export interface SaleTicketItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  ticketNumber: string;
  customerName: string;
  taxId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  createdAt: number;
  itemsJson: string; // Serialized SaleTicketItem[]
}

export type TabType = 'orders' | 'inventory' | 'pos' | 'sales_history' | 'customers';

export const DEFAULT_PIECE_TYPES = [
  'Pull',
  'Neumática',
  'Antena',
  'Puntera',
  'Molde de Inyección',
  'Matriz de Corte',
  'Buje de Bronce',
  'Rodillo Guía',
  'Placa de Desgaste',
  'Inserto de Acero',
  'Contrapieza Especial',
  'Servicio de Mecanizado',
  'Otro',
] as string[];

export const COUNTERPIECE_TYPES = DEFAULT_PIECE_TYPES;

export const DEFAULT_CUSTOMERS = [
  'Lier 213',
  'Lier 214',
  'Yasaki Nicaragua',
  'Yasaki Colombia',
  'Yasaki Guatemala',
  'Active',
];

