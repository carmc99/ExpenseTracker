import { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { ExpenseList } from '@/features/expenses/ExpenseList';
import { IncomeList } from '@/features/income/IncomeList';
import { Projections } from '@/features/projections/Projections';
import { Settings } from '@/features/settings/Settings';
import { Button } from '@/components/ui/button';
import { Wallet, LayoutDashboard, Receipt, TrendingUp, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'dashboard' | 'expenses' | 'income' | 'projections' | 'settings';

const navItems: { id: View; label: string; icon: typeof Wallet }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Gastos', icon: Receipt },
  { id: 'income', label: 'Ingresos', icon: TrendingUp },
  { id: 'projections', label: 'Proyecciones', icon: TrendingUp },
  { id: 'settings', label: 'Configuración', icon: SettingsIcon },
];

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <ExpenseList />;
      case 'income':
        return <IncomeList />;
      case 'projections':
        return <Projections />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold hidden sm:inline">Expense Tracker</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView(item.id)}
                  className={cn('hidden sm:flex', currentView === item.id && 'bg-primary/10')}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          <nav className="flex sm:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setCurrentView(item.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container px-4 py-6">
        {renderView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;