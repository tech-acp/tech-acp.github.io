import { Brevet, Club } from '../types/brevet'
import { Calendar, MapPin, Mountain, User, Mail, Globe, Route, Flag, Check, ChevronDown } from 'lucide-react'
import { isBrevetPast } from '../lib/utils'

interface BrevetCardProps {
  brevet: Brevet
  isExpanded: boolean
  onToggle: () => void
  commonClub: Club | null
  commonVilleDepart: string | null
  variant?: 'mobile' | 'desktop'
}

export function BrevetCard({
  brevet,
  isExpanded,
  onToggle,
  commonClub,
  commonVilleDepart,
  variant = 'desktop'
}: BrevetCardProps) {
  const isMobile = variant === 'mobile'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Styles conditionnels basés sur la variante
  const headerPadding = isMobile ? 'p-3' : 'p-4'
  const headerSpacing = isMobile ? 'space-y-2' : 'space-y-2'
  const dateIconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const dateTextSize = isMobile ? 'text-xs' : 'text-sm'
  const distancePadding = isMobile ? 'px-2.5 py-0.5' : 'px-3 py-1'
  const distanceTextSize = isMobile ? 'text-xs' : 'text-sm'
  const nameTextSize = isMobile ? 'text-sm' : 'text-base'
  
  const contentPadding = isMobile ? 'p-4' : 'p-5'
  const contentSpacing = isMobile ? 'space-y-4' : 'space-y-5'
  const cardSpacing = isMobile ? 'space-y-2.5' : 'space-y-3'
  const cardPadding = isMobile ? 'p-3' : 'p-4'
  const iconContainerPadding = isMobile ? 'p-2' : 'p-2.5'
  const iconSize = isMobile ? 'w-4 h-4' : 'w-5 h-5'
  const labelTextSize = isMobile ? 'text-xs' : 'text-xs'
  const labelMargin = isMobile ? 'mb-1' : 'mb-1.5'
  const valueTextSize = isMobile ? 'text-sm' : ''
  
  const sectionPadding = isMobile ? 'p-4' : 'p-5'
  const sectionSpacing = isMobile ? 'space-y-2' : 'space-y-3'
  const sectionTitleGap = isMobile ? 'gap-2' : 'gap-2.5'
  const sectionTitleTextSize = isMobile ? 'text-sm' : ''
  const sectionBarHeight = isMobile ? 'h-5' : 'h-6'
  const sectionBarWidth = isMobile ? 'w-1' : 'w-1.5'
  const sectionContentPadding = isMobile ? 'pl-2' : 'pl-3'
  const clubNameSize = isMobile ? 'text-sm' : 'text-lg'
  const sectionIconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const sectionTextSize = isMobile ? 'text-xs' : 'text-sm'
  const linkTextSize = isMobile ? 'text-xs' : 'text-sm'
  
  const badgePadding = isMobile ? 'px-3 py-1.5' : 'px-5 py-2.5'
  const badgeTextSize = isMobile ? 'text-xs' : 'text-sm'
  const badgeIconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const badgeGap = isMobile ? 'gap-2' : 'gap-3'
  const badgeRadius = isMobile ? 'rounded-xl' : 'rounded-2xl'

  const hoverEffect = isMobile 
    ? 'active:from-slate-100 active:to-slate-200/50' 
    : 'hover:from-slate-100 hover:to-slate-200/50'

  const cardHoverEffect = isMobile ? '' : 'hover:shadow-md'

  const isPast = isBrevetPast(brevet.date_brevet)

  return (
    <div 
      className={`border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${cardHoverEffect} transition-shadow`}
      style={{ opacity: isPast ? 0.3 : 1 }}
    >
      {/* En-tête du brevet (toujours visible) */}
      <button
        onClick={onToggle}
        className={`w-full ${headerPadding} flex items-center justify-between bg-gradient-to-br from-slate-50 to-slate-100/50 ${hoverEffect} transition-all`}
      >
        <div className={`flex-1 text-left ${headerSpacing}`}>
          {/* Date et distance */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className={dateIconSize} style={{ color: '#2E5077' }} />
              <span className={`${dateTextSize} font-semibold text-slate-900`}>
                {formatDate(brevet.date_brevet)}
              </span>
            </div>
            {brevet.distance_brevet && (
              <div
                className={`inline-flex items-center ${distancePadding} text-white font-bold ${badgeRadius} ${distanceTextSize}`}
                style={{
                  background: 'linear-gradient(135deg, #8B3A3A 0%, #6d2e2e 100%)'
                }}
              >
                {brevet.distance_brevet} km
              </div>
            )}
          </div>
          {/* Nom du BRM */}
          {brevet.nom_brm && (
            <div className={`${nameTextSize} font-bold text-slate-900`}>
              {brevet.nom_brm}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-600 transition-transform duration-300 flex-shrink-0 ml-2 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Détails du brevet (affichés quand expanded) */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`${contentPadding} ${contentSpacing} bg-white`}>
          {/* Informations principales dans des cards */}
          <div className={cardSpacing}>
            {/* Ville de départ (seulement si pas affichée dans le header) */}
            {brevet.ville_depart && !commonVilleDepart && (
              <div className={`flex items-start space-x-3.5 ${cardPadding} rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 ${cardHoverEffect} transition-all duration-200 border border-slate-200/50`}>
                <div
                  className={`${iconContainerPadding} rounded-xl shadow-sm`}
                  style={{ backgroundColor: '#e0e9f0' }}
                >
                  <MapPin className={iconSize} style={{ color: '#2E5077' }} />
                </div>
                <div className="flex-1">
                  <div className={`${labelTextSize} font-semibold uppercase tracking-wide ${labelMargin}`} style={{ color: '#64748b' }}>
                    Ville de départ
                  </div>
                  <div className={`text-slate-900 font-semibold ${valueTextSize}`}>
                    {brevet.ville_depart}
                    {brevet.departement && <span className="text-slate-600 font-normal"> ({brevet.departement})</span>}
                  </div>
                  {brevet.region && (
                    <div className={`${sectionTextSize} text-slate-500 mt-0.5`}>{brevet.region}</div>
                  )}
                </div>
              </div>
            )}

            {/* Dénivelé */}
            {brevet.denivele && (
              <div className={`flex items-start space-x-3.5 ${cardPadding} rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 ${cardHoverEffect} transition-all duration-200 border border-slate-200/50`}>
                <div
                  className={`${iconContainerPadding} rounded-xl shadow-sm`}
                  style={{ backgroundColor: '#e0e9f0' }}
                >
                  <Mountain className={iconSize} style={{ color: '#2E5077' }} />
                </div>
                <div className="flex-1">
                  <div className={`${labelTextSize} font-semibold uppercase tracking-wide ${labelMargin}`} style={{ color: '#64748b' }}>
                    Dénivelé
                  </div>
                  <div className={`text-slate-900 font-semibold ${valueTextSize}`}>{brevet.denivele.toLocaleString()} m</div>
                </div>
              </div>
            )}
          </div>

          {/* Club (seulement si pas affiché dans le header) */}
          {brevet.club?.nom_club && !commonClub && (
            <div className={`bg-gradient-to-br from-blue-50/50 to-slate-50/50 ${badgeRadius} ${sectionPadding} border border-blue-100/50 shadow-sm`}>
              <h4 className={`font-bold text-slate-900 mb-4 flex items-center ${sectionTitleGap} ${sectionTitleTextSize}`}>
                <span className={`${sectionBarWidth} ${sectionBarHeight} rounded-full`} style={{ backgroundColor: '#2E5077' }}></span>
                Club organisateur
              </h4>
              <div className={`${sectionContentPadding} ${sectionSpacing}`}>
                <div className={`text-slate-900 font-semibold ${clubNameSize}`}>{brevet.club.nom_club}</div>
                {brevet.club.code_acp && (
                  <div className={sectionTextSize + ' text-slate-600'}>Code ACP : {brevet.club.code_acp}</div>
                )}
                {brevet.club.pays && (
                  <div className="flex items-center space-x-2">
                    <Flag className={sectionIconSize} style={{ color: '#64748b' }} />
                    <span className={`${sectionTextSize} text-slate-600`}>{brevet.club.pays}</span>
                  </div>
                )}
                {brevet.club.representant_acp && (
                  <div className="flex items-center space-x-2">
                    <User className={sectionIconSize} style={{ color: '#64748b' }} />
                    <span className={`${sectionTextSize} text-slate-600`}>{brevet.club.representant_acp}</span>
                  </div>
                )}
                {brevet.club.email_representant_acp && (
                  <div className="flex items-center space-x-2">
                    <Mail className={sectionIconSize} style={{ color: '#64748b' }} />
                    <a
                      href={`mailto:${brevet.club.email_representant_acp}`}
                      className={`${sectionTextSize} font-medium hover:underline transition-colors`}
                      style={{ color: '#2E5077' }}
                    >
                      {brevet.club.email_representant_acp}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organisateur */}
          {brevet.nom_organisateur && (
            <div className={`bg-gradient-to-br from-purple-50/30 to-slate-50/50 ${badgeRadius} ${sectionPadding} border border-purple-100/50 shadow-sm`}>
              <h4 className={`font-bold text-slate-900 mb-4 flex items-center ${sectionTitleGap} ${sectionTitleTextSize}`}>
                <span className={`${sectionBarWidth} ${sectionBarHeight} rounded-full`} style={{ backgroundColor: '#2E5077' }}></span>
                Organisateur
              </h4>
              <div className={`${sectionContentPadding} ${sectionSpacing}`}>
                <div className="flex items-center space-x-2.5">
                  <User className={sectionIconSize} style={{ color: '#64748b' }} />
                  <span className={`text-slate-900 font-semibold ${linkTextSize}`}>{brevet.nom_organisateur}</span>
                </div>
                {brevet.mail_organisateur && (
                  <div className="flex items-center space-x-2.5">
                    <Mail className={sectionIconSize} style={{ color: '#64748b' }} />
                    <a
                      href={`mailto:${brevet.mail_organisateur}`}
                      className={`${sectionTextSize} font-medium hover:underline transition-colors`}
                      style={{ color: '#2E5077' }}
                    >
                      {brevet.mail_organisateur}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liens */}
          {((!commonClub && brevet.club?.page_web_club) || brevet.lien_itineraire_brm) && (
            <div className={`bg-gradient-to-br from-amber-50/30 to-slate-50/50 ${badgeRadius} ${sectionPadding} border border-amber-100/50 shadow-sm`}>
              <div className={`${sectionContentPadding} ${sectionSpacing}`}>
                {!commonClub && brevet.club?.page_web_club && (
                  <a
                    href={brevet.club.page_web_club}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2.5 font-semibold hover:underline transition-all duration-200 ${isMobile ? '' : 'group hover:translate-x-1'}`}
                    style={{ color: '#2E5077' }}
                  >
                    <Globe className={`${sectionIconSize} ${isMobile ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className={linkTextSize}>Page du club</span>
                  </a>
                )}
                {brevet.lien_itineraire_brm && (
                  <a
                    href={brevet.lien_itineraire_brm}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2.5 font-semibold hover:underline transition-all duration-200 ${isMobile ? '' : 'group hover:translate-x-1'}`}
                    style={{ color: '#2E5077' }}
                  >
                    <Route className={`${sectionIconSize} ${isMobile ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className={linkTextSize}>Voir l'itinéraire</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Badges */}
          {(brevet.eligible_r10000 || brevet.acces_homologations) && (
            <div className={`flex flex-wrap ${badgeGap}`}>
              {brevet.eligible_r10000 && (
                <div
                  className={`inline-flex items-center ${badgePadding} ${badgeRadius} ${badgeTextSize} font-bold shadow-lg ${isMobile ? '' : 'transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-default'}`}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    boxShadow: '0 4px 8px -2px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  Éligible R10000
                </div>
              )}
              {brevet.acces_homologations && (
                <div
                  className={`inline-flex items-center gap-1.5 ${badgePadding} ${badgeRadius} ${badgeTextSize} font-bold shadow-lg ${isMobile ? '' : 'transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-default'}`}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    boxShadow: '0 4px 8px -2px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <Check className={badgeIconSize} />
                  Accès homologations
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

