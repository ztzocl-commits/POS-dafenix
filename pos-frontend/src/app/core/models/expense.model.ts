export type ExpenseCategory = 'SUPPLIER_PAYMENT' | 'TEA' | 'BUS_FARE' | 'TEMP_WORKER' | 'SALARY' | 'OTHER';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  supplier?: { id: number; name: string; balance: number };
  salesperson?: { id: number; name: string };
  expenseDate: string;
  createdAt: string;
}

export interface ExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  note?: string;
  supplierId?: number;
  salespersonId?: number;
  expenseDate?: string;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  SUPPLIER_PAYMENT: 'Pago a proveedor',
  TEA: 'Té',
  BUS_FARE: 'Pasaje',
  TEMP_WORKER: 'Empleado temporal',
  SALARY: 'Salario',
  OTHER: 'Otro',
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  SUPPLIER_PAYMENT: 'local_shipping',
  TEA: 'local_cafe',
  BUS_FARE: 'directions_bus',
  TEMP_WORKER: 'engineering',
  SALARY: 'payments',
  OTHER: 'receipt',
};
