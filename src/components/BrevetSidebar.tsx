import { Brevet } from '../types/brevet'
import { X, Calendar, MapPin, Mountain, User, Mail, Globe, Route, Flag, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface BrevetSidebarProps {
  brevets: Brevet[]
  onClose: () => void
}

export function BrevetSidebar({ brevets, onClose }: BrevetSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const isOpen = brevets.length > 0

  // Extraire les données communes (si tous les brevets partagent la même valeur)
  const commonClub = brevets.length > 0 && brevets.every(b => b.club?.nom_club === brevets[0].club?.nom_club)
    ? brevets[0].club
    : null

  const commonVilleDepart = brevets.length > 0 && brevets.every(b => b.ville_depart === brevets[0].ville_depart)
    ? brevets[0].ville_depart
    : null

  const commonDepartement = brevets.length > 0 && brevets.every(b => b.departement === brevets[0].departement)
    ? brevets[0].departement
    : null

  const commonRegion = brevets.length > 0 && brevets.every(b => b.region === brevets[0].region)
    ? brevets[0].region
    : null

  return (
    <div
      className={`
        absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-20
        overflow-y-auto transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
      `}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}
    >
      {/* Header avec gradient bleu moderne */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'linear-gradient(135deg, #2E5077 0%, #1e3a55 100%)',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          boxShadow: '0 8px 16px -4px rgba(46, 80, 119, 0.3)'
        }}
      >

        {/* Informations communes */}
        {(commonClub || commonVilleDepart) && (
          <div className="pt-6 px-6 pb-6 space-y-3">
            {/* Club organisateur */}
            {commonClub?.nom_club && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-start gap-2.5">
                  <Flag className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
                      Club organisateur
                    </div>
                    <div className="text-white font-semibold">
                      {commonClub.nom_club}
                    </div>
                    {commonClub.page_web_club && (
                      <a
                        href={commonClub.page_web_club}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 hover:scale-105"
                        style={{ color: '#ffffff' }}
                      >
                        <Globe className="w-4 h-4" style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff' }}>Site du club</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ville de départ */}
            {commonVilleDepart && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
                      Ville de départ
                    </div>
                    <div className="text-white font-semibold">
                      {commonVilleDepart}
                      {commonDepartement && <span className="text-white/80 font-normal"> ({commonDepartement})</span>}
                    </div>
                    {commonRegion && (
                      <div className="text-sm text-white/70 mt-0.5">{commonRegion}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {brevets.length > 0 && (
        <div className="p-6 space-y-4">
          {[...brevets].sort((a, b) => new Date(a.date_brevet).getTime() - new Date(b.date_brevet).getTime()).map((brevet) => {
            const isExpanded = expandedIds.has(brevet.id)

            return (
              <div
                key={brevet.id}
                className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* En-tête du brevet (toujours visible) */}
                <button
                  onClick={() => toggleExpand(brevet.id)}
                  className="w-full p-4 flex items-center justify-between bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 transition-all"
                >
                  <div className="flex-1 text-left space-y-2">
                    {/* Date et distance */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: '#2E5077' }} />
                        <span className="text-sm font-semibold text-slate-900">
                          {formatDate(brevet.date_brevet)}
                        </span>
                      </div>
                      {brevet.distance_brevet && (
                        <div
                          className="inline-flex items-center px-3 py-1 text-white font-bold rounded-xl text-sm"
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
                      <div className="text-base font-bold text-slate-900">
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
                  <div className="p-5 space-y-5 bg-white">
                    {/* Informations principales dans des cards */}
                    <div className="space-y-3">
                      {/* Ville de départ (seulement si pas affichée dans le header) */}
                      {brevet.ville_depart && !commonVilleDepart && (
                        <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 hover:shadow-md transition-all duration-200 border border-slate-200/50">
                          <div
                            className="p-2.5 rounded-xl shadow-sm"
                            style={{ backgroundColor: '#e0e9f0' }}
                          >
                            <MapPin className="w-5 h-5" style={{ color: '#2E5077' }} />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>
                              Ville de départ
                            </div>
                            <div className="text-slate-900 font-semibold">
                              {brevet.ville_depart}
                              {brevet.departement && <span className="text-slate-600 font-normal"> ({brevet.departement})</span>}
                            </div>
                            {brevet.region && (
                              <div className="text-sm text-slate-500 mt-1">{brevet.region}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dénivelé */}
                      {brevet.denivele && (
                        <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 hover:shadow-md transition-all duration-200 border border-slate-200/50">
                          <div
                            className="p-2.5 rounded-xl shadow-sm"
                            style={{ backgroundColor: '#e0e9f0' }}
                          >
                            <Mountain className="w-5 h-5" style={{ color: '#2E5077' }} />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>
                              Dénivelé
                            </div>
                            <div className="text-slate-900 font-semibold">{brevet.denivele.toLocaleString()} m</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Club (seulement si pas affiché dans le header) */}
                    {brevet.club?.nom_club && !commonClub && (
                      <div className="bg-gradient-to-br from-blue-50/50 to-slate-50/50 rounded-2xl p-5 border border-blue-100/50 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2.5">
                          <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#2E5077' }}></span>
                          Club organisateur
                        </h4>
                        <div className="pl-3 space-y-3">
                          <div className="text-slate-900 font-semibold text-lg">{brevet.club.nom_club}</div>
                          {brevet.club.code_acp && (
                            <div className="text-sm text-slate-600">Code ACP : {brevet.club.code_acp}</div>
                          )}
                          {brevet.club.pays && (
                            <div className="flex items-center space-x-2">
                              <Flag className="w-4 h-4" style={{ color: '#64748b' }} />
                              <span className="text-sm text-slate-600">{brevet.club.pays}</span>
                            </div>
                          )}
                          {brevet.club.representant_acp && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" style={{ color: '#64748b' }} />
                              <span className="text-sm text-slate-600">{brevet.club.representant_acp}</span>
                            </div>
                          )}
                          {brevet.club.email_representant_acp && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" style={{ color: '#64748b' }} />
                              <a
                                href={`mailto:${brevet.club.email_representant_acp}`}
                                className="text-sm font-medium hover:underline transition-colors"
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
                      <div className="bg-gradient-to-br from-purple-50/30 to-slate-50/50 rounded-2xl p-5 border border-purple-100/50 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2.5">
                          <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#2E5077' }}></span>
                          Organisateur
                        </h4>
                        <div className="pl-3 space-y-3">
                          <div className="flex items-center space-x-2.5">
                            <User className="w-4 h-4" style={{ color: '#64748b' }} />
                            <span className="text-slate-900 font-semibold">{brevet.nom_organisateur}</span>
                          </div>
                          {brevet.mail_organisateur && (
                            <div className="flex items-center space-x-2.5">
                              <Mail className="w-4 h-4" style={{ color: '#64748b' }} />
                              <a
                                href={`mailto:${brevet.mail_organisateur}`}
                                className="text-sm font-medium hover:underline transition-colors"
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
                      <div className="bg-gradient-to-br from-amber-50/30 to-slate-50/50 rounded-2xl p-5 border border-amber-100/50 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2.5">
                          <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#2E5077' }}></span>
                          Liens
                        </h4>
                        <div className="pl-3 space-y-3">
                          {!commonClub && brevet.club?.page_web_club && (
                            <a
                              href={brevet.club.page_web_club}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2.5 font-semibold hover:underline transition-all duration-200 group hover:translate-x-1"
                              style={{ color: '#2E5077' }}
                            >
                              <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-sm">Page du club</span>
                            </a>
                          )}
                          {brevet.lien_itineraire_brm && (
                            <a
                              href={brevet.lien_itineraire_brm}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2.5 font-semibold hover:underline transition-all duration-200 group hover:translate-x-1"
                              style={{ color: '#2E5077' }}
                            >
                              <Route className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-sm">Voir l'itinéraire</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Badges */}
                    {(brevet.eligible_r10000 || brevet.acces_homologations) && (
                      <div className="flex flex-wrap gap-3">
                        {brevet.eligible_r10000 && (
                          <div
                            className="inline-flex items-center px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-default"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            Éligible R10000
                          </div>
                        )}
                        {brevet.acces_homologations && (
                          <div
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-default"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)'
                            }}
                          >
                            <Check className="w-4 h-4" />
                            Accès homologations
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Style pour la scrollbar personnalisée (WebKit) */}
      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
