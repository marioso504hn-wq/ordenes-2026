import type { InstantRules } from "@instantdb/react";

/**
 * InstantDB Permissions definition
 * Configures security rules for entities.
 */
const rules = {
  $users: {
    allow: {
      $default: "true",
    },
  },
  orders: {
    allow: {
      $default: "true",
    },
  },
  inventory: {
    allow: {
      $default: "true",
    },
  },
  customers: {
    allow: {
      $default: "true",
    },
  },
  sales: {
    allow: {
      $default: "true",
    },
  },
} satisfies InstantRules;

export default rules;
