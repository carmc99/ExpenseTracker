export type Rubro = 'needs' | 'leisure' | 'savings';

export type Frequency = 'monthly' | 'biweekly' | 'once';

export type ExpenseType = 'fixed' | 'variable';

export interface Category {
  id: string;
  name: string;
  rubro: Rubro;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: Frequency;
  createdAt: string;
}

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  type: ExpenseType;
  category: string;
  rubro: Rubro;
  date: string;
  period: string;
}

export interface RuleConfig {
  needs: number;
  leisure: number;
  savings: number;
}

export interface AppConfig {
  currency: string;
  rule: RuleConfig;
  categories: Category[];
}

export interface AppData {
  version: string;
  config: AppConfig;
  incomes: Income[];
  expenses: Expense[];
}

export type RuleStatus = 'ok' | 'warning' | 'over';

export interface PeriodData {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface RubroStatus {
  rubro: Rubro;
  spent: number;
  budget: number;
  percentage: number;
  status: RuleStatus;
}

export interface ProjectionParams {
  referenceMonths: 1 | 3 | 6 | 12;
  horizonMonths: 6 | 12 | 24;
  optimisticVariation: 'income_plus_10' | 'income_minus_10' | 'expense_plus_10' | 'expense_minus_10';
  pessimisticVariation: 'income_plus_10' | 'income_minus_10' | 'expense_plus_10' | 'expense_minus_10';
}

export interface ProjectionPoint {
  month: string;
  base: number;
  optimistic: number;
  pessimistic: number;
}