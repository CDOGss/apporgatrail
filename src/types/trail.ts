export interface GpxPoint {
  lat: number
  lon: number
  ele: number
  dist: number // Cumulative distance in km
  dPlus: number // Cumulative positive elevation in m
  dMinus: number // Cumulative negative elevation in m
  slope: number // Decimal slope (rise / run)
}

export interface TrackStats {
  totalDistance: number // in km
  totalDPlus: number // in m
  totalDMinus: number // in m
  minElevation: number // in m
  maxElevation: number // in m
  pointsCount: number
}

export interface GpxCalibrationOptions {
  smoothWindowMeters: number
  eleThresholdMeters: number
  distanceMode: '3D' | '2D'
}

export type AidStationType = 'DEPART' | 'EAU' | 'SOLIDE' | 'COMPLET' | 'BASE_VIE' | 'ARRIVEE'
export type AccessType = 'ROUTE' | '4X4' | 'HELICO' | 'PIETON' | 'INTERDIT'
export type NetworkType = 'GSM' | 'RADIO_VHF' | 'SATELLITE' | 'ZONE_BLANCHE'

export interface AidStation {
  id: string
  order: number
  name: string
  distanceKm: number
  elevation?: number
  stopTimeFirstMin: number
  stopTimeLastMin: number
  type: AidStationType
  accessibility: AccessType
  network: NetworkType
  medical: boolean
  dormitory: boolean
  lat?: number
  lon?: number
  gpxPointIndex?: number
  manualCutoffTime?: string // ISO string or 'YYYY-MM-DDTHH:mm'
}

export interface RaceSettings {
  raceName: string
  startDate: string // 'YYYY-MM-DD'
  startTime: string // 'HH:mm'
  winnerTargetHours: number // e.g. 23.5 for 23h30
  cutoffTargetHours: number // e.g. 66.0 for 66h00
  defaultFirstStopMin: number
  defaultLastStopMin: number
  nightPenaltyPercent: number // e.g. 8 (8%)
  nightStartHour: number // e.g. 19
  nightEndHour: number // e.g. 6
}

export interface RunnerPacingInfo {
  passingTime: Date
  departureTime: Date
  elapsedMinutes: number
  splitMinutes: number
  splitSpeedKmh: number
  splitPaceMinPerKm: number
}

export interface CalculatedCheckpoint {
  aidStation: AidStation
  distanceKm: number
  elevation: number
  cumDPlus: number
  cumDMinus: number
  firstRunner: RunnerPacingInfo
  lastRunner: RunnerPacingInfo & {
    isManualCutoff: boolean
  }
}

export interface RoadbookSection {
  id: string
  sectionNumber: number
  title: string
  fromName: string
  toName: string
  startKm: number
  endKm: number
  distanceKm: number
  dPlus: number
  dMinus: number
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  highestEle: number
  lowestEle: number
  maxSlopePercent: number
}
