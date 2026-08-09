import { i } from "@instantdb/react";

/**
 * InstantDB Schema definition for the Order Management & POS system
 * Clean, type-safe entity definitions for InstantDB.
 */
const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    orders: i.entity({
      customerName: i.string(),
      otNumber: i.string(),
      project: i.string(),
      itemName: i.string(),
      quantity: i.number(),
      itemReference: i.string(),
      counterpieceType: i.string(),
      engineerInCharge: i.string(),
      status: i.string(), // 'pending' | 'in_progress' | 'completed' | 'delivered' | 'activa' | 'finalizada'
      createdAt: i.number(),
      updatedAt: i.number(),
      dueDate: i.number(),
      fechaEntrega: i.string(),
      destinoFabricacion: i.string(),
      carpetaURL: i.string(),
      creadoPor: i.string(),
      notes: i.string(),
      itemsJson: i.string(), // JSON string for batch items / references from Excel
      comentariosJson: i.string(), // JSON string for order comments
    }),
    inventory: i.entity({
      code: i.string(),
      name: i.string(),
      counterpieceType: i.string(),
      reference: i.string(),
      stockQuantity: i.number(),
      minStock: i.number(),
      unitPrice: i.number(),
      createdAt: i.number(),
    }),
    customers: i.entity({
      name: i.string(),
      email: i.string(),
      phone: i.string(),
      taxId: i.string(),
      createdAt: i.number(),
    }),
    sales: i.entity({
      ticketNumber: i.string(),
      customerName: i.string(),
      taxId: i.string(),
      subtotal: i.number(),
      taxAmount: i.number(),
      totalAmount: i.number(),
      paymentMethod: i.string(),
      createdAt: i.number(),
      itemsJson: i.string(), // JSON string of sold items
    }),
  },
});

export type Schema = typeof _schema;
export default _schema;
