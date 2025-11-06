import { Brevet } from '../types/brevet'
import { X } from 'lucide-react'
import { useState } from 'react'
import { BrevetCommonInfo } from './BrevetCommonInfo'
import { BrevetCard } from './BrevetCard'

interface BrevetBottomSheetProps {
  brevets: Brevet[]
  onClose: () => void
}

export function BrevetBottomSheet({ brevets, onClose }: BrevetBottomSheetProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

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
    ? (brevets[0].club ?? null)
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
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl shadow-2xl
          h-[90vh] flex flex-col transition-transform duration-500 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Bouton fermer en croix - au premier plan */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-all duration-200 shadow-lg z-50"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" style={{ color: '#2E5077' }} />
        </button>

        {/* Header avec gradient bleu moderne */}
        <div
          className="flex-shrink-0 rounded-t-3xl"
          style={{
            background: 'linear-gradient(135deg, #2E5077 0%, #1e3a55 100%)',
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            boxShadow: '0 8px 16px -4px rgba(46, 80, 119, 0.3)'
          }}
        >
          <BrevetCommonInfo
            commonClub={commonClub}
            commonVilleDepart={commonVilleDepart}
            commonDepartement={commonDepartement}
            commonRegion={commonRegion}
            variant="mobile"
          />
        </div>

        {/* Contenu scrollable */}
        {brevets.length > 0 && (
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
          >
            {[...brevets].sort((a, b) => new Date(a.date_brevet).getTime() - new Date(b.date_brevet).getTime()).map((brevet) => (
              <BrevetCard
                  key={brevet.id}
                brevet={brevet}
                isExpanded={expandedIds.has(brevet.id)}
                onToggle={() => toggleExpand(brevet.id)}
                commonClub={commonClub}
                commonVilleDepart={commonVilleDepart}
                variant="mobile"
              />
            ))}
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
    </>
  )
}
