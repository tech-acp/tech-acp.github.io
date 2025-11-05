import { Brevet } from '../types/brevet'
import { X, Calendar, MapPin, Mountain, User, Mail, Globe, Route } from 'lucide-react'

interface BrevetSidebarProps {
  brevet: Brevet | null
  onClose: () => void
}

export function BrevetSidebar({ brevet, onClose }: BrevetSidebarProps) {
  if (!brevet) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-20 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-900">Détails du BRM</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Nom du BRM */}
        {brevet.nom_brm && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {brevet.nom_brm}
            </h3>
          </div>
        )}

        {/* Distance Badge */}
        {brevet.distance_brevet && (
          <div className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-bold rounded-full text-lg">
            {brevet.distance_brevet} km
          </div>
        )}

        {/* Date */}
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-gray-500">Date</div>
            <div className="text-gray-900">{formatDate(brevet.date_brevet)}</div>
          </div>
        </div>

        {/* Ville de départ */}
        {brevet.ville_depart && (
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-500">Ville de départ</div>
              <div className="text-gray-900">
                {brevet.ville_depart}
                {brevet.departement && ` (${brevet.departement})`}
              </div>
              {brevet.region && (
                <div className="text-sm text-gray-600">{brevet.region}</div>
              )}
            </div>
          </div>
        )}

        {/* Dénivelé */}
        {brevet.denivele && (
          <div className="flex items-start space-x-3">
            <Mountain className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-500">Dénivelé</div>
              <div className="text-gray-900">{brevet.denivele.toLocaleString()} m</div>
            </div>
          </div>
        )}

        {/* Club */}
        {brevet.club?.nom_club && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Club organisateur</h4>
            <div className="text-gray-900 mb-2">{brevet.club.nom_club}</div>
            {brevet.club.code_acp && (
              <div className="text-sm text-gray-600">Code ACP: {brevet.club.code_acp}</div>
            )}
          </div>
        )}

        {/* Organisateur */}
        {brevet.nom_organisateur && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Organisateur</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{brevet.nom_organisateur}</span>
              </div>
              {brevet.mail_organisateur && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a
                    href={`mailto:${brevet.mail_organisateur}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {brevet.mail_organisateur}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liens */}
        {(brevet.club?.page_web_club || brevet.lien_itineraire_brm) && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Liens</h4>
            <div className="space-y-2">
              {brevet.club?.page_web_club && (
                <a
                  href={brevet.club.page_web_club}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Page du club</span>
                </a>
              )}
              {brevet.lien_itineraire_brm && (
                <a
                  href={brevet.lien_itineraire_brm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                >
                  <Route className="w-4 h-4" />
                  <span className="text-sm">Voir l'itinéraire</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* R10000 Badge */}
        {brevet.eligible_r10000 && (
          <div className="pt-4 border-t">
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Éligible R10000
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

