import { Trash2 } from 'lucide-react'
import type { ProductionRecord } from '../../types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { formatDate } from '../../lib/format'
import { formatQuantity } from '../../lib/units'
import { Money } from '../exchange/Money'

type ProductionTableProps = {
  records: ProductionRecord[]
  onDelete: (record: ProductionRecord) => void
}

function recordCost(record: ProductionRecord): number {
  return record.consumed.reduce(
    (total, ingredient) => total + ingredient.quantity * ingredient.unitCost,
    0,
  )
}

export function ProductionTable({ records, onDelete }: ProductionTableProps) {
  if (records.length === 0) {
    return <EmptyState message="No hay producciones registradas." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
      <table className="stacked-table w-full text-left text-sm md:min-w-[700px]">
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
          {records.map((record) => (
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
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    className="gap-1.5 max-md:w-full"
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
    </div>
  )
}
