import { Brevet } from '../types/brevet'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BrevetPanelContent } from './BrevetCommonInfo'

interface BrevetSidebarProps {
  brevets: Brevet[]
  onClose: () => void
  onShowRoute: (brevetId: number) => void
  focusedRouteId: number | null
  hoveredRouteId: number | null
  onHoverRoute: (brevetId: number | null) => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function BrevetSidebar({ brevets, onClose, onShowRoute, focusedRouteId, hoveredRouteId, onHoverRoute, collapsed, onToggleCollapsed }: BrevetSidebarProps) {
  const hasSelection = brevets.length > 0
  const isOpen = hasSelection && !collapsed

  return (
    <>
    {/* Languette pour replier / déplier la liste, collée au bord du panneau */}
    {hasSelection && (
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? `Afficher la liste (${brevets.length} brevet${brevets.length > 1 ? 's' : ''})` : 'Masquer la liste'}
        title={collapsed ? 'Afficher la liste' : 'Masquer la liste'}
        className={`ui-fade absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 h-14 pl-1.5 pr-1 rounded-l-xl
                    bg-white/75 backdrop-blur-md border border-r-0 border-white/60 shadow-lg text-slate-600 hover:text-slate-900 hover:bg-white/90 cursor-pointer
                    transition-[right,background-color,color] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40
                    ${collapsed ? 'right-0' : 'right-[400px]'}`}
      >
        {collapsed ? <ChevronLeft className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
        {collapsed && <span className="text-xs font-bold tabular-nums">{brevets.length}</span>}
      </button>
    )}
    <aside
      aria-label="Brevets sélectionnés"
      className={`
        absolute top-0 right-0 h-full w-[400px] bg-white/60 backdrop-blur-xl backdrop-saturate-150 shadow-2xl z-20 border-l border-white/60
        overflow-y-auto transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
      `}
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
    >
      {hasSelection && <BrevetPanelContent key={brevets[0].id} brevets={brevets} onClose={onClose} onShowRoute={onShowRoute} focusedRouteId={focusedRouteId} hoveredRouteId={hoveredRouteId} onHoverRoute={onHoverRoute} />}
    </aside>
    </>
  )
}
