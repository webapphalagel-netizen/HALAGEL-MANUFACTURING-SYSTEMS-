
import { User, ProductionEntry, OffDay } from './types';
import { getTodayISO, getDbTimestamp } from './utils/dateUtils';

export const CATEGORIES = ['Healthcare', 'Toothpaste', 'Rocksalt', 'Cosmetic'] as const;
export const PROCESSES = ['Mixing', 'Encapsulation', 'Filling', 'Sorting', 'Packing'] as const;
export const UNITS = ['KG', 'PCS', 'CARTON'] as const;

// High-quality SVG Cartoon Avatars
export const DEFAULT_AVATARS = {
  MAN: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E0E7FF'/%3E%3Cpath d='M50 25c-15 0-20 10-20 20 0 15 5 25 20 25s20-10 20-25c0-10-5-20-20-20z' fill='%23FFDBAC'/%3E%3Cpath d='M30 45c0-10 5-20 20-20s20 10 20 20l-5-5c-5-5-10-5-15-5s-10 0-15 5l-5 5z' fill='%234B2C20'/%3E%3Ccircle cx='40' cy='48' r='2' fill='%23333'/%3E%3Ccircle cx='60' cy='48' r='2' fill='%23333'/%3E%3Cpath d='M45 58s2 3 5 3 5-3 5-3' stroke='%23333' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M25 90c5-10 15-15 25-15s20 5 25 15l-50 0z' fill='%234F46E5'/%3E%3C/svg%3E`,
  WOMAN_HIJAB: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23FDF2F8'/%3E%3Cpath d='M50 22c-15 0-22 10-22 25 0 18 8 28 22 28s22-10 22-28c0-15-7-25-22-25z' fill='%23FFDBAC'/%3E%3Cpath d='M50 15c-20 0-30 15-30 35 0 25 15 40 30 40s30-15 30-40c0-20-10-35-30-35z' fill='%23818CF8' opacity='0.9'/%3E%3Cpath d='M50 22c-12 0-16 8-16 18 0 10 4 15 16 15s16-5 16-15c0-10-4-18-16-18z' fill='%23FFDBAC'/%3E%3Ccircle cx='43' cy='35' r='2' fill='%23333'/%3E%3Ccircle cx='57' cy='35' r='2' fill='%23333'/%3E%3Cpath d='M46 45s1.5 2 4 2 4-2 4-2' stroke='%23333' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M20 90c5-15 15-20 30-20s25 5 30 20H20z' fill='%23F472B6'/%3E%3C/svg%3E`
};

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin User', username: 'admin', email: 'admin@halagel.com', role: 'admin', password: 'password123', avatar: DEFAULT_AVATARS.MAN },
  { id: 'u2', name: 'Healthcare Manager', username: 'manager', email: 'manager@halagel.com', role: 'manager', category: 'Healthcare', password: 'password123', avatar: DEFAULT_AVATARS.WOMAN_HIJAB },
  { id: 'u3', name: 'Planner Staff', username: 'planner', email: 'planner@halagel.com', role: 'planner', category: 'Toothpaste', password: 'password123' },
  { id: 'u4', name: 'Operator Healthcare', username: 'operator', email: 'op.health@halagel.com', role: 'operator', category: 'Healthcare', password: 'password123' },
  { id: 'u5', name: 'Operator Toothpaste', username: 'operator2', email: 'op.paste@halagel.com', role: 'operator', category: 'Toothpaste', password: 'password123' },
];

export const INITIAL_OFF_DAYS: OffDay[] = [
  { id: 'od1', date: '2025-12-25', description: 'Christmas Day', createdBy: 'u1' },
  { id: 'od2', date: '2026-01-01', description: 'New Year', createdBy: 'u1' },
];

export const generateSeedProductionData = (): ProductionEntry[] => {
  const data: ProductionEntry[] = [];
  const products = ['Pain Relief Gel', 'Minty Fresh', 'Pink Salt Fine', 'Vitamin C', 'Charcoal Paste', 'Herbal Shampoo', 'Skin Repair Cream'];
  
  const todayStr = getTodayISO();
  const [y, m, d] = todayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    products.forEach((prod, idx) => {
      if (Math.random() > 0.8) return;

      const plan = Math.floor(Math.random() * 500) + 500;
      const actual = Math.floor(plan * (0.8 + Math.random() * 0.2));

      data.push({
        id: `seed-${i}-${idx}`,
        date: dateStr,
        category: CATEGORIES[idx % CATEGORIES.length],
        process: PROCESSES[idx % PROCESSES.length],
        productName: prod,
        planQuantity: plan,
        actualQuantity: actual,
        unit: idx % 2 === 0 ? 'KG' : 'PCS',
        batchNo: `B-${dateStr.replace(/-/g, '')}-${idx}`,
        manpower: Math.floor(Math.random() * 5) + 3,
        lastUpdatedBy: 'u1',
        updatedAt: getDbTimestamp()
      });
    });
  }
  return data;
};
