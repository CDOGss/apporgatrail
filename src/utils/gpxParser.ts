import type { GpxPoint, TrackStats, GpxCalibrationOptions } from '../types/trail'

const EARTH_RADIUS_METERS = 6371000

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

export const DEFAULT_CALIBRATION_OPTIONS: GpxCalibrationOptions = {
  smoothWindowMeters: 120, // Calibrated strictly to IGN BD Alti / TraceDeTrail
  eleThresholdMeters: 4.0, // Filters micro-elevation sensor noise
  distanceMode: '3D',      // 3D terrain surface distance
}

/**
 * Parses raw GPX XML string into an array of 3D points with elevation smoothing calibrated to IGN / TraceDeTrail
 */
export function parseGpx(
  xmlContent: string,
  options?: Partial<GpxCalibrationOptions>
): { points: GpxPoint[]; stats: TrackStats } {
  const smoothWindow = options?.smoothWindowMeters ?? DEFAULT_CALIBRATION_OPTIONS.smoothWindowMeters
  const eleThreshold = options?.eleThresholdMeters ?? DEFAULT_CALIBRATION_OPTIONS.eleThresholdMeters
  const is2D = options?.distanceMode === '2D'

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')

  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Le fichier GPX est mal formé ou invalide : ' + parserError.textContent)
  }

  // Find all trkpt or rtept or wpt elements
  let ptNodes = Array.from(xmlDoc.querySelectorAll('trkpt'))
  if (ptNodes.length === 0) {
    ptNodes = Array.from(xmlDoc.querySelectorAll('rtept'))
  }
  if (ptNodes.length === 0) {
    ptNodes = Array.from(xmlDoc.querySelectorAll('wpt'))
  }

  if (ptNodes.length < 2) {
    throw new Error('Le fichier GPX ne contient pas assez de points de trace (minimum 2 points requis).')
  }

  // Extract raw coordinates and elevations
  const rawPoints: { lat: number; lon: number; ele: number }[] = []
  let lastEle = 0

  for (const node of ptNodes) {
    const latStr = node.getAttribute('lat')
    const lonStr = node.getAttribute('lon')
    if (!latStr || !lonStr) continue

    const lat = parseFloat(latStr)
    const lon = parseFloat(lonStr)
    const eleNode = node.querySelector('ele')
    let ele = eleNode && eleNode.textContent ? parseFloat(eleNode.textContent) : lastEle
    if (isNaN(ele)) ele = lastEle
    lastEle = ele

    rawPoints.push({ lat, lon, ele })
  }

  if (rawPoints.length < 2) {
    throw new Error('Coordonnées GPX invalides ou introuvables.')
  }

  // Step 1: Compute cumulative 2D horizontal distances with Haversine
  const dist2dArray: number[] = [0]
  let cum2d = 0
  for (let i = 1; i < rawPoints.length; i++) {
    const d2d = haversineDistanceMeters(
      rawPoints[i - 1].lat,
      rawPoints[i - 1].lon,
      rawPoints[i].lat,
      rawPoints[i].lon
    )
    cum2d += d2d
    dist2dArray.push(cum2d)
  }

  // Step 2: Distance-weighted elevation smoothing (Gaussian/linear spatial kernel)
  const smoothedEle: number[] = []

  for (let i = 0; i < rawPoints.length; i++) {
    if (smoothWindow <= 0) {
      smoothedEle.push(rawPoints[i].ele)
      continue
    }

    const curD = dist2dArray[i]
    let weightedSum = 0
    let totalWeight = 0

    // Look backward within window
    for (let j = i; j >= 0; j--) {
      const d = curD - dist2dArray[j]
      if (d > smoothWindow) break
      const w = 1 - d / (smoothWindow + 1)
      weightedSum += rawPoints[j].ele * w
      totalWeight += w
    }

    // Look forward within window
    for (let j = i + 1; j < rawPoints.length; j++) {
      const d = dist2dArray[j] - curD
      if (d > smoothWindow) break
      const w = 1 - d / (smoothWindow + 1)
      weightedSum += rawPoints[j].ele * w
      totalWeight += w
    }

    smoothedEle.push(totalWeight > 0 ? weightedSum / totalWeight : rawPoints[i].ele)
  }

  // Step 3: Compute final 3D or 2D distance along track
  const pointDistances: number[] = [0]
  let cumDistance = 0

  for (let i = 1; i < rawPoints.length; i++) {
    const d2d = dist2dArray[i] - dist2dArray[i - 1]
    if (is2D) {
      cumDistance += d2d
    } else {
      // 3D distance computed from smoothed elevation to avoid artificial jitter elongation
      const dz = smoothedEle[i] - smoothedEle[i - 1]
      const d3d = Math.sqrt(d2d * d2d + dz * dz)
      cumDistance += d3d
    }
    pointDistances.push(cumDistance)
  }

  // Step 4: Compute cumulative D+ and D- using calibrated elevation threshold
  const points: GpxPoint[] = []
  let cumDPlus = 0
  let cumDMinus = 0
  let minEle = smoothedEle[0]
  let maxEle = smoothedEle[0]
  let lastEleRef = smoothedEle[0]

  points.push({
    lat: rawPoints[0].lat,
    lon: rawPoints[0].lon,
    ele: Math.round(smoothedEle[0] * 10) / 10,
    dist: 0,
    dPlus: 0,
    dMinus: 0,
    slope: 0,
  })

  for (let i = 1; i < rawPoints.length; i++) {
    const curEle = smoothedEle[i]
    const stepDist = pointDistances[i] - pointDistances[i - 1]

    if (curEle < minEle) minEle = curEle
    if (curEle > maxEle) maxEle = curEle

    const eleDelta = curEle - lastEleRef
    if (Math.abs(eleDelta) >= eleThreshold) {
      if (eleDelta > 0) {
        cumDPlus += eleDelta
      } else {
        cumDMinus += Math.abs(eleDelta)
      }
      lastEleRef = curEle
    }

    const slope = stepDist > 0.5 ? (curEle - smoothedEle[i - 1]) / stepDist : 0

    points.push({
      lat: rawPoints[0].lat !== undefined ? rawPoints[i].lat : 0,
      lon: rawPoints[0].lon !== undefined ? rawPoints[i].lon : 0,
      ele: Math.round(curEle * 10) / 10,
      dist: Math.round((pointDistances[i] / 1000) * 1000) / 1000, // in km (3 decimals)
      dPlus: Math.round(cumDPlus),
      dMinus: Math.round(cumDMinus),
      slope: Math.max(-0.6, Math.min(0.6, slope)),
    })
  }

  const totalDistKm = points[points.length - 1].dist

  const stats: TrackStats = {
    totalDistance: Math.round(totalDistKm * 10) / 10,
    totalDPlus: Math.round(cumDPlus),
    totalDMinus: Math.round(cumDMinus),
    minElevation: Math.round(minEle),
    maxElevation: Math.round(maxEle),
    pointsCount: points.length,
  }

  return { points, stats }
}
