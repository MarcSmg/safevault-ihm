import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { initiales } from '../envoi/annuaire'
import { Apercu, type FichierApercu } from '../composants/Apercu'
import { DROITS } from '../composants/ChoixDroit'
import { cleCoffre, lireFichier } from '../envoi/coffre'
import { finLe } from '../envoi/durees'
import { genreDe, poidsLisible } from '../envoi/formats'
import { lireHistorique } from '../envoi/historique'
import { Icone } from '../pieces/Icone'
import { IconeFichier } from '../pieces/IconeFichier'
import { BoutonVerre } from '../verre/BoutonVerre'
import './Historique.css'

const dateDepot = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFinFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const enListe = new Intl.ListFormat('fr', { type: 'conjunction' })

type EtatApercu = { etape: 'chargement' } | { etape: 'indisponible' } | { etape: 'pret'; fichier: FichierApercu }

// La trace de ce qui est dans le coffre : chaque document depose y entre
// tout de suite, partage ou non. Pas une etape du parcours, une page a
// part, ouverte depuis l en-tete.
export function Historique() {
  const [entrees] = useState(lireHistorique)
  const naviguer = useNavigate()
  const refTitre = useRef<HTMLHeadingElement>(null)
  // Un seul document consulte a la fois, pour ne garder qu une seule URL
  // objet vivante : `ouvert` est sa cle dans le coffre.
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [etat, setEtat] = useState<EtatApercu | null>(null)
  const urlActuelle = useRef<string | null>(null)

  useEffect(() => {
    document.title = 'Historique · SafeVault'
    refTitre.current?.focus({ preventScroll: true })
  }, [])

  // En quittant la page, l URL objet encore ouverte ne doit pas trainer.
  useEffect(
    () => () => {
      if (urlActuelle.current) URL.revokeObjectURL(urlActuelle.current)
    },
    [],
  )

  async function basculer(idEntree: string, fichier: { id: string; nom: string }) {
    const cle = cleCoffre(idEntree, fichier.id)
    if (urlActuelle.current) {
      URL.revokeObjectURL(urlActuelle.current)
      urlActuelle.current = null
    }
    if (ouvert === cle) {
      setOuvert(null)
      setEtat(null)
      return
    }
    setOuvert(cle)
    setEtat({ etape: 'chargement' })
    const brut = await lireFichier(cle)
    if (!brut) {
      setEtat({ etape: 'indisponible' })
      return
    }
    const url = URL.createObjectURL(brut)
    urlActuelle.current = url
    setEtat({ etape: 'pret', fichier: { id: fichier.id, nom: fichier.nom, url } })
  }

  return (
    <div className="historique">
      <header className="historique-tete">
        <h1 className="historique-titre" ref={refTitre} tabIndex={-1}>
          Historique des envois
        </h1>
        <p className="historique-chapo">Les documents déposés dans votre coffre, partagés ou non.</p>
      </header>

      {entrees.length === 0 ? (
        <div className="historique-vide verre-plaque">
          <Icone nom="horloge" />
          <p>
            <b>Aucun document pour le moment.</b>
            <span>Les documents que vous déposez apparaîtront ici.</span>
          </p>
          <BoutonVerre variante="plein" fleche onClick={() => naviguer('/deposer')}>
            Déposer un document
          </BoutonVerre>
        </div>
      ) : (
        <ul className="historique-liste">
          {entrees.map((e) => {
            const depose = new Date(e.dateDepot)
            const droit = e.partage ? DROITS.find((d) => d.valeur === e.droit) : undefined
            const fin = e.partage ? finLe(e.duree!, e.dateFin, new Date(e.datePartage!)) : null
            const expire = fin !== null && fin.getTime() < Date.now()
            const noms = enListe.format(e.destinataires.map((c) => c.nom))

            return (
              <li key={e.id} className="historique-carte verre-plaque">
                <div className="historique-fichiers">
                  {e.fichiers.map((f) => {
                    const cle = cleCoffre(e.id, f.id)
                    const estOuvert = ouvert === cle
                    return (
                      <div key={f.id}>
                        <button
                          type="button"
                          className="historique-fichier"
                          onClick={() => basculer(e.id, f)}
                          aria-expanded={estOuvert}
                        >
                          <IconeFichier genre={genreDe(f.nom)} />
                          <span className="historique-nom" title={f.nom}>
                            {f.nom}
                          </span>
                          <span className="historique-poids">{poidsLisible(f.poids)}</span>
                          <span className="historique-voir">
                            <Icone nom="oeil" />
                            {estOuvert ? 'Masquer' : 'Voir'}
                          </span>
                        </button>
                        {estOuvert && (
                          <div className="historique-apercu">
                            {etat?.etape === 'chargement' && (
                              <p className="historique-apercu-attente">Ouverture du document…</p>
                            )}
                            {etat?.etape === 'indisponible' && (
                              <p className="historique-apercu-indisponible">
                                Ce document n'est plus disponible pour consultation.
                              </p>
                            )}
                            {etat?.etape === 'pret' && <Apercu fichier={etat.fichier} />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="historique-ligne-statut">
                  <span className="historique-badge" data-partage={e.partage}>
                    <Icone nom={e.partage ? 'envoyer' : 'cadenas'} epaisseur={1.8} />
                    {e.partage ? 'Partagé' : 'Déposé, non partagé'}
                  </span>
                  <p className="historique-date">{dateDepot.format(depose)}</p>
                </div>

                {e.partage ? (
                  <>
                    <div className="historique-destinataires">
                      {e.destinataires.map((c) => (
                        <span key={c.email} className="jeton" aria-hidden="true">
                          {initiales(c.nom)}
                        </span>
                      ))}
                      <span className="historique-noms">{noms}</span>
                    </div>

                    <div className="historique-meta">
                      <span className="historique-droit">
                        <Icone nom={droit!.icone} />
                        {droit!.texte}
                      </span>
                      <span className="historique-statut" data-expire={expire}>
                        {fin === null
                          ? 'Accès sans limite'
                          : expire
                            ? `Accès expiré le ${dateFinFmt.format(fin)}`
                            : `Accès jusqu'au ${dateFinFmt.format(fin)}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="historique-non-partage">Ce document reste dans votre coffre, prêt à être partagé.</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
