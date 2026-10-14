// Le coffre : les octets des documents deposes, pour pouvoir les consulter
// depuis l historique. localStorage ne tient que le nom et le poids d un
// fichier, quelques kilooctets maximum et en texte seulement ; les vrais
// fichiers vont dans IndexedDB, prevu pour des blobs binaires, avec une
// place bien plus large.
//
// Chaque fichier est range sous la cle `${idHistorique}:${idFichier}`, pour
// rester unique d une entree a l autre meme si deux depots reutilisent un
// meme identifiant de fichier.

const BASE = 'safevault-coffre'
const MAGASIN = 'fichiers'

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(BASE, 1)
    requete.onupgradeneeded = () => {
      requete.result.createObjectStore(MAGASIN)
    }
    requete.onsuccess = () => resolve(requete.result)
    requete.onerror = () => reject(requete.error)
  })
}

export function cleCoffre(idHistorique: string, idFichier: string) {
  return `${idHistorique}:${idFichier}`
}

export async function rangerFichier(cle: string, fichier: File) {
  try {
    const db = await ouvrir()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(MAGASIN, 'readwrite')
      transaction.objectStore(MAGASIN).put(fichier, cle)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    db.close()
  } catch {
    // Le depot lui-meme a deja reussi : le coffre local est un confort de
    // consultation, pas une condition pour que deposer() fonctionne.
  }
}

export async function lireFichier(cle: string): Promise<File | undefined> {
  try {
    const db = await ouvrir()
    const fichier = await new Promise<File | undefined>((resolve, reject) => {
      const transaction = db.transaction(MAGASIN, 'readonly')
      const requete = transaction.objectStore(MAGASIN).get(cle)
      requete.onsuccess = () => resolve(requete.result)
      requete.onerror = () => reject(requete.error)
    })
    db.close()
    return fichier
  } catch {
    return undefined
  }
}

export async function supprimerFichier(cle: string) {
  try {
    const db = await ouvrir()
    db.transaction(MAGASIN, 'readwrite').objectStore(MAGASIN).delete(cle)
    db.close()
  } catch {
    // Une entree qui sort de l historique par la limite MAX n a plus besoin
    // de son fichier ; rater ce menage ne doit rien casser d autre.
  }
}
