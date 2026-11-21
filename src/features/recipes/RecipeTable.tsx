import { Pencil, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Recipe, Supply } from '../../types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { formatQuantity } from '../../lib/units'
import { Money } from '../exchange/Money'
import { recipeBatchCost, recipeUnitCost } from './cost'

type RecipeTableProps = {
  recipes: Recipe[]
  supplies: Supply[]
  onEdit: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
  onCreate: () => void
}

export function RecipeTable({
  recipes,
  supplies,
  onEdit,
  onDelete,
  onCreate,
}: RecipeTableProps) {
  const [query, setQuery] = useState('')

  if (recipes.length === 0) {
    return (
      <EmptyState
        message="Todavía no tienes recetas. Crea la primera para poder producir."
        actionLabel="Crear mi primera receta"
        onAction={onCreate}
      />
    )
  }

  const term = query.trim().toLowerCase()
  const visible = recipes.filter((recipe) => {
    if (!term) return true
    if (recipe.name.toLowerCase().includes(term)) return true
    return recipe.ingredients.some((ingredient) => {
      const supply = supplies.find((item) => item.id === ingredient.supplyId)
      return supply?.name.toLowerCase().includes(term) ?? false
    })
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          aria-label="Buscar receta"
          placeholder="Buscar por receta o insumo…"
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:py-2 sm:text-sm"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message="No hay recetas que coincidan con la búsqueda."
          actionLabel="Limpiar búsqueda"
          onAction={() => setQuery('')}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
          <table className="stacked-table w-full text-left text-sm md:min-w-[640px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Receta
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Rinde
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Ingredientes
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Costo del lote ($)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Costo por unidad ($)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((recipe) => {
                const batchCost = recipeBatchCost(recipe, supplies)
                const unitCost = recipeUnitCost(recipe, supplies)
                return (
                  <tr key={recipe.id} className="text-slate-700">
                    <td
                      data-label="Receta"
                      data-primary
                      className="px-4 py-3 font-medium text-slate-900"
                    >
                      {recipe.name}
                    </td>
                    <td data-label="Rinde" className="px-4 py-3 text-right">
                      {formatQuantity(recipe.outputQuantity, 'unidad')}
                    </td>
                    <td
                      data-label="Ingredientes"
                      className="cell-stack px-4 py-3"
                    >
                      <ul className="list-inside list-disc">
                        {recipe.ingredients.map((ingredient, index) => {
                          const supply = supplies.find(
                            (item) => item.id === ingredient.supplyId,
                          )
                          return (
                            <li key={`${ingredient.supplyId}-${index}`}>
                              {supply
                                ? `${supply.name}: ${formatQuantity(
                                    ingredient.quantity,
                                    ingredient.unit ?? supply.unit,
                                  )}`
                                : 'Insumo no disponible'}
                            </li>
                          )
                        })}
                      </ul>
                    </td>
                    <td
                      data-label="Costo del lote ($)"
                      className="px-4 py-3 text-right"
                    >
                      {batchCost === null ? '—' : <Money usd={batchCost} />}
                    </td>
                    <td
                      data-label="Costo por unidad ($)"
                      className="px-4 py-3 text-right font-medium text-slate-900"
                    >
                      {unitCost === null ? '—' : <Money usd={unitCost} />}
                    </td>
                    <td data-label="Acciones" className="cell-actions px-4 py-3">
                      <div className="flex justify-end gap-2 max-md:grid max-md:grid-cols-2">
                        <Button
                          variant="secondary"
                          className="gap-1.5"
                          aria-label={`Editar ${recipe.name}`}
                          onClick={() => onEdit(recipe)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          className="gap-1.5"
                          aria-label={`Eliminar ${recipe.name}`}
                          onClick={() => onDelete(recipe)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {term ? (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Mostrando {visible.length} de {recipes.length} receta
              {recipes.length === 1 ? '' : 's'}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
