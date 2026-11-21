import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Supply } from '../../types'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorBanner } from '../../components/ErrorBanner'
import {
  applyBackup,
  downloadBackup,
  downloadSuppliesCsv,
  parseBackup,
} from '../../storage/backup'
import type { BackupData } from '../../storage/backup'

type DataBackupProps = {
  supplies: Supply[]
  recipesCount: number
  productionCount: number
}

export function DataBackup({
  supplies,
  recipesCount,
  productionCount,
}: DataBackupProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    const raw = await file.text()
    const result = parseBackup(raw)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPending(result.data)
  }

  const handleRestore = () => {
    if (!pending) return
    const result = applyBackup(pending)
    if (!result.ok) {
      setError(result.error)
      setPending(null)
      return
    }
    window.location.reload()
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Tus datos están en este dispositivo
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Se guardan solo en este navegador: {supplies.length} insumo
            {supplies.length === 1 ? '' : 's'}, {recipesCount} receta
            {recipesCount === 1 ? '' : 's'} y {productionCount} producción
            {productionCount === 1 ? '' : 'es'}. Descarga un respaldo para no
            perderlos si borras los datos del navegador o cambias de equipo.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="gap-1.5"
          onClick={() => downloadBackup()}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar respaldo
        </Button>
        <Button
          variant="secondary"
          className="gap-1.5"
          onClick={() => downloadSuppliesCsv(supplies)}
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          Exportar insumos a Excel
        </Button>
        <Button
          variant="secondary"
          className="gap-1.5"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Restaurar respaldo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Archivo de respaldo"
          tabIndex={-1}
          onChange={handleFile}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Restaurar un respaldo reemplaza todos los datos actuales.
      </p>

      {pending ? (
        <ConfirmDialog
          title="Restaurar respaldo"
          message={`El archivo tiene ${pending.supplies.length} insumo${
            pending.supplies.length === 1 ? '' : 's'
          }, ${pending.recipes.length} receta${
            pending.recipes.length === 1 ? '' : 's'
          } y ${pending.production.length} producción${
            pending.production.length === 1 ? '' : 'es'
          }. Se reemplazarán todos los datos actuales de este dispositivo.`}
          confirmLabel="Restaurar"
          onConfirm={handleRestore}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </section>
  )
}
