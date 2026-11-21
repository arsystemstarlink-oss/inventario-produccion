import { RotateCcw, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { ProductionRecord } from '../../types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { formatDate } from '../../lib/format'
import { formatQuantity } from '../../lib/units'
import { Money } from '../exchange/Money'

type ProductionTableProps = {
  records: ProductionRecord[]
  onDelete: (record: ProductionRecord) => void
  onRepeat: (record: ProductionRecord) => void
}

function recordCost(record: ProductionRecord): number {
  return record.consumed.reduce(
    (total, ingredient) => total + ingredient.quantity * ingredient.unitCost,
    0,
  )
}

export function ProductionTable({
  records,
  onDelete,
  onRepeat,
}: ProductionTableProps) {
  const [query, setQuery] = useState('')

  if (records.length === 0) {
    return <EmptyState message="No hay producciones registradas." />
  }

  const term = query.trim().toLowerCase()
  const visible = records.filter(
    (record) =>
      !term ||
      record.recipeName.toLowerCase().includes(term) ||
      record.consumed.some((ingredient) =>
        ingredient.supplyName.toLowerCase().includes(term),
      ),
  )

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
          aria-label="Buscar producción"
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
          message="No hay producciones que coincidan con la búsqueda."
          actionLabel="Limpiar búsqueda"
          onAction={() => setQuery('')}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
          <table className="stacked-table w-full text-left text-sm md:min-w-[760px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Receta
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Cantidad
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Insumos utilizados
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Costo de insumos ($)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((record) => (
                <tr key={record.id} className="text-slate-700">
                  <td data-label="Fecha" className="px-4 py-3">
                    {formatDate(record.producedAt)}
                  </td>
                  <td
                    data-label="Receta"
                    data-primary
                    className="px-4 py-3 font-medium text-slate-900"
                  >
                    {record.recipeName}
                  </td>
                  <td data-label="Cantidad" className="px-4 py-3 text-right">
                    {formatQuantity(record.quantity, 'unidad')}
                  </td>
                  <td
                    data-label="Insumos utilizados"
                    className="cell-stack px-4 py-3"
                  >
                    <ul className="list-inside list-disc">
                      {record.consumed.map((ingredient, index) => (
                        <li key={`${ingredient.supplyId}-${index}`}>
                          {ingredient.supplyName}:{' '}
                          {formatQuantity(ingredient.quantity, ingredient.unit)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td
                    data-label="Costo de insumos ($)"
                    className="px-4 py-3 text-right font-medium text-slate-900"
                  >
                    <Money usd={recordCost(record)} />
                  </td>
                  <td data-label="Acciones" className="cell-actions px-4 py-3">
                    <div className="flex justify-end gap-2 max-md:grid max-md:grid-cols-2">
                      <Button
                        variant="secondary"
                        className="gap-1.5"
                        aria-label={`Repetir producción de ${record.recipeName}`}
                        onClick={() => onRepeat(record)}
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Repetir
                      </Button>
                      <Button
                        variant="danger"
                        className="gap-1.5"
                        aria-label={`Eliminar producción de ${record.recipeName} del ${formatDate(record.producedAt)}`}
                        onClick={() => onDelete(record)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {term ? (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Mostrando {visible.length} de {records.length} registro
              {records.length === 1 ? '' : 's'}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
