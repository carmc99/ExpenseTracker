import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, getPeriodLabel, getMonthsArray } from '@/lib/utils';
import {
  calculateMonthlyIncome,
  calculateBudgetByRubro,
  calculateSpentByRubro,
  getRuleStatus,
  getRubroLabel,
  calculateCategoryExpenses,
  getHistoricalData,
  getStatusLabel,
} from '@/lib/calculations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, PiggyBank, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LineChart, Line, Legend, CartesianGrid } from 'recharts';
import type { Rubro } from '@/types';

const RUBRO_COLORS: Record<Rubro, string> = {
  needs: '#3b82f6',
  leisure: '#8b5cf6',
  savings: '#22c55e',
};

export function Dashboard() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState(getMonthsArray(1)[0]);
  const availableMonths = getMonthsArray(12);

  const monthlyIncome = useMemo(() => calculateMonthlyIncome(state.incomes), [state.incomes]);

  const periodExpenses = useMemo(() => {
    return state.expenses.filter((e) => e.period === selectedPeriod);
  }, [state.expenses, selectedPeriod]);

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [periodExpenses]);

  const balance = monthlyIncome - totalExpenses;
  const balancePercentage = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;

  const budgetByRubro = useMemo(
    () => calculateBudgetByRubro(monthlyIncome, state.config.rule),
    [monthlyIncome, state.config.rule]
  );

  const spentByRubro = useMemo(() => calculateSpentByRubro(periodExpenses), [periodExpenses]);

  const categoryData = useMemo(() => {
    const data = calculateCategoryExpenses(periodExpenses);
    return data.map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage: item.percentage * 100,
    }));
  }, [periodExpenses]);

  const historicalMonths = getMonthsArray(6);
  const historicalData = useMemo(() => {
    return getHistoricalData(state.expenses, state.incomes, historicalMonths, monthlyIncome);
  }, [state.expenses, state.incomes, historicalMonths, monthlyIncome]);

  const previousPeriodExpenses = useMemo(() => {
    const [year, month] = selectedPeriod.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 2);
    const prevPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return state.expenses.filter((e) => e.period === prevPeriod).reduce((sum, e) => sum + e.amount, 0);
  }, [state.expenses, selectedPeriod]);

  const expenseChange = previousPeriodExpenses > 0 ? ((totalExpenses - previousPeriodExpenses) / previousPeriodExpenses) * 100 : 0;

  const rubroStatus = (rubro: Rubro) => {
    const budget = budgetByRubro[rubro];
    const spent = spentByRubro[rubro];
    const percentage = budget > 0 ? spent / budget : 0;
    const status = getRuleStatus(percentage);
    return {
      spent,
      budget,
      percentage: percentage * 100,
      status,
    };
  };

  const RUBROS: Rubro[] = ['needs', 'leisure', 'savings'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Resumen financiero del período</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month}>
                {getPeriodLabel(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyIncome, state.config.currency)}</div>
            <p className="text-xs text-muted-foreground">Neto mensual ponderado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del período</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, state.config.currency)}</div>
            <p className={`text-xs ${expenseChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% vs período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance, state.config.currency)}
            </div>
            <p className="text-xs text-muted-foreground">{balancePercentage.toFixed(1)}% del ingreso</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gasto por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay gastos en este período</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v, state.config.currency).replace(/\s/g, '')} />
                    <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number, state.config.currency)}
                      labelStyle={{ color: '#888' }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={RUBRO_COLORS[state.config.categories[index % state.config.categories.length]?.rubro as Rubro] || '#888'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Regla {state.config.rule.needs} / {state.config.rule.leisure} / {state.config.rule.savings}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {RUBROS.map((rubro) => {
              const status = rubroStatus(rubro);
              const diff = status.budget - status.spent;
              const isSavings = rubro === 'savings';
              const isOver = status.status === 'over';
              const statusVariant = isSavings
                ? isOver ? 'success' : status.status === 'warning' ? 'warning' : 'danger'
                : status.status === 'ok' ? 'success' : status.status === 'warning' ? 'warning' : 'danger';

              let diffLabel: string;
              if (isSavings) {
                diffLabel = diff >= 0
                  ? `Faltan ${formatCurrency(diff, state.config.currency)} para la meta`
                  : `Meta superada en ${formatCurrency(Math.abs(diff), state.config.currency)}`;
              } else {
                diffLabel = diff >= 0
                  ? `Disponible: ${formatCurrency(diff, state.config.currency)}`
                  : `Excedido en ${formatCurrency(Math.abs(diff), state.config.currency)}`;
              }

              return (
                <div key={rubro} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getRubroLabel(rubro)}</span>
                      <Badge variant={statusVariant} className="text-xs">
                        {isSavings && isOver ? 'Meta superada' : getStatusLabel(status.status)}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(status.spent, state.config.currency)}{' '}
                      <span className="text-xs">/ {formatCurrency(status.budget, state.config.currency)}</span>
                    </span>
                  </div>
                  <Progress
                    value={Math.min(status.percentage, 100)}
                    className="h-3"
                    style={{ '--progress-color': statusVariant === 'success' ? '#22c55e' : statusVariant === 'warning' ? '#eab308' : '#ef4444' } as React.CSSProperties}
                  />
                  <p className={`text-xs font-medium ${
                    isSavings
                      ? isOver ? 'text-green-600' : 'text-orange-500'
                      : diff >= 0 ? 'text-muted-foreground' : 'text-red-500'
                  }`}>
                    {diffLabel}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial comparativo (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => getPeriodLabel(value).split(' ')[0].substring(0, 3)}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number, state.config.currency)}
                  labelFormatter={(value) => getPeriodLabel(value as string)}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" name="Ingresos" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Gastos" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}