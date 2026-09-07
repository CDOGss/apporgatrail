import React from 'react'
import type { RoadbookSection } from '../../types/trail'
import { SectionMiniProfile } from './SectionMiniProfile'
import { formatPassingDateTime, formatElapsedMinutes } from '../../utils/pacingEngine'
import {
  Navigation,
  TrendingUp,
  Mountain,
  AlertTriangle,
  Truck,
  Radio,
  HeartPulse,
  Bed,
  Utensils,
  Droplets,
} from 'lucide-react'

interface SectionSheetProps {
  section: RoadbookSection
}

export const SectionSheet: React.FC<SectionSheetProps> = ({ section }) => {
  return (
    <div className="page-break rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-slate-100 shadow-2xl print:border-none print:p-4 print:bg-white print:text-slate-900 mb-8 print:mb-0">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-orange-500 pb-4 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs font-extrabold text-orange-400 uppercase tracking-wider print:text-orange-700 print:bg-orange-100">
              Tronçon {section.sectionNumber} (~30 km)
            </span>
            <span className="text-xs text-slate-400 print:text-slate-600 font-mono">
              Km {section.startKm} ➔ Km {section.endKm}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white m-0 mt-1 print:text-slate-900">
            {section.fromName} <span className="text-orange-500">➔</span> {section.toName}
          </h2>
        </div>

        {/* Section Quick Metrics Badge */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-right print:border-slate-300 print:bg-slate-50">
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500">Distance</div>
            <div className="text-lg font-bold font-mono text-orange-400 print:text-orange-600">{section.distanceKm} km</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-right print:border-slate-300 print:bg-slate-50">
            <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500">D+ / D-</div>
            <div className="text-lg font-bold font-mono text-emerald-400 print:text-emerald-600">+{section.dPlus}m / -{section.dMinus}m</div>
          </div>
        </div>
      </div>

      {/* Top Indicators: Highest elevation, lowest elevation, steepest slope */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 print:border-slate-300 print:bg-slate-50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 print:text-slate-500">
            <Mountain className="h-3.5 w-3.5 text-orange-400" />
            Point Culminant
          </div>
          <div className="text-xl font-bold font-mono text-white mt-0.5 print:text-slate-900">
            {section.highestEle} <span className="text-xs font-normal text-slate-400">m</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 print:border-slate-300 print:bg-slate-50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 print:text-slate-500">
            <Navigation className="h-3.5 w-3.5 text-cyan-400" />
            Point Bas
          </div>
          <div className="text-xl font-bold font-mono text-white mt-0.5 print:text-slate-900">
            {section.lowestEle} <span className="text-xs font-normal text-slate-400">m</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 print:border-slate-300 print:bg-slate-50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 print:text-slate-500">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Pente Maximale
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-0.5 print:text-amber-600">
            {section.maxSlopePercent}%
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 print:border-slate-300 print:bg-slate-50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 print:text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Postes du tronçon
          </div>
          <div className="text-xl font-bold font-mono text-white mt-0.5 print:text-slate-900">
            {section.checkpoints.length} <span className="text-xs font-normal text-slate-400">points</span>
          </div>
        </div>
      </div>

      {/* Mini Profile Altimétrique Zoomé */}
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 print:text-slate-800">
          Profil Zoomé de la Section & Pourcentages
        </h3>
        <SectionMiniProfile
          points={section.points}
          checkpoints={section.checkpoints}
          height={160}
        />
      </div>

      {/* Intermediate Checkpoints Table */}
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 print:text-slate-800">
          Points de Contrôle & Grille de Pacing du Tronçon
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-slate-700">
              <tr>
                <th className="px-3 py-2 w-8 text-center">N°</th>
                <th className="px-3 py-2">Ravitaillement</th>
                <th className="px-3 py-2 text-right">Km Global</th>
                <th className="px-3 py-2 text-right">Km Relatif</th>
                <th className="px-3 py-2 text-right">Alt.</th>
                <th className="px-3 py-2 text-center">Pause</th>
                <th className="px-3 py-2 text-orange-400 print:text-orange-700">1er Coureur</th>
                <th className="px-3 py-2 font-bold text-cyan-400 print:text-cyan-800">Barrière Horaire</th>
                <th className="px-3 py-2 text-right">Vit. 1er</th>
                <th className="px-3 py-2 text-right">Vit. Serre-file</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 print:bg-white print:divide-slate-200">
              {section.checkpoints.map((cp) => {
                const relKm = Math.round((cp.distanceKm - section.startKm) * 10) / 10
                const firstPass = formatPassingDateTime(cp.firstRunner.passingTime)
                const lastPass = formatPassingDateTime(cp.lastRunner.passingTime)

                return (
                  <tr key={cp.aidStation.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="px-3 py-1.5 text-center font-mono text-slate-400">{cp.aidStation.order}</td>
                    <td className="px-3 py-1.5 font-bold text-white print:text-slate-900">
                      {cp.aidStation.name}
                      {cp.aidStation.type === 'BASE_VIE' && (
                        <span className="ml-1.5 rounded bg-amber-400/20 px-1 py-0.2 text-[8px] font-bold text-amber-300">
                          BASE VIE
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-orange-400 print:text-orange-600">{cp.distanceKm}k</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-400">+{relKm}k</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-200 print:text-slate-800">{cp.elevation}m</td>
                    <td className="px-3 py-1.5 text-center text-slate-400">
                      {cp.aidStation.stopTimeFirstMin}m / {cp.aidStation.stopTimeLastMin}m
                    </td>
                    <td className="px-3 py-1.5 font-mono text-slate-200 print:text-slate-800">
                      {firstPass.fullStr} ({formatElapsedMinutes(cp.firstRunner.elapsedMinutes)})
                    </td>
                    <td className="px-3 py-1.5 font-mono font-bold text-cyan-300 print:text-cyan-800">
                      {lastPass.fullStr} ({formatElapsedMinutes(cp.lastRunner.elapsedMinutes)})
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-300">{cp.firstRunner.splitSpeedKmh} km/h</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-300">{cp.lastRunner.splitSpeedKmh} km/h</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logistics Cards Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 print:text-slate-800">
          Fiches Logistiques & Sécurité des Postes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {section.checkpoints.map((cp) => (
            <div
              key={`logistics-${cp.aidStation.id}`}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-2 print:border-slate-300 print:bg-slate-50"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 print:border-slate-200">
                <span className="font-bold text-white print:text-slate-900">
                  #{cp.aidStation.order} {cp.aidStation.name}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 print:bg-slate-200 print:text-slate-800">
                  {cp.aidStation.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 print:text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-slate-500" />
                  <span>Accès : <strong className="text-white print:text-slate-900">{cp.aidStation.accessibility}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-slate-500" />
                  <span>Comms : <strong className="text-white print:text-slate-900">{cp.aidStation.network}</strong></span>
                </div>
              </div>

              {/* Service Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cp.aidStation.type === 'EAU' && (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300 border border-blue-500/30">
                    <Droplets className="h-3 w-3" /> Eau seule
                  </span>
                )}
                {(cp.aidStation.type === 'SOLIDE' || cp.aidStation.type === 'COMPLET' || cp.aidStation.type === 'BASE_VIE') && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/30">
                    <Utensils className="h-3 w-3" /> Solide & Liquide
                  </span>
                )}
                {cp.aidStation.medical && (
                  <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300 border border-red-500/30">
                    <HeartPulse className="h-3 w-3" /> Équipe Médicale
                  </span>
                )}
                {cp.aidStation.dormitory && (
                  <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300 border border-purple-500/30">
                    <Bed className="h-3 w-3" /> Dortoir / Lits
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
