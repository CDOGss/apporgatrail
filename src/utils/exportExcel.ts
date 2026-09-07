import * as XLSX from 'xlsx'
import type { CalculatedCheckpoint, RaceSettings, TrackStats, AidStation } from '../types/trail'
import { formatPassingDateTime, formatElapsedMinutes } from './pacingEngine'

/**
 * Robust cross-browser file download helper with explicit filename and mime type
 */
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 1000)
}

/**
 * Exports complete race director / safety schedule grid to Excel (.xlsx)
 */
export function exportSafetyGridToExcel(
  checkpoints: CalculatedCheckpoint[],
  settings: RaceSettings,
  stats?: TrackStats
) {
  if (!checkpoints || checkpoints.length === 0) return

  const rows: any[] = []

  let prevKm = 0

  checkpoints.forEach((cp, idx) => {
    const st = cp.aidStation
    const distDelta = Math.round((cp.distanceKm - prevKm) * 10) / 10
    prevKm = cp.distanceKm

    const firstTime = formatPassingDateTime(cp.firstRunner.passingTime)
    const lastTime = formatPassingDateTime(cp.lastRunner.passingTime)

    rows.push({
      'N°': idx + 1,
      'Poste de Contrôle / Ravitaillement': st.name,
      'Distance Cumulée (km)': cp.distanceKm,
      'Distance Tronçon (km)': distDelta,
      'Altitude (m)': cp.elevation,
      'D+ Cumulé (m)': cp.cumDPlus,
      'D- Cumulé (m)': cp.cumDMinus,
      'Type Poste': st.type,
      'Arrêt 1er (min)': st.stopTimeFirstMin,
      'Arrêt Dernier (min)': st.stopTimeLastMin,
      'Heure 1er Coureur': firstTime.fullStr,
      'Temps Course 1er': formatElapsedMinutes(cp.firstRunner.elapsedMinutes),
      'Vitesse 1er (km/h)': cp.firstRunner.splitSpeedKmh,
      'Heure Barrière (Serre-file)': lastTime.fullStr,
      'Temps Course Barrière': formatElapsedMinutes(cp.lastRunner.elapsedMinutes),
      'Vitesse Serre-file (km/h)': cp.lastRunner.splitSpeedKmh,
      'Barrière Manuelle': cp.lastRunner.isManualCutoff ? 'OUI (Ajustée)' : 'Automatique',
      'Accès Véhicule': st.accessibility,
      'Réseau / Comms': st.network,
      'Secours / Médical': st.medical ? 'Oui' : 'Non',
      'Dortoir / Repos': st.dormitory ? 'Oui' : 'Non',
    })
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // N°
    { wch: 30 }, // Nom
    { wch: 20 }, // Dist
    { wch: 18 }, // Dist Troncon
    { wch: 12 }, // Alt
    { wch: 14 }, // D+
    { wch: 14 }, // D-
    { wch: 14 }, // Type
    { wch: 14 }, // Arret 1er
    { wch: 18 }, // Arret Dernier
    { wch: 18 }, // Heure 1er
    { wch: 16 }, // Temps 1er
    { wch: 16 }, // Vit 1er
    { wch: 24 }, // Heure Barrière
    { wch: 20 }, // Temps Barrière
    { wch: 20 }, // Vit Dernier
    { wch: 18 }, // Barrière Manuelle
    { wch: 16 }, // Acces
    { wch: 18 }, // Reseau
    { wch: 16 }, // Secours
    { wch: 16 }, // Dortoir
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grille Sécurité & Horaires')

  // Add Metadata Sheet
  const metaRows = [
    { 'Paramètre': 'Nom de la course', 'Valeur': settings.raceName },
    { 'Paramètre': 'Date de départ', 'Valeur': settings.startDate },
    { 'Paramètre': 'Heure de départ', 'Valeur': settings.startTime },
    { 'Paramètre': 'Distance totale', 'Valeur': `${stats?.totalDistance ?? checkpoints[checkpoints.length - 1].distanceKm} km` },
    { 'Paramètre': 'Dénivelé positif (D+)', 'Valeur': `${stats?.totalDPlus ?? checkpoints[checkpoints.length - 1].cumDPlus} m` },
    { 'Paramètre': 'Dénivelé négatif (D-)', 'Valeur': `${stats?.totalDMinus ?? checkpoints[checkpoints.length - 1].cumDMinus} m` },
    { 'Paramètre': 'Temps Vainqueur calibré', 'Valeur': `${settings.winnerTargetHours} heures` },
    { 'Paramètre': 'Temps Barrière Finale', 'Valeur': `${settings.cutoffTargetHours} heures` },
    { 'Paramètre': 'Généré par', 'Valeur': 'OrgaTrail Pro (Suite Direction de Course)' },
    { 'Paramètre': 'Date d\'export', 'Valeur': new Date().toLocaleString('fr-FR') },
  ]
  const metaSheet = XLSX.utils.json_to_sheet(metaRows)
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Infos & Paramètres Course')

  // Generate buffer and trigger robust download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeTitle = settings.raceName.replace(/[^a-zA-Z0-9_-]/g, '_')
  downloadFile(blob, `OrgaTrail_${safeTitle}_Grille_Securite.xlsx`)
}

/**
 * Exports an official Aid Stations Template / Modèle Excel (.xlsx) with exact required columns:
 * N° | Nom du Ravitaillement | Distance (km) | Barrière Horaire | Type de Poste | Pause 1er (min) | Pause Dern. (min) | Accès Véhicule | Couverture Réseau | Médical | Dortoir
 */
export function exportAidStationsTemplateExcel(aidStations: AidStation[]) {
  const rows = aidStations.map((st, idx) => {
    let cutoffStr = ''
    if (st.manualCutoffTime) {
      const d = new Date(st.manualCutoffTime)
      if (!isNaN(d.getTime())) {
        cutoffStr = formatPassingDateTime(d).fullStr
      }
    }

    return {
      'N°': st.order || idx + 1,
      'Nom du Ravitaillement': st.name,
      'Distance (km)': st.distanceKm,
      'Barrière Horaire': cutoffStr,
      'Type de Poste': st.type,
      'Pause 1er (min)': st.stopTimeFirstMin,
      'Pause Dern. (min)': st.stopTimeLastMin,
      'Accès Véhicule': st.accessibility,
      'Couverture Réseau': st.network,
      'Médical': st.medical ? 'Oui' : 'Non',
      'Dortoir': st.dormitory ? 'Oui' : 'Non',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)

  worksheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 32 }, // Nom du Ravitaillement
    { wch: 15 }, // Distance (km)
    { wch: 18 }, // Barrière Horaire
    { wch: 15 }, // Type de Poste
    { wch: 16 }, // Pause 1er (min)
    { wch: 18 }, // Pause Dern. (min)
    { wch: 16 }, // Accès Véhicule
    { wch: 20 }, // Couverture Réseau
    { wch: 10 }, // Médical
    { wch: 10 }, // Dortoir
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ravitaillements')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadFile(blob, 'OrgaTrail_Modele_Ravitaillements.xlsx')
}

/**
 * Exports an official Aid Stations Template in CSV format (.csv) with semicolon separator and UTF-8 BOM
 * Guaranteed to open directly in French Microsoft Excel with perfect accents and separate columns.
 */
export function exportAidStationsTemplateCsv(aidStations: AidStation[]) {
  const headers = [
    'N°',
    'Nom du Ravitaillement',
    'Distance (km)',
    'Barrière Horaire',
    'Type de Poste',
    'Pause 1er (min)',
    'Pause Dern. (min)',
    'Accès Véhicule',
    'Couverture Réseau',
    'Médical',
    'Dortoir',
  ]

  const csvRows = aidStations.map((st, idx) => {
    let cutoffStr = ''
    if (st.manualCutoffTime) {
      const d = new Date(st.manualCutoffTime)
      if (!isNaN(d.getTime())) {
        cutoffStr = formatPassingDateTime(d).fullStr
      }
    }

    return [
      st.order || idx + 1,
      `"${st.name.replace(/"/g, '""')}"`,
      st.distanceKm,
      `"${cutoffStr}"`,
      st.type,
      st.stopTimeFirstMin,
      st.stopTimeLastMin,
      st.accessibility,
      st.network,
      st.medical ? 'Oui' : 'Non',
      st.dormitory ? 'Oui' : 'Non',
    ]
  })

  // Semicolon separator with UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(';'), ...csvRows.map((r) => r.join(';'))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, 'OrgaTrail_Modele_Ravitaillements.csv')
}
