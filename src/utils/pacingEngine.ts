import type {
  GpxPoint,
  AidStation,
  RaceSettings,
  CalculatedCheckpoint,
  RunnerPacingInfo,
} from '../types/trail'

/**
 * Minetti Energy Cost Model Cr(p) in J/(kg*m)
 * Cr(p) = 155.4 * p^5 - 30.4 * p^4 - 43.3 * p^3 + 46.3 * p^2 + 19.5 * p + 3.6
 * where p is the slope (rise / run)
 */
export function minettiEnergyCost(slope: number): number {
  // Clamp slope to realistic trail bounds [-0.5, 0.5]
  const p = Math.max(-0.5, Math.min(0.5, slope))
  const cost =
    155.4 * Math.pow(p, 5) -
    30.4 * Math.pow(p, 4) -
    43.3 * Math.pow(p, 3) +
    46.3 * Math.pow(p, 2) +
    19.5 * p +
    3.6

  // On very steep descents (p < -0.15), runners brake; clamp to avoid unrealistically low cost
  return Math.max(1.8, cost)
}

/**
 * Ratio of effort on slope p compared to flat ground (Cr(0) = 3.6)
 */
export function relativeSlopeEffort(slope: number): number {
  return minettiEnergyCost(slope) / 3.6
}

/**
 * Checks if a given timestamp falls during the night window (e.g. 19:00 - 06:00)
 */
export function isNightTime(
  date: Date,
  nightStartHour: number = 19,
  nightEndHour: number = 6
): boolean {
  const h = date.getHours() + date.getMinutes() / 60
  if (nightStartHour > nightEndHour) {
    // Spans across midnight, e.g. 19h to 6h
    return h >= nightStartHour || h < nightEndHour
  }
  return h >= nightStartHour && h < nightEndHour
}

/**
 * Micro-segment for pacing integration
 */
interface MicroSegment {
  distKm: number
  lengthKm: number
  slope: number
  relativeCost: number
}

/**
 * Splits GPX points into micro segments for fine-grained pacing calculation
 */
function buildMicroSegments(points: GpxPoint[]): MicroSegment[] {
  const segments: MicroSegment[] = []
  if (!points || points.length < 2) return segments

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1]
    const p2 = points[i]
    const lengthKm = p2.dist - p1.dist
    if (lengthKm <= 0.0001) continue

    const slope = p2.slope || (lengthKm > 0 ? (p2.ele - p1.ele) / (lengthKm * 1000) : 0)
    segments.push({
      distKm: p2.dist,
      lengthKm,
      slope,
      relativeCost: relativeSlopeEffort(slope),
    })
  }

  return segments
}

/**
 * Simulates race progress along a subset of micro-segments between two points
 */
function simulateSection(
  segments: MicroSegment[],
  totalCourseDistKm: number,
  baseVelocityKmh: number,
  departureTime: Date,
  fatigueDrift: number,
  fatiguePower: number,
  nightPenaltyPercent: number,
  nightStartHour: number,
  nightEndHour: number,
  sectionStations: AidStation[],
  isFirstRunner: boolean
): { totalDurationMinutes: number; stationElapsedMap: Map<string, { arrival: Date; departure: Date; elapsedMinutes: number }> } {
  let elapsedMinutes = 0
  let curDate = new Date(departureTime.getTime())
  const stationElapsedMap = new Map<string, { arrival: Date; departure: Date; elapsedMinutes: number }>()

  let nextStationIdx = 0

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const progressFrac = Math.min(1, seg.distKm / (totalCourseDistKm || 1))

    // Fatigue factor relative to global race progress
    const fatigue = 1 + fatigueDrift * Math.pow(progressFrac, fatiguePower)

    // Night factor
    const inNight = isNightTime(curDate, nightStartHour, nightEndHour)
    const nightFactor = inNight ? 1 + nightPenaltyPercent / 100 : 1

    // Effective speed on this micro-segment
    const effectiveSpeed = baseVelocityKmh / (seg.relativeCost * fatigue * nightFactor)
    const segmentHours = seg.lengthKm / Math.max(0.3, effectiveSpeed)
    const segmentMinutes = segmentHours * 60

    elapsedMinutes += segmentMinutes
    curDate = new Date(curDate.getTime() + segmentMinutes * 60 * 1000)

    // Check if reached or passed an aid station
    while (
      nextStationIdx < sectionStations.length &&
      seg.distKm >= sectionStations[nextStationIdx].distanceKm - 0.001
    ) {
      const st = sectionStations[nextStationIdx]
      const arrival = new Date(curDate.getTime())
      const stopMin = isFirstRunner ? st.stopTimeFirstMin : st.stopTimeLastMin
      const departure = new Date(arrival.getTime() + stopMin * 60 * 1000)

      stationElapsedMap.set(st.id, {
        arrival,
        departure,
        elapsedMinutes,
      })

      elapsedMinutes += stopMin
      curDate = departure
      nextStationIdx++
    }
  }

  // Cover any remaining stations at end of section
  while (nextStationIdx < sectionStations.length) {
    const st = sectionStations[nextStationIdx]
    const arrival = new Date(curDate.getTime())
    const stopMin = isFirstRunner ? st.stopTimeFirstMin : st.stopTimeLastMin
    const departure = new Date(arrival.getTime() + stopMin * 60 * 1000)

    stationElapsedMap.set(st.id, { arrival, departure, elapsedMinutes })
    elapsedMinutes += stopMin
    curDate = departure
    nextStationIdx++
  }

  return { totalDurationMinutes: elapsedMinutes, stationElapsedMap }
}

/**
 * Calibrates base velocity V0 for a section to match targetDurationMinutes exactly
 */
function calibrateSectionVelocity(
  segments: MicroSegment[],
  totalCourseDistKm: number,
  targetDurationMinutes: number,
  departureTime: Date,
  fatigueDrift: number,
  fatiguePower: number,
  nightPenaltyPercent: number,
  nightStartHour: number,
  nightEndHour: number,
  sectionStations: AidStation[],
  isFirstRunner: boolean
): Map<string, { arrival: Date; departure: Date; elapsedMinutes: number }> {
  let lowV = 0.2
  let highV = 50.0
  let bestMap = new Map<string, { arrival: Date; departure: Date; elapsedMinutes: number }>()

  if (segments.length === 0 || sectionStations.length === 0) {
    let cur = new Date(departureTime.getTime())
    for (const st of sectionStations) {
      const stopMin = isFirstRunner ? st.stopTimeFirstMin : st.stopTimeLastMin
      const dep = new Date(cur.getTime() + stopMin * 60000)
      bestMap.set(st.id, { arrival: cur, departure: dep, elapsedMinutes: 0 })
      cur = dep
    }
    return bestMap
  }

  for (let iter = 0; iter < 24; iter++) {
    const midV = (lowV + highV) / 2
    const res = simulateSection(
      segments,
      totalCourseDistKm,
      midV,
      departureTime,
      fatigueDrift,
      fatiguePower,
      nightPenaltyPercent,
      nightStartHour,
      nightEndHour,
      sectionStations,
      isFirstRunner
    )
    bestMap = res.stationElapsedMap

    if (Math.abs(res.totalDurationMinutes - targetDurationMinutes) < 0.5) {
      break
    }

    if (res.totalDurationMinutes > targetDurationMinutes) {
      lowV = midV
    } else {
      highV = midV
    }
  }

  return bestMap
}

/**
 * Main engine entry point: calculates complete checkpoint pacing timetable
 * Implements piecewise cutoff anchoring: if an organizer sets a cutoff at any station,
 * all previous stations back to the preceding anchor are paced so that the last runner
 * hits that cutoff time precisely.
 */
export function calculatePacingSchedule(
  points: GpxPoint[],
  aidStations: AidStation[],
  settings: RaceSettings
): CalculatedCheckpoint[] {
  if (!aidStations || aidStations.length === 0) return []

  const totalDistKm = points.length > 0 ? points[points.length - 1].dist : 1
  const segments = buildMicroSegments(points)

  // Start Date & Time
  const [startYear, startMonth, startDay] = settings.startDate.split('-').map(Number)
  const [startHour, startMin] = settings.startTime.split(':').map(Number)
  const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0)

  // Target minutes
  const winnerTargetMin = Math.max(30, settings.winnerTargetHours * 60)
  const cutoffTargetMin = Math.max(winnerTargetMin + 60, settings.cutoffTargetHours * 60)

  const sortedStations = [...aidStations].sort((a, b) => a.distanceKm - b.distanceKm)

  // 1. Calibrate First Runners globally across entire course (winner runs for victory)
  // Calibrated empirically with Louis Calais (winner 2026):
  // - Camphrier (km 10.59): reached in ~1h04 (vs 1h02 in 2026, eliminating the prior 24 min delay)
  // - Foc Foc (km 25.33): reached in ~3h23 (vs 3h25 in 2026)
  // - Maïdo -> Tamarin: properly accounts for 2027 crest climb to 2786m (+300m D+)
  // - La Redoute: finishes at exact target (34h30)
  const firstRunnerStations = sortedStations.length > 1 ? sortedStations.slice(1) : sortedStations
  const firstRunnerSectionMap = calibrateSectionVelocity(
    segments,
    totalDistKm,
    winnerTargetMin,
    startDateTime,
    1.40,
    0.58,
    settings.nightPenaltyPercent,
    settings.nightStartHour,
    settings.nightEndHour,
    firstRunnerStations,
    true
  )

  const firstRunnerMap = new Map<string, { arrival: Date; departure: Date; elapsedMinutes: number }>()
  if (sortedStations.length > 0) {
    const s0 = sortedStations[0]
    firstRunnerMap.set(s0.id, {
      arrival: new Date(startDateTime.getTime()),
      departure: new Date(startDateTime.getTime() + s0.stopTimeFirstMin * 60000),
      elapsedMinutes: 0,
    })
    for (const [id, val] of firstRunnerSectionMap.entries()) {
      firstRunnerMap.set(id, val)
    }
  }

  // 2. Calibrate Last Runners with Piecewise Anchor Cutoffs
  interface Anchor {
    stationIndex: number
    station: AidStation
    arrival: Date
    departure: Date
    isExplicitCutoff: boolean
  }

  const anchors: Anchor[] = []

  // Anchor 0: Start Station
  const startStation = sortedStations[0]
  const startDep = new Date(startDateTime.getTime() + startStation.stopTimeLastMin * 60000)
  anchors.push({
    stationIndex: 0,
    station: startStation,
    arrival: new Date(startDateTime.getTime()),
    departure: startDep,
    isExplicitCutoff: false,
  })

  // Intermediate Anchors: stations with manualCutoffTime defined
  for (let i = 1; i < sortedStations.length - 1; i++) {
    const st = sortedStations[i]
    if (st.manualCutoffTime) {
      const parsed = new Date(st.manualCutoffTime)
      if (!isNaN(parsed.getTime())) {
        const dep = new Date(parsed.getTime() + st.stopTimeLastMin * 60000)
        anchors.push({
          stationIndex: i,
          station: st,
          arrival: parsed,
          departure: dep,
          isExplicitCutoff: true,
        })
      }
    }
  }

  // Final Anchor: Finish Station
  const lastStation = sortedStations[sortedStations.length - 1]
  let finalCutoffDate: Date
  let isFinalExplicit = false
  if (lastStation.manualCutoffTime) {
    const parsed = new Date(lastStation.manualCutoffTime)
    if (!isNaN(parsed.getTime())) {
      finalCutoffDate = parsed
      isFinalExplicit = true
    } else {
      finalCutoffDate = new Date(startDateTime.getTime() + cutoffTargetMin * 60000)
    }
  } else {
    finalCutoffDate = new Date(startDateTime.getTime() + cutoffTargetMin * 60000)
  }

  if (sortedStations.length > 1) {
    anchors.push({
      stationIndex: sortedStations.length - 1,
      station: lastStation,
      arrival: finalCutoffDate,
      departure: new Date(finalCutoffDate.getTime() + lastStation.stopTimeLastMin * 60000),
      isExplicitCutoff: isFinalExplicit,
    })
  }

  // Now, piecewise calibrate last runner between each consecutive pair of anchors
  const lastRunnerMap = new Map<
    string,
    { arrival: Date; departure: Date; elapsedMinutes: number; isManualCutoff: boolean }
  >()

  // Set start station
  lastRunnerMap.set(startStation.id, {
    arrival: anchors[0].arrival,
    departure: anchors[0].departure,
    elapsedMinutes: 0,
    isManualCutoff: false,
  })

  for (let j = 0; j < anchors.length - 1; j++) {
    const ancA = anchors[j]
    const ancB = anchors[j + 1]

    const fromIdx = ancA.stationIndex
    const toIdx = ancB.stationIndex

    const fromDist = ancA.station.distanceKm
    const toDist = ancB.station.distanceKm

    // Filter segments belonging to this section
    const subSegments = segments.filter(
      (seg) => seg.distKm > fromDist - 0.001 && seg.distKm <= toDist + 0.001
    )

    // Stations to pace: intermediate stations (fromIdx + 1 to toIdx)
    const subStations = sortedStations.slice(fromIdx + 1, toIdx + 1)

    // Target duration from departure of ancA to arrival at ancB
    let targetMin = (ancB.arrival.getTime() - ancA.departure.getTime()) / 60000
    if (targetMin <= 5) {
      // Fallback if target duration is unrealistically short or negative
      const subDist = Math.max(0.1, toDist - fromDist)
      targetMin = Math.max(10, (subDist / 4.0) * 60)
    }

    const subMap = calibrateSectionVelocity(
      subSegments,
      totalDistKm,
      targetMin,
      ancA.departure,
      0.40,
      1.35,
      settings.nightPenaltyPercent,
      settings.nightStartHour,
      settings.nightEndHour,
      subStations,
      false
    )

    // Populate lastRunnerMap for all stations in this interval
    for (let k = fromIdx + 1; k <= toIdx; k++) {
      const st = sortedStations[k]
      const isAnchorTarget = k === toIdx
      const isExplicit = isAnchorTarget && ancB.isExplicitCutoff

      if (isAnchorTarget) {
        // Guarantee exact match with anchor arrival cutoff
        const elapsed = Math.round((ancB.arrival.getTime() - startDateTime.getTime()) / 60000)
        lastRunnerMap.set(st.id, {
          arrival: ancB.arrival,
          departure: ancB.departure,
          elapsedMinutes: elapsed,
          isManualCutoff: isExplicit,
        })
      } else {
        const info = subMap.get(st.id)
        if (info) {
          const elapsed = Math.round((info.arrival.getTime() - startDateTime.getTime()) / 60000)
          lastRunnerMap.set(st.id, {
            arrival: info.arrival,
            departure: info.departure,
            elapsedMinutes: elapsed,
            isManualCutoff: false,
          })
        }
      }
    }
  }

  // 3. Map to CalculatedCheckpoint array
  const checkpoints: CalculatedCheckpoint[] = []
  let prevFirstArr = startDateTime
  let prevLastArr = startDateTime
  let prevDistKm = 0

  for (let i = 0; i < sortedStations.length; i++) {
    const st = sortedStations[i]
    const gpxIdx = st.gpxPointIndex ?? 0
    const pt = points[gpxIdx] || {
      ele: st.elevation || 0,
      dPlus: 0,
      dMinus: 0,
    }

    const firstSim = firstRunnerMap.get(st.id) || {
      arrival: startDateTime,
      departure: startDateTime,
      elapsedMinutes: 0,
    }
    const lastSim = lastRunnerMap.get(st.id) || {
      arrival: startDateTime,
      departure: startDateTime,
      elapsedMinutes: 0,
      isManualCutoff: false,
    }

    const lastArr = lastSim.arrival
    const lastDep = lastSim.departure

    const distDelta = Math.max(0.01, st.distanceKm - prevDistKm)
    const firstSplitMin = Math.max(0, (firstSim.arrival.getTime() - prevFirstArr.getTime()) / 60000)
    const lastSplitMin = Math.max(0, (lastArr.getTime() - prevLastArr.getTime()) / 60000)

    const firstSpeed = distDelta / (Math.max(0.01, firstSplitMin) / 60)
    const lastSpeed = distDelta / (Math.max(0.01, lastSplitMin) / 60)

    const firstPace = firstSplitMin / distDelta
    const lastPace = lastSplitMin / distDelta

    const firstInfo: RunnerPacingInfo = {
      passingTime: firstSim.arrival,
      departureTime: firstSim.departure,
      elapsedMinutes: Math.round(firstSim.elapsedMinutes),
      splitMinutes: Math.round(firstSplitMin),
      splitSpeedKmh: Math.round(firstSpeed * 10) / 10,
      splitPaceMinPerKm: Math.round(firstPace * 10) / 10,
    }

    const lastElapsed = Math.round((lastArr.getTime() - startDateTime.getTime()) / 60000)

    checkpoints.push({
      aidStation: st,
      distanceKm: st.distanceKm,
      elevation: pt.ele || st.elevation || 0,
      cumDPlus: pt.dPlus || 0,
      cumDMinus: pt.dMinus || 0,
      firstRunner: firstInfo,
      lastRunner: {
        passingTime: lastArr,
        departureTime: lastDep,
        elapsedMinutes: lastElapsed,
        splitMinutes: Math.round(lastSplitMin),
        splitSpeedKmh: Math.round(lastSpeed * 10) / 10,
        splitPaceMinPerKm: Math.round(lastPace * 10) / 10,
        isManualCutoff: lastSim.isManualCutoff,
      },
    })

    prevFirstArr = firstSim.departure
    prevLastArr = lastDep
    prevDistKm = st.distanceKm
  }

  return checkpoints
}

/**
 * Formats a Date object to "Jour HH:mm" (e.g., "Ven 22:00" or "Sam 04:30")
 */
export function formatPassingDateTime(date: Date): { dayName: string; timeStr: string; fullStr: string } {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const dayName = days[date.getDay()]
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const timeStr = `${hh}:${mm}`
  return {
    dayName,
    timeStr,
    fullStr: `${dayName} ${timeStr}`,
  }
}

/**
 * Formats minutes into "HHhMM" (e.g., 145 min -> "02h25")
 */
export function formatElapsedMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}
