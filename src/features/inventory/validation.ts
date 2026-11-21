import type { Supply, SupplyDraft, SupplyFormValues, Unit } from '../../types'
import { parseDecimal } from '../../lib/number'
import { roundQuantity, UNITS } from '../../lib/units'

export type SupplyFieldErrors = Partial<Record<keyof SupplyFormValues, string>>

export function hasErrors(errors: SupplyFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function validateSupply(
  input: SupplyFormValues,
  supplies: Supply[],
  editingId?: string,
): SupplyFieldErrors {
  const errors: SupplyFieldErrors = {}
  const name = input.name.trim()

  if (name === '') {
    errors.name = 'El nombre es obligatorio.'
  } else if (
    supplies.some(
      (supply) =>
        supply.id !== editingId &&
        supply.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'Ya existe un insumo con ese nombre.'
  }

  const packageSize = parseDecimal(input.packageSize)
  if (input.packageSize.trim() === '') {
    errors.packageSize = 'El contenido del paquete es obligatorio.'
  } else if (packageSize === null) {
    errors.packageSize = 'El contenido del paquete debe ser un número.'
  } else if (packageSize <= 0) {
    errors.packageSize = 'El contenido del paquete debe ser mayor que cero.'
  }

  if (!UNITS.includes(input.unit)) {
    errors.unit = 'Selecciona una unidad de medida.'
  }

  const packages = parseDecimal(input.packages)
  if (input.packages.trim() === '') {
    errors.packages = 'La cantidad de paquetes es obligatoria.'
  } else if (packages === null) {
    errors.packages = 'La cantidad de paquetes debe ser un número.'
  } else if (packages < 0) {
    errors.packages = 'La cantidad de paquetes no puede ser negativa.'
  }

  const packageCost = parseDecimal(input.packageCost)
  if (input.packageCost.trim() === '') {
    errors.packageCost = 'El costo por paquete es obligatorio.'
  } else if (packageCost === null) {
    errors.packageCost = 'El costo por paquete debe ser un número.'
  } else if (packageCost < 0) {
    errors.packageCost = 'El costo por paquete no puede ser negativo.'
  }

  if (input.minPackages.trim() !== '') {
    const minPackages = parseDecimal(input.minPackages)
    if (minPackages === null) {
      errors.minPackages = 'El stock mínimo debe ser un número.'
    } else if (minPackages < 0) {
      errors.minPackages = 'El stock mínimo no puede ser negativo.'
    }
  }

  return errors
}

export function toSupplyDraft(input: SupplyFormValues): SupplyDraft {
  const unit: Unit = UNITS.includes(input.unit) ? input.unit : 'unidad'
  const packageSize = parseDecimal(input.packageSize) ?? 0
  const packages = parseDecimal(input.packages) ?? 0
  const packageCost = parseDecimal(input.packageCost) ?? 0
  const minPackages = parseDecimal(input.minPackages) ?? 0

  return {
    name: input.name.trim(),
    quantity: roundQuantity(packageSize * packages),
    unit,
    unitCost: packageSize > 0 ? packageCost / packageSize : 0,
    minStock: roundQuantity(packageSize * minPackages),
    packageSize,
    packageCost,
  }
}
