import { useState, type KeyboardEvent } from 'react'
import { chercher, estEmail, initiales, type Collegue } from '../envoi/annuaire'
import { Icone } from '../pieces/Icone'
import { Verre } from '../verre/useVerreLiquide'
import { Alerte } from './Alerte'
import './ChampDestinataire.css'

type Props = { exclus: Collegue[]; onAjouter: (c: Collegue) => void }

// Le champ destinataire : on tape un nom ou un e-mail, l annuaire propose,
// Entree retient. Une adresse hors annuaire est acceptee telle quelle.
export function ChampDestinataire({ exclus, onAjouter }: Props) {
  const [requete, setRequete] = useState('')
  const [actif, setActif] = useState(0)
  const [introuvable, setIntrouvable] = useState<string | null>(null)

  const propositions = chercher(requete, exclus)
  const ouvert = propositions.length > 0

  function retenir(c: Collegue) {
    onAjouter(c)
    setRequete('')
    setActif(0)
    setIntrouvable(null)
  }

  function valider() {
    const saisie = requete.trim()
    if (!saisie) return
    if (ouvert) return retenir(propositions[actif])
    if (estEmail(saisie)) {
      const deja = exclus.some((c) => c.email.toLowerCase() === saisie.toLowerCase())
      if (deja) return setRequete('')
      return retenir({ nom: saisie, email: saisie })
    }
    setIntrouvable(saisie)
  }

  function clavier(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      valider()
    } else if (e.key === 'ArrowDown' && ouvert) {
      e.preventDefault()
      setActif((actif + 1) % propositions.length)
    } else if (e.key === 'ArrowUp' && ouvert) {
      e.preventDefault()
      setActif((actif - 1 + propositions.length) % propositions.length)
    } else if (e.key === 'Escape') {
      setRequete('')
    }
  }

  return (
    <>
      <div className="champ-zone">
        <Verre rayon={14} lentille={false} className="champ">
          <Icone nom="personne" />
          <input
            id="champ-destinataire"
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={ouvert}
            aria-controls="propositions"
            aria-activedescendant={ouvert ? `proposition-${actif}` : undefined}
            placeholder="Nom ou e-mail du collègue"
            value={requete}
            onChange={(e) => {
              setRequete(e.target.value)
              setActif(0)
              setIntrouvable(null)
            }}
            onKeyDown={clavier}
          />
        </Verre>
        {ouvert && (
          <ul id="propositions" role="listbox" className="propositions verre-plaque">
            {propositions.map((c, i) => (
              <li
                key={c.email}
                id={`proposition-${i}`}
                role="option"
                aria-selected={i === actif}
                onMouseEnter={() => setActif(i)}
                onMouseDown={(e) => {
                  // Garde le focus dans le champ pour enchainer un autre nom.
                  e.preventDefault()
                  retenir(c)
                }}
              >
                <span className="jeton" aria-hidden="true">
                  {initiales(c.nom)}
                </span>
                <span className="ligne">
                  <b>{c.nom}</b>
                  <small>{c.email}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {introuvable && (
        <Alerte titre={`Personne ne correspond à « ${introuvable} ».`}>
          Vérifiez l'orthographe, ou saisissez directement son adresse e-mail.
        </Alerte>
      )}
    </>
  )
}
