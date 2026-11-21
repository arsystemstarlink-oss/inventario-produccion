import { describe, expect, it } from 'vitest'
import type { Supply, Unit } from '../../types'
import { hasErrors, toSupplyDraft, validateSupply } from './validation'

const existing: Supply[] = [
  {
    id: 'harina',
    name: 'Harina 000',
    quantity: 2000,
    unit: 'g',
    unitCost: 0.003,
    minStock: 1000,
    packageSize: 500,
    packageCost: 1.5,
  },
]

const validInput = {
  name: 'Azúcar',
  packageSize: '500',
  unit: 'g' as Unit,
  packages: '3',
  packageCost: '2.5',
  minPackages: '1',
}

describe('validateSupply', () => {
  it('accepts a valid supply', () => {
    expect(validateSupply(validInput, existing)).toEqual({})
  })

  it('requires a unique name', () => {
    expect(validateSupply({ ...validInput, name: '  ' }, existing).name).toBe(
      'El nombre es obligatorio.',
    )
    expect(
      validateSupply({ ...validInput, name: ' harina 000 ' }, existing).name,
    ).toBe('Ya existe un insumo con ese nombre.')
    expect(
      validateSupply({ ...validInput, name: 'Harina 000' }, existing, 'harina')
        .name,
    ).toBeUndefined()
  })

  it('requires a positive package size', () => {
    expect(
      validateSupply({ ...validInput, packageSize: '' }, existing).packageSize,
    ).toBe('El contenido del paquete es obligatorio.')
    expect(
      validateSupply({ ...validInput, packageSize: '0' }, existing).packageSize,
    ).toBe('El contenido del paquete debe ser mayor que cero.')
    expect(
      validateSupply({ ...validInput, packageSize: 'abc' }, existing)
        .packageSize,
    ).toBe('El contenido del paquete debe ser un número.')
  })

  it('rejects an unknown unit', () => {
    expect(
      validateSupply({ ...validInput, unit: 'oz' as Unit }, existing).unit,
    ).toBe('Selecciona una unidad de medida.')
  })

  it('requires a non-negative package count', () => {
    expect(
      validateSupply({ ...validInput, packages: '' }, existing).packages,
    ).toBe('La cantidad de paquetes es obligatoria.')
    expect(
      validateSupply({ ...validInput, packages: '-1' }, existing).packages,
    ).toBe('La cantidad de paquetes no puede ser negativa.')
    expect(
      validateSupply({ ...validInput, packages: 'abc' }, existing).packages,
    ).toBe('La cantidad de paquetes debe ser un número.')
    expect(
      validateSupply({ ...validInput, packages: '2,5' }, existing).packages,
    ).toBeUndefined()
  })

  it('requires a non-negative package cost', () => {
    expect(
      validateSupply({ ...validInput, packageCost: '' }, existing).packageCost,
    ).toBe('El costo por paquete es obligatorio.')
    expect(
      validateSupply({ ...validInput, packageCost: '-0.5' }, existing)
        .packageCost,
    ).toBe('El costo por paquete no puede ser negativo.')
    expect(
      validateSupply({ ...validInput, packageCost: 'dos' }, existing)
        .packageCost,
    ).toBe('El costo por paquete debe ser un número.')
    expect(
      validateSupply({ ...validInput, packageCost: '2,5' }, existing)
        .packageCost,
    ).toBeUndefined()
  })

  it('accepts an empty minimum stock and rejects invalid values', () => {
    expect(
      validateSupply({ ...validInput, minPackages: '' }, existing).minPackages,
    ).toBeUndefined()
    expect(
      validateSupply({ ...validInput, minPackages: '-1' }, existing).minPackages,
    ).toBe('El stock mínimo no puede ser negativo.')
    expect(
      validateSupply({ ...validInput, minPackages: 'dos' }, existing)
        .minPackages,
    ).toBe('El stock mínimo debe ser un número.')
  })

  it('reports whether there are errors', () => {
    expect(hasErrors(validateSupply(validInput, existing))).toBe(false)
    expect(
      hasErrors(validateSupply({ ...validInput, name: '' }, existing)),
    ).toBe(true)
  })
})

describe('toSupplyDraft', () => {
  it('calculates total quantity, unit cost and minimum stock', () => {
    expect(
      toSupplyDraft({
        name: '  Azúcar ',
        packageSize: '500',
        unit: 'g',
        packages: '3',
        packageCost: '2,5',
        minPackages: '1',
      }),
    ).toEqual({
      name: 'Azúcar',
      quantity: 1500,
      unit: 'g',
      unitCost: 0.005,
      minStock: 500,
      packageSize: 500,
      packageCost: 2.5,
    })
  })

  it('defaults empty packages to zero', () => {
    const draft = toSupplyDraft({
      name: 'Azúcar',
      packageSize: '500',
      unit: 'g',
      packages: '3',
      packageCost: '2,5',
      minPackages: '',
    })
    expect(draft.minStock).toBe(0)
  })
})
