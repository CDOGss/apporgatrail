import type {
  CalculatedCheckpoint,
  GpxPoint,
  RoadbookSection,
} from '../types/trail'

/**
 * Automatically chunks the course into ~30 km sections, strictly snapped on real aid stations.
 */
export function chunkCourseIntoSections(
  points: GpxPoint[],
  checkpoints: CalculatedCheckpoint[],
  targetChunkKm: number = 30
): RoadbookSection[] {
  if (checkpoints.length < 2) return []

  const totalDist = checkpoints[checkpoints.length - 1].distanceKm
  if (totalDist <= targetChunkKm * 1.3) {
    // Single section covers the whole course
    return [
      createSection(
        1,
        checkpoints[0],
        checkpoints[checkpoints.length - 1],
        points,
        checkpoints
      ),
    ]
  }

  // Determine section boundary aid stations
  const selectedCutoffIndices: number[] = [0] // First station is always start
  let currentKm = 0
  let currentIdx = 0

  while (currentKm + targetChunkKm * 0.7 < totalDist) {
    const targetKm = currentKm + targetChunkKm
    let bestIdx = currentIdx + 1
    let minDiff = Infinity

    for (let i = currentIdx + 1; i < checkpoints.length; i++) {
      const diff = Math.abs(checkpoints[i].distanceKm - targetKm)
      if (diff < minDiff) {
        minDiff = diff
        bestIdx = i
      }
    }

    // If bestIdx is already the finish or too close to the end, wrap to end
    if (bestIdx >= checkpoints.length - 1 || totalDist - checkpoints[bestIdx].distanceKm < targetChunkKm * 0.5) {
      break
    }

    selectedCutoffIndices.push(bestIdx)
    currentIdx = bestIdx
    currentKm = checkpoints[bestIdx].distanceKm
  }

  // Always end on the last checkpoint
  selectedCutoffIndices.push(checkpoints.length - 1)

  // Build RoadbookSection items
  const sections: RoadbookSection[] = []

  for (let s = 0; s < selectedCutoffIndices.length - 1; s++) {
    const startIdx = selectedCutoffIndices[s]
    const endIdx = selectedCutoffIndices[s + 1]
    const startCp = checkpoints[startIdx]
    const endCp = checkpoints[endIdx]

    const subCheckpoints = checkpoints.slice(startIdx, endIdx + 1)
    const section = createSection(s + 1, startCp, endCp, points, subCheckpoints)
    sections.push(section)
  }

  return sections
}

function createSection(
  sectionNumber: number,
  startCp: CalculatedCheckpoint,
  endCp: CalculatedCheckpoint,
  allPoints: GpxPoint[],
  subCheckpoints: CalculatedCheckpoint[]
): RoadbookSection {
  const startKm = startCp.distanceKm
  const endKm = endCp.distanceKm

  // Filter GPX points within [startKm, endKm]
  const sectionPoints = allPoints.filter(
    p => p.dist >= startKm - 0.05 && p.dist <= endKm + 0.05
  )

  let highestEle = 0
  let lowestEle = Infinity
  let maxSlope = 0

  for (const pt of sectionPoints) {
    if (pt.ele > highestEle) highestEle = pt.ele
    if (pt.ele < lowestEle) lowestEle = pt.ele
    const absSlope = Math.abs(pt.slope)
    if (absSlope > maxSlope) maxSlope = absSlope
  }

  if (lowestEle === Infinity) lowestEle = startCp.elevation

  const distKm = Math.round((endKm - startKm) * 10) / 10
  const dPlus = Math.max(0, endCp.cumDPlus - startCp.cumDPlus)
  const dMinus = Math.max(0, endCp.cumDMinus - startCp.cumDMinus)

  return {
    id: `sec-${sectionNumber}-${startCp.aidStation.id}-${endCp.aidStation.id}`,
    sectionNumber,
    title: `Section ${sectionNumber} : ${startCp.aidStation.name} ➔ ${endCp.aidStation.name}`,
    fromName: startCp.aidStation.name,
    toName: endCp.aidStation.name,
    startKm,
    endKm,
    distanceKm: distKm,
    dPlus,
    dMinus,
    points: sectionPoints.length > 0 ? sectionPoints : allPoints,
    checkpoints: subCheckpoints,
    highestEle: Math.round(highestEle),
    lowestEle: Math.round(lowestEle),
    maxSlopePercent: Math.round(maxSlope * 100),
  }
}
