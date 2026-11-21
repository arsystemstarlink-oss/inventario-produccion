import {
  ArrowRight,
  Boxes,
  ChefHat,
  CircleCheck,
  Factory,
  Gauge,
  House,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { formatAmount } from '../../lib/format'
import { formatQuantity } from '../../lib/units'
import { DataBackup } from '../backup/DataBackup'
import { useInventory } from '../inventory/useInventory'
import { lowStockSupplies } from '../inventory/stock'
import { useProduction } from '../production/useProduction'
import { useRecipes } from '../recipes/useRecipes'

type KpiProps = {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'warning'
}

function Kpi({ icon: Icon, label, value, hint, tone = 'default' }: KpiProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon
          className={`h-4 w-4 ${
            tone === 'warning' ? 'text-amber-600' : 'text-indigo-600'
          }`}
          aria-hidden="true"
        />
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

type Step = {
  title: string
  description: string
  to: string
  cta: string
  done: boolean
}

export function DashboardPage() {
  const { supplies } = useInventory()
  const { recipes } = useRecipes()
  const { records } = useProduction()

  const lowStock = lowStockSupplies(supplies)
  const inventoryValue = supplies.reduce(
    (total, supply) => total + supply.quantity * supply.unitCost,
    0,
  )
  const producedUnits = records.reduce(
    (total, record) => total + record.quantity,
    0,
  )

  const steps: Step[] = [
    {
      title: 'Carga tus insumos',
      description: 'Anota qué compras, en qué paquete y cuánto cuesta.',
      to: '/inventario',
      cta: 'Ir a Inventario',
      done: supplies.length > 0,
    },
    {
      title: 'Crea una receta',
      description: 'Indica qué insumos usa y cuántas unidades rinde.',
      to: '/recetas',
      cta: 'Ir a Recetas',
      done: recipes.length > 0,
    },
    {
      title: 'Registra la producción',
      description: 'La app descuenta los insumos y calcula el costo.',
      to: '/produccion',
      cta: 'Ir a Producción',
      done: records.length > 0,
    },
  ]
  const completed = steps.filter((step) => step.done).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={House}
        title="Inicio"
        description="Tu inventario y tu producción de un vistazo. Empieza por el paso que tengas pendiente."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={Wallet}
          label="Valor del inventario"
          value={`$${formatAmount(inventoryValue)}`}
          hint={`${supplies.length} insumo${supplies.length === 1 ? '' : 's'}`}
        />
        <Kpi
          icon={TriangleAlert}
          label="Por reponer"
          value={String(lowStock.length)}
          hint={lowStock.length === 0 ? 'Todo en orden' : 'Revisa la lista de compras'}
          tone={lowStock.length > 0 ? 'warning' : 'default'}
        />
        <Kpi
          icon={ChefHat}
          label="Recetas"
          value={String(recipes.length)}
          hint={recipes.length === 0 ? 'Aún no hay recetas' : 'Listas para producir'}
        />
        <Kpi
          icon={Gauge}
          label="Unidades producidas"
          value={formatAmount(producedUnits)}
          hint={`${records.length} registro${records.length === 1 ? '' : 's'}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Tus primeros pasos
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {completed} de {steps.length} completados
            </p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completed}
            aria-label="Progreso de configuración"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>

          <ol className="mt-4 flex flex-col divide-y divide-slate-100">
            {steps.map((step, index) => (
              <li
                key={step.to}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step.done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  {step.done ? (
                    <CircleCheck className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {step.title}
                    {step.done ? (
                      <span className="ml-1.5 text-xs font-normal text-emerald-700">
                        Hecho
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
                <Link
                  to={step.to}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {step.done ? 'Revisar' : step.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-4">
          {lowStock.length > 0 ? (
            <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Hay {lowStock.length} insumo
                {lowStock.length === 1 ? '' : 's'} por reponer
              </h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-amber-900">
                {lowStock.slice(0, 4).map((supply) => (
                  <li key={supply.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{supply.name}</span>
                    <span className="shrink-0 text-xs">
                      mínimo {formatQuantity(supply.minStock, supply.unit)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/inventario"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
              >
                Ver lista de compras
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Acciones rápidas
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                to="/inventario"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 max-md:min-h-11"
              >
                <Boxes className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                Agregar o ajustar insumos
              </Link>
              <Link
                to="/produccion"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 max-md:min-h-11"
              >
                <Factory className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                Registrar producción
              </Link>
            </div>
          </section>
        </div>
      </div>

      {records.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Últimas producciones
            </h2>
            <Link
              to="/produccion"
              className="text-xs font-semibold text-indigo-700 hover:underline"
            >
              Ver todo
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {records.slice(0, 4).map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
              >
                <span className="font-medium text-slate-900">
                  {record.recipeName}
                </span>
                <span className="text-xs text-slate-500">
                  {formatQuantity(record.quantity, 'unidad')} ·{' '}
                  {new Date(record.producedAt).toLocaleDateString('es-ES')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DataBackup
        supplies={supplies}
        recipesCount={recipes.length}
        productionCount={records.length}
      />
    </div>
  )
}
