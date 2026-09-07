import React from 'react'
import {
  Compass,
  SlidersHorizontal,
  TableProperties,
  BookOpen,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react'

interface HeaderProps {
  activeTab: 'config' | 'dashboard' | 'roadbook'
  setActiveTab: (tab: 'config' | 'dashboard' | 'roadbook') => void
  onLoadDemo: () => void
  onLoadUtg2027: () => void
  onExportExcel: () => void
  onPrintRoadbook: () => void
  hasData: boolean
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onLoadDemo,
  onLoadUtg2027,
  onExportExcel,
  onPrintRoadbook,
  hasData,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 text-white">
            <Compass className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0">
                OrgaTrail <span className="text-orange-500">Pro</span>
              </h1>
              <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">
                Direction de Course
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Calibration Minetti & Générateur de Roadbook Officiel
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'config'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>1. Configuration & Tracé</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TableProperties className="h-3.5 w-3.5" />
            <span>2. Poste Sécurité & Barrières</span>
          </button>

          <button
            onClick={() => setActiveTab('roadbook')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'roadbook'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>3. Roadbook Officiel (A4)</span>
          </button>
        </nav>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadUtg2027}
            title="Recharger la course par défaut : Ultra Terrestre 2027 (223 km, 12 400m D+, 25 postes)"
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Ultra Terrestre 2027 (223 km)</span>
          </button>

          <button
            onClick={onLoadDemo}
            title="Réinitialiser l'exemple officiel : Ultra Terrestre 2027 (223 km, 12 400m D+, 25 postes)"
            className="hidden xl:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <span>Réinitialiser l'Exemple</span>
          </button>

          {hasData && (
            <>
              <button
                onClick={onExportExcel}
                title="Exporter la grille PC Sécurité au format Excel (.xlsx)"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Export Excel</span>
              </button>

              <button
                onClick={onPrintRoadbook}
                title="Imprimer ou enregistrer en PDF le Roadbook officiel (A4)"
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white border border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Imprimer / PDF</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
