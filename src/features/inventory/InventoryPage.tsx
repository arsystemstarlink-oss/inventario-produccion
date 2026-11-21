import { Boxes } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Supply } from '../../types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorBanner } from '../../components/ErrorBanner'
import { GuideBanner } from '../../components/GuideBanner'
import { PageHeader } from '../../components/PageHeader'
import { Toast } from '../../components/Toast'
import { ShoppingList } from './ShoppingList'
import { SupplyForm } from './SupplyForm'
import { SupplyTable } from './SupplyTable'
import { useInventory } from './useInventory'
import { lowStockSupplies } from './stock'

export function InventoryPage() {
  const {
    supplies,
    addSupply,
    restoreSupply,
    updateSupply,
    removeSupply,
    adjustStock,
    error,
    clearError,
  } = useInventory()
  const [editing, setEditing] = useState<Supply | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Supply | null>(null)
  const [notice, setNotice] = useState<{
    id: number
    message: string
    undo?: () => void
  } | null>(null)
  const dismissNotice = useCallback(() => setNotice(null), [])
  const lowStockCount = lowStockSupplies(supplies).length

  const showNotice = (message: string, undo?: () => void) =>
    setNotice({ id: Date.now(), message, undo })

  const focusForm = () => {
    const input = document.getElementById('supply-name')
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input?.focus({ preventScroll: true })
  }

  const handleAdjust = (supply: Supply, packages: 1 | -1) => {
    const size = supply.packageSize > 0 ? supply.packageSize : 1
    const delta = packages * size
    const applied = Math.max(delta, -supply.quantity)
    if (applied === 0) return
    if (!adjustStock([{ supplyId: supply.id, delta: applied }])) return
    showNotice(`Stock de "${supply.name}" actualizado.`, () =>
      adjustStock([{ supplyId: supply.id, delta: -applied }]),
    )
  }

  const handleSave = (draft: Parameters<typeof addSupply>[0]) => {
    if (editing) {
      const saved = updateSupply(editing.id, draft)
      if (saved) {
        setEditing(null)
        showNotice(`Insumo "${draft.name}" actualizado.`)
      }
      return saved
    }
    const saved = addSupply(draft)
    if (saved) showNotice(`Insumo "${draft.name}" agregado.`)
    return saved
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    const deleted = pendingDelete
    const removed = removeSupply(deleted.id)
    if (editing?.id === deleted.id) setEditing(null)
    setPendingDelete(null)
    if (removed) {
      showNotice(`Insumo "${deleted.name}" eliminado.`, () =>
        restoreSupply(deleted),
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Boxes}
        title="Inventario"
        description="Registra los insumos como los compras: paquetes, contenido y costo. Las recetas y la producción descuentan de estas existencias."
      />

      {supplies.length === 0 ? (
        <GuideBanner title="Paso 1 · Carga tus insumos">
          Por ejemplo: 20 paquetes de harina de 500 g a $3 cada uno. La app
          calcula el total disponible y el costo por kg automáticamente.
        </GuideBanner>
      ) : null}

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {lowStockCount > 0 ? (
        <ErrorBanner
          message={`Hay ${lowStockCount} insumo${
            lowStockCount === 1 ? '' : 's'
          } por debajo del stock mínimo. Revisa la lista de compras.`}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-start">
        <SupplyForm
          key={editing?.id ?? 'new'}
          supplies={supplies}
          editing={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
        <SupplyTable
          supplies={supplies}
          onEdit={setEditing}
          onDelete={setPendingDelete}
          onAdjust={handleAdjust}
          onCreate={focusForm}
        />
      </div>

      <ShoppingList supplies={supplies} />

      {notice ? (
        <Toast
          key={notice.id}
          message={notice.message}
          onDismiss={dismissNotice}
          action={
            notice.undo
              ? {
                  label: 'Deshacer',
                  onClick: () => {
                    notice.undo?.()
                    dismissNotice()
                  },
                }
              : undefined
          }
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Eliminar insumo"
          message={`¿Seguro que quieres eliminar "${pendingDelete.name}"? Las recetas que lo usen quedarán con un insumo no disponible.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  )
}
