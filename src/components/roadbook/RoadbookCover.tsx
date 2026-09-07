import type {
  CalculatedCheckpoint,
  GpxPoint,
  RaceSettings,
  TrackStats,
} from '../../types/trail'
import {
  formatPassingDateTime,
} from '../../utils/pacingEngine'
import { ElevationChart } from '../dashboard/ElevationChart'
import {
  Trophy,
  Clock,
  TrendingUp,
  Navigation,
  Compass,
  MapPin,
} from 'lucide-react'

interface RoadbookCoverProps {
  settings: RaceSettings
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  stats?: TrackStats
}

export const RoadbookCover: React.FC<RoadbookCoverProps> = ({
  settings,
  points,
  checkpoints,
  stats,
}) => {
  const totalDist = stats?.totalDistance ?? (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].distanceKm : 0)
  const totalDPlus = stats?.totalDPlus ?? (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].cumDPlus : 0)
  const totalDMinus = stats?.totalDMinus ?? (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].cumDMinus : 0)

  const winnerH = Math.floor(settings.winnerTargetHours)
  const winnerM = Math.round((settings.winnerTargetHours - winnerH) * 60)
  const winnerStr = `${winnerH}h${String(winnerM).padStart(2, '0')}`

  const cutoffH = Math.floor(settings.cutoffTargetHours)
  const cutoffM = Math.round((settings.cutoffTargetHours - cutoffH) * 60)
  const cutoffStr = `${cutoffH}h${String(cutoffM).padStart(2, '0')}`

  let prevKm = 0

  return (
    <div className="page-break rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-slate-100 shadow-2xl print:border-none print:p-4 print:bg-white print:text-slate-900">
      {/* Official Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-orange-500 pb-6 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
            <Compass className="h-8 w-8 stroke-[2.2]" />
          </div>
          <div>
            <span className="rounded bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-400 uppercase tracking-widest print:text-orange-600 print:bg-orange-100">
              Roadbook Officiel de Course
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white m-0 mt-1 print:text-slate-900">
              {settings.raceName}
            </h1>
            <p className="text-sm text-slate-400 m-0 mt-0.5 print:text-slate-600">
              Départ officiel : {settings.startDate} à {settings.startTime} • Document Direction de Course & Sécurité
            </p>
          </div>
        </div>

        {/* Brand Stamp */}
        <div className="text-right">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider print:text-slate-500">
            Épreuve Ultra-Endurance
          </div>
          <div className="text-xl font-black font-mono text-orange-500 print:text-orange-600">
            {totalDist} KM / +{totalDPlus} M
          </div>
        </div>
      </div>

      {/* Identity Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 print:border-slate-300 print:bg-slate-50">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 print:text-slate-500">
            <Navigation className="h-3.5 w-3.5 text-orange-400" />
            Distance Officielle
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1 print:text-slate-900">
            {totalDist} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 print:border-slate-300 print:bg-slate-50">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 print:text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Dénivelé (+ / -)
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1 print:text-slate-900">
            +{totalDPlus}m <span className="text-xs font-normal text-slate-400">(-{totalDMinus}m)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 print:border-slate-300 print:bg-slate-50">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 print:text-slate-500">
            <Trophy className="h-3.5 w-3.5 text-orange-400" />
            Temps Vainqueur
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1 print:text-slate-900">
            {winnerStr}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 print:border-slate-300 print:bg-slate-50">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 print:text-slate-500">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            Barrière Finale (Max)
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1 print:text-slate-900">
            {cutoffStr}
          </div>
        </div>
      </div>

      {/* Global Elevation Profile */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2 print:text-slate-800">
          <MapPin className="h-4 w-4 text-orange-500" />
          Profil Altimétrique Global avec Ravitaillements
        </h2>
        <ElevationChart points={points} checkpoints={checkpoints} height={250} />
      </div>

      {/* Summary Schedule Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2 print:text-slate-800">
          <Clock className="h-4 w-4 text-orange-500" />
          Grille Récapitulative des Postes & Barrières Horaires
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
              <tr>
                <th className="px-2.5 py-2 w-8 text-center">N°</th>
                <th className="px-2.5 py-2">Ravitaillement</th>
                <th className="px-2.5 py-2 text-right">Km</th>
                <th className="px-2.5 py-2 text-right">Tronçon</th>
                <th className="px-2.5 py-2 text-right">Alt.</th>
                <th className="px-2.5 py-2 text-right">D+</th>
                <th className="px-2.5 py-2 text-center">Type</th>
                <th className="px-2.5 py-2">Heure 1er</th>
                <th className="px-2.5 py-2 font-bold text-cyan-400 print:text-cyan-700">Barrière Horaire</th>
                <th className="px-2.5 py-2">Accès</th>
                <th className="px-2.5 py-2">Comms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 print:bg-white print:divide-slate-200">
              {checkpoints.map((cp) => {
                const distDelta = Math.round((cp.distanceKm - prevKm) * 10) / 10
                prevKm = cp.distanceKm
                const firstPass = formatPassingDateTime(cp.firstRunner.passingTime)
                const lastPass = formatPassingDateTime(cp.lastRunner.passingTime)

                return (
                  <tr key={cp.aidStation.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="px-2.5 py-1.5 text-center font-mono text-slate-400">{cp.aidStation.order}</td>
                    <td className="px-2.5 py-1.5 font-semibold text-white print:text-slate-900">{cp.aidStation.name}</td>
                    <td className="px-2.5 py-1.5 text-right font-mono font-bold text-orange-400 print:text-orange-600">{cp.distanceKm}</td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-slate-400">+{distDelta}k</td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-slate-200 print:text-slate-800">{cp.elevation}m</td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-emerald-400 print:text-emerald-600">+{cp.cumDPlus}m</td>
                    <td className="px-2.5 py-1.5 text-center">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300 print:bg-slate-100 print:text-slate-800">
                        {cp.aidStation.type}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-slate-200 print:text-slate-800">
                      {firstPass.fullStr}
                    </td>
                    <td className="px-2.5 py-1.5 font-mono font-bold text-cyan-300 print:text-cyan-800">
                      {lastPass.fullStr}
                    </td>
                    <td className="px-2.5 py-1.5 text-slate-400 print:text-slate-600">{cp.aidStation.accessibility}</td>
                    <td className="px-2.5 py-1.5 text-slate-400 print:text-slate-600">{cp.aidStation.network}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
