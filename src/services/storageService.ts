import type { AppData, Income, Expense, AppConfig, Category } from '../types';
import { generateId } from '../lib/utils';

const STORAGE_KEY = 'expense-tracker-data';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Arriendo / Hipoteca', rubro: 'needs' },
  { id: '2', name: 'Supermercado', rubro: 'needs' },
  { id: '3', name: 'Servicios', rubro: 'needs' },
  { id: '4', name: 'Salud', rubro: 'needs' },
  { id: '5', name: 'Transporte', rubro: 'needs' },
  { id: '6', name: 'Streaming', rubro: 'leisure' },
  { id: '7', name: 'Restaurantes', rubro: 'leisure' },
  { id: '8', name: 'Viajes', rubro: 'leisure' },
  { id: '9', name: 'Entretenimiento', rubro: 'leisure' },
  { id: '10', name: 'Inversiones', rubro: 'savings' },
  { id: '11', name: 'Ahorro', rubro: 'savings' },
];

const DEFAULT_CONFIG: AppConfig = {
  currency: 'COP',
  rule: {
    needs: 50,
    leisure: 30,
    savings: 20,
  },
  categories: DEFAULT_CATEGORIES,
};

const DEFAULT_DATA: AppData = {
  version: '1.0',
  config: DEFAULT_CONFIG,
  incomes: [],
  expenses: [],
};

function getInitialData(): AppData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as AppData;
      if (parsed.version && parsed.config && parsed.incomes !== undefined && parsed.expenses !== undefined) {
        return parsed;
      }
    } catch {
      console.error('Error parsing stored data, using defaults');
    }
  }
  return { ...DEFAULT_DATA };
}

function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const storageService = {
  getData(): AppData {
    return getInitialData();
  },

  exportData(): string {
    const data = getInitialData();
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): AppData {
    const parsed = JSON.parse(jsonString) as AppData;
    if (!parsed.version || !parsed.config || !parsed.incomes || !parsed.expenses) {
      throw new Error('Invalid data structure');
    }
    saveData(parsed);
    return parsed;
  },

  resetData(): AppData {
    const data = { ...DEFAULT_DATA };
    saveData(data);
    return data;
  },

  getConfig(): AppConfig {
    return getInitialData().config;
  },

  updateConfig(config: Partial<AppConfig>): AppConfig {
    const data = getInitialData();
    data.config = { ...data.config, ...config };
    saveData(data);
    return data.config;
  },

  getIncomes(): Income[] {
    return getInitialData().incomes;
  },

  addIncome(income: Omit<Income, 'id' | 'createdAt'>): Income {
    const data = getInitialData();
    const newIncome: Income = {
      ...income,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    data.incomes.push(newIncome);
    saveData(data);
    return newIncome;
  },

  updateIncome(id: string, updates: Partial<Income>): Income | null {
    const data = getInitialData();
    const index = data.incomes.findIndex((i) => i.id === id);
    if (index === -1) return null;
    data.incomes[index] = { ...data.incomes[index], ...updates };
    saveData(data);
    return data.incomes[index];
  },

  deleteIncome(id: string): boolean {
    const data = getInitialData();
    const index = data.incomes.findIndex((i) => i.id === id);
    if (index === -1) return false;
    data.incomes.splice(index, 1);
    saveData(data);
    return true;
  },

  getExpenses(): Expense[] {
    return getInitialData().expenses;
  },

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const data = getInitialData();
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
    };
    data.expenses.push(newExpense);
    saveData(data);
    return newExpense;
  },

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const data = getInitialData();
    const index = data.expenses.findIndex((e) => e.id === id);
    if (index === -1) return null;
    data.expenses[index] = { ...data.expenses[index], ...updates };
    saveData(data);
    return data.expenses[index];
  },

  deleteExpense(id: string): boolean {
    const data = getInitialData();
    const index = data.expenses.findIndex((e) => e.id === id);
    if (index === -1) return false;
    data.expenses.splice(index, 1);
    saveData(data);
    return true;
  },

  getExpensesByPeriod(period: string): Expense[] {
    return getInitialData().expenses.filter((e) => e.period === period);
  },

  getCategories(): Category[] {
    return getInitialData().config.categories;
  },

  addCategory(category: Omit<Category, 'id'>): Category {
    const data = getInitialData();
    const newCategory: Category = {
      ...category,
      id: generateId(),
    };
    data.config.categories.push(newCategory);
    saveData(data);
    return newCategory;
  },

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const data = getInitialData();
    const index = data.config.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    data.config.categories[index] = { ...data.config.categories[index], ...updates };
    saveData(data);
    return data.config.categories[index];
  },

  deleteCategory(id: string): boolean {
    const data = getInitialData();
    const index = data.config.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    data.config.categories.splice(index, 1);
    saveData(data);
    return true;
  },

};