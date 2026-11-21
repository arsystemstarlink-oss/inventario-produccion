import {
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { Supply } from '../../types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { formatUSD } from '../../lib/currency'
import { formatQuantity } from '../../lib/units'
import { Money } from '../exchange/Money'
import {
  costPerDisplayUnit,
  displayUnitLabel,
  formatPackageCount,
  minPackageCount,
  packageCount,
} from './packaging'
import { isLowStock } from './stock'

type SupplyTableProps = {
  supplies: Supply[]
  onEdit: (supply: Supply) => void
  onDelete: (supply: Supply) => void
  onAdjust: (supply: Supply, packages: 1 | -1) => void
  onCreate: () => void
}

export function SupplyTable({
  supplies,
  onEdit,
  onDelete,
  onAdjust,
  onCreate,
}: SupplyTableProps) {
  const [query, setQuery] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  if (supplies.length === 0) {
    return (
      <EmptyState
        message="Todavía no tienes insumos. Agrega el primero con el formulario."
        actionLabel="Agregar mi primer insumo"
        onAction={onCreate}
      />
    )
  }

  const term = query.trim().toLowerCase()
  const visible = supplies
    .filter(
      (supply) =>
        (!onlyLow || isLowStock(supply)) &&
        (!term || supply.name.toLowerCase().includes(term)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const filtered = term !== '' || onlyLow

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            aria-label="Buscar insumo"
            placeholder="Buscar insumo…"
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
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm sm:min-h-0">
          <input
            type="checkbox"
            checked={onlyLow}
            onChange={(event) => setOnlyLow(event.target.checked)}
            className="h-4 w-4 cursor-pointer accent-indigo-600"
          />
          Solo reponer
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message="No hay insumos que coincidan con la búsqueda."
          actionLabel="Limpiar filtros"
          onAction={() => {
            setQuery('')
            setOnlyLow(false)
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
          <table className="stacked-table w-full text-left text-sm md:min-w-[860px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Insumo
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Paquete
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Disponible
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Aviso en
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Costos ($)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Valor total ($)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((supply) => (
                <tr
                  key={supply.id}
                  className={
                    isLowStock(supply)
                      ? 'bg-red-50 text-slate-700'
                      : 'text-slate-700'
                  }
                >
                  <td
                    data-label="Insumo"
                    data-primary
                    className="px-4 py-3 font-medium text-slate-900"
                  >
                    {supply.name}
                  </td>
                  <td data-label="Paquete" className="px-4 py-3">
                    {formatQuantity(supply.packageSize, supply.unit)} por paquete
                  </td>
                  <td data-label="Disponible" className="px-4 py-3 text-right">
                    <span
                      className={
                        isLowStock(supply)
                          ? 'font-medium text-red-700'
                          : undefined
                      }
                    >
                      {formatPackageCount(packageCount(supply))}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {formatQuantity(supply.quantity, supply.unit)} en total
                    </span>
                    {isLowStock(supply) ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                        Reponer
                      </span>
                    ) : null}
                    <div className="mt-2 flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="h-8 px-2"
                        aria-label={`Restar un paquete de ${supply.name}`}
                        disabled={packageCount(supply) <= 0}
                        onClick={() => onAdjust(supply, -1)}
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2"
                        aria-label={`Sumar un paquete de ${supply.name}`}
                        onClick={() => onAdjust(supply, 1)}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                  <td data-label="Aviso en" className="px-4 py-3 text-right">
                    {supply.minStock > 0 ? (
                      <>
                        <span>{formatPackageCount(minPackageCount(supply))}</span>
                        <span className="block text-xs text-slate-500">
                          {formatQuantity(supply.minStock, supply.unit)} en total
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Sin aviso</span>
                    )}
                  </td>
                  <td data-label="Costos ($)" className="px-4 py-3 text-right">
                    <Money usd={supply.packageCost} suffix="/paquete" />
                    <span className="mt-1 block text-xs text-slate-500">
                      {formatUSD(costPerDisplayUnit(supply))} /
                      {displayUnitLabel(supply)}
                    </span>
                  </td>
                  <td
                    data-label="Valor total ($)"
                    className="px-4 py-3 text-right font-medium text-slate-900"
                  >
                    <Money usd={supply.packageCost * packageCount(supply)} />
                  </td>
                  <td
                    data-label="Acciones"
                    className="cell-actions px-4 py-3"
                  >
                    <div className="flex justify-end gap-2 max-md:grid max-md:grid-cols-2">
                      <Button
                        variant="secondary"
                        className="gap-1.5"
                        aria-label={`Editar ${supply.name}`}
                        onClick={() => onEdit(supply)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="gap-1.5"
                        aria-label={`Eliminar ${supply.name}`}
                        onClick={() => onDelete(supply)}
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
          {filtered ? (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Mostrando {visible.length} de {supplies.length} insumo
              {supplies.length === 1 ? '' : 's'}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
