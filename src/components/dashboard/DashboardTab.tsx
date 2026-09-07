import React, { useState } from 'react'
import type {
  CalculatedCheckpoint,
  GpxPoint,
  RaceSettings,
  TrackStats,
} from '../../types/trail'
import { MetricCard } from '../layout/MetricCard'
import { TrailMap } from './TrailMap'
import { ElevationChart } from './ElevationChart'
import { ScheduleTable } from './ScheduleTable'
import {
  MapPin,
  TrendingUp,
  Trophy,
  Clock,
  Navigation,
} from 'lucide-react'

interface DashboardTabProps {
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  settings: RaceSettings
  stats?: TrackStats
  onUpdateCheckpointCutoff: (stationId: string, manualTimeIso?: string) => void
  onExportExcel: () => void
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  points,
  checkpoints,
  settings,
  stats,
  onUpdateCheckpointCutoff,
  onExportExcel,
}) => {
  const [hoveredCheckpointId, setHoveredCheckpointId] = useState<string | null>(null)

  const totalDist = stats?.totalDistance ?? (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].distanceKm : 0)
  const totalDPlus = stats?.totalDPlus ?? (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].cumDPlus : 0)
  const totalDMinus = stats?.totalDMinus ?? (checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].cumDMinus : 0)

  // Winner & Cutoff formatting
  const winnerH = Math.floor(settings.winnerTargetHours)
  const winnerM = Math.round((settings.winnerTargetHours - winnerH) * 60)
  const winnerStr = `${winnerH}h${String(winnerM).padStart(2, '0')}`

  const cutoffH = Math.floor(settings.cutoffTargetHours)
  const cutoffM = Math.round((settings.cutoffTargetHours - cutoffH) * 60)
  const cutoffStr = `${cutoffH}h${String(cutoffM).padStart(2, '0')}`

  return (
    <div className="space-y-6 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Distance Totale"
          value={totalDist}
          unit="km"
          sublabel="Tracé 3D vérifié"
          icon={<Navigation className="h-5 w-5" />}
          variant="orange"
        />
        <MetricCard
          label="Dénivelé Positif"
          value={`+${totalDPlus}`}
          unit="m"
          sublabel={`D- : -${totalDMinus} m`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="emerald"
        />
        <MetricCard
          label="Temps 1er Coureur"
          value={winnerStr}
          sublabel={`Allure ~${((settings.winnerTargetHours * 60) / Math.max(1, totalDist)).toFixed(1)} min/km`}
          icon={<Trophy className="h-5 w-5" />}
          variant="orange"
        />
        <MetricCard
          label="Barrière Finale (Max)"
          value={cutoffStr}
          sublabel="Queue de peloton / Serre-file"
          icon={<Clock className="h-5 w-5" />}
          variant="cyan"
        />
        <MetricCard
          label="Postes de Contrôle"
          value={checkpoints.length}
          unit="postes"
          sublabel="Ravitaillements & Sécurité"
          icon={<MapPin className="h-5 w-5" />}
          variant="purple"
        />
      </div>

      {/* Map and Elevation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map */}
        <div className="lg:col-span-6 h-[420px]">
          <TrailMap
            points={points}
            checkpoints={checkpoints}
            hoveredCheckpointId={hoveredCheckpointId}
            onSelectCheckpoint={(id) => setHoveredCheckpointId(id)}
          />
        </div>

        {/* High-res Elevation Profile with Pins */}
        <div className="lg:col-span-6 h-[420px] flex flex-col justify-between">
          <ElevationChart
            points={points}
            checkpoints={checkpoints}
            hoveredCheckpointId={hoveredCheckpointId}
            onHoverCheckpoint={(id) => setHoveredCheckpointId(id)}
            height={360}
          />
        </div>
      </div>

      {/* Security & Timing Schedule Table */}
      <ScheduleTable
        checkpoints={checkpoints}
        settings={settings}
        stats={stats}
        hoveredCheckpointId={hoveredCheckpointId}
        onHoverCheckpoint={(id) => setHoveredCheckpointId(id)}
        onUpdateCheckpointCutoff={onUpdateCheckpointCutoff}
        onExportExcel={onExportExcel}
      />
    </div>
  )
}
