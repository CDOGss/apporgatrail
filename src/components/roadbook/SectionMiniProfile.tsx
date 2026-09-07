import React, { useRef, useEffect } from 'react'
import type { GpxPoint, CalculatedCheckpoint } from '../../types/trail'

interface SectionMiniProfileProps {
  points: GpxPoint[]
  checkpoints: CalculatedCheckpoint[]
  height?: number
}

export const SectionMiniProfile: React.FC<SectionMiniProfileProps> = ({
  points,
  checkpoints,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    const padLeft = 45
    const padRight = 30
    const padTop = 22
    const padBottom = 28
    const chartW = w - padLeft - padRight
    const chartH = h - padTop - padBottom

    const startDist = points[0].dist
    const endDist = points[points.length - 1].dist
    const distSpan = Math.max(1, endDist - startDist)

    let minEle = Infinity
    let maxEle = -Infinity
    for (const p of points) {
      if (p.ele < minEle) minEle = p.ele
      if (p.ele > maxEle) maxEle = p.ele
    }
    minEle = Math.max(0, Math.floor(minEle * 0.9))
    maxEle = Math.ceil(maxEle * 1.08)
    const eleRange = Math.max(80, maxEle - minEle)

    // Clear background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)

    // Draw horizontal grid lines
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'right'

    const eleStep = eleRange > 1000 ? 250 : 100
    const startGridEle = Math.ceil(minEle / eleStep) * eleStep

    for (let e = startGridEle; e <= maxEle; e += eleStep) {
      const y = padTop + chartH - ((e - minEle) / eleRange) * chartH
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(w - padRight, y)
      ctx.stroke()
      ctx.fillText(`${e}m`, padLeft - 6, y + 3)
    }

    // Distance ticks
    ctx.textAlign = 'center'
    const stepKm = distSpan > 40 ? 10 : 5
    const firstTick = Math.ceil(startDist / stepKm) * stepKm
    for (let d = firstTick; d <= endDist; d += stepKm) {
      const x = padLeft + ((d - startDist) / distSpan) * chartW
      ctx.beginPath()
      ctx.moveTo(x, padTop)
      ctx.lineTo(x, padTop + chartH)
      ctx.stroke()
      ctx.fillText(`${Math.round(d)}k`, x, h - padBottom + 14)
    }

    // Draw elevation path
    const getX = (d: number) => padLeft + ((d - startDist) / distSpan) * chartW
    const getY = (e: number) => padTop + chartH - ((e - minEle) / eleRange) * chartH

    ctx.beginPath()
    ctx.moveTo(getX(points[0].dist), getY(points[0].ele))
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(points[i].dist), getY(points[i].ele))
    }

    // Fill
    ctx.lineTo(getX(points[points.length - 1].dist), padTop + chartH)
    ctx.lineTo(getX(points[0].dist), padTop + chartH)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH)
    gradient.addColorStop(0, 'rgba(255, 94, 26, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 94, 26, 0.05)')
    ctx.fillStyle = gradient
    ctx.fill()

    // Stroke
    ctx.beginPath()
    ctx.moveTo(getX(points[0].dist), getY(points[0].ele))
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(points[i].dist), getY(points[i].ele))
    }
    ctx.strokeStyle = '#ff5e1a'
    ctx.lineWidth = 2.2
    ctx.stroke()

    // Pins for checkpoints within this section
    checkpoints.forEach((cp) => {
      const x = getX(cp.distanceKm)
      const y = getY(cp.elevation)

      // Pin line
      ctx.save()
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(x, padTop)
      ctx.lineTo(x, padTop + chartH)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      // Circle
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = cp.aidStation.type === 'BASE_VIE' ? '#f59e0b' : '#ff5e1a'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Text label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(cp.aidStation.name.slice(0, 14), x, padTop - 6)
    })
  }, [points, checkpoints, height])

  return (
    <div className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 overflow-hidden shadow-inner">
      <div style={{ height: `${height}px` }}>
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  )
}
