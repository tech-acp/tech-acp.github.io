import { Brevet } from '../types/brevet'
import { BrevetPanelContent } from './BrevetCommonInfo'

interface BrevetBottomSheetProps {
  brevets: Brevet[]
  onClose: () => void
  onShowRoute: (brevetId: number) => void
  focusedRouteId: number | null
  hoveredRouteId: number | null
  onHoverRoute: (brevetId: number | null) => void
}

export function BrevetBottomSheet({ brevets, onClose, onShowRoute, focusedRouteId, hoveredRouteId, onHoverRoute }: BrevetBottomSheetProps) {
  const isOpen = brevets.length > 0

  return (
    <>
      {/* Voile : un tap en dehors ferme le panneau */}
      {isOpen && (
        <div className="ui-fade fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Brevets sélectionnés"
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white/75 backdrop-blur-xl backdrop-saturate-150 rounded-t-2xl shadow-2xl
          max-h-[85dvh] flex flex-col overflow-hidden
          transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
          ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}
        `}
      >
        {/* Poignée visuelle du bottom sheet */}
        <div className="flex-shrink-0 pt-2" aria-hidden="true">
          <div className="mx-auto h-1 w-10 rounded-full bg-slate-300" />
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
        >
          {isOpen && <BrevetPanelContent key={brevets[0].id} brevets={brevets} onClose={onClose} onShowRoute={onShowRoute} focusedRouteId={focusedRouteId} hoveredRouteId={hoveredRouteId} onHoverRoute={onHoverRoute} />}
        </div>
      </div>
    </>
  )
}
