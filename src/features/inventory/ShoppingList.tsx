import { ShoppingCart } from 'lucide-react'
import type { Supply } from '../../types'
import { formatQuantity } from '../../lib/units'
import { Money } from '../exchange/Money'
import {
  estimatedPurchaseCost,
  formatPackageCount,
  minPackageCount,
  packageCount,
  packagesToBuy,
} from './packaging'
import { lowStockSupplies } from './stock'

type ShoppingListProps = {
  supplies: Supply[]
}

export function ShoppingList({ supplies }: ShoppingListProps) {
  const items = lowStockSupplies(supplies)

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ShoppingCart className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Lista de compras
        </h2>
        <p className="text-xs text-slate-500">
          {items.length === 0
            ? 'Sin reposiciones pendientes'
            : `${items.length} insumo${items.length === 1 ? '' : 's'} por reponer`}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No hay insumos por debajo del stock mínimo.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 max-md:overflow-visible max-md:border-0">
          <table className="stacked-table w-full text-left text-sm md:min-w-[640px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Insumo
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Disponible
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Aviso en
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Comprar
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Costo estimado ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((supply) => (
                <tr key={supply.id} className="text-slate-700">
                  <td
                    data-label="Insumo"
                    data-primary
                    className="px-4 py-2 font-medium text-slate-900"
                  >
                    {supply.name}
                  </td>
                  <td
                    data-label="Disponible"
                    className="px-4 py-2 text-right text-red-700"
                  >
                    <span>{formatPackageCount(packageCount(supply))}</span>
                    <span className="block text-xs text-slate-500">
                      {formatQuantity(supply.quantity, supply.unit)}
                    </span>
                  </td>
                  <td data-label="Aviso en" className="px-4 py-2 text-right">
                    <span>{formatPackageCount(minPackageCount(supply))}</span>
                    <span className="block text-xs text-slate-500">
                      {formatQuantity(supply.minStock, supply.unit)}
                    </span>
                  </td>
                  <td
                    data-label="Comprar"
                    className="px-4 py-2 text-right font-medium text-slate-900"
                  >
                    <span>{formatPackageCount(packagesToBuy(supply))}</span>
                    <span className="block text-xs text-slate-500">
                      de {formatQuantity(supply.packageSize, supply.unit)}
                    </span>
                  </td>
                  <td data-label="Costo estimado ($)" className="px-4 py-2 text-right">
                    <Money usd={estimatedPurchaseCost(supply)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
