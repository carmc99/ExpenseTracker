import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Expense, ExpenseType, Rubro } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Home, ShoppingCart, Tv, Car, Heart, Briefcase, Sparkles, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';

const expenseTypes: { value: ExpenseType; label: string }[] = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
];

const rubroOptions: { value: Rubro; label: string; color: string }[] = [
  { value: 'needs', label: 'Necesidades', color: 'bg-blue-500' },
  { value: 'leisure', label: 'Ocio', color: 'bg-purple-500' },
  { value: 'savings', label: 'Ahorro', color: 'bg-green-500' },
];

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('arriendo') || lower.includes('hipoteca')) return Home;
  if (lower.includes('supermercado')) return ShoppingCart;
  if (lower.includes('streaming') || lower.includes('entretenimiento')) return Tv;
  if (lower.includes('transporte') || lower.includes('bencina')) return Car;
  if (lower.includes('salud')) return Heart;
  if (lower.includes('inversion')) return Briefcase;
  if (lower.includes('ocio')) return Sparkles;
  if (lower.includes('ahorro')) return PiggyBank;
  return ShoppingCart;
};

interface ExpenseFormData {
  concept: string;
  amount: string;
  type: ExpenseType;
  categoryId: string;
  categoryName: string;
  rubro: Rubro;
  date: string;
  period: string;
}

const initialFormData: ExpenseFormData = {
  concept: '',
  amount: '',
  type: 'variable',
  categoryId: '',
  categoryName: '',
  rubro: 'needs',
  date: format(new Date(), 'yyyy-MM-dd'),
  period: format(new Date(), 'yyyy-MM'),
};

export function ExpenseList() {
  const { state, addExpense, updateExpense, deleteExpense } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
  const [filterRubro, setFilterRubro] = useState<Rubro | 'all'>('all');

  const filteredExpenses = useMemo(() => {
    return state.expenses
      .filter((expense) => {
        const matchesSearch = expense.concept.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || expense.type === filterType;
        const matchesRubro = filterRubro === 'all' || expense.rubro === filterRubro;
        return matchesSearch && matchesType && matchesRubro;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.expenses, searchQuery, filterType, filterRubro]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      const category = state.config.categories.find((c) => c.name === expense.category);
      setEditingId(expense.id);
      setFormData({
        concept: expense.concept,
        amount: expense.amount.toString(),
        type: expense.type,
        categoryId: category?.id || '',
        categoryName: expense.category,
        rubro: expense.rubro,
        date: expense.date,
        period: expense.period,
      });
    } else {
      setEditingId(null);
      const now = new Date();
      setFormData({
        ...initialFormData,
        date: format(now, 'yyyy-MM-dd'),
        period: format(now, 'yyyy-MM'),
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!formData.concept.trim() || isNaN(amount) || amount <= 0 || !formData.categoryId) return;

    const categoryName = formData.categoryName || state.config.categories.find((c) => c.id === formData.categoryId)?.name || '';

    if (editingId) {
      updateExpense(editingId, {
        concept: formData.concept.trim(),
        amount,
        type: formData.type,
        category: categoryName,
        rubro: formData.rubro,
        date: formData.date,
        period: formData.period,
      });
    } else {
      addExpense({
        concept: formData.concept.trim(),
        amount,
        type: formData.type,
        category: categoryName,
        rubro: formData.rubro,
        date: formData.date,
        period: formData.period,
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
  };

  const getRubroBadgeVariant = (rubro: Rubro) => {
    switch (rubro) {
      case 'needs':
        return 'secondary';
      case 'leisure':
        return 'outline';
      case 'savings':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gastos</h2>
          <p className="text-muted-foreground">Registra y gestiona tus gastos</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo gasto
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por concepto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ToggleGroup
          type="single"
          value={filterType}
          onValueChange={(value) => setFilterType((value as ExpenseType) || 'all')}
          className="flex-wrap"
        >
          <ToggleGroupItem value="all">Todos</ToggleGroupItem>
          <ToggleGroupItem value="fixed">Fijos</ToggleGroupItem>
          <ToggleGroupItem value="variable">Variables</ToggleGroupItem>
        </ToggleGroup>
        <Select
          value={filterRubro}
          onValueChange={(value) => setFilterRubro((value as Rubro) || 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar por rubro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los rubros</SelectItem>
            {rubroOptions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {state.expenses.length === 0
                ? 'No hay gastos registrados. Agrega tu primer gasto.'
                : 'No hay gastos que coincidan con los filtros.'}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Mostrando {filteredExpenses.length} de {state.expenses.length} gastos
                </span>
                <span className="font-semibold">
                  Total: {formatCurrency(totalExpenses, state.config.currency)}
                </span>
              </div>
            </div>
            {filteredExpenses.map((expense) => {
              const CategoryIcon = getCategoryIcon(expense.category);
              return (
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${rubroOptions.find((r) => r.value === expense.rubro)?.color} bg-opacity-10`}>
                          <CategoryIcon className={`h-5 w-5 ${rubroOptions.find((r) => r.value === expense.rubro)?.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <p className="font-medium">{expense.concept}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(new Date(expense.date), 'dd MMM')}</span>
                            <Badge variant={getRubroBadgeVariant(expense.rubro)} className="text-xs">
                              {rubroOptions.find((r) => r.value === expense.rubro)?.label}
                            </Badge>
                            <span>{expense.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(expense.amount, state.config.currency)}</p>
                          <Badge variant="outline" className="text-xs">
                            {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar "{expense.concept}"? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(expense.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Input
                id="concept"
                placeholder="Ej: Arriendo departamento"
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                placeholder="625000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <ToggleGroup
                type="single"
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ExpenseType })}
                className="w-full"
              >
                {expenseTypes.map((t) => (
                  <ToggleGroupItem key={t.value} value={t.value} className="flex-1">
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  const category = state.config.categories.find((c) => c.id === value);
                  setFormData({
                    ...formData,
                    categoryId: value,
                    categoryName: category?.name || '',
                    rubro: category?.rubro || formData.rubro,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {state.config.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rubro">Rubro (50/30/20)</Label>
              <Select
                value={formData.rubro}
                onValueChange={(value) => setFormData({ ...formData, rubro: value as Rubro })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el rubro" />
                </SelectTrigger>
                <SelectContent>
                  {rubroOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setFormData({
                    ...formData,
                    date: e.target.value,
                    period: format(date, 'yyyy-MM'),
                  });
                }}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">{editingId ? 'Guardar cambios' : 'Agregar gasto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}