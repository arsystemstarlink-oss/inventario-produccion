import {
  ClipboardCheck,
  Factory,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type {
  ProductionDraft,
  ProductionFormValues,
  Recipe,
  Supply,
} from '../../types'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { SuccessBanner } from '../../components/SuccessBanner'
import { formatUSD, formatVES } from '../../lib/currency'
import { parseDecimal } from '../../lib/number'
import { formatQuantity } from '../../lib/units'
import { useExchangeRate } from '../exchange/useExchangeRate'
import {
  calculateRequirements,
  hasProblems,
  hasShortage,
  productionCapacity,
  requirementsCost,
  toConsumedIngredients,
} from './logic'
import { hasErrors, toProducedQuantity, validateProduction } from './validation'
import { pickVisible, useTouchedFields } from '../../lib/touched'

const emptyValues: ProductionFormValues = { recipeId: '', quantity: '' }

type ProductionFormProps = {
  recipes: Recipe[]
  supplies: Supply[]
  onRegister: (draft: ProductionDraft) => boolean
}

export function ProductionForm({
  recipes,
  supplies,
  onRegister,
}: ProductionFormProps) {
  const [values, setValues] = useState<ProductionFormValues>(emptyValues)
  const { touch, isVisible, markSubmitted, reset } = useTouchedFields()
  const allErrors = validateProduction(values)
  const errors = pickVisible(allErrors, isVisible)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { rate } = useExchangeRate()

  const selectedRecipe =
    recipes.find((recipe) => recipe.id === values.recipeId) ?? null
  const capacity = selectedRecipe
    ? productionCapacity(selectedRecipe, supplies)
    : null
  const quantity = parseDecimal(values.quantity)
  const requirements =
    selectedRecipe && quantity !== null && quantity > 0
      ? calculateRequirements(selectedRecipe, quantity, supplies)
      : []
  const problems = hasProblems(requirements)
  const missingSupply = requirements.some(
    (requirement) => requirement.problem === 'missing',
  )
  const incompatibleUnit = requirements.some(
    (requirement) => requirement.problem === 'incompatible',
  )
  const shortage = hasShortage(requirements)
  const totalCost =
    requirements.length > 0 && !problems
      ? requirementsCost(requirements)
      : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    markSubmitted()
    setSubmitError(null)
    setSuccessMessage(null)
    if (hasErrors(allErrors)) return

    if (!selectedRecipe) {
      setSubmitError('La receta seleccionada ya no existe.')
      return
    }
    if (missingSupply) {
      setSubmitError(
        'Algún insumo de la receta ya no está en el inventario. Actualiza la receta antes de producir.',
      )
      return
    }
    if (incompatibleUnit) {
      setSubmitError(
        'La unidad de algún ingrediente no es compatible con la del insumo. Actualiza la receta antes de producir.',
      )
      return
    }
    if (shortage) {
      setSubmitError(
        'No hay existencias suficientes para esta producción. Ajusta la cantidad o repón el inventario.',
      )
      return
    }

    const consumed = toConsumedIngredients(requirements)
    if (!consumed) {
      setSubmitError(
        'No se pudieron calcular los insumos de la receta. Actualízala antes de producir.',
      )
      return
    }

    const saved = onRegister({
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      quantity: toProducedQuantity(values),
      producedAt: new Date().toISOString(),
      consumed,
    })

    if (saved) {
      setSuccessMessage(
        `Se registraron ${formatQuantity(
          toProducedQuantity(values),
          'unidad',
        )} de ${selectedRecipe.name} y se descontaron los insumos del inventario.`,
      )
      setValues(emptyValues)
      reset()
      setSubmitError(null)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Factory className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        Registrar producción
      </h2>

      {successMessage ? (
        <div className="mt-3">
          <SuccessBanner
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        </div>
      ) : null}

      {recipes.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Primero crea una receta en la sección Recetas para poder registrar
          producción.
        </p>
      ) : null}

      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Select
          id="production-recipe"
          label="Receta"
          value={values.recipeId}
          error={errors.recipeId}
          onBlur={() => touch('recipeId')}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              recipeId: event.target.value,
            }))
          }
        >
          <option value="">Selecciona una receta</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name} (rinde {formatQuantity(recipe.outputQuantity, 'unidad')})
            </option>
          ))}
        </Select>

        <Input
          id="production-quantity"
          label="Cantidad a producir"
          suffix="unidades"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="0"
          value={values.quantity}
          error={errors.quantity}
          onBlur={() => touch('quantity')}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              quantity: event.target.value,
            }))
          }
        />
        <p className="-mt-2 text-xs text-slate-500">
          Escribe cuántas unidades quieres producir. Usa el máximo sugerido
          para aprovechar todo el stock disponible.
        </p>

        {selectedRecipe ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span>
              Rendimiento base: {formatQuantity(selectedRecipe.outputQuantity, 'unidad')}
              {capacity
                ? ` · Con el stock actual puedes producir hasta ${formatQuantity(
                    capacity.maxUnits,
                    'unidad',
                  )}`
                : ' · No se puede calcular la capacidad con el inventario actual'}
            </span>
            {capacity && capacity.maxUnits > 0 ? (
              <Button
                variant="secondary"
                className="gap-1.5"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    quantity: String(capacity.maxUnits),
                  }))
                }
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Usar máximo
              </Button>
            ) : null}
          </div>
        ) : null}

        {requirements.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Materiales necesarios
            </h3>
            <div className="overflow-x-auto rounded-md border border-slate-200 max-md:overflow-visible max-md:border-0">
              <table className="stacked-table w-full text-left text-xs md:min-w-[420px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Insumo
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Necesario
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Disponible
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      Faltante
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requirements.map((requirement) => (
                    <tr
                      key={requirement.supplyId}
                      className={
                        requirement.shortage > 0 || requirement.problem
                          ? 'text-red-700'
                          : 'text-slate-700'
                      }
                    >
                      <td
                        data-label="Insumo"
                        data-primary
                        className="px-3 py-2 font-medium"
                      >
                        {requirement.supply
                          ? requirement.supply.name
                          : 'Insumo no disponible'}
                        {requirement.problem === 'incompatible' ? (
                          <span className="block font-normal">
                            Unidad incompatible
                          </span>
                        ) : null}
                      </td>
                      <td data-label="Necesario" className="px-3 py-2 text-right">
                        {requirement.problem === 'missing'
                          ? formatQuantity(
                              requirement.recipeQuantity,
                              requirement.recipeUnit,
                            )
                          : formatQuantity(
                              requirement.quantity,
                              requirement.supply?.unit ?? requirement.recipeUnit,
                            )}
                      </td>
                      <td data-label="Disponible" className="px-3 py-2 text-right">
                        {requirement.supply
                          ? formatQuantity(
                              requirement.available,
                              requirement.supply.unit,
                            )
                          : '—'}
                      </td>
                      <td
                        data-label="Faltante"
                        className="px-3 py-2 text-right font-medium"
                      >
                        {requirement.shortage > 0 && requirement.supply
                          ? formatQuantity(
                              requirement.shortage,
                              requirement.supply.unit,
                            )
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalCost !== null ? (
              <p className="text-xs text-slate-600">
                Costo estimado de insumos: {formatUSD(totalCost)}
                {rate !== null
                  ? ` (${formatVES(totalCost * rate)})`
                  : ''}
              </p>
            ) : null}
            {shortage ? (
              <p role="alert" className="text-xs text-red-600">
                Faltan insumos para cubrir esta producción.
              </p>
            ) : null}
          </div>
        ) : null}

        {submitError ? <ErrorBanner message={submitError} /> : null}

        <div>
          <Button type="submit" className="gap-1.5" disabled={recipes.length === 0}>
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Registrar producción
          </Button>
        </div>
      </form>
    </section>
  )
}
