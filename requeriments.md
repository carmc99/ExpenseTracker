# Requerimientos — Expense Tracker Web App

> **Versión:** 1.0  
> **Stack:** React 18 · shadcn/ui · Tailwind CSS · localStorage (JSON)  
> **Fecha:** Mayo 2026

---

## Tabla de contenidos

1. [Propósito](#1-propósito)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Módulos funcionales](#4-módulos-funcionales)
   - 4.1 [Ingresos](#41-ingresos)
   - 4.2 [Gastos](#42-gastos)
   - 4.3 [Dashboard y métricas](#43-dashboard-y-métricas)
   - 4.4 [Proyecciones](#44-proyecciones)
   - 4.5 [Configuración](#45-configuración)
5. [Regla 50 / 30 / 20](#5-regla-50--30--20)
6. [Estructura del JSON](#6-estructura-del-json)
7. [Componentes shadcn/ui por pantalla](#7-componentes-shadcnui-por-pantalla)
8. [Mockups de pantallas](#8-mockups-de-pantallas)
9. [Requerimientos no funcionales](#9-requerimientos-no-funcionales)
10. [Fases de entrega](#10-fases-de-entrega)

---

## 1. Propósito

Aplicación web personal para registrar ingresos y gastos, clasificarlos por tipo y rubro, visualizar métricas históricas por período y generar proyecciones financieras a futuro. La regla **50/30/20** actúa como referencia configurable para la distribución del ingreso.

---

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework UI | React 18 + Vite | Hooks, Context API |
| Componentes | **shadcn/ui** | Basado en Radix UI + Tailwind |
| Estilos | Tailwind CSS v3 | Config extendida con tokens propios |
| Gráficos | Recharts | LineChart, BarChart, PieChart |
| Persistencia v1 | `localStorage` serializado como JSON | Capa abstracta lista para migrar a API |
| Íconos | Lucide React | Incluido con shadcn/ui |
| Utilitarios | date-fns, uuid | Manejo de fechas e IDs |

---

## 3. Estructura de carpetas

```
src/
├── components/
│   └── ui/               # Componentes shadcn/ui auto-generados
├── features/
│   ├── dashboard/        # Pantalla de métricas y resumen
│   ├── expenses/         # CRUD de gastos
│   ├── income/           # CRUD de ingresos
│   ├── projections/      # Pantalla de proyecciones
│   └── settings/         # Configuración y preferencias
├── context/
│   └── AppContext.jsx     # Estado global (gastos, ingresos, config)
├── services/
│   └── storageService.js  # Abstracción de localStorage / futura API
├── hooks/
│   ├── useExpenses.js
│   ├── useIncome.js
│   └── useProjections.js
├── lib/
│   ├── calculations.js    # Lógica de regla 50/30/20 y proyecciones
│   └── utils.js           # Helpers (formato moneda, fechas)
└── App.jsx
```

---

## 4. Módulos funcionales

### 4.1 Ingresos

**Objetivo:** Registrar todas las fuentes de ingresos que determinan la base de cálculo mensual.

**Campos por registro:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (uuid) | Identificador único |
| `source` | string | Nombre de la fuente (ej. "Salario principal") |
| `amount` | number | Monto en la moneda configurada |
| `frequency` | enum | `monthly` / `biweekly` / `once` |
| `createdAt` | ISO date | Fecha del registro |

**Comportamiento:**
- El **ingreso neto mensual total** es la suma ponderada según frecuencia.
- Soporta múltiples fuentes (salario + freelance + arriendo recibido, etc.).
- CRUD completo con validación de monto mayor a 0.

---

### 4.2 Gastos

**Objetivo:** Registrar cada gasto con suficiente contexto para clasificarlo, filtrarlo y analizarlo por período.

**Campos por registro:**

| Campo | Tipo | Opciones / Descripción |
|-------|------|------------------------|
| `id` | string (uuid) | |
| `concept` | string | Descripción libre del gasto |
| `amount` | number | Monto positivo |
| `type` | enum | `fixed` / `variable` |
| `category` | string | Selección del catálogo de categorías configurables |
| `rubro` | enum | `needs` / `leisure` / `savings` — mapeo a regla 50/30/20 |
| `date` | ISO date | Fecha real del gasto |
| `period` | string `YYYY-MM` | Período al que pertenece |

**Comportamiento:**
- Filtros: por tipo (fijo/variable), por categoría, por período.
- Búsqueda por concepto (texto libre).
- Edición y eliminación con confirmación.
- Indicador visual del rubro asociado a cada gasto en el listado.

---

### 4.3 Dashboard y métricas

**Objetivo:** Vista principal de resumen financiero del período seleccionado.

**Sección: Resumen del período**
- Total ingresado, total gastado, balance (ingreso − gasto).
- Variación porcentual vs. período anterior (↑ / ↓).

**Sección: Distribución por categoría**
- Gráfico de barras horizontales con monto y porcentaje por categoría.

**Sección: Regla 50/30/20**
- Por cada rubro (Necesidades / Ocio / Ahorro):
  - Porcentaje real gastado vs. porcentaje objetivo configurado.
  - Barra de progreso con color semafórico:
    - Verde: dentro del límite.
    - Amarillo: entre 85% y 100% del límite.
    - Rojo: excede el límite.
  - Badge textual: `ok` / `cerca` / `excede`.

**Sección: Historial comparativo**
- Gráfico de líneas con los últimos 6 meses (ingresos vs. gastos).

**Controles:**
- Selector de período (mes/año).
- Rango personalizado (fecha inicio — fecha fin).

---

### 4.4 Proyecciones

**Objetivo:** Estimar el comportamiento financiero futuro en tres escenarios.

**Parámetros configurables:**

| Parámetro | Opciones por defecto |
|-----------|----------------------|
| Referencia histórica | 1 / 3 / 6 / 12 meses |
| Horizonte de proyección | 6 / 12 / 24 meses |
| Variación optimista | +10% ingreso ó −10% gasto |
| Variación pesimista | +10% gasto ó −10% ingreso |

**Escenarios calculados:**

| Escenario | Lógica |
|-----------|--------|
| Base | Promedio de los últimos N meses sin variación |
| Optimista | Base + variación positiva seleccionada |
| Pesimista | Base + variación negativa seleccionada |

**Métricas por escenario:**
- Ahorro acumulado al final del horizonte.
- Gasto mensual promedio estimado.
- Ingreso mensual promedio estimado.

**Visualización:**
- Gráfico de líneas con zona sombreada para el rango proyectado.
- Las 3 curvas (base / optimista / pesimista) superpuestas con distintos colores y estilos de línea.

---

### 4.5 Configuración

**Objetivo:** Personalizar parámetros de la aplicación y gestionar los datos.

**Sección: Regla de distribución**
- Ajuste de porcentajes por rubro (Necesidades / Ocio / Ahorro).
- Validación: deben sumar exactamente 100%.
- Vista previa de las barras proporcionales actualizadas en tiempo real.

**Sección: Categorías**
- Listado de categorías existentes con su rubro asignado.
- Crear, editar y eliminar categorías.
- Asignar cada categoría a un rubro (`needs` / `leisure` / `savings`).

**Sección: Moneda**
- Selector de símbolo: CLP, USD, EUR, MXN, COP u otro.
- El símbolo se aplica globalmente en todos los montos mostrados.

**Sección: Datos**
- Exportar todos los datos como archivo `.json` descargable.
- Importar datos desde un `.json` (con validación de estructura).
- Restablecer todos los datos (con diálogo de confirmación `AlertDialog`).

---

## 5. Regla 50 / 30 / 20

La regla clasifica cada peso del ingreso en tres rubros:

```
Ingreso neto mensual
  ├── 50% → Necesidades   (arriendo, supermercado, servicios, salud)
  ├── 30% → Ocio          (entretenimiento, viajes, restaurantes)
  └── 20% → Ahorro        (inversiones, fondos, reserva de emergencia)
```

**Cálculo:**

```js
const budget = {
  needs:   income * (config.rule.needs   / 100),
  leisure: income * (config.rule.leisure / 100),
  savings: income * (config.rule.savings / 100),
};

const spent = {
  needs:   expenses.filter(e => e.rubro === 'needs').reduce(sum, 0),
  leisure: expenses.filter(e => e.rubro === 'leisure').reduce(sum, 0),
  savings: expenses.filter(e => e.rubro === 'savings').reduce(sum, 0),
};

const status = (rubro) => {
  const ratio = spent[rubro] / budget[rubro];
  if (ratio > 1)    return 'over';    // rojo
  if (ratio > 0.85) return 'warning'; // amarillo
  return 'ok';                        // verde
};
```

Los porcentajes son configurables pero siempre deben sumar 100%.

---

## 6. Estructura del JSON

```json
{
  "version": "1.0",
  "config": {
    "currency": "CLP",
    "rule": {
      "needs": 50,
      "leisure": 30,
      "savings": 20
    },
    "categories": [
      { "id": "uuid", "name": "Arriendo / Hipoteca", "rubro": "needs" },
      { "id": "uuid", "name": "Supermercado",        "rubro": "needs" },
      { "id": "uuid", "name": "Streaming",           "rubro": "leisure" },
      { "id": "uuid", "name": "Inversiones",         "rubro": "savings" }
    ]
  },
  "incomes": [
    {
      "id": "uuid-1",
      "source": "Salario principal",
      "amount": 1500000,
      "frequency": "monthly",
      "createdAt": "2026-01-01"
    }
  ],
  "expenses": [
    {
      "id": "uuid-2",
      "concept": "Arriendo departamento",
      "amount": 625000,
      "type": "fixed",
      "category": "Arriendo / Hipoteca",
      "rubro": "needs",
      "date": "2026-05-01",
      "period": "2026-05"
    },
    {
      "id": "uuid-3",
      "concept": "Supermercado semana 1",
      "amount": 82300,
      "type": "variable",
      "category": "Supermercado",
      "rubro": "needs",
      "date": "2026-05-03",
      "period": "2026-05"
    }
  ]
}
```

---

## 7. Componentes shadcn/ui por pantalla

### Componentes globales

```bash
npx shadcn@latest add button card badge separator tooltip
npx shadcn@latest add select dialog alert-dialog
npx shadcn@latest add form input label
```

### Dashboard

| Componente shadcn/ui | Uso |
|---------------------|-----|
| `Card`, `CardHeader`, `CardContent` | Tarjetas de métricas y gráficos |
| `Badge` | Estado semafórico (ok / cerca / excede) |
| `Select` | Selector de período |
| `Separator` | División entre secciones |
| `Progress` | Barras de la regla 50/30/20 |

### Gastos

| Componente shadcn/ui | Uso |
|---------------------|-----|
| `Dialog` | Formulario de nuevo/editar gasto |
| `Form`, `Input`, `Label` | Campos del formulario |
| `Select` | Tipo, categoría, rubro |
| `ToggleGroup` | Fijo / Variable |
| `AlertDialog` | Confirmación de eliminación |
| `Badge` | Etiqueta de tipo y categoría en listado |
| `Button` | Acciones CRUD |
| `Popover` | Filtros avanzados |

### Ingresos

| Componente shadcn/ui | Uso |
|---------------------|-----|
| `Dialog` | Formulario de nuevo/editar ingreso |
| `Form`, `Input`, `Label` | Campos |
| `Select` | Frecuencia |
| `AlertDialog` | Confirmación de eliminación |

### Proyecciones

| Componente shadcn/ui | Uso |
|---------------------|-----|
| `Card` | Tarjetas de escenario |
| `Select` | Parámetros (referencia, horizonte, variación) |
| `Badge` | Etiqueta "escenario base" |
| `Separator` | División visual |

### Configuración

| Componente shadcn/ui | Uso |
|---------------------|-----|
| `Slider` (o `Input number`) | Ajuste de porcentajes |
| `AlertDialog` | Confirmación de reset de datos |
| `Dialog` | Formulario de nueva categoría |
| `Badge` | Rubro de cada categoría |
| `Button` (variant outline/destructive) | Exportar / Importar / Resetear |
| `RadioGroup` | Selector de moneda |
| `Separator` | Divisiones entre secciones |

---

## 8. Mockups de pantallas

Los siguientes mockups representan el layout y los elementos de cada pantalla principal. Los colores, íconos y disposición son indicativos; el diseño final se implementa con shadcn/ui y Tailwind CSS.

---

### 8.1 Dashboard — Resumen del período

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Expense Tracker  [Dashboard] [Gastos] [Ingresos] [Proy] [⚙] │
├─────────────────────────────────────────────────────────────────┤
│  Resumen del período            [Mayo 2026 ▾]  [⚙ Filtros]      │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ ↑ Ingresos      │  │ 💳 Gastos        │  │ 🐷 Balance      │  │
│  │ $1.500.000      │  │ $1.140.000       │  │ $360.000       │  │
│  │ ↑ +5% vs abril  │  │ ↑ +8% vs abril  │  │ 24% del ingreso│  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐  │
│  │ 📊 Gasto por categoría       │  │ ⚖ Regla 50 / 30 / 20     │  │
│  │                             │  │                          │  │
│  │ Arriendo    ████████   $625k│  │ Necesidades  62% / 50%   │  │
│  │ Supermercado ████    $220k  │  │ ████████████████▌ [excede]│  │
│  │ Transporte  ██       $80k  │  │                          │  │
│  │ Ocio        ███      $115k │  │ Ocio         24% / 30%   │  │
│  │ Otros       ██       $100k │  │ ████████             [ok] │  │
│  │                             │  │                          │  │
│  └─────────────────────────────┘  │ Ahorro       14% / 20%   │  │
│                                   │ ███████            [bajo] │  │
│                                   └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos shadcn/ui:** `Card`, `Badge`, `Progress`, `Select`

---

### 8.2 Gastos — Listado y formulario

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Expense Tracker  [Dashboard] [Gastos*] [Ingresos] [Proy] [⚙]│
├───────────────────────┬─────────────────────────────────────────┤
│ ➕ Nuevo gasto         │  🔍 Buscar concepto...  [Todos][Fijo][Var]│
│                        │                                         │
│ Concepto               │ ┌──────────────────────────────────────┐│
│ [Arriendo depto       ]│ │ 🏠 Arriendo departamento              ││
│                        │ │    01 mayo · [Necesidades]   $625.000 ││
│ Monto                  │ │                      [Fijo]  ✏ 🗑      ││
│ [$625.000             ]│ ├──────────────────────────────────────┤│
│                        │ │ 🛒 Supermercado                       ││
│ Tipo                   │ │    03 mayo · [Necesidades]    $82.300 ││
│ [Fijo ●] [Variable]   │ │                   [Variable]  ✏ 🗑      ││
│                        │ ├──────────────────────────────────────┤│
│ Categoría              │ │ 📺 Streaming + entretenimiento        ││
│ [Necesidades      ▾]  │ │    04 mayo · [Ocio]           $25.990 ││
│                        │ │                      [Fijo]  ✏ 🗑      ││
│ Rubro (50/30/20)       │ ├──────────────────────────────────────┤│
│ [Necesidades (50%) ▾] │ │ 🚗 Bencina                            ││
│                        │ │    05 mayo · [Necesidades]    $45.000 ││
│ Fecha                  │ │                   [Variable]  ✏ 🗑      ││
│ [05 / 05 / 2026  📅]  │ └──────────────────────────────────────┘│
│                        │   Mostrando 4 de 18 · Total: $1.140.000 │
│ [✓ Guardar gasto]      │                                         │
└───────────────────────┴─────────────────────────────────────────┘
```

**Elementos shadcn/ui:** `Dialog` (formulario), `Form`, `Input`, `Select`, `ToggleGroup`, `Badge`, `AlertDialog` (eliminar)

---

### 8.3 Ingresos

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Expense Tracker  [Dashboard] [Gastos] [Ingresos*] [Proy] [⚙]│
├─────────────────────────────────────────────────────────────────┤
│  Ingresos registrados                        [+ Agregar ingreso] │
│                                                                  │
│  Ingreso neto mensual total: $1.750.000                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 💼 Salario principal                                         │ │
│  │    Frecuencia: Mensual                     $1.500.000 / mes  │ │
│  │                                                    ✏ 🗑       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 💻 Freelance desarrollo                                      │ │
│  │    Frecuencia: Variable (promedio)           $250.000 / mes  │ │
│  │                                                    ✏ 🗑       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Distribución objetivo con regla 50/30/20:                       │
│  Necesidades $875.000 · Ocio $525.000 · Ahorro $350.000          │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos shadcn/ui:** `Card`, `Dialog`, `Form`, `Input`, `Select`, `Separator`

---

### 8.4 Proyecciones

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Expense Tracker  [Dashboard] [Gastos] [Ingresos] [Proy*] [⚙]│
├────────────────────┬────────────────────────────────────────────┤
│ ⚙ Parámetros        │  Pesimista      Base (★)      Optimista     │
│                     │  ┌───────────┐ ┌─────────────┐ ┌─────────┐ │
│ Referencia hist.    │  │↘ Pesimista│ │ escenario  *│ │↗ Optimis│ │
│ [Últimos 3 meses ▾]│  │           │ │    base     │ │         │ │
│                     │  │ Ahorro    │ │ Ahorro      │ │ Ahorro  │ │
│ Proyectar hacia     │  │ acumulado │ │ acumulado   │ │ acumulado│ │
│ [12 meses      ▾]  │  │$1.980.000 │ │ $4.320.000  │ │$6.120.000│ │
│                     │  │           │ │             │ │         │ │
│ Var. optimista      │  │ Gasto/mes │ │ Gasto/mes   │ │ Gasto/mes│ │
│ [+10% ingreso  ▾]  │  │$1.254.000 │ │ $1.140.000  │ │$1.026.000│ │
│                     │  └───────────┘ └─────────────┘ └─────────┘ │
│ Var. pesimista      │                                             │
│ [+10% gasto    ▾]  │  📈 Evolución proyectada del ahorro acumulado│
│                     │                                             │
│ Ingreso base        │   ╱ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ optimista  │
│ $1.500.000 / mes    │  ╱ ─────────────────────────── base        │
│                     │ ╱ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ pesimista  │
│                     │ May  Ago  Nov  Feb 27  May 27               │
└────────────────────┴────────────────────────────────────────────┘
```

**Elementos shadcn/ui:** `Card`, `Badge`, `Select`, `Separator`  
**Recharts:** `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`

---

### 8.5 Configuración

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Expense Tracker  [Dashboard] [Gastos] [Ingresos] [Proy] [⚙*]│
├──────────────────────────────┬──────────────────────────────────┤
│ ⚖ Regla de distribución       │ 🏷 Categorías                     │
│                               │                                  │
│ Necesidades        50%        │ Arriendo / Hipoteca [Necesidades]│
│ ████████████░░░░░░░░░░░       │                          ✏ 🗑     │
│                               │ Supermercado        [Necesidades]│
│ Ocio               30%        │                          ✏ 🗑     │
│ ████████░░░░░░░░░░░░░░░       │ Streaming               [Ocio]   │
│                               │                          ✏ 🗑     │
│ Ahorro             20%        │ Inversiones             [Ahorro] │
│ ██████░░░░░░░░░░░░░░░░░       │                          ✏ 🗑     │
│                               │ [+ Agregar categoría]            │
│ [50%] [30%] [20%]             │                                  │
│ ✅ Suma: 100%                  │                                  │
├──────────────────────────────┼──────────────────────────────────┤
│ 💱 Moneda                     │ 💾 Datos                          │
│                               │                                  │
│ (●) CLP  ( ) USD  ( ) EUR     │ [↓ Exportar JSON]  [↑ Importar] │
│ ( ) MXN  ( ) COP              │                                  │
│                               │ ──────────────────────────────── │
│ Vista previa: $1.500.000      │ [🗑 Restablecer todos los datos]  │
│                               │ Esta acción no se puede deshacer  │
└──────────────────────────────┴──────────────────────────────────┘
```

**Elementos shadcn/ui:** `Slider`, `Input`, `AlertDialog`, `Dialog`, `Badge`, `Button` (variant destructive), `RadioGroup`, `Separator`

---

## 9. Requerimientos no funcionales

| Categoría | Requerimiento |
|-----------|--------------|
| Responsive | Funcional en desktop (≥1024px) y tablet (≥768px). Mobile como mejora futura. |
| Rendimiento | Carga inicial < 2 segundos. Sin llamadas de red en v1. |
| Accesibilidad | shadcn/ui garantiza ARIA base. Contraste AA mínimo. |
| Arquitectura | `storageService.js` abstrae el acceso a datos. Reemplazar la implementación no afecta los componentes. |
| Seguridad | Sin autenticación en v1 (datos locales del navegador). |
| Extensibilidad | La estructura JSON y los hooks deben poder conectarse a una REST API sin refactoring mayor. |
| Internacionalización | La moneda y el separador de miles son configurables. i18n de texto como mejora futura. |

---

## 10. Fases de entrega

### Fase 1 — MVP (semanas 1–2)

- [ ] Setup: Vite + React + Tailwind + shadcn/ui
- [ ] `storageService.js` con operaciones CRUD sobre localStorage
- [ ] AppContext con estado global
- [ ] Módulo Ingresos (CRUD completo)
- [ ] Módulo Gastos (CRUD completo, filtros básicos)
- [ ] Dashboard: balance simple, listado del período

### Fase 2 — Métricas (semana 3)

- [ ] Regla 50/30/20 con barras semafóricas
- [ ] Gráfico de barras por categoría (Recharts)
- [ ] Gráfico histórico mes a mes (LineChart)
- [ ] Selector de período funcional

### Fase 3 — Proyecciones y configuración (semana 4)

- [ ] Pantalla de proyecciones con 3 escenarios
- [ ] Gráfico de proyección con zona sombreada
- [ ] Módulo de configuración completo
- [ ] Exportar / Importar JSON
- [ ] Gestión de categorías personalizadas
- [ ] Ajuste de porcentajes de la regla

---

*Documento generado como base de implementación. Revisar y ajustar según feedback del equipo antes de iniciar desarrollo.*
