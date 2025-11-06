import { Club } from '../types/brevet'
import { Flag, MapPin, Globe } from 'lucide-react'

interface BrevetCommonInfoProps {
  commonClub: Club | null
  commonVilleDepart: string | null
  commonDepartement: string | null
  commonRegion: string | null
  variant?: 'mobile' | 'desktop'
}

export function BrevetCommonInfo({
  commonClub,
  commonVilleDepart,
  commonDepartement,
  commonRegion,
  variant = 'desktop'
}: BrevetCommonInfoProps) {
  const isMobile = variant === 'mobile'
  const padding = isMobile ? 'pt-2 px-4 pb-6' : 'pt-6 px-6 pb-6'
  const textSize = isMobile ? 'text-sm' : ''
  const regionTextSize = isMobile ? 'text-xs' : 'text-sm'

  // Si aucune information commune n'est disponible, ne rien afficher
  if (!commonClub && !commonVilleDepart) {
    return null
  }

  return (
    <div className={`${padding} space-y-3`}>
      {/* Club organisateur */}
      {commonClub?.nom_club && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
          <div className="flex items-start gap-2.5">
            <Flag className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
                Club organisateur
              </div>
              <div className={`text-white font-semibold ${textSize}`}>
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
              <div className={`text-white font-semibold ${textSize}`}>
                {commonVilleDepart}
                {commonDepartement && <span className="text-white/80 font-normal"> ({commonDepartement})</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

