import { useNavigate } from 'react-router'
import { useEnvoi } from '../envoi/EnvoiContexte'
import './ListeEtapes.css'

export const ETAPES = [
  { titre: 'Déposer', aide: 'Le document à protéger', chemin: '/deposer' },
  { titre: 'Partager', aide: 'Qui, quel droit, combien de temps', chemin: '/partager' },
]

// Les etapes du parcours. La coche n apparait que si l etape est vraiment
// remplie ; on ne peut aller qu ou l on a deja de quoi travailler.
export function ListeEtapes({ courante }: { courante: number }) {
  const envoi = useEnvoi()
  const naviguer = useNavigate()
  const faites = [envoi.depose, envoi.partage]
  const ouvertes = [!envoi.partage, envoi.depose && !envoi.partage]

  return (
    <nav className="etapes" aria-label="Étapes de l'envoi">
      <ol>
        {ETAPES.map((e, i) => {
          const active = i === courante
          const faite = faites[i] && !active
          return (
            <li key={e.chemin}>
              <button
                type="button"
                className={active ? 'etape verre' : 'etape'}
                data-etat={active ? 'active' : faite ? 'faite' : 'a-venir'}
                aria-current={active ? 'step' : undefined}
                disabled={!ouvertes[i] || active}
                onClick={() => naviguer(e.chemin)}
              >
                <span className="etape-numero" aria-hidden="true">
                  {faite ? '✓' : i + 1}
                </span>
                <span className="etape-textes">
                  <span className="etape-titre">
                    {e.titre}
                    {faite && <span className="visuellement-cache"> (terminée)</span>}
                  </span>
                  <span className="etape-aide">{e.aide}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
