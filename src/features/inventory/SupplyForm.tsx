import { PackagePlus, Pencil, Plus, Save, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Supply, SupplyDraft, SupplyFormValues } from '../../types'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { formatUSD, formatVES, usdToVes } from '../../lib/currency'
import { parseDecimal } from '../../lib/number'
import {
  convert,
  displayCostUnit,
  formatQuantity,
  roundQuantity,
  UNIT_LABELS,
  UNIT_OPTIONS,
} from '../../lib/units'
import { useExchangeRate } from '../exchange/useExchangeRate'
import { formatPackageCount, minPackageCount, packageCount } from './packaging'
import { hasErrors, toSupplyDraft, validateSupply } from './validation'
import { pickVisible, useTouchedFields } from '../../lib/touched'

const emptyValues: SupplyFormValues = {
  name: '',
  packageSize: '',
  unit: 'g',
  packages: '',
  packageCost: '',
  minPackages: '0',
}

type SupplyFormProps = {
  supplies: Supply[]
  editing: Supply | null
  onSave: (draft: SupplyDraft) => boolean
  onCancel: () => void
  alwaysShowCancel?: boolean
}

function buildSummary(
  values: SupplyFormValues,
  rate: number | null,
): string | null {
  const packageSize = parseDecimal(values.packageSize)
  const packages = parseDecimal(values.packages)
  const packageCost = parseDecimal(values.packageCost)

  if (
    packageSize === null ||
    packageSize <= 0 ||
    packages === null ||
    packages < 0 ||
    packageCost === null ||
    packageCost < 0
  ) {
    return null
  }

  const unitCost = packageCost / packageSize
  const displayUnit = displayCostUnit(values.unit)
  const factor = convert(1, displayUnit, values.unit)
  const displayCost = factor === null ? unitCost : unitCost * factor
  const totalCost = packageCost * packages
  const vesSuffix = (value: number) =>
    rate === null ? '' : ` (${formatVES(usdToVes(value, rate))})`

  return `${formatPackageCount(packages)} de ${formatQuantity(
    packageSize,
    values.unit,
  )} = ${formatQuantity(
    packageSize * packages,
    values.unit,
  )}. Costo por ${UNIT_LABELS[displayUnit]}: ${formatUSD(
    displayCost,
  )}${vesSuffix(displayCost)}. Valor total: ${formatUSD(
    totalCost,
  )}${vesSuffix(totalCost)}.`
}

export function SupplyForm({
  supplies,
  editing,
  onSave,
  onCancel,
  alwaysShowCancel = false,
}: SupplyFormProps) {
  const [values, setValues] = useState<SupplyFormValues>(() =>
    editing
      ? {
          name: editing.name,
          packageSize: String(editing.packageSize),
          unit: editing.unit,
          packages: String(roundQuantity(packageCount(editing))),
          packageCost: String(editing.packageCost),
          minPackages: String(roundQuantity(minPackageCount(editing))),
        }
      : emptyValues,
  )
  const sectionRef = useRef<HTMLElement>(null)
  const { touch, isVisible, markSubmitted, reset } = useTouchedFields()
  const allErrors = validateSupply(values, supplies, editing?.id)
  const errors = pickVisible(allErrors, isVisible)
  const { rate } = useExchangeRate()

  useEffect(() => {
    if (!editing) return
    const section = sectionRef.current
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    section
      .querySelector<HTMLInputElement>('input')
      ?.focus({ preventScroll: true })
  }, [editing])

  const updateField = <Field extends keyof SupplyFormValues>(
    field: Field,
    value: SupplyFormValues[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    markSubmitted()
    if (hasErrors(allErrors)) return

    const saved = onSave(toSupplyDraft(values))
    if (saved && !editing) {
      setValues(emptyValues)
      reset()
    }
  }

  const summary = buildSummary(values, rate)
  const HeadingIcon = editing ? Pencil : PackagePlus

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-36 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <HeadingIcon className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        {editing ? 'Editar insumo' : 'Nuevo insumo'}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Carga el insumo como lo compras: paquetes, contenido y costo de cada
        paquete. Los costos se ingresan en dólares ($).
      </p>

      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="supply-name"
          label="Nombre del insumo"
          placeholder="Ej. Harina 000"
          value={values.name}
          error={errors.name}
          onBlur={() => touch('name')}
          onChange={(event) => updateField('name', event.target.value)}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-700">
            ¿Cómo viene el paquete?
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="supply-package-size"
              label="Cantidad por paquete"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Ej. 500"
              value={values.packageSize}
              error={errors.packageSize}
              onBlur={() => touch('packageSize')}
              onChange={(event) =>
                updateField('packageSize', event.target.value)
              }
            />
            <Select
              id="supply-unit"
              label="Unidad"
              value={values.unit}
              error={errors.unit}
              onBlur={() => touch('unit')}
              onChange={(event) =>
                updateField(
                  'unit',
                  event.target.value as SupplyFormValues['unit'],
                )
              }
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-slate-500">
            Ejemplo: una bolsa de 500 gramos → contenido 500 y unidad Gramo (g).
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-700">
            ¿Cuántos tienes?
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="supply-packages"
              label="Paquetes que tienes"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Ej. 20"
              value={values.packages}
              error={errors.packages}
              onBlur={() => touch('packages')}
              onChange={(event) => updateField('packages', event.target.value)}
            />
            <Input
              id="supply-min-packages"
              label="Avisar cuando queden menos de (paquetes)"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Ej. 5"
              value={values.minPackages}
              error={errors.minPackages}
              onBlur={() => touch('minPackages')}
              onChange={(event) =>
                updateField('minPackages', event.target.value)
              }
            />
          </div>
          <p className="text-xs text-slate-500">
            Te avisaremos y el insumo aparecerá en la lista de compras cuando
            queden menos paquetes que esta cantidad. Déjalo en 0 si no quieres
            avisos.
          </p>
        </fieldset>

        <Input
          id="supply-package-cost"
          label="¿Cuánto cuesta cada paquete? ($)"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="Ej. 3.00"
          value={values.packageCost}
          error={errors.packageCost}
          onBlur={() => touch('packageCost')}
          onChange={(event) => updateField('packageCost', event.target.value)}
        />
        <p className="-mt-3 text-xs text-slate-500">
          En dólares. El equivalente en bolívares se calcula con la tasa oficial
          del día.
        </p>

        <div
          aria-live="polite"
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
        >
          {summary ?? 'Completa presentación, paquetes y costo para ver el resumen.'}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="gap-1.5 max-sm:flex-1">
            {editing ? (
              <Save className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {editing ? 'Guardar cambios' : 'Agregar insumo'}
          </Button>
          {editing || alwaysShowCancel ? (
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
