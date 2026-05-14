import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { calculateMonthlyIncome } from '@/lib/calculations';
import type { Category, Rubro } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Download, Upload, RotateCcw, CheckCircle2 } from 'lucide-react';

const CURRENCIES = [
  { value: 'USD', label: 'USD - Dólar estadounidense' },
  { value: 'COP', label: 'COP - Peso colombiano' },
];

const RUBRO_OPTIONS: { value: Rubro; label: string; color: string }[] = [
  { value: 'needs', label: 'Necesidades', color: 'bg-blue-500' },
  { value: 'leisure', label: 'Ocio', color: 'bg-purple-500' },
  { value: 'savings', label: 'Ahorro', color: 'bg-green-500' },
];

const DEFAULT_SAMPLE_INCOME = 1500000;

export function Settings() {
  const { state, updateConfig, addCategory, updateCategory, deleteCategory, resetData, exportData, importData } = useApp();

  const actualMonthlyIncome = useMemo(() => calculateMonthlyIncome(state.incomes), [state.incomes]);
  const previewIncome = actualMonthlyIncome > 0 ? actualMonthlyIncome : DEFAULT_SAMPLE_INCOME;

  const [ruleValues, setRuleValues] = useState({
    needs: state.config.rule.needs,
    leisure: state.config.rule.leisure,
    savings: state.config.rule.savings,
  });
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', rubro: 'needs' as Rubro });
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    setRuleValues({
      needs: state.config.rule.needs,
      leisure: state.config.rule.leisure,
      savings: state.config.rule.savings,
    });
  }, [state.config.rule]);

  const totalPercentage = ruleValues.needs + ruleValues.leisure + ruleValues.savings;
  const isValid = totalPercentage === 100;

  const handleRuleChange = (rubro: keyof typeof ruleValues, value: number) => {
    setRuleValues({ ...ruleValues, [rubro]: value });
  };

  const handleSaveRule = () => {
    if (isValid) {
      updateConfig({
        rule: { ...ruleValues },
      });
    }
  };

  const handleCurrencyChange = (currency: string) => {
    updateConfig({ currency });
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, rubro: category.rubro });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', rubro: 'needs' });
    }
    setIsCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', rubro: 'needs' });
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryForm.name.trim(),
        rubro: categoryForm.rubro,
      });
    } else {
      addCategory({
        name: categoryForm.name.trim(),
        rubro: categoryForm.rubro,
      });
    }
    handleCloseCategoryDialog();
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
  };

  const handleExport = () => {
    exportData();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        importData(json);
      } catch {
        alert('Error al importar datos. Asegúrate de que el archivo sea un JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    resetData();
    setIsResetDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-muted-foreground">Personaliza la aplicación y gestiona tus datos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Regla de distribución</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Necesidades</Label>
                  <span className="font-semibold">{ruleValues.needs}%</span>
                </div>
                <Slider
                  value={[ruleValues.needs]}
                  onValueChange={([value]) => handleRuleChange('needs', value)}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ocio</Label>
                  <span className="font-semibold">{ruleValues.leisure}%</span>
                </div>
                <Slider
                  value={[ruleValues.leisure]}
                  onValueChange={([value]) => handleRuleChange('leisure', value)}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ahorro</Label>
                  <span className="font-semibold">{ruleValues.savings}%</span>
                </div>
                <Slider
                  value={[ruleValues.savings]}
                  onValueChange={([value]) => handleRuleChange('savings', value)}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total: {totalPercentage}%</span>
                {isValid ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Válido
                  </Badge>
                ) : (
                  <Badge variant="danger">Debe ser 100%</Badge>
                )}
              </div>
              <Button onClick={handleSaveRule} disabled={!isValid}>
                Guardar cambios
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Vista previa</p>
                <p className="text-xs text-muted-foreground">
                  {actualMonthlyIncome > 0
                    ? `Basado en tu ingreso: ${formatCurrency(actualMonthlyIncome, state.config.currency)}`
                    : `Ingreso de referencia: ${formatCurrency(DEFAULT_SAMPLE_INCOME, state.config.currency)}`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Necesidades</p>
                  <p className="font-semibold">{formatCurrency(previewIncome * (ruleValues.needs / 100), state.config.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ocio</p>
                  <p className="font-semibold">{formatCurrency(previewIncome * (ruleValues.leisure / 100), state.config.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ahorro</p>
                  <p className="font-semibold">{formatCurrency(previewIncome * (ruleValues.savings / 100), state.config.currency)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moneda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {CURRENCIES.map((currency) => (
                <label
                  key={currency.value}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="radio"
                    name="currency"
                    value={currency.value}
                    checked={state.config.currency === currency.value}
                    onChange={() => handleCurrencyChange(currency.value)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{currency.label}</span>
                </label>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Vista previa</p>
              <p className="text-lg font-semibold">{formatCurrency(1500000, state.config.currency)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorías</CardTitle>
          <Button onClick={() => handleOpenCategoryDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar categoría
          </Button>
        </CardHeader>
        <CardContent>
          {state.config.categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No hay categorías. Agrega una para comenzar.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {state.config.categories.map((category) => {
                const rubro = RUBRO_OPTIONS.find((r) => r.value === category.rubro);
                return (
                  <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${rubro?.color}`} />
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {rubro?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Importar JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </Button>
          </div>

          <Separator />

          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer todos los datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todos tus ingresos, gastos y configuración. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Restablecer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre</Label>
              <input
                id="categoryName"
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ej: Servicios"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Rubro</Label>
              <div className="flex gap-2">
                {RUBRO_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, rubro: r.value })}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      categoryForm.rubro === r.value ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${r.color}`} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseCategoryDialog}>
                Cancelar
              </Button>
              <Button type="submit">{editingCategory ? 'Guardar cambios' : 'Agregar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}