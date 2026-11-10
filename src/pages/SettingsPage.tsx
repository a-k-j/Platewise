import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  Flame,
  Info,
  Loader2,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react'
import type { SettingsInput, ThemePreference, WeightUnit } from '../types'
import { getWeekDates, getWeekStartOptions, todayKey } from '../lib/dates'
import { buildWeeklyCsv } from '../lib/csv'
import { downloadCsv, downloadJson, readFileAsText } from '../lib/download'
import { formatCalories } from '../lib/format'
import { validateSettingsInput, hasErrors, type ValidationErrors } from '../lib/validation'
import { updateSettings } from '../services/settingsService'
import {
  buildBackupFilename,
  buildCsvFilename,
  clearAllData,
  exportBackup,
  importBackup,
  parseBackupText,
} from '../services/backupService'
import type { BackupPayload } from '../types'
import { useSettings } from '../hooks/useSettings'
import { useWeekEntries } from '../hooks/useMeals'
import { useWeightEntries } from '../hooks/useWeights'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Field, SegmentedControl } from '../components/ui/Field'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/ToastProvider'

interface SettingsFormState {
  dailyCalorieTarget: string
  proteinTarget: string
  weightUnit: WeightUnit
  weekStartsOn: string
  theme: ThemePreference
}

function toFormState(settings: ReturnType<typeof useSettings>['settings']): SettingsFormState {
  return {
    dailyCalorieTarget: String(settings.dailyCalorieTarget),
    proteinTarget: settings.proteinTarget == null ? '' : String(settings.proteinTarget),
    weightUnit: settings.weightUnit,
    weekStartsOn: String(settings.weekStartsOn),
    theme: settings.theme,
  }
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Flame
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function DataAction({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Download
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p>
      </div>
      <div className="shrink-0 self-start sm:self-auto">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { settings, isLoading } = useSettings()
  const { toast } = useToast()
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings))
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null)
  const [importing, setImporting] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (isLoading) return
    setForm(toFormState(settings))
    setErrors({})
  }, [settings, isLoading])

  const weekDates = useMemo(
    () => getWeekDates(todayKey(), Number.isInteger(Number(form.weekStartsOn)) ? Number(form.weekStartsOn) : settings.weekStartsOn),
    [form.weekStartsOn, settings.weekStartsOn],
  )
  const { entries: weekEntries } = useWeekEntries(weekDates)
  const { entries: weightEntries } = useWeightEntries()

  const hasChanges = JSON.stringify(form) !== JSON.stringify(toFormState(settings))
  const targetForDisplay = Number(form.dailyCalorieTarget)

  const update = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleSave = async () => {
    const input: SettingsInput = {
      dailyCalorieTarget: Number(form.dailyCalorieTarget),
      proteinTarget: form.proteinTarget.trim() === '' ? null : Number(form.proteinTarget),
      weightUnit: form.weightUnit,
      weekStartsOn: Number(form.weekStartsOn),
      theme: form.theme,
    }
    const validation = validateSettingsInput(input)
    setErrors(validation)
    if (hasErrors(validation)) {
      toast('Check the highlighted settings and try again.', 'error')
      return
    }

    setSaving(true)
    try {
      await updateSettings(input)
      toast('Settings saved', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleResetForm = () => {
    setForm(toFormState(settings))
    setErrors({})
  }

  const handleExportJson = async () => {
    setExporting(true)
    try {
      const payload = await exportBackup()
      downloadJson(buildBackupFilename(), payload)
      toast('Backup downloaded', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not export your data.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCsv = () => {
    try {
      const csv = buildWeeklyCsv(weekDates, weekEntries, weightEntries, Number(form.dailyCalorieTarget) || 0)
      downloadCsv(buildCsvFilename(), csv)
      toast('This week’s CSV downloaded', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not export the week.', 'error')
    }
  }

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const payload = parseBackupText(text)
      setPendingImport(payload)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'That file could not be imported.', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (!pendingImport) return
    setImporting(true)
    try {
      await importBackup(pendingImport)
      toast('Backup restored', 'success')
      setPendingImport(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not restore that backup.', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleClearAll = async () => {
    setClearing(true)
    try {
      await clearAllData()
      toast('All data cleared. Starter foods restored.', 'info')
      setClearOpen(false)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not clear your data.', 'error')
    } finally {
      setClearing(false)
    }
  }

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') toast('Platewise is being installed', 'success')
    if (outcome === 'unavailable') {
      toast('Use your browser menu to install Platewise.', 'info')
    }
  }

  const importSummary = pendingImport
    ? `${pendingImport.data.mealEntries.length} meal entries, ${pendingImport.data.foodItems.length} foods, ${pendingImport.data.weightEntries.length} weigh-ins, and ${pendingImport.data.savedMeals.length} saved combinations.`
    : ''

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Preferences</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Settings</h1>
          <p className="mt-1 text-xs text-muted">
            Targets, units, and backups. Everything is stored locally in this browser.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasChanges ? (
            <button type="button" onClick={handleResetForm} className="btn-ghost h-10 px-3 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSave()}
            className="btn-primary h-10 px-3.5 text-xs"
            disabled={saving || !hasChanges}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionCard
            icon={Flame}
            title="Daily targets"
            description="The budget Platewise measures your day and week against."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Daily calorie target"
                htmlFor="setting-calories"
                error={errors.dailyCalorieTarget}
                hint="Used for the remaining budget and weekly target line."
              >
                <div className="relative">
                  <input
                    id="setting-calories"
                    type="number"
                    min="1"
                    step="10"
                    inputMode="numeric"
                    value={form.dailyCalorieTarget}
                    onChange={(event) => update('dailyCalorieTarget', event.target.value)}
                    className="input pr-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted">
                    kcal
                  </span>
                </div>
              </Field>

              <Field
                label="Protein target"
                htmlFor="setting-protein"
                error={errors.proteinTarget}
                hint="Optional. Leave empty if you do not track protein."
              >
                <div className="relative">
                  <input
                    id="setting-protein"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.proteinTarget}
                    onChange={(event) => update('proteinTarget', event.target.value)}
                    className="input pr-14"
                    placeholder="Not set"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted">
                    g
                  </span>
                </div>
              </Field>
            </div>

            <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[10px] leading-relaxed text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Platewise does not calculate a target for you. Use a value recommended by your doctor or dietitian, or start
              with the default {formatCalories(1800)} kcal and adjust over time.
            </p>
          </SectionCard>

          <SectionCard
            icon={Palette}
            title="Display & preferences"
            description="Choose units, your week boundary, and how Platewise looks."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Weight unit" htmlFor="setting-weight-unit">
                <SegmentedControl<WeightUnit>
                  value={form.weightUnit}
                  onChange={(value) => update('weightUnit', value)}
                  options={[
                    { value: 'kg', label: 'Kilograms' },
                    { value: 'lb', label: 'Pounds' },
                  ]}
                  ariaLabel="Weight unit"
                />
              </Field>

              <Field label="Week starts on" htmlFor="setting-week-start" hint="Used by the weekly chart and averages.">
                <select
                  id="setting-week-start"
                  value={form.weekStartsOn}
                  onChange={(event) => update('weekStartsOn', event.target.value)}
                  className="select"
                >
                  {getWeekStartOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <p className="label">Theme</p>
              <SegmentedControl<ThemePreference>
                value={form.theme}
                onChange={(value) => update('theme', value)}
                options={[
                  { value: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
                  { value: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
                  { value: 'system', label: 'System', icon: <Monitor className="h-3.5 w-3.5" /> },
                ]}
                ariaLabel="Theme"
              />
              <p className="mt-1.5 text-xs text-muted">System follows your device’s light or dark appearance.</p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/50 px-3.5 py-3">
              <div>
                <p className="text-[11px] font-semibold text-ink">Daily budget preview</p>
                <p className="mt-0.5 text-[10px] text-muted">Current value before saving</p>
              </div>
              <p className="num text-lg font-bold text-ink">
                {Number.isFinite(targetForDisplay) && targetForDisplay > 0 ? formatCalories(targetForDisplay) : '—'}
                <span className="ml-1 text-[10px] font-medium text-muted">kcal</span>
              </p>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            icon={DatabaseBackup}
            title="Data & backup"
            description="Your data never leaves this device unless you export it yourself."
          >
            <div className="space-y-2.5">
              <DataAction
                icon={Download}
                title="Export a full backup"
                description="Downloads a JSON file with foods, meals, weights, saved combinations, and settings."
              >
                <button
                  type="button"
                  onClick={() => void handleExportJson()}
                  className="btn-secondary h-9 px-3 text-xs"
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export JSON
                </button>
              </DataAction>

              <DataAction
                icon={Upload}
                title="Restore from a backup"
                description="Validates the file, then replaces everything currently stored in Platewise."
              >
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="sr-only"
                    onChange={(event) => void handleFileSelected(event.target.files?.[0])}
                    aria-label="Choose a Platewise backup file"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary h-9 px-3 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Choose file
                  </button>
                </>
              </DataAction>

              <DataAction
                icon={FileSpreadsheet}
                title="Export this week as CSV"
                description={`A spreadsheet-friendly file for the week of ${weekDates[0]}.`}
              >
                <button type="button" onClick={handleExportCsv} className="btn-secondary h-9 px-3 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </DataAction>
            </div>

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/60 p-3.5 dark:border-red-500/25 dark:bg-red-500/10">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-red-900 dark:text-red-200">Danger zone</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-red-800/80 dark:text-red-300/80">
                    Clearing removes every meal, weigh-in, custom food, and saved combination from this browser.
                    Starter foods and default settings are restored. Export a backup first.
                  </p>
                  <button
                    type="button"
                    onClick={() => setClearOpen(true)}
                    className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-300 bg-surface px-2.5 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all data
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Smartphone}
            title="Install & offline"
            description="Platewise is a PWA. Once loaded, it works with no connection."
          >
            {isInstalled ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Platewise is installed</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">
                    Launch it from your home screen or app list. Your data stays available offline.
                  </p>
                </div>
              </div>
            ) : canInstall ? (
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2/50 px-3.5 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">Install Platewise on this device</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    Adds an app icon, opens without browser chrome, and keeps working offline.
                  </p>
                </div>
                <button type="button" onClick={() => void handleInstall()} className="btn-primary h-9 px-3 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Install app
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/50 px-3.5 py-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-xs font-semibold text-ink">Android / Chrome</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      Open the browser menu and choose <strong className="font-semibold text-ink">Install app</strong> or{' '}
                      <strong className="font-semibold text-ink">Add to Home screen</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/50 px-3.5 py-3">
                  <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-xs font-semibold text-ink">Desktop Chrome / Edge</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      Use the install icon in the address bar, or the browser menu’s{' '}
                      <strong className="font-semibold text-ink">Install</strong> option.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/50 px-3.5 py-3">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-xs font-semibold text-ink">iPhone / Safari</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      Tap <strong className="font-semibold text-ink">Share</strong>, then{' '}
                      <strong className="font-semibold text-ink">Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          <section className="card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-ink">Private by design</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  Platewise stores everything in this browser’s IndexedDB. There is no account, server, cloud sync, or
                  nutrition API. Clearing browser storage or this app’s data will remove your entries unless you have a
                  backup.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-muted">
                  <span className="pill bg-surface-2">
                    <Scale className="h-3 w-3" />
                    Weight in {form.weightUnit}
                  </span>
                  <span className="pill bg-surface-2">
                    <Flame className="h-3 w-3" />
                    Target {formatCalories(Number(form.dailyCalorieTarget) || 0)} kcal
                  </span>
                  <span className="pill bg-surface-2">Version 1.0.0</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          className="btn-primary h-10 px-4 text-xs"
          disabled={saving || !hasChanges}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace all current data?"
        description={
          pendingImport
            ? `This backup contains ${importSummary} Restoring it will replace everything currently stored in Platewise.`
            : ''
        }
        confirmLabel={importing ? 'Restoring…' : 'Restore backup'}
        onConfirm={() => void handleConfirmImport()}
        onClose={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="Clear all data?"
        description="Every meal, weigh-in, custom food, and saved combination will be permanently removed from this browser. Starter foods and default settings will be restored. This cannot be undone."
        confirmLabel={clearing ? 'Clearing…' : 'Clear everything'}
        destructive
        onConfirm={() => void handleClearAll()}
        onClose={() => setClearOpen(false)}
      />
    </div>
  )
}
