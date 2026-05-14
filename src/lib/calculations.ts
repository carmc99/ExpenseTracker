import type {
  Income,
  Expense,
  AppConfig,
  Rubro,
  RuleStatus,
  RubroStatus,
  ProjectionParams,
  ProjectionPoint,
} from '../types';

export function calculateMonthlyIncome(incomes: Income[]): number {
  return incomes.reduce((total, income) => {
    switch (income.frequency) {
      case 'monthly':
        return total + income.amount;
      case 'biweekly':
        return total + income.amount * 2;
      case 'once':
        return total + income.amount / 12;
      default:
        return total;
    }
  }, 0);
}

export function calculateBudgetByRubro(
  monthlyIncome: number,
  rule: AppConfig['rule']
): Record<Rubro, number> {
  return {
    needs: monthlyIncome * (rule.needs / 100),
    leisure: monthlyIncome * (rule.leisure / 100),
    savings: monthlyIncome * (rule.savings / 100),
  };
}

export function calculateSpentByRubro(expenses: Expense[]): Record<Rubro, number> {
  const spent: Record<Rubro, number> = {
    needs: 0,
    leisure: 0,
    savings: 0,
  };

  for (const expense of expenses) {
    spent[expense.rubro] += expense.amount;
  }

  return spent;
}

export function getRuleStatus(percentage: number): RuleStatus {
  if (percentage > 1) return 'over';
  if (percentage > 0.85) return 'warning';
  return 'ok';
}

export function calculateRubroStatus(
  spent: number,
  budget: number
): RubroStatus {
  const percentage = budget > 0 ? spent / budget : 0;
  return {
    rubro: 'needs',
    spent,
    budget,
    percentage,
    status: getRuleStatus(percentage),
  };
}

export function getRubroLabel(rubro: Rubro): string {
  const labels: Record<Rubro, string> = {
    needs: 'Necesidades',
    leisure: 'Ocio',
    savings: 'Ahorro',
  };
  return labels[rubro];
}

export function getRubroColor(rubro: Rubro): string {
  const colors: Record<Rubro, string> = {
    needs: 'bg-blue-500',
    leisure: 'bg-purple-500',
    savings: 'bg-green-500',
  };
  return colors[rubro];
}

export function getStatusColor(status: RuleStatus): string {
  switch (status) {
    case 'ok':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'over':
      return 'bg-red-500';
  }
}

export function getStatusLabel(status: RuleStatus): string {
  switch (status) {
    case 'ok':
      return 'ok';
    case 'warning':
      return 'cerca';
    case 'over':
      return 'excede';
  }
}

export function calculateCategoryExpenses(
  expenses: Expense[]
): { category: string; amount: number; percentage: number }[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryMap = new Map<string, number>();

  for (const expense of expenses) {
    const current = categoryMap.get(expense.category) || 0;
    categoryMap.set(expense.category, current + expense.amount);
  }

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getExpensePercentageChange(
  currentExpenses: number,
  previousExpenses: number
): number {
  if (previousExpenses === 0) return 0;
  return ((currentExpenses - previousExpenses) / previousExpenses) * 100;
}

export function getIncomePercentageChange(
  currentIncome: number,
  previousIncome: number
): number {
  if (previousIncome === 0) return 0;
  return ((currentIncome - previousIncome) / previousIncome) * 100;
}

export function calculateProjections(
  monthlyIncome: number,
  monthlyExpenses: number,
  params: ProjectionParams,
  months: string[]
): ProjectionPoint[] {
  const baseSavings = monthlyIncome - monthlyExpenses;
  const base = baseSavings;

  let optimisticVariation = 0;
  let pessimisticVariation = 0;

  switch (params.optimisticVariation) {
    case 'income_plus_10':
      optimisticVariation = monthlyIncome * 0.1;
      break;
    case 'income_minus_10':
      optimisticVariation = -monthlyIncome * 0.1;
      break;
    case 'expense_plus_10':
      optimisticVariation = -monthlyExpenses * 0.1;
      break;
    case 'expense_minus_10':
      optimisticVariation = monthlyExpenses * 0.1;
      break;
  }

  switch (params.pessimisticVariation) {
    case 'income_plus_10':
      pessimisticVariation = monthlyIncome * 0.1;
      break;
    case 'income_minus_10':
      pessimisticVariation = -monthlyIncome * 0.1;
      break;
    case 'expense_plus_10':
      pessimisticVariation = monthlyExpenses * 0.1;
      break;
    case 'expense_minus_10':
      pessimisticVariation = -monthlyExpenses * 0.1;
      break;
  }

  let cumulativeBase = 0;
  let cumulativeOptimistic = 0;
  let cumulativePessimistic = 0;

  return months.map((month) => {
    cumulativeBase += base;
    cumulativeOptimistic += base + optimisticVariation;
    cumulativePessimistic += base + pessimisticVariation;

    return {
      month,
      base: Math.max(0, cumulativeBase),
      optimistic: Math.max(0, cumulativeOptimistic),
      pessimistic: Math.max(0, cumulativePessimistic),
    };
  });
}

export function validateRulePercentages(rule: AppConfig['rule']): boolean {
  const total = rule.needs + rule.leisure + rule.savings;
  return total === 100;
}

export function getHistoricalData(
  expenses: Expense[],
  _incomes: Income[],
  months: string[],
  monthlyIncome: number
): { month: string; income: number; expenses: number }[] {
  return months.map((month) => {
    const monthExpenses = expenses
      .filter((e) => e.period === month)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month,
      income: monthlyIncome,
      expenses: monthExpenses,
    };
  });
}