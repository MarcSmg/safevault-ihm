import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { JOURS_MAX, dansJours, deCle, enCle } from '../envoi/durees'
import { Icone } from '../pieces/Icone'
import { Verre } from '../verre/useVerreLiquide'
import './Calendrier.css'

const SEMAINE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const PAS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const enToutesLettres = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const debutDuMois = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

// Le calendrier de la duree d acces : un mois a la fois, la semaine commence
// le lundi. On ne peut choisir ni un jour passe ni au-dela d un an : l erreur
// est empechee plutot que signalee. Au clavier, les fleches vont de jour en
// jour et de semaine en semaine, Entree choisit.
export function Calendrier({ valeur, onChoisir }: { valeur: string; onChoisir: (cle: string) => void }) {
  const aujourdhui = dansJours(0)
  const limite = dansJours(JOURS_MAX)
  const possible = (d: Date) => d >= aujourdhui && d <= limite

  // Le mois montre : d abord celui de la date choisie, puis celui ou l on va.
  const [vue, setVue] = useState(() => debutDuMois(deCle(valeur)))
  const refJours = useRef<HTMLDivElement>(null)
  // Le jour a rejoindre au clavier, une fois son mois affiche.
  const refCible = useRef<string | null>(null)

  useEffect(() => {
    if (!refCible.current) return
    refJours.current?.querySelector<HTMLButtonElement>(`[data-jour="${refCible.current}"]`)?.focus()
    refCible.current = null
  })

  const nombre = new Date(vue.getFullYear(), vue.getMonth() + 1, 0).getDate()
  const jours = Array.from({ length: nombre }, (_, i) => new Date(vue.getFullYear(), vue.getMonth(), i + 1))
  // Les cases vides avant le 1er : getDay compte a partir du dimanche.
  const vides = (vue.getDay() + 6) % 7

  // Un seul jour du mois recoit la tabulation : celui qui est choisi, sinon
  // le premier qu on peut choisir.
  const arret = jours.some((d) => enCle(d) === valeur) ? valeur : enCle(jours.find(possible) ?? jours[0])

  const changerDeMois = (sens: number) => setVue(new Date(vue.getFullYear(), vue.getMonth() + sens, 1))
  const auClavier = (e: KeyboardEvent<HTMLDivElement>) => {
    const pas = PAS[e.key]
    const depart = (e.target as HTMLElement).dataset.jour
    if (!pas || !depart) return
    e.preventDefault()
    const d = deCle(depart)
    const cible = new Date(d.getFullYear(), d.getMonth(), d.getDate() + pas)
    if (!possible(cible)) return
    refCible.current = enCle(cible)
    setVue(debutDuMois(cible))
  }

  return (
    <Verre rayon={18} lentille={false} className="calendrier" role="group" aria-label="Dernier jour d'accès">
      <div className="calendrier-tete">
        <button
          type="button"
          className="calendrier-pas"
          aria-label="Mois précédent"
          disabled={vue <= debutDuMois(aujourdhui)}
          onClick={() => changerDeMois(-1)}
        >
          <Icone nom="chevronGauche" />
        </button>
        <span className="calendrier-mois" aria-live="polite">
          {mois.format(vue)}
        </span>
        <button
          type="button"
          className="calendrier-pas"
          aria-label="Mois suivant"
          disabled={vue >= debutDuMois(limite)}
          onClick={() => changerDeMois(1)}
        >
          <Icone nom="chevronDroite" />
        </button>
      </div>
      <div className="calendrier-semaine" aria-hidden="true">
        {SEMAINE.map((lettre, i) => (
          <span key={i}>{lettre}</span>
        ))}
      </div>
      <div className="calendrier-jours" ref={refJours} onKeyDown={auClavier}>
        {Array.from({ length: vides }, (_, i) => (
          <span key={`vide-${i}`} />
        ))}
        {jours.map((d) => {
          const cle = enCle(d)
          return (
            <button
              type="button"
              key={cle}
              data-jour={cle}
              className="calendrier-jour"
              aria-label={enToutesLettres.format(d)}
              aria-pressed={cle === valeur}
              aria-current={cle === enCle(aujourdhui) ? 'date' : undefined}
              disabled={!possible(d)}
              tabIndex={cle === arret ? 0 : -1}
              onClick={() => onChoisir(cle)}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </Verre>
  )
}
