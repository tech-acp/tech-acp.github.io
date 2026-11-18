import { useEffect, useRef } from 'react'
import { Brevet, Club, getDistanceColor } from '../types/brevet'
import { Mountain, User, Mail, Globe, Route, ChevronDown, ExternalLink } from 'lucide-react'
import { isBrevetPast } from '../lib/utils'
import { canDisplayRoute } from '../lib/routes'

interface BrevetCardProps {
  brevet: Brevet
  isExpanded: boolean
  onToggle: () => void
  commonClub: Club | null
  commonVilleDepart: string | null
  onShowRoute: () => void
  isRouteFocused: boolean
  isRouteHovered: boolean
  onHoverRoute: (hovered: boolean) => void
  index: number // rang dans la liste, pour décaler l'apparition des cartes
}

// YYYY-MM-DD en heure locale (new Date('YYYY-MM-DD') serait en UTC)
const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// « Jean DUPONT » -> « Jean Dupont » (les noms arrivent souvent en majuscules de l'API ACP)
const formatName = (name: string) =>
  name.replace(/\p{L}+/gu, word => (word === word.toUpperCase() ? word.charAt(0) + word.slice(1).toLowerCase() : word))

export function BrevetCard({ brevet, isExpanded, onToggle, commonClub, commonVilleDepart, onShowRoute, isRouteFocused, isRouteHovered, onHoverRoute, index }: BrevetCardProps) {
  const date = parseDate(brevet.date_brevet)
  const isPast = isBrevetPast(brevet.date_brevet)
  const detailsId = `brevet-details-${brevet.id}`
  const hasRoute = canDisplayRoute(brevet.lien_itineraire_brm)

  // Tracé survolé sur la carte : amener la carte du brevet dans la vue
  const cardRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (isRouteHovered) cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [isRouteHovered])

  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
  const day = date.getDate()
  const month = date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
  const fullDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const showClub = !commonClub && brevet.club?.nom_club
  const showCity = !commonVilleDepart && brevet.ville_depart
  const hasDetails = brevet.nom_organisateur || brevet.mail_organisateur || showClub || (!commonClub && brevet.club?.page_web_club)

  return (
    <article
      ref={cardRef}
      onMouseEnter={hasRoute ? () => onHoverRoute(true) : undefined}
      onMouseLeave={hasRoute ? () => onHoverRoute(false) : undefined}
      // Clic sur la carte du brevet (hors liens et boutons) : afficher son tracé et son profil
      onClick={hasRoute ? e => { if (!(e.target as HTMLElement).closest('a, button')) onShowRoute() } : undefined}
      className={`ui-fade-in-up rounded-xl border bg-white/90 transition-[box-shadow,border-color,opacity] duration-200 ${hasRoute ? 'cursor-pointer' : ''}
        ${isRouteHovered
          ? 'shadow-md'
          : isExpanded ? 'border-[#2E5077]/30 shadow-md' : 'border-slate-200 shadow-sm hover:shadow-md'}`}
      style={{
        animationDelay: `${Math.min(index, 8) * 35}ms`,
        opacity: isPast && !isRouteHovered ? 0.6 : 1,
        // Liseré de la couleur du tracé, comme sur la carte
        ...(isRouteHovered && { borderColor: getDistanceColor(brevet.distance_brevet ?? 0), boxShadow: `0 0 0 2px ${getDistanceColor(brevet.distance_brevet ?? 0)}` })
      }}
    >
      <div className="flex gap-3 p-3">
        {/* Date en pavé, pour parcourir la liste d'un coup d'œil */}
        <div
          className="flex flex-col items-center justify-center w-14 flex-shrink-0 rounded-lg bg-slate-100/70 border border-slate-200/60 py-1.5"
          aria-label={fullDate}
        >
          <span className="text-[11px] font-semibold uppercase text-slate-500 leading-none">{weekday}</span>
          <span className="text-xl font-bold text-slate-900 leading-tight tabular-nums">{day}</span>
          <span className="text-[11px] font-semibold uppercase text-slate-500 leading-none">{month}</span>
          <span className="mt-0.5 text-[10px] font-medium text-slate-400 leading-none tabular-nums">{date.getFullYear()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-slate-900 leading-snug" style={{ overflowWrap: 'anywhere' }}>
              {brevet.nom_brm || `BRM ${brevet.distance_brevet ?? ''} km`}
            </h3>
            {brevet.distance_brevet && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-bold text-white bg-[#8B3A3A] tabular-nums">
                {brevet.distance_brevet} km
              </span>
            )}
          </div>

          {/* Infos clés toujours visibles */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            {showCity && <span>{brevet.ville_depart}{brevet.departement && ` (${brevet.departement})`}</span>}
            {brevet.denivele ? (
              <span className="inline-flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                {brevet.denivele.toLocaleString('fr-FR')} m D+
              </span>
            ) : null}
            {brevet.eligible_r10000 && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">R10000</span>
            )}
            {isPast && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">Passé</span>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            {hasRoute && (
              <>
                {/* Affiche le tracé sur la carte ; la pastille reprend la couleur du tracé */}
                <button
                  type="button"
                  onClick={onShowRoute}
                  aria-pressed={isRouteFocused}
                  className={`inline-flex items-center gap-1.5 min-h-[32px] px-2.5 rounded-lg text-sm font-semibold border transition-[color,background-color,border-color,transform] duration-150 cursor-pointer active:scale-[0.96]
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40
                              ${isRouteFocused
                                ? 'bg-[#2E5077] border-[#2E5077] text-white'
                                : 'text-[#2E5077] bg-[#2E5077]/5 border-[#2E5077]/15 hover:bg-[#2E5077]/10'}`}
                >
                  <span
                    className="w-3 h-1 rounded-full"
                    style={{ backgroundColor: isRouteFocused ? '#ffffff' : getDistanceColor(brevet.distance_brevet ?? 0) }}
                    aria-hidden="true"
                  />
                  Voir l'itinéraire
                </button>
                <a
                  href={brevet.lien_itineraire_brm!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ouvrir l'itinéraire dans un nouvel onglet"
                  title="Ouvrir l'itinéraire dans un nouvel onglet"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#2E5077] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </>
            )}
            {brevet.lien_itineraire_brm && !canDisplayRoute(brevet.lien_itineraire_brm) && (
              <a
                href={brevet.lien_itineraire_brm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 rounded-lg text-sm font-semibold text-[#2E5077] bg-[#2E5077]/5 border border-[#2E5077]/15 hover:bg-[#2E5077]/10 transition-colors"
              >
                <Route className="w-4 h-4" aria-hidden="true" />
                Itinéraire
                <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
              </a>
            )}
            {hasDetails && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                className="inline-flex items-center gap-1 min-h-[32px] px-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40"
              >
                {isExpanded ? 'Moins' : 'Contact'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contact et club, à la demande */}
      {/* Dépliage animé : grille 0fr -> 1fr (pas de hauteur fixe à deviner) */}
      {hasDetails && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
            ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          inert={!isExpanded}
        >
        <div className="overflow-hidden">
        <div id={detailsId} className="border-t border-slate-100 px-3 py-3 space-y-3 text-sm">
          {(brevet.nom_organisateur || brevet.mail_organisateur) && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Organisateur</div>
              {brevet.nom_organisateur && (
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                  {formatName(brevet.nom_organisateur)}
                </div>
              )}
              {brevet.mail_organisateur && (
                <a
                  href={`mailto:${brevet.mail_organisateur}`}
                  className="mt-1 flex items-center gap-2 text-[#2E5077] hover:underline"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                  {brevet.mail_organisateur}
                </a>
              )}
            </div>
          )}

          {showClub && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Club</div>
              <div className="text-slate-900 font-medium">{brevet.club!.nom_club}</div>
              {brevet.club!.page_web_club && (
                <a
                  href={brevet.club!.page_web_club}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-2 text-[#2E5077] hover:underline"
                >
                  <Globe className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  Site du club
                </a>
              )}
            </div>
          )}
        </div>
        </div>
        </div>
      )}
    </article>
  )
}
