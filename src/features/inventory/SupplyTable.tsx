import { Pencil, Trash2, TriangleAlert } from 'lucide-react'
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
}

export function SupplyTable({ supplies, onEdit, onDelete }: SupplyTableProps) {
  if (supplies.length === 0) {
    return <EmptyState message="No hay insumos registrados." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
      <table className="stacked-table w-full text-left text-sm md:min-w-[860px]">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Insumo
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Presentación
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Disponible
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Stock mínimo
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
          {supplies.map((supply) => (
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
              <td data-label="Presentación" className="px-4 py-3">
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
              </td>
              <td data-label="Stock mínimo" className="px-4 py-3 text-right">
                {supply.minStock > 0 ? (
                  <>
                    <span>{formatPackageCount(minPackageCount(supply))}</span>
                    <span className="block text-xs text-slate-500">
                      {formatQuantity(supply.minStock, supply.unit)} en total
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500">Sin mínimo</span>
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
    </div>
  )
}
