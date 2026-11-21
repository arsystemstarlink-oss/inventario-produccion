import {
  Boxes,
  ChefHat,
  Factory,
  House,
  Package,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { InventoryPage } from './features/inventory/InventoryPage'
import { ProductionPage } from './features/production/ProductionPage'
import { RecipesPage } from './features/recipes/RecipesPage'
import { ExchangeRateProvider } from './features/exchange/ExchangeRateProvider'
import { ExchangeRateStrip } from './features/exchange/ExchangeRateStrip'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition max-sm:min-h-11 max-sm:flex-1 max-sm:flex-col max-sm:gap-0.5 max-sm:text-xs ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

const navItems = [
  { to: '/inicio', label: 'Inicio', icon: House },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/recetas', label: 'Recetas', icon: ChefHat },
  { to: '/produccion', label: 'Producción', icon: Factory },
]

const sectionNames: Record<string, string> = {
  '/inicio': 'Inicio',
  '/inventario': 'Inventario',
  '/recetas': 'Recetas',
  '/produccion': 'Producción',
}

function RouteAnnouncer() {
  const { pathname } = useLocation()
  const name = sectionNames[pathname] ?? 'Inicio'

  useEffect(() => {
    document.title = `${name} · Inventario y Producción`
  }, [name])

  return (
    <p className="sr-only" aria-live="polite">
      {name}
    </p>
  )
}

function App() {
  const mainRef = useRef<HTMLElement>(null)

  return (
    <ExchangeRateProvider>
      <div className="min-h-dvh bg-slate-50">
        <button
          type="button"
          onClick={() => mainRef.current?.focus()}
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar al contenido
        </button>

        <div className="sticky top-0 z-40">
          <header className="bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                  <Package className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-base font-semibold text-slate-900">
                  Inventario y Producción
                </p>
              </div>
              <nav
                aria-label="Secciones"
                className="flex gap-1 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-40 max-sm:border-t max-sm:border-slate-200 max-sm:bg-white max-sm:px-2 max-sm:pb-[calc(env(safe-area-inset-bottom)+0.375rem)] max-sm:pt-1.5 max-sm:shadow-[0_-2px_10px_rgba(15,23,42,0.06)]"
              >
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className={navLinkClass}>
                    <Icon
                      className="h-4 w-4 max-sm:h-5 max-sm:w-5"
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </header>

          <ExchangeRateStrip />
        </div>

        <RouteAnnouncer />

        <main
          id="contenido"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto max-w-6xl px-3 pb-28 pt-6 outline-none sm:px-4 sm:pb-8 sm:pt-8"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route path="/inicio" element={<DashboardPage />} />
            <Route path="/inventario" element={<InventoryPage />} />
            <Route path="/recetas" element={<RecipesPage />} />
            <Route path="/produccion" element={<ProductionPage />} />
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Routes>
        </main>
      </div>
    </ExchangeRateProvider>
  )
}

export default App
