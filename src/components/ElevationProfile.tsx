import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Mountain } from 'lucide-react'
import { RouteTrack } from '../lib/routes'

interface ElevationProfileProps {
  track: RouteTrack
  color: string
  title: string
  denivele: number | null // D+ officiel du BRM, à défaut calculé depuis le tracé
  onHoverIndex: (index: number | null) => void
  collapsed: boolean // replié : seul le bandeau (nom, distance, D+) reste visible
  onToggleCollapsed: () => void
  className?: string
}

const W = 1000 // repère SVG horizontal, étiré à la largeur réelle
const H = 100

export function ElevationProfile({ track, color, title, denivele, onHoverIndex, collapsed, onToggleCollapsed, className = '' }: ElevationProfileProps) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const totalKm = track.dist[track.dist.length - 1]
  const hasEle = track.ele.some(e => e !== null)

  const { path, area, minEle, maxEle, gain } = useMemo(() => {
    const eles = track.ele.map(e => e ?? 0)
    const min = Math.min(...eles)
    const max = Math.max(...eles)
    const span = Math.max(max - min, 50) // éviter d'écraser un parcours plat
    const pts = eles.map((e, i) => `${(track.dist[i] / totalKm) * W},${H - ((e - min) / span) * (H - 8) - 4}`)
    // ponytail: D+ brut avec un seuil de 3 m contre le bruit GPS ; lissage si l'écart avec le D+ officiel gêne
    let up = 0
    let ref = eles[0]
    for (const e of eles) {
      if (e - ref > 3) { up += e - ref; ref = e } else if (ref - e > 3) ref = e
    }
    return { path: `M${pts.join('L')}`, area: `M0,${H}L${pts.join('L')}L${W},${H}Z`, minEle: min, maxEle: max, gain: Math.round(up) }
  }, [track, totalKm])

  const indexAt = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const km = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * totalKm
    // Recherche dichotomique du point le plus proche de cette distance
    let lo = 0
    let hi = track.dist.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (track.dist[mid] < km) lo = mid
      else hi = mid
    }
    return km - track.dist[lo] < track.dist[hi] - km ? lo : hi
  }

  const move = (clientX: number) => {
    const i = indexAt(clientX)
    setHover(i)
    onHoverIndex(i)
  }
  const leave = () => {
    setHover(null)
    onHoverIndex(null)
  }

  const hoverX = hover !== null ? (track.dist[hover] / totalKm) * 100 : null
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(r * totalKm))

  return (
    <section
      aria-label={`Profil altimétrique : ${title}`}
      className={`ui-slide-up bg-white/70 backdrop-blur-md backdrop-saturate-150 border-t border-white/60 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] px-4 pt-2.5 pb-2 ${className}`}
    >
      <div className={`flex items-center gap-3 transition-[margin] duration-300 ${collapsed ? 'mb-0' : 'mb-1.5'}`}>
        <span className="w-3 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-900 truncate">{title}</h2>
        <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums flex-shrink-0">
          <span>{Math.round(totalKm)} km</span>
          <span className="inline-flex items-center gap-1">
            <Mountain className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            {(denivele ?? gain).toLocaleString('fr-FR')} m D+
          </span>
          {hasEle && <span className="hidden sm:inline">{Math.round(minEle)}–{Math.round(maxEle)} m</span>}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Déplier le profil' : 'Replier le profil'}
          title={collapsed ? 'Déplier le profil' : 'Replier le profil'}
          className="ml-auto w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 transition-colors cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {/* Repli animé du graphique (grille 0fr -> 1fr) */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
          ${collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
        inert={collapsed}
      >
      <div className="overflow-hidden">
      {hasEle ? (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full h-20 md:h-24 block cursor-crosshair touch-none"
            onMouseMove={e => move(e.clientX)}
            onMouseLeave={leave}
            onTouchStart={e => move(e.touches[0].clientX)}
            onTouchMove={e => move(e.touches[0].clientX)}
            onTouchEnd={leave}
            role="img"
            aria-label={`Altitude de ${Math.round(minEle)} à ${Math.round(maxEle)} m sur ${Math.round(totalKm)} km`}
          >
            <path d={area} fill={color} fillOpacity={0.15} />
            <path d={path} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Curseur et bulle de lecture */}
          {hover !== null && hoverX !== null && (
            <>
              <div className="absolute top-0 bottom-0 w-px bg-slate-900/50 pointer-events-none" style={{ left: `${hoverX}%` }} />
              <div
                className="absolute -top-1 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-semibold tabular-nums whitespace-nowrap pointer-events-none"
                style={{ left: `${hoverX}%`, transform: `translateX(${hoverX > 85 ? '-100%' : hoverX < 15 ? '0' : '-50%'})` }}
              >
                km {Math.round(track.dist[hover])}
                {track.ele[hover] !== null && ` · ${Math.round(track.ele[hover]!)} m`}
              </div>
            </>
          )}

          <div className="flex justify-between text-[10px] text-slate-400 tabular-nums mt-0.5" aria-hidden="true">
            {ticks.map((t, i) => <span key={i}>{t} km</span>)}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-4">Pas d'altitude disponible pour ce tracé.</p>
      )}
      </div>
      </div>
    </section>
  )
}
