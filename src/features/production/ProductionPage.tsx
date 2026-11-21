import { Factory } from 'lucide-react'
import { useState } from 'react'
import type { ProductionRecord } from '../../types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorBanner } from '../../components/ErrorBanner'
import { GuideBanner } from '../../components/GuideBanner'
import { PageHeader } from '../../components/PageHeader'
import { formatDate } from '../../lib/format'
import { useInventory } from '../inventory/useInventory'
import { useRecipes } from '../recipes/useRecipes'
import { ProductionForm } from './ProductionForm'
import { ProductionPlanner } from './ProductionPlanner'
import { ProductionTable } from './ProductionTable'
import { useProduction } from './useProduction'

export function ProductionPage() {
  const inventory = useInventory()
  const recipesHook = useRecipes()
  const production = useProduction()
  const [pendingDelete, setPendingDelete] = useState<ProductionRecord | null>(
    null,
  )

  const handleRegister: Parameters<typeof ProductionForm>[0]['onRegister'] = (
    draft,
  ) => {
    const deducted = inventory.adjustStock(
      draft.consumed.map((ingredient) => ({
        supplyId: ingredient.supplyId,
        delta: -ingredient.quantity,
      })),
    )
    if (!deducted) return false

    const saved = production.addRecord(draft)
    if (!saved) {
      inventory.adjustStock(
        draft.consumed.map((ingredient) => ({
          supplyId: ingredient.supplyId,
          delta: ingredient.quantity,
        })),
      )
    }
    return saved
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return

    const restored = inventory.adjustStock(
      pendingDelete.consumed.map((ingredient) => ({
        supplyId: ingredient.supplyId,
        delta: ingredient.quantity,
      })),
    )
    if (!restored) {
      setPendingDelete(null)
      return
    }

    const removed = production.removeRecord(pendingDelete.id)
    if (!removed) {
      inventory.adjustStock(
        pendingDelete.consumed.map((ingredient) => ({
          supplyId: ingredient.supplyId,
          delta: -ingredient.quantity,
        })),
      )
    }
    setPendingDelete(null)
  }

  const errors = [
    inventory.error,
    recipesHook.error,
    production.error,
  ].filter((message): message is string => message !== null)

  const clearErrors = () => {
    inventory.clearError()
    recipesHook.clearError()
    production.clearError()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Factory}
        title="Producción"
        description="Registra lo producido con una receta. La app calcula los insumos necesarios, valida las existencias y descuenta el inventario."
      />

      {recipesHook.recipes.length === 0 ? (
        <GuideBanner
          title="Primero crea una receta"
          action={{ to: '/recetas', label: 'Ir a Recetas' }}
        >
          La producción se calcula a partir de una receta. Crea una receta con
          sus insumos para empezar.
        </GuideBanner>
      ) : production.records.length === 0 ? (
        <GuideBanner title="Paso 3 · Registra la producción">
          Elige una receta y la cantidad de unidades. Verás los materiales
          necesarios y el stock disponible antes de confirmar.
        </GuideBanner>
      ) : null}

      {errors.length > 0 ? (
        <div className="flex flex-col gap-2">
          {errors.map((message, index) => (
            <ErrorBanner
              key={`${message}-${index}`}
              message={message}
              onDismiss={clearErrors}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,440px)_1fr] lg:items-start">
        <ProductionForm
          recipes={recipesHook.recipes}
          supplies={inventory.supplies}
          onRegister={handleRegister}
        />
        <ProductionTable
          records={production.records}
          onDelete={setPendingDelete}
        />
      </div>

      <ProductionPlanner
        recipes={recipesHook.recipes}
        supplies={inventory.supplies}
      />

      {pendingDelete ? (
        <ConfirmDialog
          title="Eliminar producción"
          message={`¿Seguro que quieres eliminar la producción de "${pendingDelete.recipeName}" del ${formatDate(
            pendingDelete.producedAt,
          )}? Se devolverán los insumos al inventario.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  )
}
