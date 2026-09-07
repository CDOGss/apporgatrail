import React, { useState } from 'react'
import type {
  CalculatedCheckpoint,
  GpxPoint,
  RaceSettings,
  RoadbookSection,
  TrackStats,
} from '../../types/trail'
import { RoadbookCover } from './RoadbookCover'
import { SectionSheet } from './SectionSheet'
import { Printer, BookOpen, Layers } from 'lucide-react'

interface RoadbookTabProps {
  settings: RaceSettings
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  sections: RoadbookSection[]
  stats?: TrackStats
  onPrint: () => void
}

export const RoadbookTab: React.FC<RoadbookTabProps> = ({
  settings,
  points,
  checkpoints,
  sections,
  stats,
  onPrint,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all')

  return (
    <div className="space-y-6 pb-16">
      {/* Print & View Options Bar (No-Print) */}
      <div className="no-print rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-400" />
            <h3 className="text-base font-bold text-white m-0">
              Visualiseur de Roadbook Officiel (Format UTMB / Grand Raid)
            </h3>
          </div>
          <p className="text-xs text-slate-400 m-0">
            Découpé automatiquement en {sections.length} fiches de ~30 km calées sur les ravitaillements réels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Section filter */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedSectionId('all')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer ${
                selectedSectionId === 'all'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 inline mr-1" />
              Tout le Roadbook ({sections.length} tronçons)
            </button>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`rounded-lg px-2 py-1 font-semibold transition-all cursor-pointer ${
                  selectedSectionId === sec.id
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                S{sec.sectionNumber}
              </button>
            ))}
          </div>

          <button
            onClick={onPrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-amber-500 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimer / Exporter PDF (A4)
          </button>
        </div>
      </div>

      {/* Roadbook Content */}
      <div className="space-y-8 print:space-y-0">
        {/* Cover / General Synthesis Page (always shown when 'all' or when explicitly requested) */}
        {(selectedSectionId === 'all' || selectedSectionId === 'cover') && (
          <RoadbookCover
            settings={settings}
            points={points}
            checkpoints={checkpoints}
            stats={stats}
          />
        )}

        {/* Section Sheets */}
        {sections
          .filter((sec) => selectedSectionId === 'all' || selectedSectionId === sec.id)
          .map((sec) => (
            <SectionSheet key={sec.id} section={sec} />
          ))}
      </div>
    </div>
  )
}
