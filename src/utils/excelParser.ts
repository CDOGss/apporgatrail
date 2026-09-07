import * as XLSX from 'xlsx'
import type { AidStation, AidStationType, AccessType, NetworkType, GpxPoint, RaceSettings } from '../types/trail'

/**
 * Parses free text / formatted cutoff value into an ISO date string
 * Supports formats:
 * - Day + Time: "Ven 22:00", "Sam 04:30", "Dim 14:00"
 * - Date + Time: "07/05 04:30", "07/05/2027 04:30", "2027-05-07 04:30"
 * - Relative Day: "J1 22:00", "J+1 04:30", "J2 04:30"
 * - Elapsed hours: "14h30", "28h00"
 * - Plain time: "04:30", "22:00"
 * - Excel Date / Time serial number
 */
export function parseCutoffValue(
  raw: any,
  raceStartDateStr?: string,
  raceStartTimeStr?: string
): string | undefined {
  if (raw === undefined || raw === null) return undefined
  const str = String(raw).trim()
  if (
    !str ||
    str === '-' ||
    str === '/' ||
    str.toLowerCase() === 'n/a' ||
    str.toLowerCase() === 'aucun' ||
    str.toLowerCase() === 'non'
  ) {
    return undefined
  }

  // 1. If it's a number (Excel date/time serial or elapsed hours)
  if (typeof raw === 'number' || (!isNaN(Number(str)) && !str.includes(':') && !str.includes('/') && !str.includes('-'))) {
    const num = typeof raw === 'number' ? raw : parseFloat(str)
    if (num > 30000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000))
      if (!isNaN(date.getTime())) return date.toISOString()
    }
    if (raceStartDateStr && raceStartTimeStr && num >= 0 && num <= 200) {
      const [y, m, d] = raceStartDateStr.split('-').map(Number)
      const [hh, mm] = raceStartTimeStr.split(':').map(Number)
      const start = new Date(y, m - 1, d, hh, mm, 0)
      const target = new Date(start.getTime() + num * 3600 * 1000)
      return target.toISOString()
    }
  }

  // 2. Format with "HHhMM" (e.g. "14h30", "28h00")
  const elapsedHhMm = str.match(/^(\d{1,3})\s*h\s*(\d{0,2})$/i)
  if (elapsedHhMm) {
    const h = parseInt(elapsedHhMm[1], 10)
    const m = elapsedHhMm[2] ? parseInt(elapsedHhMm[2], 10) : 0
    if (raceStartDateStr && raceStartTimeStr) {
      const [y, mth, d] = raceStartDateStr.split('-').map(Number)
      const [hh, mm] = raceStartTimeStr.split(':').map(Number)
      const start = new Date(y, mth - 1, d, hh, mm, 0)
      const target = new Date(start.getTime() + (h * 60 + m) * 60 * 1000)
      return target.toISOString()
    }
  }

  // 3. Standard ISO or YYYY-MM-DD HH:mm
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{2})/)
  if (isoMatch) {
    const [, y, m, d, hh, mm] = isoMatch.map(Number)
    const dt = new Date(y, m - 1, d, hh, mm, 0)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // 4. DD/MM/YYYY HH:mm or DD/MM HH:mm (French format)
  const frMatch = str.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?[\s@T](\d{1,2}):(\d{2})/)
  if (frMatch) {
    const d = parseInt(frMatch[1], 10)
    const m = parseInt(frMatch[2], 10)
    let y = frMatch[3]
      ? parseInt(frMatch[3], 10)
      : raceStartDateStr
      ? parseInt(raceStartDateStr.split('-')[0], 10)
      : new Date().getFullYear()
    if (y < 100) y += 2000
    const hh = parseInt(frMatch[4], 10)
    const mm = parseInt(frMatch[5], 10)
    const dt = new Date(y, m - 1, d, hh, mm, 0)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // 5. Day name + Time (e.g. "Ven 22:00", "Sam 04:30", "Dimanche 14:00", "Jeu 20:00")
  const dayNames = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
  const dayTimeMatch = str.match(/([a-zéû]+)\.?\s*(\d{1,2})[:h](\d{2})/i)
  if (dayTimeMatch && raceStartDateStr) {
    const prefix = dayTimeMatch[1]
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .slice(0, 3)
    const targetDayIdx = dayNames.indexOf(prefix)
    if (targetDayIdx !== -1) {
      const hh = parseInt(dayTimeMatch[2], 10)
      const mm = parseInt(dayTimeMatch[3], 10)
      const [startYear, startMonth, startDay] = raceStartDateStr.split('-').map(Number)
      const baseDate = new Date(startYear, startMonth - 1, startDay, hh, mm, 0)
      const startDayIdx = baseDate.getDay()
      const dayDelta = (targetDayIdx - startDayIdx + 7) % 7
      baseDate.setDate(baseDate.getDate() + dayDelta)
      return baseDate.toISOString()
    }
  }

  // 6. Relative Day + Time (e.g. "J1 22:00", "J+1 04:30", "J2 04:30", "J3 12:00")
  const relDayMatch = str.match(/j\+?(\d+)[\s_-]*(\d{1,2})[:h](\d{2})/i)
  if (relDayMatch && raceStartDateStr) {
    const dayOffset = parseInt(relDayMatch[1], 10) - (str.toLowerCase().includes('j+') ? 0 : 1)
    const hh = parseInt(relDayMatch[2], 10)
    const mm = parseInt(relDayMatch[3], 10)
    const [startYear, startMonth, startDay] = raceStartDateStr.split('-').map(Number)
    const dt = new Date(startYear, startMonth - 1, startDay + dayOffset, hh, mm, 0)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // 7. Plain time HH:mm (e.g. "22:00" or "04:30")
  const plainTimeMatch = str.match(/^(\d{1,2})[:h](\d{2})$/i)
  if (plainTimeMatch && raceStartDateStr && raceStartTimeStr) {
    const hh = parseInt(plainTimeMatch[1], 10)
    const mm = parseInt(plainTimeMatch[2], 10)
    const [startYear, startMonth, startDay] = raceStartDateStr.split('-').map(Number)
    const [startH, startM] = raceStartTimeStr.split(':').map(Number)
    const dt = new Date(startYear, startMonth - 1, startDay, hh, mm, 0)
    if (hh * 60 + mm < startH * 60 + startM) {
      dt.setDate(dt.getDate() + 1)
    }
    return dt.toISOString()
  }

  // Fallback direct Date parse
  const direct = new Date(str)
  if (!isNaN(direct.getTime())) {
    return direct.toISOString()
  }

  return undefined
}

/**
 * Normalizes string for fuzzy header matching
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Infers AidStationType from free text
 */
function inferType(val: string): AidStationType {
  const s = normalizeHeader(String(val || ''))
  if (s.includes('depart') || s.includes('start')) return 'DEPART'
  if (s.includes('arrivee') || s.includes('finish') || s.includes('fin')) return 'ARRIVEE'
  if (s.includes('base') || s.includes('vie')) return 'BASE_VIE'
  if (s.includes('complet') || s.includes('chaud')) return 'COMPLET'
  if (s.includes('solide')) return 'SOLIDE'
  if (s.includes('eau') || s.includes('liquide')) return 'EAU'
  return 'COMPLET'
}

/**
 * Infers AccessType from text
 */
function inferAccess(val: string): AccessType {
  const s = normalizeHeader(String(val || ''))
  if (s.includes('interdit') || s.includes('interd') || s.includes('ferme') || s.includes('aucun')) return 'INTERDIT'
  if (s.includes('4x4') || s.includes('piste')) return '4X4'
  if (s.includes('helico') || s.includes('aerien')) return 'HELICO'
  if (s.includes('pie') || s.includes('sentier') || s.includes('marche')) return 'PIETON'
  return 'ROUTE'
}

/**
 * Infers NetworkType from text
 */
function inferNetwork(val: string): NetworkType {
  const s = normalizeHeader(String(val || ''))
  if (s.includes('radio') || s.includes('vhf')) return 'RADIO_VHF'
  if (s.includes('sat') || s.includes('inreach')) return 'SATELLITE'
  if (s.includes('blanc') || s.includes('aucun') || s.includes('sans')) return 'ZONE_BLANCHE'
  return 'GSM'
}

/**
 * Snaps a list of aid stations to the GPX track points.
 * Handles:
 * - Start station snapping to first GPX point (0.0 km)
 * - Finish station snapping to last GPX point
 * - Ratio-based distance projection if the Excel distances were exported in 2D (e.g., from TraceDeTrail)
 *   while the GPX track is evaluated in 3D terrain surface distance.
 */
export function snapAidStationsToGpx(
  stations: AidStation[],
  gpxPoints: GpxPoint[]
): AidStation[] {
  if (!gpxPoints || gpxPoints.length === 0 || stations.length === 0) return stations

  const totalGpxDist = gpxPoints[gpxPoints.length - 1].dist
  const lastStation = stations[stations.length - 1]
  const lastStationDist = lastStation.distanceKm

  // Detect if the table distances are 2D while track is 3D (ratio between 0.94 and 1.08)
  const isFinishStation =
    lastStation.type === 'ARRIVEE' ||
    normalizeHeader(lastStation.name).includes('arrivee') ||
    normalizeHeader(lastStation.name).includes('finish') ||
    lastStationDist >= totalGpxDist * 0.90

  const ratio = isFinishStation && lastStationDist > 0 ? totalGpxDist / lastStationDist : 1.0

  return stations.map((station, idx) => {
    // Exact start point
    if (idx === 0) {
      const p0 = gpxPoints[0]
      return {
        ...station,
        gpxPointIndex: 0,
        distanceKm: p0.dist,
        elevation: p0.ele,
      }
    }

    // Exact finish point
    if (idx === stations.length - 1 && isFinishStation) {
      const pEnd = gpxPoints[gpxPoints.length - 1]
      return {
        ...station,
        gpxPointIndex: gpxPoints.length - 1,
        distanceKm: pEnd.dist,
        elevation: pEnd.ele,
      }
    }

    // Target distance (scaled if 2D vs 3D discrepancy detected)
    const targetDist = station.distanceKm * ratio

    let bestIndex = 0
    let minDiff = Infinity
    for (let i = 0; i < gpxPoints.length; i++) {
      const diff = Math.abs(gpxPoints[i].dist - targetDist)
      if (diff < minDiff) {
        minDiff = diff
        bestIndex = i
      }
    }

    const snappedPoint = gpxPoints[bestIndex]
    return {
      ...station,
      gpxPointIndex: bestIndex,
      distanceKm: snappedPoint.dist,
      elevation: snappedPoint.ele,
    }
  })
}

/**
 * Snaps a single aid station to the closest GPX point
 */
export function snapAidStationToGpx(
  station: AidStation,
  gpxPoints: GpxPoint[]
): AidStation {
  if (!gpxPoints || gpxPoints.length === 0) return station
  return snapAidStationsToGpx([station], gpxPoints)[0]
}

/**
 * Parses Excel/CSV ArrayBuffer and maps to AidStation array.
 * Supports exact column schema:
 * N° | Nom du Ravitaillement | Distance (km) | Type de Poste | Pause 1er (min) | Pause Dern. (min) | Accès Véhicule | Couverture Réseau | Médical | Dortoir | Actions
 */
export function parseAidStationsExcel(
  data: ArrayBuffer,
  gpxPoints?: GpxPoint[],
  settings?: Partial<RaceSettings>
): AidStation[] {
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error("Le fichier Excel ne contient aucune feuille de calcul.")
  }

  const sheet = workbook.Sheets[sheetName]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (rows.length === 0) {
    throw new Error("La feuille de calcul est vide.")
  }

  // Find column mappings
  const sample = rows[0]
  const keys = Object.keys(sample)

  // 1. Order / N°
  const orderKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm === 'n' || norm === 'no' || norm === 'num' || norm === 'numero' || norm === 'ordre' || norm === 'id' || norm.startsWith('num') || norm.startsWith('ordre')
  })

  // 2. Name / Nom du Ravitaillement
  const nameKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('nom') || norm.includes('ravitaillement') || norm.includes('poste') || norm.includes('station') || norm.includes('lieu') || norm.includes('libelle')
  }) || keys[0]

  // 3. Distance / Distance (km)
  const distKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('distance') || norm.includes('dist') || norm.includes('km') || norm.includes('kilometre')
  })

  // 4. Barrière Horaire
  const cutoffKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('barriere') || norm.includes('cutoff') || norm.includes('limite') || (norm.includes('horaire') && !norm.includes('grille'))
  })

  // 5. Type / Type de Poste
  const typeKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('type') || norm.includes('nature') || norm.includes('categorie')
  })

  // 6. Pause 1er (min)
  const stopFirstKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return (norm.includes('pause') || norm.includes('arret') || norm.includes('stop') || norm.includes('temps')) &&
           (norm.includes('1er') || norm.includes('1') || norm.includes('prem') || norm.includes('first') || norm.includes('vainqueur'))
  })

  // 7. Pause Dern. (min)
  const stopLastKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return (norm.includes('pause') || norm.includes('arret') || norm.includes('stop') || norm.includes('temps')) &&
           (norm.includes('dern') || norm.includes('last') || norm.includes('serre') || norm.includes('barriere') || norm.includes('queue'))
  }) || keys.find(k => {
    const norm = normalizeHeader(k)
    return k !== stopFirstKey && (norm.includes('pause') || norm.includes('arret') || norm.includes('tempsarret') || norm.includes('duree'))
  })

  // 8. Accès Véhicule
  const accessKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('acces') || norm.includes('vehicule') || norm.includes('accessibilite')
  })

  // 9. Couverture Réseau
  const networkKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('reseau') || norm.includes('radio') || norm.includes('telephonie') || norm.includes('couverture') || norm.includes('comms')
  })

  // 10. Médical
  const medicalKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('medical') || norm.includes('secours') || norm.includes('medecin') || norm.includes('soin')
  })

  // 11. Dortoir
  const dormKey = keys.find(k => {
    const norm = normalizeHeader(k)
    return norm.includes('dortoir') || norm.includes('lit') || norm.includes('repos') || norm.includes('sommeil')
  })

  const stations: AidStation[] = rows.map((row, idx) => {
    const rawName = String(row[nameKey] || `Poste ${idx + 1}`).trim()
    
    // Parse distance
    let rawDist = 0
    if (distKey && row[distKey] !== undefined && row[distKey] !== '') {
      const cleaned = String(row[distKey]).replace(',', '.').replace(/[^\d.]/g, '')
      rawDist = parseFloat(cleaned) || 0
    } else {
      rawDist = idx * 10
    }

    // Stop times
    const stopFirst = stopFirstKey && row[stopFirstKey] !== '' ? parseInt(String(row[stopFirstKey]), 10) || 2 : 2
    const stopLast = stopLastKey && row[stopLastKey] !== '' ? parseInt(String(row[stopLastKey]), 10) || 15 : 15

    const typeStr = typeKey ? String(row[typeKey]) : ''
    const accessStr = accessKey ? String(row[accessKey]) : ''
    const networkStr = networkKey ? String(row[networkKey]) : ''

    const medVal = medicalKey ? String(row[medicalKey]).toLowerCase().trim() : ''
    const isMed = ['oui', 'yes', 'true', 'vrai', '1', 'x'].includes(medVal) || (medicalKey ? Boolean(row[medicalKey] === true) : false)

    const dormVal = dormKey ? String(row[dormKey]).toLowerCase().trim() : ''
    const isDorm = ['oui', 'yes', 'true', 'vrai', '1', 'x'].includes(dormVal) || (dormKey ? Boolean(row[dormKey] === true) : false)

    const rawOrder = orderKey && row[orderKey] !== '' ? parseInt(String(row[orderKey]), 10) : idx + 1

    // Parse Barrière Horaire (if provided in row)
    const rawCutoff = cutoffKey ? row[cutoffKey] : undefined
    const parsedCutoff = parseCutoffValue(rawCutoff, settings?.startDate, settings?.startTime)

    return {
      id: `station-${idx + 1}-${Date.now()}-${idx}`,
      order: isNaN(rawOrder) ? idx + 1 : rawOrder,
      name: rawName,
      distanceKm: Math.round(rawDist * 100) / 100,
      stopTimeFirstMin: stopFirst,
      stopTimeLastMin: stopLast,
      type: typeStr ? inferType(typeStr) : (idx === 0 ? 'DEPART' : (idx === rows.length - 1 ? 'ARRIVEE' : 'COMPLET')),
      accessibility: accessStr ? inferAccess(accessStr) : 'ROUTE',
      network: networkStr ? inferNetwork(networkStr) : 'GSM',
      medical: isMed,
      dormitory: isDorm,
      manualCutoffTime: parsedCutoff,
    }
  })

  // Sort by distance
  stations.sort((a, b) => a.distanceKm - b.distanceKm)
  stations.forEach((s, i) => { s.order = i + 1 })

  // Snap to GPX points if provided
  if (gpxPoints && gpxPoints.length > 0) {
    return snapAidStationsToGpx(stations, gpxPoints)
  }

  return stations
}
