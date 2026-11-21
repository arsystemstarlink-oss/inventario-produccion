import { Gauge } from 'lucide-react'
import type { Recipe, Supply } from '../../types'
import { EmptyState } from '../../components/EmptyState'
import { formatQuantity } from '../../lib/units'
import { productionCapacity } from './logic'

type ProductionPlannerProps = {
  recipes: Recipe[]
  supplies: Supply[]
}

export function ProductionPlanner({
  recipes,
  supplies,
}: ProductionPlannerProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Gauge className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        Planificador de producción
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Capacidad máxima de cada receta con las existencias actuales.
      </p>

      {recipes.length === 0 ? (
        <div className="mt-4">
          <EmptyState message="No hay recetas para planificar." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 max-md:overflow-visible max-md:border-0">
          <table className="stacked-table w-full text-left text-sm md:min-w-[560px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Receta
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Rendimiento base
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Máximo producible
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Insumo limitante
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.map((recipe) => {
                const capacity = productionCapacity(recipe, supplies)
                return (
                  <tr key={recipe.id} className="text-slate-700">
                    <td
                      data-label="Receta"
                      data-primary
                      className="px-4 py-2 font-medium text-slate-900"
                    >
                      {recipe.name}
                    </td>
                    <td data-label="Rendimiento base" className="px-4 py-2 text-right">
                      {formatQuantity(recipe.outputQuantity, 'unidad')}
                    </td>
                    <td
                      data-label="Máximo producible"
                      className={`px-4 py-2 text-right font-medium ${
                        capacity && capacity.maxUnits === 0
                          ? 'text-red-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {capacity
                        ? formatQuantity(capacity.maxUnits, 'unidad')
                        : '—'}
                    </td>
                    <td data-label="Insumo limitante" className="px-4 py-2">
                      {capacity?.limitingSupply
                        ? capacity.limitingSupply.name
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
