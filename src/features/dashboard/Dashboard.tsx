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
  const { state, toDisplay } = useApp();
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
            <div className="text-2xl font-bold">{formatCurrency(toDisplay(monthlyIncome), state.config.currency)}</div>
            <p className="text-xs text-muted-foreground">Neto mensual ponderado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del período</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(toDisplay(totalExpenses), state.config.currency)}</div>
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
              {formatCurrency(toDisplay(balance), state.config.currency)}
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
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(toDisplay(v), state.config.currency).replace(/\s/g, '')} />
                    <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(toDisplay(value as number), state.config.currency)}
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
            {/* Necesidades y Ocio: rastrean gasto real vs presupuesto */}
            {(['needs', 'leisure'] as Rubro[]).map((rubro) => {
              const status = rubroStatus(rubro);
              const diff = status.budget - status.spent;
              const variant =
                status.status === 'ok' ? 'success' : status.status === 'warning' ? 'warning' : 'danger';
              const progressColor =
                variant === 'success' ? '#22c55e' : variant === 'warning' ? '#eab308' : '#ef4444';

              return (
                <div key={rubro} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getRubroLabel(rubro)}</span>
                      <Badge variant={variant} className="text-xs">
                        {getStatusLabel(status.status)}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(toDisplay(status.spent), state.config.currency)}{' '}
                      <span className="text-xs">/ {formatCurrency(toDisplay(status.budget), state.config.currency)}</span>
                    </span>
                  </div>
                  <Progress
                    value={Math.min(status.percentage, 100)}
                    className="h-3"
                    style={{ '--progress-color': progressColor } as React.CSSProperties}
                  />
                  <p className={`text-xs font-medium ${diff >= 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
                    {diff >= 0
                      ? `Disponible: ${formatCurrency(diff, state.config.currency)}`
                      : `Excedido en ${formatCurrency(Math.abs(diff), state.config.currency)}`}
                  </p>
                </div>
              );
            })}

            {/* Disponible para ahorrar */}
            {(() => {
              const savingsTarget = budgetByRubro.savings;
              const realSavings = monthlyIncome - spentByRubro.needs - spentByRubro.leisure;
              const disponible = realSavings - savingsTarget;
              const progressValue = savingsTarget > 0
                ? Math.min(Math.max(0, realSavings) / savingsTarget * 100, 100)
                : 0;

              const metaCumplida = disponible >= 0;
              const deficit = realSavings < 0;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Ahorro</span>
                    <Badge
                      variant={deficit ? 'danger' : metaCumplida ? 'success' : progressValue >= 85 ? 'warning' : 'outline'}
                      className="text-xs"
                    >
                      {deficit ? 'Déficit' : metaCumplida ? 'Meta cumplida ✓' : progressValue >= 85 ? 'Casi lista' : 'En progreso'}
                    </Badge>
                  </div>

                  {/* Meta vs disponible */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground mb-1">Meta mensual</p>
                      <p className="text-base font-bold">{formatCurrency(toDisplay(savingsTarget), state.config.currency)}</p>
                      <p className="text-xs text-muted-foreground">{state.config.rule.savings}% del ingreso</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground mb-1">Disponible para ahorrar</p>
                      <p className={`text-base font-bold ${deficit ? 'text-red-500' : 'text-foreground'}`}>
                        {formatCurrency(toDisplay(Math.max(0, realSavings)), state.config.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ingreso − Nec. − Ocio</p>
                    </div>
                  </div>

                  {/* Barra de progreso hacia la meta */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso hacia la meta</span>
                      <span>{Math.min(progressValue, 100).toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={progressValue}
                      className="h-2"
                      style={{
                        '--progress-color': deficit ? '#ef4444' : metaCumplida ? '#22c55e' : progressValue >= 85 ? '#eab308' : '#f97316',
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* Insight principal */}
                  {deficit ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">Gastos mayores al ingreso</p>
                        <p className="text-xs text-muted-foreground">Necesidades + Ocio superan lo que ganas</p>
                      </div>
                      <p className="text-lg font-bold text-red-500">
                        −{formatCurrency(toDisplay(Math.abs(realSavings)), state.config.currency)}
                      </p>
                    </div>
                  ) : metaCumplida ? (
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">Excedente libre</p>
                        <p className="text-xs text-muted-foreground">Libre después de cubrir tu meta</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        +{formatCurrency(toDisplay(disponible), state.config.currency)}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Aún te faltan</p>
                        <p className="text-xs text-muted-foreground">para alcanzar tu meta este mes</p>
                      </div>
                      <p className="text-lg font-bold text-orange-500">
                        {formatCurrency(toDisplay(Math.abs(disponible)), state.config.currency)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
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
                <YAxis tickFormatter={(value) => formatCurrency(toDisplay(value), state.config.currency)} />
                <Tooltip
                  formatter={(value) => formatCurrency(toDisplay(value as number), state.config.currency)}
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