import { NotebookPen, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Recipe,
  RecipeDraft,
  RecipeFormValues,
  RecipeIngredientValues,
  Supply,
} from '../../types'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { formatUSD } from '../../lib/currency'
import {
  areUnitsCompatible,
  compatibleUnits,
  convert,
  formatQuantity,
  UNIT_OPTIONS,
} from '../../lib/units'
import { parseDecimal } from '../../lib/number'
import {
  formatPackageCount,
  packageCount,
} from '../inventory/packaging'
import { hasErrors, toRecipeDraft, validateRecipe } from './validation'
import { pickVisible, useTouchedFields } from '../../lib/touched'

const emptyRow: RecipeIngredientValues = {
  supplyId: '',
  quantity: '',
  unit: 'g',
}

const emptyValues: RecipeFormValues = {
  name: '',
  outputQuantity: '',
  ingredients: [emptyRow],
}

type RecipeFormProps = {
  recipes: Recipe[]
  supplies: Supply[]
  editing: Recipe | null
  onSave: (draft: RecipeDraft) => boolean
  onCancel: () => void
}

export function RecipeForm({
  recipes,
  supplies,
  editing,
  onSave,
  onCancel,
}: RecipeFormProps) {
  const [values, setValues] = useState<RecipeFormValues>(() =>
    editing
      ? {
          name: editing.name,
          outputQuantity: String(editing.outputQuantity),
          ingredients: editing.ingredients.map((ingredient) => {
            const supply = supplies.find(
              (item) => item.id === ingredient.supplyId,
            )
            const unit =
              ingredient.unit &&
              (!supply || areUnitsCompatible(ingredient.unit, supply.unit))
                ? ingredient.unit
                : supply?.unit ?? ingredient.unit ?? 'unidad'
            return {
              supplyId: ingredient.supplyId,
              quantity: String(ingredient.quantity),
              unit,
            }
          }),
        }
      : { ...emptyValues, ingredients: [{ ...emptyRow }] },
  )
  const sectionRef = useRef<HTMLElement>(null)
  const { touch, isVisible, markSubmitted, reset } = useTouchedFields()
  const allErrors = validateRecipe(values, recipes, supplies, editing?.id)
  const errors = pickVisible(
    {
      name: allErrors.name,
      outputQuantity: allErrors.outputQuantity,
      ingredients: allErrors.ingredients,
    },
    isVisible,
  )

  useEffect(() => {
    if (!editing) return
    const section = sectionRef.current
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    section
      .querySelector<HTMLInputElement>('input')
      ?.focus({ preventScroll: true })
  }, [editing])

  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredientValues,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, position) =>
        position === index ? { ...ingredient, [field]: value } : ingredient,
      ),
    }))
  }

  const updateSupply = (index: number, supplyId: string) => {
    const supply = supplies.find((item) => item.id === supplyId)
    setValues((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, position) => {
        if (position !== index) return ingredient
        if (!supply) return { ...ingredient, supplyId }
        const unit = areUnitsCompatible(ingredient.unit, supply.unit)
          ? ingredient.unit
          : supply.unit
        return { ...ingredient, supplyId, unit }
      }),
    }))
  }

  const addIngredient = () => {
    setValues((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ...emptyRow }],
    }))
  }

  const removeIngredient = (index: number) => {
    setValues((current) => ({
      ...current,
      ingredients: current.ingredients.filter(
        (_, position) => position !== index,
      ),
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    markSubmitted()
    if (hasErrors(allErrors)) return

    const saved = onSave(toRecipeDraft(values))
    if (saved && !editing) {
      setValues({ ...emptyValues, ingredients: [{ ...emptyRow }] })
      reset()
    }
  }

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-36 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <NotebookPen className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        {editing ? 'Editar receta' : 'Nueva receta'}
      </h2>
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="recipe-name"
          label="Nombre de la receta"
          placeholder="Ej. Pan de masa madre"
          value={values.name}
          error={errors.name}
          onBlur={() => touch('name')}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
        <div className="flex flex-col gap-1">
          <Input
            id="recipe-output"
            label="Rendimiento (unidades)"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="Ej. 20"
            value={values.outputQuantity}
            error={errors.outputQuantity}
            onBlur={() => touch('outputQuantity')}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                outputQuantity: event.target.value,
              }))
            }
          />
          <p className="text-xs text-slate-500">
            ¿Cuántas unidades salen de esta receta? Ejemplo: 20 panes.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-700">
            Ingredientes
          </legend>
          <p className="text-xs text-slate-500">
            Puedes usar una unidad distinta a la del inventario: se convierte
            automáticamente.
          </p>
          {values.ingredients.map((ingredient, index) => {
            const rowErrors = isVisible(`row-${index}`)
              ? allErrors.ingredientRows?.[index]
              : undefined
            const supply = supplies.find(
              (item) => item.id === ingredient.supplyId,
            )
            const unitOptions = supply
              ? compatibleUnits(supply.unit)
              : UNIT_OPTIONS.map((option) => option.value)
            const amount = parseDecimal(ingredient.quantity)
            const converted =
              supply &&
              amount !== null &&
              amount > 0 &&
              supply.unit !== ingredient.unit
                ? convert(amount, ingredient.unit, supply.unit)
                : null
            return (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ingrediente {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    className="gap-1.5 px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Quitar ingrediente ${index + 1}`}
                    disabled={values.ingredients.length === 1}
                    onClick={() => removeIngredient(index)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Quitar
                  </Button>
                </div>
                <Select
                  id={`recipe-ingredient-${index}`}
                  label="Insumo"
                  value={ingredient.supplyId}
                  error={rowErrors?.supplyId}
                  onBlur={() => touch(`row-${index}`)}
                  onChange={(event) => updateSupply(index, event.target.value)}
                >
                  <option value="">Selecciona un insumo</option>
                  {supplies.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {formatQuantity(option.packageSize, option.unit)}{' '}
                      por paquete · {formatPackageCount(packageCount(option))}
                    </option>
                  ))}
                </Select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id={`recipe-ingredient-quantity-${index}`}
                    label="Cantidad"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="0"
                    value={ingredient.quantity}
                    error={rowErrors?.quantity}
                    onBlur={() => touch(`row-${index}`)}
                    onChange={(event) =>
                      updateIngredient(index, 'quantity', event.target.value)
                    }
                  />
                  <Select
                    id={`recipe-ingredient-unit-${index}`}
                    label="Unidad"
                    value={ingredient.unit}
                    error={rowErrors?.unit}
                    onBlur={() => touch(`row-${index}`)}
                    onChange={(event) =>
                      updateIngredient(index, 'unit', event.target.value)
                    }
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {UNIT_OPTIONS.find((option) => option.value === unit)
                          ?.label ?? unit}
                      </option>
                    ))}
                  </Select>
                </div>
                {supply ? (
                  <div className="flex flex-col gap-1 text-xs text-slate-500">
                    <p>
                      Disponible: {formatQuantity(supply.quantity, supply.unit)}{' '}
                      ({formatPackageCount(packageCount(supply))} de{' '}
                      {formatQuantity(supply.packageSize, supply.unit)} c/u ·
                      costo {formatUSD(supply.packageCost)} por paquete)
                    </p>
                    {converted !== null ? (
                      <p className="font-medium text-indigo-700">
                        Se descontarán {formatQuantity(converted, supply.unit)}{' '}
                        del inventario.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Al elegir el insumo, la unidad se ajusta a la del inventario
                    si no es compatible.
                  </p>
                )}
              </div>
            )
          })}
          {errors.ingredients ? (
            <p role="alert" className="text-xs text-red-600">
              {errors.ingredients}
            </p>
          ) : null}
          <div>
            <Button variant="secondary" className="gap-1.5" onClick={addIngredient}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar ingrediente
            </Button>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            className="gap-1.5 max-sm:flex-1"
            disabled={supplies.length === 0}
          >
            {editing ? (
              <Save className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {editing ? 'Guardar cambios' : 'Agregar receta'}
          </Button>
          {editing ? (
            <Button variant="secondary" className="gap-1.5" onClick={onCancel}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
