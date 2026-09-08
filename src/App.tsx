import { useState, useMemo, useEffect } from 'react'
import confetti from 'canvas-confetti'
import type {
  AidStation,
  GpxPoint,
  RaceSettings,
  TrackStats,
  GpxCalibrationOptions,
} from './types/trail'
import {
  DEMO_AID_STATIONS,
  DEMO_SETTINGS,
  generateDemoGpxTrack,
} from './utils/demoData'
import { parseGpx, DEFAULT_CALIBRATION_OPTIONS } from './utils/gpxParser'
import { parseAidStationsExcel, snapAidStationsToGpx } from './utils/excelParser'
import { calculatePacingSchedule } from './utils/pacingEngine'
import { chunkCourseIntoSections } from './utils/roadbookChunker'
import {
  exportSafetyGridToExcel,
  exportAidStationsTemplateExcel,
  exportAidStationsTemplateCsv,
} from './utils/exportExcel'
import { Header } from './components/layout/Header'
import { ConfigTab } from './components/config/ConfigTab'
import { DashboardTab } from './components/dashboard/DashboardTab'
import { RoadbookTab } from './components/roadbook/RoadbookTab'

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'config' | 'dashboard' | 'roadbook'>('dashboard')

  // Race Settings
  const [settings, setSettings] = useState<RaceSettings>(DEMO_SETTINGS)

  // Calibration Options & Raw GPX storage
  const [calibrationOptions, setCalibrationOptions] = useState<GpxCalibrationOptions>(DEFAULT_CALIBRATION_OPTIONS)
  const [rawGpxXml, setRawGpxXml] = useState<string | null>(null)

  // Track & Aid Stations data (initialized with realistic Grand Raid demo data)
  const initialDemo = useMemo(() => generateDemoGpxTrack(), [])
  const [gpxPoints, setGpxPoints] = useState<GpxPoint[]>(initialDemo.points)
  const [trackStats, setTrackStats] = useState<TrackStats | undefined>(initialDemo.stats)
  const [aidStations, setAidStations] = useState<AidStation[]>(() => {
    return snapAidStationsToGpx(DEMO_AID_STATIONS, initialDemo.points)
  })
  const [gpxFileName, setGpxFileName] = useState<string>('UTG 2027 UT.gpx')
  const [excelFileName, setExcelFileName] = useState<string>('OrgaTrail_Modele_Ravitaillements.xlsx')

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 4500)
  }

  // Reactive Calculation of Pacing Schedule via Minetti Engine
  const calculatedCheckpoints = useMemo(() => {
    return calculatePacingSchedule(gpxPoints, aidStations, settings)
  }, [gpxPoints, aidStations, settings])

  // Reactive Chunking of Course into ~30km Sections for Roadbook
  const roadbookSections = useMemo(() => {
    return chunkCourseIntoSections(gpxPoints, calculatedCheckpoints, 30)
  }, [gpxPoints, calculatedCheckpoints])

  // Import GPX File
  const handleImportGpx = async (file: File) => {
    try {
      const text = await file.text()
      setRawGpxXml(text)
      const { points, stats } = parseGpx(text, calibrationOptions)
      setGpxPoints(points)
      setTrackStats(stats)
      setGpxFileName(file.name)

      // Re-snap existing aid stations to new GPX
      if (aidStations.length > 0) {
        const snapped = snapAidStationsToGpx(aidStations, points)
        setAidStations(snapped)
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      showToast(`Tracé GPX chargé : ${stats.totalDistance} km, +${stats.totalDPlus}m D+ (${stats.pointsCount} points)`)
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du parsing GPX', 'error')
    }
  }

  // Update GPX Calibration Options (Smoothing window, Elevation threshold, 2D/3D mode)
  const handleUpdateCalibration = (newOptions: GpxCalibrationOptions) => {
    setCalibrationOptions(newOptions)
    if (rawGpxXml) {
      try {
        const { points, stats } = parseGpx(rawGpxXml, newOptions)
        setGpxPoints(points)
        setTrackStats(stats)
        if (aidStations.length > 0) {
          const snapped = snapAidStationsToGpx(aidStations, points)
          setAidStations(snapped)
        }
        showToast(`Recalibrage appliqué : ${stats.totalDistance} km, +${stats.totalDPlus}m D+`)
      } catch (err: any) {
        showToast(err.message || 'Erreur lors de la recalibration', 'error')
      }
    }
  }

  // Import Excel/CSV Aid Stations File
  const handleImportExcel = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const stations = parseAidStationsExcel(buffer, gpxPoints)
      setAidStations(stations)
      setExcelFileName(file.name)

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } })
      showToast(`${stations.length} ravitaillements importés et calés avec succès !`)
    } catch (err: any) {
      showToast(err.message || "Erreur lors de l'import Excel", 'error')
    }
  }

  // Load Default Official Race "Ultra Terrestre 2027" (223 km / 12 400m D+)
  const handleLoadUtg2027 = async (silent = false) => {
    try {
      if (!silent) showToast('Chargement des fichiers officiels Ultra Terrestre 2027...')
      const gpxRes = await fetch('./files/UTG_2027_UT.gpx')
      if (!gpxRes.ok) throw new Error('Fichier UTG_2027_UT.gpx introuvable')
      const gpxText = await gpxRes.text()
      setRawGpxXml(gpxText)

      const { points, stats } = parseGpx(gpxText, calibrationOptions)
      setGpxPoints(points)
      setTrackStats(stats)
      setGpxFileName('UTG 2027 UT.gpx')

      const excelRes = await fetch('./files/OrgaTrail_Modele_Ravitaillements.xlsx')
      if (!excelRes.ok) throw new Error('Fichier OrgaTrail_Modele_Ravitaillements.xlsx introuvable')
      const excelBuffer = await excelRes.arrayBuffer()
      const stations = parseAidStationsExcel(excelBuffer, points, {
        startDate: '2027-05-06',
        startTime: '06:00',
      })
      setAidStations(stations)
      setExcelFileName('OrgaTrail_Modele_Ravitaillements.xlsx')

      setSettings({
        raceName: 'Ultra Terrestre 2027',
        startDate: '2027-05-06',
        startTime: '06:00',
        winnerTargetHours: 34.5,
        cutoffTargetHours: 83.0,
        defaultFirstStopMin: 3,
        defaultLastStopMin: 15,
        nightPenaltyPercent: 8,
        nightStartHour: 19,
        nightEndHour: 6,
      })

      if (!silent) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } })
        showToast(`Ultra Terrestre 2027 chargé : ${stats.totalDistance} km, +${stats.totalDPlus}m D+ (${stations.length} postes calés) !`)
      }
    } catch (err: any) {
      if (!silent) showToast(err.message || "Erreur lors du chargement de l'Ultra Terrestre 2027", 'error')
    }
  }

  // Auto-load default race "Ultra Terrestre 2027" on mount
  useEffect(() => {
    handleLoadUtg2027(true)
  }, [])

  // Load Demo / Frozen Example Data
  const handleLoadDemo = () => {
    setRawGpxXml(null)
    const demo = generateDemoGpxTrack()
    setGpxPoints(demo.points)
    setTrackStats(demo.stats)
    setSettings(DEMO_SETTINGS)
    const snapped = snapAidStationsToGpx(DEMO_AID_STATIONS, demo.points)
    setAidStations(snapped)
    setGpxFileName('UTG 2027 UT.gpx')
    setExcelFileName('OrgaTrail_Modele_Ravitaillements.xlsx')

    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } })
    showToast('Données figées de l\'exemple Ultra Terrestre 2027 (223 km / 12 408m D+) réinitialisées !')
  }

  // Update Manual Cutoff Time for a Checkpoint
  const handleUpdateCheckpointCutoff = (stationId: string, manualTimeIso?: string) => {
    const updated = aidStations.map((st) => {
      if (st.id === stationId) {
        return {
          ...st,
          manualCutoffTime: manualTimeIso,
        }
      }
      return st
    })
    setAidStations(updated)
    if (manualTimeIso) {
      showToast('Barrière horaire modifiée manuellement')
    } else {
      showToast('Barrière horaire réinitialisée sur le modèle Minetti')
    }
  }

  // Export Safety Grid to Excel
  const handleExportExcel = () => {
    exportSafetyGridToExcel(calculatedCheckpoints, settings, trackStats)
    showToast('Grille horaire et sécurité exportée au format Excel (.xlsx)')
  }

  // Download Aid Stations Excel Template
  const handleDownloadTemplate = () => {
    exportAidStationsTemplateExcel(aidStations)
    showToast('Modèle Excel officiel téléchargé (.xlsx)')
  }

  // Download Aid Stations CSV Template (French Excel compatible with UTF-8 BOM)
  const handleDownloadCsvTemplate = () => {
    exportAidStationsTemplateCsv(aidStations)
    showToast('Modèle CSV officiel téléchargé (.csv)')
  }

  // Print Official Roadbook
  const handlePrintRoadbook = () => {
    if (activeTab !== 'roadbook') {
      setActiveTab('roadbook')
      setTimeout(() => window.print(), 300)
    } else {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur border text-xs font-semibold flex items-center gap-2 transition-all ${toastMessage.type === 'error'
            ? 'bg-red-950/90 text-red-200 border-red-500/50'
            : 'bg-slate-900/90 text-emerald-300 border-emerald-500/40'
            }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadDemo={handleLoadDemo}
        onLoadUtg2027={handleLoadUtg2027}
        onExportExcel={handleExportExcel}
        onPrintRoadbook={handlePrintRoadbook}
        hasData={gpxPoints.length > 0 && aidStations.length > 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'config' && (
          <ConfigTab
            settings={settings}
            onUpdateSettings={setSettings}
            trackStats={trackStats}
            aidStations={aidStations}
            onUpdateAidStations={setAidStations}
            onImportGpx={handleImportGpx}
            onImportExcel={handleImportExcel}
            onLoadDemo={handleLoadDemo}
            onLoadUtg2027={handleLoadUtg2027}
            onDownloadTemplate={handleDownloadTemplate}
            onDownloadCsvTemplate={handleDownloadCsvTemplate}
            calibrationOptions={calibrationOptions}
            onUpdateCalibration={handleUpdateCalibration}
            gpxFileName={gpxFileName}
            excelFileName={excelFileName}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            points={gpxPoints}
            checkpoints={calculatedCheckpoints}
            settings={settings}
            stats={trackStats}
            onUpdateCheckpointCutoff={handleUpdateCheckpointCutoff}
            onExportExcel={handleExportExcel}
          />
        )}

        {activeTab === 'roadbook' && (
          <RoadbookTab
            settings={settings}
            points={gpxPoints}
            checkpoints={calculatedCheckpoints}
            sections={roadbookSections}
            stats={trackStats}
            onPrint={handlePrintRoadbook}
          />
        )}
      </main>
    </div>
  )
}

export default App
