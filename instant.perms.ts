import type { InstantRules } from "@instantdb/react";

/**
 * Permissions for InstantDB
 * Allows full allow read/create/update/delete permissions for orders, customers, inventory, sales, and users.
 */
const rules = {
  $default: {
    allow: {
      $default: "true",
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  orders: {
    allow: {
      $default: "true",
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  customers: {
    allow: {
      $default: "true",
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  inventory: {
    allow: {
      $default: "true",
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  sales: {
    allow: {
      $default: "true",
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  userAccounts: {
    allow: {
      $default: "true",
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
} satisfies InstantRules;

export default rules;
