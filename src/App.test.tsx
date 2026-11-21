import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/inventario']}>
      <App />
    </MemoryRouter>,
  )
}

type SupplyInput = {
  packageSize: string
  unit?: string
  packages: string
  packageCost: string
  minPackages?: string
}

async function addSupply(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  input: SupplyInput,
) {
  await user.type(screen.getByLabelText('Nombre del insumo'), name)
  await user.type(
    screen.getByLabelText('Contenido por paquete'),
    input.packageSize,
  )
  if (input.unit) {
    await user.selectOptions(screen.getByLabelText('Unidad'), input.unit)
  }
  await user.type(screen.getByLabelText('Paquetes disponibles'), input.packages)
  await user.type(screen.getByLabelText('Costo por paquete ($)'), input.packageCost)
  if (input.minPackages !== undefined) {
    const minStock = screen.getByLabelText('Stock mínimo (paquetes)')
    await user.clear(minStock)
    await user.type(minStock, input.minPackages)
  }
  await user.click(screen.getByRole('button', { name: 'Agregar insumo' }))
}

describe('flujo de inventario', () => {
  it('crea, edita y elimina insumos por paquete', async () => {
    const user = userEvent.setup()
    renderApp()

    const rateStrip = screen.getByRole('region', { name: 'Tasa oficial BCV' })
    expect(await within(rateStrip).findByText('Bs 918,77')).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Inventario' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No hay insumos registrados.')).toBeInTheDocument()
    expect(
      screen.getByText('Paso 1 · Carga tus insumos'),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nombre del insumo'), 'Harina 000')
    await user.type(screen.getByLabelText('Contenido por paquete'), '500')
    await user.type(screen.getByLabelText('Paquetes disponibles'), '4')
    await user.type(screen.getByLabelText('Costo por paquete ($)'), '1')

    expect(
      screen.getByText(/4 paquetes de 500 g = 2 kg/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Agregar insumo' }))

    let row = screen.getByText('Harina 000').closest('tr')
    expect(row).not.toBeNull()
    expect(
      within(row as HTMLElement).getByText('500 g por paquete'),
    ).toBeInTheDocument()
    expect(
      within(row as HTMLElement).getByText('4 paquetes'),
    ).toBeInTheDocument()
    expect(
      within(row as HTMLElement).getByText('2 kg en total'),
    ).toBeInTheDocument()
    expect(within(row as HTMLElement).getByText('$1,00 /paquete')).toBeInTheDocument()
    expect(within(row as HTMLElement).getByText('$2,00 /kg')).toBeInTheDocument()
    expect(within(row as HTMLElement).getByText('$4,00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Editar Harina 000' }))
    expect(
      screen.getByRole('heading', { name: 'Editar insumo' }),
    ).toBeInTheDocument()

    const nameInput = screen.getByLabelText('Nombre del insumo')
    await user.clear(nameInput)
    await user.type(nameInput, 'Harina 0000')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    row = screen.getByText('Harina 0000').closest('tr')
    expect(row).not.toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Eliminar Harina 0000' }),
    )
    let dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Harina 0000')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Eliminar Harina 0000' }),
    )
    dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByText('No hay insumos registrados.')).toBeInTheDocument()

    expect(window.localStorage.getItem('inventory:supplies:v1')).toBe('[]')
  })
})

describe('alertas de stock mínimo', () => {
  it('muestra la alerta y la lista de compras en paquetes', async () => {
    const user = userEvent.setup()
    renderApp()

    await addSupply(user, 'Harina 000', {
      packageSize: '500',
      packages: '4',
      packageCost: '1',
      minPackages: '10',
    })

    expect(
      screen.getByText(
        'Hay 1 insumo por debajo del stock mínimo. Revisa la lista de compras.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Reponer')).toBeInTheDocument()

    const shoppingTable = screen.getByText('Comprar').closest('table')
    expect(shoppingTable).not.toBeNull()
    expect(
      within(shoppingTable as HTMLElement).getByText('6 paquetes'),
    ).toBeInTheDocument()
    expect(
      within(shoppingTable as HTMLElement).getByText('de 500 g'),
    ).toBeInTheDocument()
    expect(
      within(shoppingTable as HTMLElement).getByText('$6,00'),
    ).toBeInTheDocument()
  })
})

describe('flujo de recetas y producción', () => {
  it('calcula materiales por paquete, descuenta stock y lo restaura', async () => {
    const user = userEvent.setup()
    renderApp()

    await addSupply(user, 'Harina 000', {
      packageSize: '500',
      packages: '4',
      packageCost: '1',
    })

    await user.click(screen.getByRole('link', { name: 'Recetas' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Recetas' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No hay recetas registradas.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nombre de la receta'), 'Pan')
    await user.type(screen.getByLabelText('Rendimiento (unidades)'), '20')
    await user.selectOptions(
      screen.getByLabelText('Insumo'),
      screen.getByRole('option', { name: /Harina 000/ }),
    )
    await user.selectOptions(screen.getByLabelText('Unidad'), 'g')
    await user.type(screen.getByLabelText('Cantidad'), '500')

    expect(
      screen.getByText(/Disponible: 2 kg \(4 paquetes de 500 g/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Agregar receta' }))

    const recipeRow = screen.getByText('Pan').closest('tr')
    expect(recipeRow).not.toBeNull()
    expect(
      within(recipeRow as HTMLElement).getByText('Harina 000: 500 g'),
    ).toBeInTheDocument()
    expect(within(recipeRow as HTMLElement).getByText('$1,00')).toBeInTheDocument()
    expect(within(recipeRow as HTMLElement).getByText('$0,05')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Producción' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Producción' }),
    ).toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText('Receta'),
      screen.getByRole('option', { name: /Pan \(rinde 20 unidades\)/ }),
    )
    await user.type(screen.getByLabelText('Cantidad a producir'), '40')

    expect(screen.getByText('1 kg')).toBeInTheDocument()
    expect(screen.getByText('2 kg')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Con el stock actual puedes producir hasta 80 unidades/,
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Registrar producción' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      /Se registraron 40 unidades de Pan/,
    )

    const productionRow = screen.getByText('Harina 000: 1 kg').closest('tr')
    expect(productionRow).not.toBeNull()
    expect(within(productionRow as HTMLElement).getByText('$2,00')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Inventario' }))
    const inventoryRow = screen.getByText('Harina 000').closest('tr')
    expect(inventoryRow).not.toBeNull()
    expect(
      within(inventoryRow as HTMLElement).getByText('2 paquetes'),
    ).toBeInTheDocument()
    expect(
      within(inventoryRow as HTMLElement).getByText('1 kg en total'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Producción' }))
    await user.selectOptions(
      screen.getByLabelText('Receta'),
      screen.getByRole('option', { name: /Pan \(rinde 20 unidades\)/ }),
    )
    await user.type(screen.getByLabelText('Cantidad a producir'), '100')
    await user.click(screen.getByRole('button', { name: 'Registrar producción' }))

    expect(
      screen.getByText(/No hay existencias suficientes para esta producción/),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /Eliminar producción de Pan/ }),
    ).toHaveLength(1)

    await user.click(
      screen.getByRole('button', { name: /Eliminar producción de Pan/ }),
    )
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByText('No hay producciones registradas.')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Inventario' }))
    const restoredRow = screen.getByText('Harina 000').closest('tr')
    expect(restoredRow).not.toBeNull()
    expect(
      within(restoredRow as HTMLElement).getByText('4 paquetes'),
    ).toBeInTheDocument()
    expect(
      within(restoredRow as HTMLElement).getByText('2 kg en total'),
    ).toBeInTheDocument()
  })
})
