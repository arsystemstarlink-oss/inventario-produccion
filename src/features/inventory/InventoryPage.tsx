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
    updateSupply,
    removeSupply,
    error,
    clearError,
  } = useInventory()
  const [editing, setEditing] = useState<Supply | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Supply | null>(null)
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(
    null,
  )
  const dismissNotice = useCallback(() => setNotice(null), [])
  const lowStockCount = lowStockSupplies(supplies).length

  const showNotice = (message: string) => setNotice({ id: Date.now(), message })

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
    const name = pendingDelete.name
    const removed = removeSupply(pendingDelete.id)
    if (editing?.id === pendingDelete.id) setEditing(null)
    setPendingDelete(null)
    if (removed) showNotice(`Insumo "${name}" eliminado.`)
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
        />
      </div>

      <ShoppingList supplies={supplies} />

      {notice ? (
        <Toast
          key={notice.id}
          message={notice.message}
          onDismiss={dismissNotice}
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
