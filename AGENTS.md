# ControlGastos - Expense Tracker

## Developer Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build   # TypeScript check + Vite build
npm run lint    # ESLint
npm run preview # Preview production build
```

## Important Quirks

- **Build order**: `npm run build` runs `tsc -b && vite build` — typecheck fails will block the build
- **Tailwind v4**: Uses `@import "tailwindcss"` in CSS, not `tailwind.config.js` — no traditional config file
- **Path alias**: `@/*` resolves to `./src/*`
- **No tests**: No test framework installed; skip test-related changes
- **shadcn/ui**: Components in `src/components/ui/` are hand-written Radix UI wrappers; use `npx shadcn@latest add <component>` to add new ones
- **Icon library**: Uses `@hugeicons/react` (not lucide-react despite it being in dependencies)
- **Data persistence**: All data in localStorage via `src/services/storageService.ts`

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/features/*` | Feature modules (dashboard, expenses, income, projections, settings) |
| `src/components/ui/` | shadcn/ui component wrappers |
| `src/context/` | AppContext for global state |
| `src/lib/` | Utils and calculation logic |

## Key Files

- `src/context/AppContext.tsx` — Global state management
- `src/services/storageService.ts` — localStorage abstraction (ready for API migration)
- `src/lib/calculations.ts` — 50/30/20 rule calculations
- `src/index.css` — Tailwind v4 theme setup

## Common Issues

- ESLint will warn on unused variables/imports (strict config)
- TypeScript strict mode enabled — avoid `any` types
- The `dist/` folder is the production build output