import React, { useState } from 'react'
import type {
  CalculatedCheckpoint,
  RaceSettings,
  TrackStats,
} from '../../types/trail'
import {
  formatPassingDateTime,
  formatElapsedMinutes,
} from '../../utils/pacingEngine'
import {
  Search,
  SlidersHorizontal,
  Edit2,
  RotateCcw,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Truck,
  Radio,
  HeartPulse,
  Bed,
} from 'lucide-react'

interface ScheduleTableProps {
  checkpoints: CalculatedCheckpoint[]
  settings: RaceSettings
  stats?: TrackStats
  hoveredCheckpointId?: string | null
  onHoverCheckpoint?: (id: string | null) => void
  onUpdateCheckpointCutoff: (stationId: string, manualTimeIso?: string) => void
  onExportExcel: () => void
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  checkpoints,
  settings,
  hoveredCheckpointId,
  onHoverCheckpoint,
  onUpdateCheckpointCutoff,
  onExportExcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingStationId, setEditingStationId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  const handleStartEdit = (cp: CalculatedCheckpoint) => {
    setEditingStationId(cp.aidStation.id)
    const dateObj = cp.lastRunner.passingTime
    const yyyy = dateObj.getFullYear()
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getDate()).padStart(2, '0')
    const hh = String(dateObj.getHours()).padStart(2, '0')
    const min = String(dateObj.getMinutes()).padStart(2, '0')

    setEditDate(`${yyyy}-${mm}-${dd}`)
    setEditTime(`${hh}:${min}`)
  }

  const handleSaveEdit = (stationId: string) => {
    if (!editDate || !editTime) return
    const isoString = `${editDate}T${editTime}`
    onUpdateCheckpointCutoff(stationId, isoString)
    setEditingStationId(null)
  }

  const handleResetManualCutoff = (stationId: string) => {
    onUpdateCheckpointCutoff(stationId, undefined)
    setEditingStationId(null)
  }

  const filtered = checkpoints.filter(cp =>
    cp.aidStation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cp.aidStation.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  let prevKm = 0

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-orange-400" />
            Grille Horaire Officielle & Postes de Sécurité
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrée sur le modèle physiologique de Minetti. Cliquez sur une barrière horaire pour l'ajuster manuellement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-52 rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel Sécurité</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-3 py-3 w-10 text-center">N°</th>
              <th className="px-3 py-3 min-w-[190px]">Ravitaillement / Poste</th>
              <th className="px-3 py-3 w-20 text-right">Km</th>
              <th className="px-3 py-3 w-16 text-right">Tronçon</th>
              <th className="px-3 py-3 w-16 text-right">Alt.</th>
              <th className="px-3 py-3 w-16 text-right">D+</th>
              <th className="px-3 py-3 min-w-[160px] text-orange-400">1er Coureur (Vainqueur)</th>
              <th className="px-3 py-3 min-w-[210px] text-cyan-400">Barrière Horaire (Serre-file)</th>
              <th className="px-3 py-3 w-28">Accès</th>
              <th className="px-3 py-3 w-28">Réseau</th>
              <th className="px-3 py-3 w-20 text-center">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filtered.map((cp) => {
              const isHovered = hoveredCheckpointId === cp.aidStation.id
              const distDelta = Math.round((cp.distanceKm - prevKm) * 10) / 10
              prevKm = cp.distanceKm

              const firstPass = formatPassingDateTime(cp.firstRunner.passingTime)
              const lastPass = formatPassingDateTime(cp.lastRunner.passingTime)

              const isEditing = editingStationId === cp.aidStation.id

              return (
                <tr
                  key={cp.aidStation.id}
                  onMouseEnter={() => onHoverCheckpoint && onHoverCheckpoint(cp.aidStation.id)}
                  onMouseLeave={() => onHoverCheckpoint && onHoverCheckpoint(null)}
                  className={`transition-colors ${
                    isHovered
                      ? 'bg-orange-500/10'
                      : cp.lastRunner.isManualCutoff
                      ? 'bg-cyan-950/20'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Order */}
                  <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                    {cp.aidStation.order}
                  </td>

                  {/* Name & Badges */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {cp.aidStation.name}
                      </span>
                      {cp.aidStation.type === 'BASE_VIE' && (
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-400/30">
                          BASE VIE
                        </span>
                      )}
                      {cp.aidStation.type === 'DEPART' && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                          DÉPART
                        </span>
                      )}
                      {cp.aidStation.type === 'ARRIVEE' && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-300 border border-red-500/30">
                          ARRIVÉE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Km Cumulé */}
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-orange-400">
                    {cp.distanceKm}
                  </td>

                  {/* Tronçon delta */}
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400 text-[11px]">
                    +{distDelta}k
                  </td>

                  {/* Elevation */}
                  <td className="px-3 py-2.5 text-right font-mono text-slate-200">
                    {cp.elevation}m
                  </td>

                  {/* D+ Cumulé */}
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-400 font-medium">
                    +{cp.cumDPlus}m
                  </td>

                  {/* 1st Runner Info */}
                  <td className="px-3 py-2.5">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="text-orange-400 text-[11px] font-sans">{firstPass.dayName}</span>
                        <span>{firstPass.timeStr}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (+{cp.aidStation.stopTimeFirstMin}m)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Course : {formatElapsedMinutes(cp.firstRunner.elapsedMinutes)}</span>
                        <span>•</span>
                        <span className="text-slate-300">{cp.firstRunner.splitSpeedKmh} km/h</span>
                      </div>
                    </div>
                  </td>

                  {/* Last Runner / Cutoff Info (with inline manual edit) */}
                  <td className="px-3 py-2.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-cyan-500/60 shadow-lg">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[10px] text-white focus:outline-none"
                        />
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[10px] text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(cp.aidStation.id)}
                          title="Valider la barrière manuelle"
                          className="text-emerald-400 hover:text-emerald-300 p-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStationId(null)}
                          title="Annuler"
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <span className="text-cyan-400 text-[11px] font-sans">{lastPass.dayName}</span>
                            <span className={cp.lastRunner.isManualCutoff ? 'text-amber-300' : ''}>
                              {lastPass.timeStr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              (+{cp.aidStation.stopTimeLastMin}m)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>Limite : {formatElapsedMinutes(cp.lastRunner.elapsedMinutes)}</span>
                            <span>•</span>
                            <span className="text-slate-300">{cp.lastRunner.splitSpeedKmh} km/h</span>
                            {cp.lastRunner.isManualCutoff && (
                              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                                Ajustée
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit and Reset Buttons */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(cp)}
                            title="Modifier manuellement la barrière horaire"
                            className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {cp.lastRunner.isManualCutoff && (
                            <button
                              onClick={() => handleResetManualCutoff(cp.aidStation.id)}
                              title="Réinitialiser au calcul Minetti"
                              className="p-1 rounded hover:bg-slate-800 text-amber-400 hover:text-amber-300"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Access */}
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                      <Truck className="h-3 w-3 text-slate-500" />
                      {cp.aidStation.accessibility}
                    </span>
                  </td>

                  {/* Network */}
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                      <Radio className="h-3 w-3 text-slate-500" />
                      {cp.aidStation.network}
                    </span>
                  </td>

                  {/* Services */}
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {cp.aidStation.medical && (
                        <span title="Poste Médical / Secours">
                          <HeartPulse className="h-3.5 w-3.5 text-red-400" />
                        </span>
                      )}
                      {cp.aidStation.dormitory && (
                        <span title="Dortoir / Repos">
                          <Bed className="h-3.5 w-3.5 text-indigo-400" />
                        </span>
                      )}
                      {!cp.aidStation.medical && !cp.aidStation.dormitory && (
                        <span className="text-slate-600">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
        <AlertCircle className="h-4 w-4 text-cyan-400" />
        <span>
          Les barrières horaires sont calculées sur la base du temps cible final ({settings.cutoffTargetHours}h) avec intégration du coût physiologique de Minetti, de la dérive de fatigue de queue de peloton et du ralentissement de nuit.
        </span>
      </div>
    </div>
  )
}
