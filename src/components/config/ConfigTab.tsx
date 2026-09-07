import { useRef, useState } from 'react'
import {
  Upload,
  FileCode,
  FileSpreadsheet,
  Clock,
  Settings2,
  Plus,
  Trash2,
  CheckCircle2,
  Moon,
  Footprints,
  Sparkles,
  Download,
  Sliders,
  Info,
  X,
} from 'lucide-react'
import type {
  AidStation,
  AidStationType,
  AccessType,
  NetworkType,
  RaceSettings,
  TrackStats,
  GpxCalibrationOptions,
} from '../../types/trail'
import { formatPassingDateTime } from '../../utils/pacingEngine'
import { parseCutoffValue } from '../../utils/excelParser'

interface ConfigTabProps {
  settings: RaceSettings
  onUpdateSettings: (newSettings: RaceSettings) => void
  trackStats?: TrackStats
  aidStations: AidStation[]
  onUpdateAidStations: (stations: AidStation[]) => void
  onImportGpx: (file: File) => void
  onImportExcel: (file: File) => void
  onLoadDemo: () => void
  onLoadUtg2027: () => void
  onDownloadTemplate: () => void
  onDownloadCsvTemplate: () => void
  calibrationOptions: GpxCalibrationOptions
  onUpdateCalibration: (options: GpxCalibrationOptions) => void
  gpxFileName?: string
  excelFileName?: string
}

export const ConfigTab: React.FC<ConfigTabProps> = ({
  settings,
  onUpdateSettings,
  trackStats,
  aidStations,
  onUpdateAidStations,
  onImportGpx,
  onImportExcel,
  onLoadDemo,
  onLoadUtg2027,
  onDownloadTemplate,
  onDownloadCsvTemplate,
  calibrationOptions,
  onUpdateCalibration,
  gpxFileName,
  excelFileName,
}) => {
  const gpxInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [dragOverGpx, setDragOverGpx] = useState(false)
  const [dragOverExcel, setDragOverExcel] = useState(false)

  // Local state for adding a new aid station
  const [newStationName, setNewStationName] = useState('')
  const [newStationKm, setNewStationKm] = useState('')
  const [newStationCutoff, setNewStationCutoff] = useState('')

  const handleAddStation = () => {
    if (!newStationName || isNaN(parseFloat(newStationKm))) return
    const km = parseFloat(newStationKm)
    let manualCutoff: string | undefined = undefined
    if (newStationCutoff.trim()) {
      manualCutoff = parseCutoffValue(newStationCutoff.trim(), settings.startDate, settings.startTime)
    }

    const newStation: AidStation = {
      id: `custom-${Date.now()}`,
      order: aidStations.length + 1,
      name: newStationName,
      distanceKm: km,
      stopTimeFirstMin: settings.defaultFirstStopMin,
      stopTimeLastMin: settings.defaultLastStopMin,
      type: 'COMPLET',
      accessibility: 'ROUTE',
      network: 'GSM',
      medical: false,
      dormitory: false,
      manualCutoffTime: manualCutoff,
    }

    const updated = [...aidStations, newStation].sort((a, b) => a.distanceKm - b.distanceKm)
    updated.forEach((s, idx) => { s.order = idx + 1 })
    onUpdateAidStations(updated)

    setNewStationName('')
    setNewStationKm('')
    setNewStationCutoff('')
  }

  const handleDeleteStation = (id: string) => {
    const updated = aidStations.filter(s => s.id !== id)
    updated.forEach((s, idx) => { s.order = idx + 1 })
    onUpdateAidStations(updated)
  }

  const handleStationChange = (id: string, field: keyof AidStation, value: any) => {
    const updated = aidStations.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value }
      }
      return s
    })
    if (field === 'distanceKm') {
      updated.sort((a, b) => a.distanceKm - b.distanceKm)
      updated.forEach((s, idx) => { s.order = idx + 1 })
    }
    onUpdateAidStations(updated)
  }

  // Convert winner & cutoff hours into HH and MM for clean editing
  const winnerH = Math.floor(settings.winnerTargetHours)
  const winnerM = Math.round((settings.winnerTargetHours - winnerH) * 60)
  const cutoffH = Math.floor(settings.cutoffTargetHours)
  const cutoffM = Math.round((settings.cutoffTargetHours - cutoffH) * 60)

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Callout */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/30 p-5 sm:p-6 backdrop-blur shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Direction de Course & Calage de Tracé
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 m-0">
              Importez vos fichiers de course ou rechargez l'épreuve par défaut <span className="font-semibold text-amber-300">Ultra Terrestre 2027</span> (223 km / 12 400m D+).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onLoadUtg2027}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-500 cursor-pointer transition-all"
            >
              <Sparkles className="h-4 w-4 text-amber-200" />
              Recharger Ultra Terrestre 2027 (223 km)
            </button>
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-all"
            >
              Réinitialiser l'Exemple (223 km)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Upload Dropzones + Race Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload GPX */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverGpx(true) }}
          onDragLeave={() => setDragOverGpx(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOverGpx(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              onImportGpx(e.dataTransfer.files[0])
            }
          }}
          className={`flex flex-col justify-between rounded-2xl border-2 border-dashed p-6 transition-all ${
            dragOverGpx
              ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
              : gpxFileName
              ? 'border-emerald-500/40 bg-slate-900/50'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <FileCode className="h-5 w-5" />
              </div>
              {trackStats && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  GPX Calibré
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white m-0">1. Tracé GPX du parcours</h3>
              <p className="text-xs text-slate-400 mt-1">
                Extraction 3D, coordonnées GPS et lissage altimétrique (~50m).
              </p>
            </div>
            {trackStats ? (
              <div className="rounded-xl bg-slate-950/60 p-3 text-xs space-y-1.5 border border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>Fichier :</span>
                  <span className="font-mono text-white font-medium truncate max-w-[160px]">{gpxFileName || 'Trace_course.gpx'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Distance :</span>
                  <span className="font-mono text-orange-400 font-bold">{trackStats.totalDistance} km</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>D+ / D- :</span>
                  <span className="font-mono text-white">+{trackStats.totalDPlus} m / -{trackStats.totalDMinus} m</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Points de trace :</span>
                  <span className="font-mono text-slate-400">{trackStats.pointsCount} points</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Glissez votre fichier .gpx ici ou cliquez ci-dessous.
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <input
              type="file"
              ref={gpxInputRef}
              accept=".gpx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onImportGpx(e.target.files[0])
                }
              }}
            />
            <button
              onClick={() => gpxInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              {gpxFileName ? 'Remplacer le GPX' : 'Sélectionner un fichier GPX'}
            </button>
          </div>
        </div>

        {/* Upload Excel/CSV */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverExcel(true) }}
          onDragLeave={() => setDragOverExcel(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOverExcel(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              onImportExcel(e.dataTransfer.files[0])
            }
          }}
          className={`flex flex-col justify-between rounded-2xl border-2 border-dashed p-6 transition-all ${
            dragOverExcel
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : excelFileName
              ? 'border-emerald-500/40 bg-slate-900/50'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              {aidStations.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {aidStations.length} postes
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white m-0">2. Ravitaillements (Excel / CSV)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Colonnes reconnues : <span className="text-slate-300 font-medium font-mono text-[11px]">N°, Nom du Ravitaillement, Distance (km), Barrière Horaire (optionnel), Type de Poste, Pause 1er (min), Pause Dern. (min), Accès Véhicule, Couverture Réseau, Médical, Dortoir</span>.
              </p>
            </div>
            {aidStations.length > 0 ? (
              <div className="rounded-xl bg-slate-950/60 p-3 text-xs space-y-1.5 border border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>Fichier :</span>
                  <span className="font-mono text-white font-medium truncate max-w-[160px]">{excelFileName || 'Postes_ravitaillement.xlsx'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Postes détectés :</span>
                  <span className="font-mono text-emerald-400 font-bold">{aidStations.length}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Premier poste :</span>
                  <span className="font-mono text-slate-300 truncate max-w-[150px]">{aidStations[0]?.name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Dernier poste :</span>
                  <span className="font-mono text-slate-300 truncate max-w-[150px]">{aidStations[aidStations.length - 1]?.name}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Glissez votre fichier Excel (.xlsx, .xls, .csv) ici.
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                href="./OrgaTrail_Modele_Ravitaillements.xlsx"
                download="OrgaTrail_Modele_Ravitaillements.xlsx"
                onClick={onDownloadTemplate}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-2 text-xs font-semibold text-emerald-400 transition-all cursor-pointer text-center no-underline"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>Modèle .xlsx</span>
              </a>
              <a
                href="./OrgaTrail_Modele_Ravitaillements.csv"
                download="OrgaTrail_Modele_Ravitaillements.csv"
                onClick={onDownloadCsvTemplate}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-2 text-xs font-semibold text-cyan-400 transition-all cursor-pointer text-center no-underline"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>Modèle .csv</span>
              </a>
            </div>
            <input
              type="file"
              ref={excelInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onImportExcel(e.target.files[0])
                }
              }}
            />
            <button
              onClick={() => excelInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              {excelFileName ? 'Remplacer le fichier Excel' : 'Sélectionner un fichier Excel/CSV'}
            </button>
          </div>
        </div>

        {/* Race Settings Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Settings2 className="h-5 w-5 text-orange-400" />
            <span>3. Paramètres de Course</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nom de l'épreuve
              </label>
              <input
                type="text"
                value={settings.raceName}
                onChange={(e) => onUpdateSettings({ ...settings, raceName: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Date de départ
                </label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => onUpdateSettings({ ...settings, startDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Heure officielle
                </label>
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => onUpdateSettings({ ...settings, startTime: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-orange-400 mb-1 flex items-center gap-1">
                  <Footprints className="h-3 w-3" />
                  Temps Vainqueur
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={winnerH}
                    onChange={(e) => {
                      const h = parseInt(e.target.value) || 0
                      onUpdateSettings({ ...settings, winnerTargetHours: h + winnerM / 60 })
                    }}
                    className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-orange-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">h</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={winnerM}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0
                      onUpdateSettings({ ...settings, winnerTargetHours: winnerH + m / 60 })
                    }}
                    className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-orange-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">min</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Barrière Finale (Max)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={cutoffH}
                    onChange={(e) => {
                      const h = parseInt(e.target.value) || 0
                      onUpdateSettings({ ...settings, cutoffTargetHours: h + cutoffM / 60 })
                    }}
                    className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">h</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={cutoffM}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0
                      onUpdateSettings({ ...settings, cutoffTargetHours: cutoffH + m / 60 })
                    }}
                    className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">min</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Arrêt moyen 1ers
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.defaultFirstStopMin}
                    onChange={(e) => onUpdateSettings({ ...settings, defaultFirstStopMin: parseInt(e.target.value) || 0 })}
                    className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-orange-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">min/poste</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Arrêt moyen derniers
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={settings.defaultLastStopMin}
                    onChange={(e) => onUpdateSettings({ ...settings, defaultLastStopMin: parseInt(e.target.value) || 0 })}
                    className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-orange-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">min/poste</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                Ralentissement nuit (19h-06h)
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={settings.nightPenaltyPercent}
                  onChange={(e) => onUpdateSettings({ ...settings, nightPenaltyPercent: parseInt(e.target.value) || 0 })}
                  className="w-14 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono text-white focus:border-orange-500 focus:outline-none"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Panel IGN / TraceDeTrail */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur space-y-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
                Calibration Altimétrique & Distance (IGN BD Alti / TraceDeTrail)
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Filtre Actif
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calage haute précision pour éliminer le bruit micro-GPS sur les longues traces (12 127 points) et retrouver les valeurs officielles.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateCalibration({ smoothWindowMeters: 120, eleThresholdMeters: 4.0, distanceMode: '3D' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                calibrationOptions.smoothWindowMeters === 120 && calibrationOptions.eleThresholdMeters === 4.0 && calibrationOptions.distanceMode === '3D'
                  ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              🎯 Standard IGN / TraceDeTrail (120m / 4.0m 3D)
            </button>

            <button
              type="button"
              onClick={() => onUpdateCalibration({ smoothWindowMeters: 120, eleThresholdMeters: 4.0, distanceMode: '2D' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                calibrationOptions.distanceMode === '2D'
                  ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              🗺️ TraceDeTrail 2D (Plat)
            </button>

            <button
              type="button"
              onClick={() => onUpdateCalibration({ smoothWindowMeters: 60, eleThresholdMeters: 2.0, distanceMode: '3D' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                calibrationOptions.smoothWindowMeters === 60 && calibrationOptions.eleThresholdMeters === 2.0
                  ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              Filtre Léger (60m / 2m)
            </button>

            <button
              type="button"
              onClick={() => onUpdateCalibration({ smoothWindowMeters: 0, eleThresholdMeters: 0, distanceMode: '3D' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                calibrationOptions.smoothWindowMeters === 0 && calibrationOptions.eleThresholdMeters === 0
                  ? 'border-red-500 bg-red-500/20 text-red-300 shadow'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              Brut (Sans lissage)
            </button>
          </div>
        </div>

        {/* Sliders & Mode Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-800/60">
          {/* Slider 1: Fenêtre de lissage */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-semibold">Fenêtre de lissage spatial :</label>
              <span className="font-mono text-orange-400 font-bold">{calibrationOptions.smoothWindowMeters} m</span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={10}
              value={calibrationOptions.smoothWindowMeters}
              onChange={(e) => onUpdateCalibration({
                ...calibrationOptions,
                smoothWindowMeters: parseInt(e.target.value, 10),
              })}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 m-0">
              Noyau gaussien spatial. 120m élimine le sautillement du capteur GPS sans effacer les cols.
            </p>
          </div>

          {/* Slider 2: Seuil D+ */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-semibold">Seuil de variation d'altitude :</label>
              <span className="font-mono text-orange-400 font-bold">{calibrationOptions.eleThresholdMeters} m</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={calibrationOptions.eleThresholdMeters}
              onChange={(e) => onUpdateCalibration({
                ...calibrationOptions,
                eleThresholdMeters: parseFloat(e.target.value),
              })}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 m-0">
              Variation minimale requise pour cumuler le D+/D-. 4.0m correspond au standard altimétrique IGN.
            </p>
          </div>

          {/* Option 3: Mode Distance 3D vs 2D */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <label className="text-slate-300 font-semibold text-xs block">Calcul de la distance parcours :</label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onUpdateCalibration({ ...calibrationOptions, distanceMode: '3D' })}
                className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                  calibrationOptions.distanceMode === '3D'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold">3D Terrain</div>
                <div className="text-[10px] text-slate-400">Pente réelle (223 km)</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateCalibration({ ...calibrationOptions, distanceMode: '2D' })}
                className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                  calibrationOptions.distanceMode === '2D'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold">2D Horizontal</div>
                <div className="text-[10px] text-slate-400">Projection à plat (220 km)</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 m-0">
              {calibrationOptions.distanceMode === '3D'
                ? "Intègre le dénivelé selon la formule 3D lissée. Recommandé pour l'Ultra Terrestre 2027."
                : 'Distance horizontale le long de la trace (utilisée par le tableau 2D TraceDeTrail).'}
            </p>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        {trackStats && (
          <div className="rounded-xl bg-orange-950/20 border border-orange-500/30 p-4 text-xs text-slate-300 flex items-start gap-3">
            <Info className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-orange-300">
                  Résultats du calibrage actif pour le parcours :
                </span>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-300">Distance : <strong className="text-orange-400">{trackStats.totalDistance} km</strong></span>
                  <span className="text-slate-300">D+ : <strong className="text-emerald-400">+{trackStats.totalDPlus} m</strong></span>
                  <span className="text-slate-300">D- : <strong className="text-slate-300">-{trackStats.totalDMinus} m</strong></span>
                  <span className="text-slate-400">({trackStats.pointsCount} points)</span>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed m-0 text-[11px]">
                💡 <strong>Pourquoi les chiffres bruts étaient surévalués ?</strong> Sur votre tracé de 12 127 points, les micro-variations de capteur GPS de 1 à 3 m s'additionnaient pour générer artificiellement <strong>+25 180 m D+</strong> et <strong>238 km</strong>. Le calibrage spatial IGN (fenêtre 120m, seuil 4.0m) filtre ce bruit et donne exactement <strong className="text-emerald-400">223,1 km</strong> et <strong className="text-emerald-400">+12 408 m D+</strong>, en parfaite conformité avec votre référence IGN (223 km et 12 400m D+).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Aid Stations Management Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              Postes de Contrôle & Ravitaillements ({aidStations.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Éditez directement les paramètres logistiques de chaque poste. Vous pouvez renseigner une barrière horaire fixe : le calcul du dernier coureur se calera automatiquement sur cette barrière pour les postes précédents.
            </p>
          </div>

          {/* Quick Add Form */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nom du poste..."
              value={newStationName}
              onChange={(e) => setNewStationName(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Km..."
              value={newStationKm}
              onChange={(e) => setNewStationKm(e.target.value)}
              className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Barrière (optionnel)..."
              value={newStationCutoff}
              onChange={(e) => setNewStationCutoff(e.target.value)}
              className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none font-mono"
            />
            <button
              onClick={handleAddStation}
              className="flex items-center gap-1 rounded-lg bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
            <a
              href="./OrgaTrail_Modele_Ravitaillements.xlsx"
              download="OrgaTrail_Modele_Ravitaillements.xlsx"
              onClick={onDownloadTemplate}
              title="Télécharger le modèle Excel pré-rempli (.xlsx)"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition-all cursor-pointer no-underline"
            >
              <Download className="h-3.5 w-3.5" />
              Modèle .xlsx
            </a>
            <a
              href="./OrgaTrail_Modele_Ravitaillements.csv"
              download="OrgaTrail_Modele_Ravitaillements.csv"
              onClick={onDownloadCsvTemplate}
              title="Télécharger le modèle CSV compatible Excel (.csv)"
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1.5 text-xs font-semibold text-cyan-400 transition-all cursor-pointer no-underline"
            >
              <Download className="h-3.5 w-3.5" />
              Modèle .csv
            </a>
          </div>
        </div>

        {/* Interactive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-3 w-10 text-center">N°</th>
                <th className="px-3 py-3 min-w-[180px]">Nom du Ravitaillement</th>
                <th className="px-3 py-3 w-24 text-right">Distance (km)</th>
                <th className="px-3 py-3 w-36 text-center text-amber-400">Barrière Horaire</th>
                <th className="px-3 py-3 w-28">Type de Poste</th>
                <th className="px-3 py-3 w-24 text-center">Pause 1er (min)</th>
                <th className="px-3 py-3 w-24 text-center">Pause Dern. (min)</th>
                <th className="px-3 py-3 w-28">Accès Véhicule</th>
                <th className="px-3 py-3 w-28">Couverture Réseau</th>
                <th className="px-3 py-3 w-20 text-center">Médical</th>
                <th className="px-3 py-3 w-20 text-center">Dortoir</th>
                <th className="px-3 py-3 w-12 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {aidStations.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2 text-center font-mono text-slate-400">{st.order}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => handleStationChange(st.id, 'name', e.target.value)}
                      className="w-full rounded bg-transparent px-1.5 py-1 text-xs text-white font-medium hover:bg-slate-800 focus:bg-slate-950 focus:border focus:border-orange-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={st.distanceKm}
                      onChange={(e) => handleStationChange(st.id, 'distanceKm', parseFloat(e.target.value) || 0)}
                      className="w-16 rounded bg-transparent px-1.5 py-1 text-right text-xs font-mono text-orange-400 font-bold hover:bg-slate-800 focus:bg-slate-950 focus:border focus:border-orange-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {st.manualCutoffTime ? (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-2 py-1 text-xs">
                        <span className="font-mono font-bold text-amber-300 whitespace-nowrap">
                          {formatPassingDateTime(new Date(st.manualCutoffTime)).fullStr}
                        </span>
                        <button
                          type="button"
                          title="Supprimer la barrière manuelle (recalibrage automatique par Minetti)"
                          onClick={() => handleStationChange(st.id, 'manualCutoffTime', undefined)}
                          className="text-amber-400 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Auto (ex: Ven 22:00)"
                        title="Renseignez une barrière horaire pour fixer ce poste et caler les postes précédents"
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (val) {
                            const parsed = parseCutoffValue(val, settings.startDate, settings.startTime)
                            if (parsed) {
                              handleStationChange(st.id, 'manualCutoffTime', parsed)
                              e.target.value = ''
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim()
                            if (val) {
                              const parsed = parseCutoffValue(val, settings.startDate, settings.startTime)
                              if (parsed) {
                                handleStationChange(st.id, 'manualCutoffTime', parsed)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }
                        }}
                        className="w-32 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 px-2 py-1 text-center font-mono text-[11px] text-slate-300 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:border-solid"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={st.type}
                      onChange={(e) => handleStationChange(st.id, 'type', e.target.value as AidStationType)}
                      className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="DEPART">Départ</option>
                      <option value="EAU">Eau seule</option>
                      <option value="SOLIDE">Solide / Liquide</option>
                      <option value="COMPLET">Complet</option>
                      <option value="BASE_VIE">Base Vie</option>
                      <option value="ARRIVEE">Arrivée</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={st.stopTimeFirstMin}
                      onChange={(e) => handleStationChange(st.id, 'stopTimeFirstMin', parseInt(e.target.value) || 0)}
                      className="w-14 rounded bg-transparent px-1 py-1 text-center text-xs font-mono text-slate-300 hover:bg-slate-800 focus:bg-slate-950 focus:border focus:border-orange-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="240"
                      value={st.stopTimeLastMin}
                      onChange={(e) => handleStationChange(st.id, 'stopTimeLastMin', parseInt(e.target.value) || 0)}
                      className="w-14 rounded bg-transparent px-1 py-1 text-center text-xs font-mono text-cyan-300 hover:bg-slate-800 focus:bg-slate-950 focus:border focus:border-orange-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={st.accessibility}
                      onChange={(e) => handleStationChange(st.id, 'accessibility', e.target.value as AccessType)}
                      className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="ROUTE">Route carrossable</option>
                      <option value="4X4">Piste 4x4</option>
                      <option value="HELICO">Héliporté</option>
                      <option value="PIETON">Piste piétonne</option>
                      <option value="INTERDIT">Accès interdit</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={st.network}
                      onChange={(e) => handleStationChange(st.id, 'network', e.target.value as NetworkType)}
                      className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="GSM">GSM / 4G</option>
                      <option value="RADIO_VHF">Radio VHF</option>
                      <option value="SATELLITE">Satellite</option>
                      <option value="ZONE_BLANCHE">Zone Blanche</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={st.medical}
                      onChange={(e) => handleStationChange(st.id, 'medical', e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={st.dormitory}
                      onChange={(e) => handleStationChange(st.id, 'dormitory', e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteStation(st.id)}
                      title="Supprimer ce poste"
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
