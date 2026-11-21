import { ChefHat } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Recipe } from '../../types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorBanner } from '../../components/ErrorBanner'
import { GuideBanner } from '../../components/GuideBanner'
import { PageHeader } from '../../components/PageHeader'
import { Toast } from '../../components/Toast'
import { useInventory } from '../inventory/useInventory'
import { RecipeForm } from './RecipeForm'
import { RecipeTable } from './RecipeTable'
import { useRecipes } from './useRecipes'

export function RecipesPage() {
  const {
    supplies,
    createSupply,
    error: inventoryError,
    clearError: clearInventoryError,
  } = useInventory()
  const {
    recipes,
    addRecipe,
    restoreRecipe,
    updateRecipe,
    removeRecipe,
    error,
    clearError,
  } = useRecipes()
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null)
  const [notice, setNotice] = useState<{
    id: number
    message: string
    undo?: () => void
  } | null>(null)
  const dismissNotice = useCallback(() => setNotice(null), [])

  const showNotice = (message: string, undo?: () => void) =>
    setNotice({ id: Date.now(), message, undo })

  const focusForm = () => {
    const input = document.getElementById('recipe-name')
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input?.focus({ preventScroll: true })
  }

  const handleSave = (draft: Parameters<typeof addRecipe>[0]) => {
    if (editing) {
      const saved = updateRecipe(editing.id, draft)
      if (saved) {
        setEditing(null)
        showNotice(`Receta "${draft.name}" actualizada.`)
      }
      return saved
    }
    const saved = addRecipe(draft)
    if (saved) showNotice(`Receta "${draft.name}" agregada.`)
    return saved
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    const deleted = pendingDelete
    const removed = removeRecipe(deleted.id)
    if (editing?.id === deleted.id) setEditing(null)
    setPendingDelete(null)
    if (removed) {
      showNotice(`Receta "${deleted.name}" eliminada.`, () =>
        restoreRecipe(deleted),
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ChefHat}
        title="Recetas"
        description="Define qué produce cada receta, cuántas unidades rinde y qué insumos usa. Los costos salen del inventario."
      />

      {supplies.length === 0 ? (
        <GuideBanner
          title="Primero carga tus insumos"
          action={{ to: '/inventario', label: 'Ir a Inventario' }}
        >
          Las recetas se arman con insumos del inventario. Carga al menos uno
          para poder crear la primera receta.
        </GuideBanner>
      ) : recipes.length === 0 ? (
        <GuideBanner title="Paso 2 · Crea tu primera receta">
          Por ejemplo, un pan que rinde 20 unidades y usa 500 g de harina. La
          app calcula el costo del lote y por unidad.
        </GuideBanner>
      ) : null}

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {inventoryError ? (
        <ErrorBanner
          message={inventoryError}
          onDismiss={clearInventoryError}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,420px)_1fr] lg:items-start">
        <RecipeForm
          key={editing?.id ?? 'new'}
          recipes={recipes}
          supplies={supplies}
          editing={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onCreateSupply={createSupply}
        />
        <RecipeTable
          recipes={recipes}
          supplies={supplies}
          onEdit={setEditing}
          onDelete={setPendingDelete}
          onCreate={focusForm}
        />
      </div>

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
          title="Eliminar receta"
          message={`¿Seguro que quieres eliminar "${pendingDelete.name}"? El historial de producción ya registrado se conservará.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  )
}
