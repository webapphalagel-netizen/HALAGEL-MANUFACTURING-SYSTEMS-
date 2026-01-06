
export type Role = 'admin' | 'manager' | 'planner' | 'operator';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  category?: Category; // Assigned department for operators/planners
  password?: string; // In a real app, never store plain text. Used here for simulation.
  avatar?: string;   // Base64 or SVG Data URI
}

export type Category = 'Healthcare' | 'Toothpaste' | 'Rocksalt' | 'Cosmetic';

export type ProcessType = 'Mixing' | 'Encapsulation' | 'Filling' | 'Sorting' | 'Packing';

export type UnitType = 'KG' | 'PCS' | 'CARTON';

export interface ProductionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: Category;
  process: ProcessType;
  productName: string;
  planQuantity: number;
  actualQuantity: number;
  unit: UnitType;
  batchNo?: string;
  manpower?: number;
  remark?: string;
  lastUpdatedBy: string;
  updatedAt: string;
}

export interface OffDay {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  totalPlan: number;
  totalActual: number;
  avgEfficiency: number;
  totalManpower: number;
}
