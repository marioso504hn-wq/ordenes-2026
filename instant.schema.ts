import { i } from "@instantdb/react";

/**
 * InstantDB Schema definition for the Order Management & POS system
 * Clean, type-safe entity definitions for InstantDB with flexible optional fields.
 */
const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    orders: i.entity({
      customerName: i.string().optional(),
      otNumber: i.string().optional(),
      project: i.string().optional(),
      itemName: i.string().optional(),
      quantity: i.number().optional(),
      itemReference: i.string().optional(),
      counterpieceType: i.string().optional(),
      engineerInCharge: i.string().optional(),
      status: i.string().optional(), // 'pending' | 'in_progress' | 'completed' | 'delivered' | 'activa' | 'finalizada'
      createdAt: i.number().optional(),
      updatedAt: i.number().optional(),
      dueDate: i.number().optional(),
      fechaEntrega: i.string().optional(),
      destinoFabricacion: i.string().optional(),
      carpetaURL: i.string().optional(),
      creadoPor: i.string().optional(),
      notes: i.string().optional(),
      itemsJson: i.string().optional(), // JSON string for batch items / references from Excel
      comentariosJson: i.string().optional(), // JSON string for order comments
    }),
    inventory: i.entity({
      code: i.string().optional(),
      name: i.string().optional(),
      counterpieceType: i.string().optional(),
      reference: i.string().optional(),
      stockQuantity: i.number().optional(),
      minStock: i.number().optional(),
      unitPrice: i.number().optional(),
      createdAt: i.number().optional(),
    }),
    customers: i.entity({
      name: i.string().optional(),
      email: i.string().optional(),
      phone: i.string().optional(),
      taxId: i.string().optional(),
      createdAt: i.number().optional(),
    }),
    sales: i.entity({
      ticketNumber: i.string().optional(),
      customerName: i.string().optional(),
      taxId: i.string().optional(),
      subtotal: i.number().optional(),
      taxAmount: i.number().optional(),
      totalAmount: i.number().optional(),
      paymentMethod: i.string().optional(),
      createdAt: i.number().optional(),
      itemsJson: i.string().optional(), // JSON string of sold items
    }),
    userAccounts: i.entity({
      name: i.string().optional(),
      email: i.string().optional(),
      password: i.string().optional(),
      status: i.string().optional(), // 'approved' | 'pending' | 'rejected'
      verificationCode: i.string().optional(),
      createdAt: i.number().optional(),
      role: i.string().optional(), // 'admin' | 'user'
    }),
  },
});

export type Schema = typeof _schema;
export default _schema;
