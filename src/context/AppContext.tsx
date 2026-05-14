import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppData, Income, Expense, AppConfig, Category } from '../types';
import { storageService } from '../services/storageService';

interface AppState extends AppData {
  isLoading: boolean;
}

type AppAction =
  | { type: 'LOAD_DATA'; payload: AppData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'ADD_INCOME'; payload: Income }
  | { type: 'UPDATE_INCOME'; payload: Income }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'RESET_DATA' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, action.payload] };
    case 'UPDATE_INCOME':
      return {
        ...state,
        incomes: state.incomes.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };
    case 'DELETE_INCOME':
      return { ...state, incomes: state.incomes.filter((i) => i.id !== action.payload) };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };
    case 'ADD_CATEGORY':
      return { ...state, config: { ...state.config, categories: [...state.config.categories, action.payload] } };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        config: {
          ...state.config,
          categories: state.config.categories.map((c) => (c.id === action.payload.id ? action.payload : c)),
        },
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        config: {
          ...state.config,
          categories: state.config.categories.filter((c) => c.id !== action.payload),
        },
      };
    case 'RESET_DATA':
      return {
        ...state,
        config: { currency: 'CLP', rule: { needs: 50, leisure: 30, savings: 20 }, categories: [] },
        incomes: [],
        expenses: [],
        isLoading: false,
      };
    default:
      return state;
  }
}

const initialState: AppState = {
  version: '1.0',
  config: { currency: 'CLP', rule: { needs: 50, leisure: 30, savings: 20 }, categories: [] },
  incomes: [],
  expenses: [],
  isLoading: true,
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  resetData: () => void;
  exportData: () => void;
  importData: (json: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const data = storageService.getData();
    dispatch({ type: 'LOAD_DATA', payload: data });
  }, []);

  const addIncome = (income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome = storageService.addIncome(income);
    dispatch({ type: 'ADD_INCOME', payload: newIncome });
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    const updated = storageService.updateIncome(id, updates);
    if (updated) dispatch({ type: 'UPDATE_INCOME', payload: updated });
  };

  const deleteIncome = (id: string) => {
    if (storageService.deleteIncome(id)) dispatch({ type: 'DELETE_INCOME', payload: id });
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = storageService.addExpense(expense);
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = storageService.updateExpense(id, updates);
    if (updated) dispatch({ type: 'UPDATE_EXPENSE', payload: updated });
  };

  const deleteExpense = (id: string) => {
    if (storageService.deleteExpense(id)) dispatch({ type: 'DELETE_EXPENSE', payload: id });
  };

  const updateConfig = (config: Partial<AppConfig>) => {
    const updated = storageService.updateConfig(config);
    dispatch({ type: 'SET_CONFIG', payload: updated });
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = storageService.addCategory(category);
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = storageService.updateCategory(id, updates);
    if (updated) dispatch({ type: 'UPDATE_CATEGORY', payload: updated });
  };

  const deleteCategory = (id: string) => {
    if (storageService.deleteCategory(id)) dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  const resetData = () => {
    storageService.resetData();
    dispatch({ type: 'RESET_DATA' });
  };

  const exportData = () => {
    const json = storageService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (json: string) => {
    try {
      const data = storageService.importData(json);
      dispatch({ type: 'LOAD_DATA', payload: data });
    } catch (error) {
      throw new Error('Invalid data format');
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        updateConfig,
        addCategory,
        updateCategory,
        deleteCategory,
        resetData,
        exportData,
        importData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}