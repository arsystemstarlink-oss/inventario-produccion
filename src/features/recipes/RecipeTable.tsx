import { Pencil, Trash2 } from 'lucide-react'
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
}

export function RecipeTable({
  recipes,
  supplies,
  onEdit,
  onDelete,
}: RecipeTableProps) {
  if (recipes.length === 0) {
    return <EmptyState message="No hay recetas registradas." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
      <table className="stacked-table w-full text-left text-sm md:min-w-[640px]">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Receta
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Rendimiento
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
          {recipes.map((recipe) => {
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
                <td data-label="Rendimiento" className="px-4 py-3 text-right">
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
                <td data-label="Costo del lote ($)" className="px-4 py-3 text-right">
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
    </div>
  )
}
