import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, getMonthsArray, getPeriodLabel } from '@/lib/utils';
import { calculateMonthlyIncome, calculateProjections } from '@/lib/calculations';
import type { ProjectionParams } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';

const referenceMonthsOptions = [
  { value: 1, label: '1 mes' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
];

const horizonMonthsOptions = [
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 24, label: '24 meses' },
];

const variationOptions = [
  { value: 'income_plus_10', label: '+10% ingreso' },
  { value: 'income_minus_10', label: '-10% ingreso' },
  { value: 'expense_plus_10', label: '+10% gasto' },
  { value: 'expense_minus_10', label: '-10% gasto' },
];

const scenarioColors = {
  base: '#3b82f6',
  optimistic: '#22c55e',
  pessimistic: '#ef4444',
};

export function Projections() {
  const { state, toDisplay } = useApp();

  const [params, setParams] = useState<ProjectionParams>({
    referenceMonths: 3,
    horizonMonths: 12,
    optimisticVariation: 'income_plus_10',
    pessimisticVariation: 'expense_plus_10',
  });

  const monthlyIncome = useMemo(() => calculateMonthlyIncome(state.incomes), [state.incomes]);

  const monthlyExpenses = useMemo(() => {
    const lastMonths = getMonthsArray(params.referenceMonths);
    const totalExpenses = state.expenses
      .filter((e) => lastMonths.includes(e.period))
      .reduce((sum, e) => sum + e.amount, 0);
    return totalExpenses / params.referenceMonths;
  }, [state.expenses, params.referenceMonths]);

  const projectionMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 1; i <= params.horizonMonths; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    return months;
  }, [params.horizonMonths]);

  const projectionData = useMemo(() => {
    return calculateProjections(monthlyIncome, monthlyExpenses, params, projectionMonths);
  }, [monthlyIncome, monthlyExpenses, params, projectionMonths]);

  const finalValues = useMemo(() => {
    if (projectionData.length === 0) {
      return { base: 0, optimistic: 0, pessimistic: 0 };
    }
    const lastPoint = projectionData[projectionData.length - 1];
    return {
      base: lastPoint.base,
      optimistic: lastPoint.optimistic,
      pessimistic: lastPoint.pessimistic,
    };
  }, [projectionData]);

  const chartData = useMemo(() => {
    return projectionData.map((point) => ({
      month: getPeriodLabel(point.month).split(' ')[0].substring(0, 3) + ' ' + point.month.split('-')[0],
      base: point.base,
      optimistic: point.optimistic,
      pessimistic: point.pessimistic,
    }));
  }, [projectionData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Proyecciones</h2>
        <p className="text-muted-foreground">Estimación del comportamiento financiero futuro</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Parámetros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Referencia histórica</label>
              <Select
                value={params.referenceMonths.toString()}
                onValueChange={(value) => setParams({ ...params, referenceMonths: parseInt(value) as 1 | 3 | 6 | 12 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {referenceMonthsOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horizonte de proyección</label>
              <Select
                value={params.horizonMonths.toString()}
                onValueChange={(value) => setParams({ ...params, horizonMonths: parseInt(value) as 6 | 12 | 24 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {horizonMonthsOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium">Variación optimista</label>
              <Select
                value={params.optimisticVariation}
                onValueChange={(value) => setParams({ ...params, optimisticVariation: value as ProjectionParams['optimisticVariation'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Variación pesimista</label>
              <Select
                value={params.pessimisticVariation}
                onValueChange={(value) => setParams({ ...params, pessimisticVariation: value as ProjectionParams['pessimisticVariation'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:col-span-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <CardTitle className="text-sm font-medium">Pesimista</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(toDisplay(finalValues.pessimistic), state.config.currency)}</div>
              <p className="text-xs text-muted-foreground">Ahorro acumulado</p>
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gasto/mes</span>
                  <span>{formatCurrency(toDisplay(monthlyExpenses * 1.1), state.config.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-medium">Base</CardTitle>
                <Badge>escenario</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(toDisplay(finalValues.base), state.config.currency)}</div>
              <p className="text-xs text-muted-foreground">Ahorro acumulado</p>
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gasto/mes</span>
                  <span>{formatCurrency(toDisplay(monthlyExpenses), state.config.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <CardTitle className="text-sm font-medium">Optimista</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(toDisplay(finalValues.optimistic), state.config.currency)}</div>
              <p className="text-xs text-muted-foreground">Ahorro acumulado</p>
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gasto/mes</span>
                  <span>{formatCurrency(toDisplay(monthlyExpenses * 0.9), state.config.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución proyectada del ahorro acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={scenarioColors.optimistic} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={scenarioColors.optimistic} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={scenarioColors.pessimistic} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={scenarioColors.pessimistic} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value) => formatCurrency(toDisplay(value as number), state.config.currency)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #ccc' }}
                />
                <Area
                  type="monotone"
                  dataKey="optimistic"
                  stroke={scenarioColors.optimistic}
                  fill="url(#colorOptimistic)"
                  name="Optimista"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="pessimistic"
                  stroke={scenarioColors.pessimistic}
                  fill="url(#colorPessimistic)"
                  name="Pesimista"
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="base" stroke={scenarioColors.base} name="Base" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">Información de referencia</p>
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <span className="text-muted-foreground">Ingreso base:</span>{' '}
            <span className="font-semibold">{formatCurrency(toDisplay(monthlyIncome), state.config.currency)} / mes</span>
          </div>
          <div>
            <span className="text-muted-foreground">Gasto promedio:</span>{' '}
            <span className="font-semibold">{formatCurrency(toDisplay(monthlyExpenses), state.config.currency)} / mes</span>
          </div>
          <div>
            <span className="text-muted-foreground">Ahorro base:</span>{' '}
            <span className="font-semibold">{formatCurrency(toDisplay(monthlyIncome - monthlyExpenses), state.config.currency)} / mes</span>
          </div>
        </div>
      </div>
    </div>
  );
}