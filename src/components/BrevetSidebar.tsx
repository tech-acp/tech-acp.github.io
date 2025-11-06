import { Brevet } from '../types/brevet'
import { useState } from 'react'
import { BrevetCommonInfo } from './BrevetCommonInfo'
import { BrevetCard } from './BrevetCard'

interface BrevetSidebarProps {
  brevets: Brevet[]
  onClose: () => void
}

export function BrevetSidebar({ brevets, onClose }: BrevetSidebarProps) {
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
        <BrevetCommonInfo
          commonClub={commonClub}
          commonVilleDepart={commonVilleDepart}
          commonDepartement={commonDepartement}
          commonRegion={commonRegion}
          variant="desktop"
        />
      </div>

      {brevets.length > 0 && (
        <div className="p-6 space-y-4">
          {[...brevets].sort((a, b) => new Date(a.date_brevet).getTime() - new Date(b.date_brevet).getTime()).map((brevet) => (
            <BrevetCard
                key={brevet.id}
              brevet={brevet}
              isExpanded={expandedIds.has(brevet.id)}
              onToggle={() => toggleExpand(brevet.id)}
              commonClub={commonClub}
              commonVilleDepart={commonVilleDepart}
              variant="desktop"
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
  )
}
