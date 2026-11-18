import { useState } from 'react'
import { Brevet } from '../types/brevet'
import { MapPin, Globe, X, ExternalLink } from 'lucide-react'
import { BrevetCard } from './BrevetCard'

interface BrevetPanelContentProps {
  brevets: Brevet[]
  onClose: () => void
  onShowRoute: (brevetId: number) => void
  focusedRouteId: number | null
  hoveredRouteId: number | null
  onHoverRoute: (brevetId: number | null) => void
}

// Contenu commun au panneau latéral (desktop) et au bottom sheet (mobile) :
// en-tête avec les infos partagées par tous les brevets du point, puis la liste triée par date
export function BrevetPanelContent({ brevets, onClose, onShowRoute, focusedRouteId, hoveredRouteId, onHoverRoute }: BrevetPanelContentProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const first = brevets[0]
  const commonClub = first && brevets.every(b => b.club?.nom_club === first.club?.nom_club) ? (first.club ?? null) : null
  const commonVilleDepart = first && brevets.every(b => b.ville_depart === first.ville_depart) ? first.ville_depart : null
  const commonDepartement = first && brevets.every(b => b.departement === first.departement) ? first.departement : null

  const sorted = [...brevets].sort((a, b) => a.date_brevet.localeCompare(b.date_brevet))

  return (
    <>
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-slate-200/70 px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {brevets.length} brevet{brevets.length > 1 ? 's' : ''} au départ de
            </div>
            <h2 className="mt-0.5 flex items-center gap-1.5 text-lg font-bold text-slate-900 leading-tight">
              <MapPin className="w-5 h-5 text-[#8B3A3A] flex-shrink-0" aria-hidden="true" />
              <span style={{ overflowWrap: 'anywhere' }}>
                {commonVilleDepart || 'Plusieurs villes'}
                {commonVilleDepart && commonDepartement && (
                  <span className="font-normal text-slate-500"> · {commonDepartement}</span>
                )}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-10 h-10 -mr-1 -mt-1 flex-shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {commonClub?.nom_club && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-slate-500">Organisé par</span>
            <span className="font-semibold text-slate-800">{commonClub.nom_club}</span>
            {commonClub.page_web_club && (
              <a
                href={commonClub.page_web_club}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#2E5077] hover:underline"
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                Site du club
                <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </header>

      <div className="p-3 space-y-2.5">
        {sorted.map((brevet, index) => (
          <BrevetCard
            index={index}
            key={brevet.id}
            brevet={brevet}
            isExpanded={expandedIds.has(brevet.id)}
            onToggle={() => toggleExpand(brevet.id)}
            commonClub={commonClub}
            commonVilleDepart={commonVilleDepart}
            onShowRoute={() => onShowRoute(brevet.id)}
            isRouteFocused={focusedRouteId === brevet.id}
            isRouteHovered={hoveredRouteId === brevet.id}
            onHoverRoute={hovered => onHoverRoute(hovered ? brevet.id : null)}
          />
        ))}
      </div>
    </>
  )
}
