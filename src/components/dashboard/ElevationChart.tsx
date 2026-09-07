import React, { useRef, useEffect, useState } from 'react'
import type { GpxPoint, CalculatedCheckpoint } from '../../types/trail'
import { formatPassingDateTime } from '../../utils/pacingEngine'

interface ElevationChartProps {
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  hoveredCheckpointId?: string | null
  onHoverCheckpoint?: (id: string | null) => void
  height?: number
}

export const ElevationChart: React.FC<ElevationChartProps> = ({
  points,
  checkpoints,
  hoveredCheckpointId,
  onHoverCheckpoint,
  height = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoverInfo, setHoverInfo] = useState<{
    x: number
    y: number
    point: GpxPoint
    checkpoint?: CalculatedCheckpoint
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !points || points.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = height

    // Margins
    const padLeft = 55
    const padRight = 35
    const padTop = 30
    const padBottom = 40
    const chartW = w - padLeft - padRight
    const chartH = h - padTop - padBottom

    const totalDist = points[points.length - 1].dist || 1
    let minEle = Infinity
    let maxEle = -Infinity
    for (const p of points) {
      if (p.ele < minEle) minEle = p.ele
      if (p.ele > maxEle) maxEle = p.ele
    }
    // Add 10% elevation padding
    minEle = Math.max(0, Math.floor(minEle * 0.85))
    maxEle = Math.ceil(maxEle * 1.1)
    const eleRange = Math.max(100, maxEle - minEle)

    // Clear background
    ctx.fillStyle = '#090d16'
    ctx.fillRect(0, 0, w, h)

    // Draw horizontal elevation grid lines
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'right'

    const eleStep = eleRange > 2000 ? 500 : eleRange > 1000 ? 250 : 100
    const startGridEle = Math.ceil(minEle / eleStep) * eleStep

    for (let e = startGridEle; e <= maxEle; e += eleStep) {
      const y = padTop + chartH - ((e - minEle) / eleRange) * chartH
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(w - padRight, y)
      ctx.stroke()
      ctx.fillText(`${e}m`, padLeft - 8, y + 3)
    }

    // Draw distance vertical grid lines
    ctx.textAlign = 'center'
    const distStep = totalDist > 100 ? 25 : totalDist > 50 ? 10 : 5
    for (let d = 0; d <= totalDist; d += distStep) {
      const x = padLeft + (d / totalDist) * chartW
      ctx.beginPath()
      ctx.moveTo(x, padTop)
      ctx.lineTo(x, padTop + chartH)
      ctx.stroke()
      ctx.fillText(`${d}k`, x, h - padBottom + 16)
    }

    // Draw Elevation Silhouette (Gradient Fill + Line)
    const getX = (dist: number) => padLeft + (dist / totalDist) * chartW
    const getY = (ele: number) => padTop + chartH - ((ele - minEle) / eleRange) * chartH

    ctx.beginPath()
    ctx.moveTo(getX(points[0].dist), getY(points[0].ele))
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(points[i].dist), getY(points[i].ele))
    }

    // Close path for fill
    ctx.lineTo(getX(points[points.length - 1].dist), padTop + chartH)
    ctx.lineTo(getX(points[0].dist), padTop + chartH)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH)
    gradient.addColorStop(0, 'rgba(255, 94, 26, 0.45)')
    gradient.addColorStop(0.6, 'rgba(255, 94, 26, 0.15)')
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.05)')
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw top stroke line
    ctx.beginPath()
    ctx.moveTo(getX(points[0].dist), getY(points[0].ele))
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(points[i].dist), getY(points[i].ele))
    }
    ctx.strokeStyle = '#ff5e1a'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Draw Aid Stations vertical pins & labels
    checkpoints.forEach((cp, idx) => {
      const x = getX(cp.distanceKm)
      const y = getY(cp.elevation)
      const isHovered = hoveredCheckpointId === cp.aidStation.id

      // Vertical pin line
      ctx.save()
      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.moveTo(x, padTop + 5)
      ctx.lineTo(x, padTop + chartH)
      ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)'
      ctx.lineWidth = isHovered ? 2 : 1
      ctx.stroke()
      ctx.restore()

      // Pin circle on elevation curve
      ctx.beginPath()
      ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = isHovered ? '#38bdf8' : (cp.aidStation.type === 'BASE_VIE' ? '#f59e0b' : '#ff5e1a')
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Station badge label at top (alternating height or staggered to avoid overlap)
      const isEven = idx % 2 === 0
      const tagY = padTop + (isEven ? -10 : 6)

      ctx.fillStyle = isHovered ? '#38bdf8' : '#cbd5e1'
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`#${idx + 1}`, x, tagY)
    })
  }, [points, checkpoints, hoveredCheckpointId, height])

  // Mouse move handler for interactive cursor inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || points.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const padLeft = 55
    const padRight = 35
    const chartW = rect.width - padLeft - padRight

    if (x < padLeft || x > rect.width - padRight) {
      setHoverInfo(null)
      if (onHoverCheckpoint) onHoverCheckpoint(null)
      return
    }

    const totalDist = points[points.length - 1].dist || 1
    const distRatio = (x - padLeft) / chartW
    const targetDist = distRatio * totalDist

    // Find closest GPX point
    let closestPt = points[0]
    let minDiff = Infinity
    for (const p of points) {
      const diff = Math.abs(p.dist - targetDist)
      if (diff < minDiff) {
        minDiff = diff
        closestPt = p
      }
    }

    // Find if close to an aid station
    let closestCp: CalculatedCheckpoint | undefined
    for (const cp of checkpoints) {
      if (Math.abs(cp.distanceKm - closestPt.dist) < 2.0) {
        closestCp = cp
        break
      }
    }

    setHoverInfo({
      x,
      y,
      point: closestPt,
      checkpoint: closestCp,
    })

    if (onHoverCheckpoint) {
      onHoverCheckpoint(closestCp ? closestCp.aidStation.id : null)
    }
  }

  const handleMouseLeave = () => {
    setHoverInfo(null)
    if (onHoverCheckpoint) onHoverCheckpoint(null)
  }

  return (
    <div className="relative w-full rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Profil Altimétrique & Piquets de Postes
          </span>
          <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">
            Micro-lissage 50m
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Poste Standard
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Base Vie
          </span>
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full w-full cursor-crosshair"
        />

        {/* Dynamic Tooltip on cursor hover */}
        {hoverInfo && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl bg-slate-900/95 p-3 text-xs text-slate-200 shadow-2xl border border-slate-700 backdrop-blur transition-all"
            style={{
              left: `${Math.min(hoverInfo.x + 15, canvasRef.current ? canvasRef.current.clientWidth - 190 : hoverInfo.x)}px`,
              top: `20px`,
            }}
          >
            {hoverInfo.checkpoint ? (
              <div className="space-y-1">
                <div className="font-bold text-orange-400 text-sm flex items-center gap-1">
                  <span>#{hoverInfo.checkpoint.aidStation.order}</span>
                  <span>{hoverInfo.checkpoint.aidStation.name}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Km {hoverInfo.checkpoint.distanceKm} • Alt {hoverInfo.checkpoint.elevation}m • D+ +{hoverInfo.checkpoint.cumDPlus}m
                </div>
                <div className="pt-1 mt-1 border-t border-slate-800 space-y-0.5 text-[11px]">
                  <div className="text-emerald-400">
                    1er : {formatPassingDateTime(hoverInfo.checkpoint.firstRunner.passingTime).fullStr}
                  </div>
                  <div className="text-cyan-400 font-semibold">
                    Barrière : {formatPassingDateTime(hoverInfo.checkpoint.lastRunner.passingTime).fullStr}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="font-mono text-white font-bold">
                  Km {hoverInfo.point.dist}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Altitude : <span className="text-white font-mono">{hoverInfo.point.ele}m</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Pente : <span className="text-orange-400 font-mono">{Math.round(hoverInfo.point.slope * 100)}%</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  D+ cumulé : <span className="text-emerald-400 font-mono">+{hoverInfo.point.dPlus}m</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
