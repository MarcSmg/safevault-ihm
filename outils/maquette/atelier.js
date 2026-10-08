// god2-design : l atelier des maquettes .god2.
//
// Une maquette est un document .god2 (voir FORMAT-GOD2.md) : des ecrans en
// HTML, leurs styles, et de quoi nommer leurs calques. L atelier pose chaque
// ecran sur une toile, une fois par format (bureau, telephone). Chaque cadre
// est une page a part entiere, une iframe a sa largeur, si bien que les
// styles s y appliquent comme dans une vraie fenetre. Par-dessus, un capteur
// recoit le pointeur : il sert a se deplacer, a zoomer et a designer le
// calque sous la main. Les calques et leurs proprietes sont lus dans la page
// de chaque cadre. On lit la maquette, on ne la modifie pas.
//
// Un .god2 ouvert depuis le disque n est pas forcement le notre : son contenu
// est pose dans des iframes bridees (sandbox). Sur la toile, aucun script du
// document ne s execute ; en presentation, les scripts tournent, mais coupes
// de l atelier.
function atelierGod2(depart, hote) {
  'use strict'

  // Ce que l atelier ecoute hors de sa coque (la fenetre, le document) se
  // retire d un coup a l arret.
  var fin = new AbortController()
  var hors = { signal: fin.signal }

  function id(nom) { return document.getElementById(nom) }
  var racine = id('gd')
  var toile = id('gd-toile')
  var monde = id('gd-monde')
  var capteur = id('gd-capteur')
  var dessus = id('gd-dessus')
  var arbre = id('gd-arbre')
  var fiche = id('gd-fiche')
  var contourSurvol = id('gd-survol')
  var contourChoix = id('gd-choix')
  var mesure = id('gd-mesure')
  var zoomValeur = id('gd-zoom-valeur')
  var presentation = id('gd-presentation')
  var presentationEcran = id('gd-presentation-ecran')
  var presentationTitre = id('gd-presentation-titre')
  var voletDroit = id('gd-volet-droit')
  var large = window.matchMedia('(min-width: 900px)')

  // Sur la toile, les ecrans sont des images fixes : rien ne bouge, rien ne
  // defile, et le calcul reste leger meme avec plusieurs cadres. Les
  // animations sont coupees net, pas seulement accelerees : un element lu au
  // milieu de son entree en scene serait encore invisible.
  var FIGE =
    '*,*::before,*::after{animation:none!important;transition:none!important}' +
    '.document-vivant .ligne{stroke-dashoffset:0!important}' +
    'html,body{overflow:hidden!important}.apercu-cadre{overflow:hidden!important}'

  // En presentation, la lumiere du verre suit la main, comme dans l application.
  var LUMIERE =
    '(function(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var a=false,d=null;' +
    'function p(){a=false;var e=d;if(!e||!e.target||!e.target.closest)return;var c=e.target.closest(".verre");if(!c)return;' +
    'var b=c.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;c.style.setProperty("--lx",x+"px");c.style.setProperty("--ly",y+"px");' +
    'c.style.setProperty("--angle",Math.atan2(y-b.height/2,x-b.width/2)*180/Math.PI+90+"deg")}' +
    'addEventListener("pointermove",function(e){d=e;if(a)return;a=true;requestAnimationFrame(p)},{passive:true})})()'

  var ECART = 200

  // ---------------------------------------------------------------- le document

  var doc = null

  // Un document .god2 doit au moins dire ce qu il est et porter des ecrans.
  function valider(d) {
    if (!d || d.format !== 'god2') throw new Error('Ce fichier n\'est pas un document .god2.')
    if (!Array.isArray(d.ecrans) || !d.ecrans.length) throw new Error('Ce document .god2 ne contient aucun écran.')
    d.ecrans.forEach(function (e) {
      if (typeof e.balisage !== 'string') throw new Error('Un écran de ce document n\'a pas de contenu.')
    })
    if (!Array.isArray(d.formats) || !d.formats.length) d.formats = [{ nom: 'Bureau', largeur: 1440 }]
    d.calques = d.calques || {}
    d.calques.noms = d.calques.noms || {}
    d.calques.composants = d.calques.composants || []
    d.calques.images = d.calques.images || []
    return d
  }

  function pageDe(ecran, extra, script) {
    return (
      '<!doctype html><html lang="fr"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + echapper(ecran.nom) + '</title><style>' + (doc.styles || '') + '</style>' +
      (extra ? '<style>' + extra + '</style>' : '') +
      '</head><body>' + (doc.symboles || '') + ecran.balisage +
      (script ? '<script>' + script + '<\/script>' : '') +
      '</body></html>'
    )
  }

  // ---------------------------------------------------------------- les calques

  var DESSINS = {
    ecran: '<rect x="2.5" y="3" width="11" height="8" rx="1.25"/><path d="M6 13.5h4"/>',
    cadre: '<path d="M5.5 2.5v11M10.5 2.5v11M2.5 5.5h11M2.5 10.5h11"/>',
    texte: '<path d="M4 5V3.75h8V5M8 3.75v8.5M6.5 12.25h3"/>',
    vecteur: '<path d="M3 12.5c1.5-6 4-9 6.5-9S13 6 10 8s-5 1.5-7 4.5z"/>',
    image: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="m3 11 3-3 2.5 2 1.75-1.5L13 11"/>',
    instance: '<path d="m8 2.5 5.5 5.5L8 13.5 2.5 8z"/>',
  }
  function dessin(type) {
    return '<svg class="gd-type" viewBox="0 0 16 16" aria-hidden="true">' + DESSINS[type] + '</svg>'
  }

  var compteur = 0
  var noeudDe = new WeakMap()
  var index = {}

  function classes(el) {
    var c = el.getAttribute('class')
    return c ? c.split(/\s+/).filter(Boolean) : []
  }
  function court(texte) {
    var t = String(texte).replace(/\s+/g, ' ').trim()
    return t.length > 42 ? t.slice(0, 41) + '…' : t
  }
  function aDuTexte(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true
    return false
  }
  function parmi(liste, ensemble) {
    for (var i = 0; i < liste.length; i++) if (ensemble.indexOf(liste[i]) >= 0) return liste[i]
    return null
  }

  // Un element de la page devient un calque : son type dit s il contient
  // d autres calques ou s il s arrete la (un texte, une icone, une image).
  function lire(el, cadre, parent) {
    var boite = el.getBoundingClientRect()
    if (boite.width <= 1 && boite.height <= 1) return null
    var style = cadre.iframe.contentWindow.getComputedStyle(el)
    if (style.visibility === 'hidden' || style.opacity === '0') return null
    var balise = el.tagName.toLowerCase()
    var liste = classes(el)
    var type = 'cadre'
    var feuille = false
    var composant = parmi(liste, doc.calques.composants)

    if (balise === 'svg') { type = 'vecteur'; feuille = true }
    else if (parmi(liste, doc.calques.images)) { type = 'image'; feuille = true }
    else if (balise === 'input') { type = 'texte'; feuille = true }
    else if (aDuTexte(el) && !el.querySelector('svg')) { type = 'texte'; feuille = true }
    else if (composant) type = 'instance'

    var nom = null
    for (var i = 0; i < liste.length && !nom; i++) nom = doc.calques.noms[liste[i]] || null
    if (type === 'texte') nom = balise === 'input' ? el.getAttribute('placeholder') || 'Saisie' : el.textContent
    else if (!nom) nom = el.getAttribute('aria-label') || (type === 'vecteur' ? 'Vecteur' : 'Groupe')
    if (type === 'instance' && aDuTexte(el)) nom += ' · ' + court(el.textContent)

    var noeud = {
      id: 'c' + ++compteur, el: el, cadre: cadre, parent: parent, nom: court(nom), type: type,
      composant: type === 'instance' ? composant : null, enfants: [],
    }
    noeudDe.set(el, noeud)
    index[noeud.id] = noeud
    if (!feuille) {
      for (var e = el.firstElementChild; e; e = e.nextElementSibling) {
        var enfant = lire(e, cadre, noeud)
        if (enfant) noeud.enfants.push(enfant)
      }
    }
    return noeud
  }

  function parcourir(noeud, faire) {
    faire(noeud)
    noeud.enfants.forEach(function (e) { parcourir(e, faire) })
  }

  // ---------------------------------------------------------------- les cadres

  var cadres = []

  function creerCadres() {
    doc.formats.forEach(function (format, rangee) {
      doc.ecrans.forEach(function (ecran) {
        var iframe = document.createElement('iframe')
        iframe.className = 'gd-cadre'
        iframe.setAttribute('tabindex', '-1')
        iframe.setAttribute('aria-hidden', 'true')
        // Meme origine pour lire les calques, mais aucun script du document.
        iframe.setAttribute('sandbox', 'allow-same-origin')
        // Un ecran "fenetre" (une fenetre modale, par exemple) se montre a la
        // hauteur de la fenetre du format ; les autres, a celle de leur contenu.
        var fixe = (ecran.fenetre && format.hauteur) || 0
        iframe.style.width = format.largeur + 'px'
        iframe.style.height = (fixe || 900) + 'px'
        var etiquette = document.createElement('button')
        etiquette.type = 'button'
        etiquette.className = 'gd-etiquette'
        etiquette.textContent = ecran.nom + ' · ' + format.nom + ' ' + format.largeur
        dessus.appendChild(etiquette)
        var cadre = {
          ecran: ecran, format: format, rangee: rangee, iframe: iframe, etiquette: etiquette,
          nom: etiquette.textContent, x: 0, y: 0, largeur: format.largeur, hauteur: fixe || 900, fixe: fixe, racine: null,
        }
        etiquette.addEventListener('click', function () { if (cadre.racine) choisir(cadre.racine) })
        cadres.push(cadre)
        monde.appendChild(iframe)
        iframe.srcdoc = pageDe(ecran, FIGE)
      })
    })
  }

  // La hauteur d un cadre est celle de son contenu. Certaines mesures de la
  // page dependent de la hauteur de la fenetre : on ajuste en quelques passes.
  function ajusterHauteur(cadre) {
    if (cadre.fixe) return
    var page = cadre.iframe.contentDocument
    for (var passe = 0; passe < 4; passe++) {
      var h = Math.ceil(page.documentElement.scrollHeight)
      var contenu = Math.ceil(page.body.getBoundingClientRect().height)
      var cible = Math.max(Math.min(h, contenu || h), 200)
      if (Math.abs(cible - cadre.hauteur) < 1) break
      cadre.hauteur = cible
      cadre.iframe.style.height = cible + 'px'
    }
  }

  function disposer() {
    var y = 0
    doc.formats.forEach(function (format, rangee) {
      var x = 0
      var haut = 0
      cadres.filter(function (c) { return c.rangee === rangee }).forEach(function (c) {
        c.x = x
        c.y = y
        c.iframe.style.left = x + 'px'
        c.iframe.style.top = y + 'px'
        x += c.largeur + ECART
        haut = Math.max(haut, c.hauteur)
      })
      y += haut + ECART + 60
    })
  }

  function preparer() {
    var attendus = cadres.map(function (cadre) {
      return new Promise(function (pret) {
        cadre.iframe.addEventListener('load', function () {
          var page = cadre.iframe.contentDocument
          var apres = page.fonts && page.fonts.ready ? page.fonts.ready : Promise.resolve()
          apres.then(function () {
            ajusterHauteur(cadre)
            pret()
          })
        }, { once: true })
      })
    })
    return Promise.all(attendus).then(function () {
      disposer()
      cadres.forEach(function (cadre) {
        var page = cadre.iframe.contentDocument
        var noeud = lire(page.body.firstElementChild && page.body.querySelector(':scope > :not(svg[width="0"])') || page.body, cadre, null)
        noeud.type = 'ecran'
        noeud.nom = cadre.nom
        cadre.racine = noeud
      })
    })
  }

  // Ouvre un document : tout ce qui tenait au precedent est remis a zero.
  function ouvrir(nouveau) {
    doc = valider(nouveau)
    cadres.forEach(function (c) { c.iframe.remove(); c.etiquette.remove() })
    cadres = []
    index = {}
    ouverts = {}
    survol = null
    choix = null
    filtre = ''
    id('gd-recherche').value = ''
    contourSurvol.hidden = true
    contourChoix.hidden = true
    id('gd-attente').hidden = false
    document.title = doc.nom + ' · god2-design'
    id('gd-nom-fichier').textContent = doc.nom + '.god2'
    id('gd-equipe').innerHTML = (doc.auteurs || []).map(function (a) {
      return '<span class="gd-pastille" title="' + echapper(a) + '">' + echapper(String(a).charAt(0).toUpperCase()) + '</span>'
    }).join('')
    creerCadres()
    // Les cadres prennent leur place tout de suite : on les voit arriver un a
    // un, avant que leurs hauteurs et leurs calques soient lus.
    disposer()
    toutVoir()
    return preparer().then(function () {
      id('gd-attente').hidden = true
      ouverts[cadres[0].racine.id] = true
      dessinerArbre()
      dessinerComposants()
      dessinerStyles()
      dessinerFiche()
      toutVoir()
    })
  }

  // ---------------------------------------------------------------- la vue

  var vue = { x: 0, y: 0, z: 1 }
  var rafraichir = false

  function borner(z) { return Math.min(4, Math.max(0.04, z)) }

  function appliquer() {
    if (rafraichir) return
    rafraichir = true
    requestAnimationFrame(function () {
      rafraichir = false
      monde.style.transform = 'translate(' + vue.x + 'px,' + vue.y + 'px) scale(' + vue.z + ')'
      zoomValeur.textContent = Math.round(vue.z * 100) + ' %'
      cadres.forEach(function (c) {
        c.etiquette.style.left = vue.x + c.x * vue.z + 'px'
        c.etiquette.style.top = vue.y + c.y * vue.z - 4 + 'px'
        c.etiquette.style.maxWidth = Math.max(40, c.largeur * vue.z) + 'px'
      })
      poserContour(contourSurvol, survol === choix ? null : survol)
      poserContour(contourChoix, choix)
    })
  }

  // La part de la toile que rien ne recouvre : sur grand ecran, les outils
  // flottent a gauche et les proprietes a droite.
  function champLibre() {
    var boite = toile.getBoundingClientRect()
    var gauche = large.matches ? 56 : 0
    var droite = large.matches ? voletDroit.getBoundingClientRect().width + 12 : 0
    return { gauche: gauche, largeur: Math.max(120, boite.width - gauche - droite), hauteur: boite.height }
  }

  function zoomer(z, cx, cy) {
    if (cx === undefined) {
      var champ = champLibre()
      cx = champ.gauche + champ.largeur / 2
      cy = champ.hauteur / 2
    }
    z = borner(z)
    vue.x = cx - ((cx - vue.x) / vue.z) * z
    vue.y = cy - ((cy - vue.y) / vue.z) * z
    vue.z = z
    appliquer()
  }

  function cadrer(x, y, largeur, hauteur, marge) {
    var champ = champLibre()
    var z = borner(Math.min((champ.largeur - marge * 2) / largeur, (champ.hauteur - marge * 2 - 30) / hauteur))
    vue.z = z
    vue.x = champ.gauche + (champ.largeur - largeur * z) / 2 - x * z
    vue.y = (champ.hauteur - hauteur * z) / 2 - y * z + 10
    appliquer()
  }

  function toutVoir() {
    var droite = 0
    var bas = 0
    cadres.forEach(function (c) {
      droite = Math.max(droite, c.x + c.largeur)
      bas = Math.max(bas, c.y + c.hauteur)
    })
    if (droite) cadrer(0, 0, droite, bas, 40)
  }

  // La boite d un calque dans la page de son cadre. Un ecran prend celle du
  // cadre : sa page peut depasser (un ecran "fenetre" s arrete a la fenetre).
  function boiteDe(noeud) {
    if (noeud.type === 'ecran') return { left: 0, top: 0, width: noeud.cadre.largeur, height: noeud.cadre.hauteur }
    return noeud.el.getBoundingClientRect()
  }

  // La boite d un calque, dans le repere du monde.
  function boiteMonde(noeud) {
    var b = boiteDe(noeud)
    return { x: noeud.cadre.x + b.left, y: noeud.cadre.y + b.top, largeur: b.width, hauteur: b.height }
  }

  function voirChoix() {
    if (!choix) return toutVoir()
    var b = boiteMonde(choix)
    cadrer(b.x, b.y, Math.max(b.largeur, 40), Math.max(b.hauteur, 40), 90)
  }

  // ---------------------------------------------------------------- survol et choix

  var survol = null
  var choix = null
  var ouverts = {}

  function poserContour(contour, noeud) {
    if (!noeud) { contour.hidden = true; return }
    var b = boiteMonde(noeud)
    contour.hidden = false
    contour.style.transform = 'translate(' + (vue.x + b.x * vue.z) + 'px,' + (vue.y + b.y * vue.z) + 'px)'
    contour.style.width = b.largeur * vue.z + 'px'
    contour.style.height = b.hauteur * vue.z + 'px'
    if (contour === contourChoix) mesure.textContent = arrondi(b.largeur) + ' × ' + arrondi(b.hauteur)
  }

  function marquer(noeud, oui) {
    var rang = id('rang-' + noeud.id)
    if (rang) rang.dataset.survol = String(oui)
  }

  function survoler(noeud) {
    if (noeud === survol) return
    if (survol) marquer(survol, false)
    survol = noeud
    if (survol) marquer(survol, true)
    poserContour(contourSurvol, survol === choix ? null : survol)
  }

  function choisir(noeud) {
    choix = noeud || null
    if (choix) for (var p = choix.parent; p; p = p.parent) ouverts[p.id] = true
    cadres.forEach(function (c) { c.etiquette.dataset.choisie = String(Boolean(choix) && choix === c.racine) })
    dessinerArbre()
    dessinerFiche()
    poserContour(contourChoix, choix)
    poserContour(contourSurvol, survol === choix ? null : survol)
    id('gd-export-quoi').textContent = choix
      ? 'L\'export porte sur « ' + choix.nom + ' ».'
      : 'Rien de choisi : l\'export porte sur tous les cadres.'
    if (choix) {
      var rang = id('rang-' + choix.id)
      if (rang) rang.scrollIntoView({ block: 'nearest' })
    }
  }

  // Le calque sous un point de la fenetre.
  function calqueSous(clientX, clientY) {
    var boite = toile.getBoundingClientRect()
    var mx = (clientX - boite.left - vue.x) / vue.z
    var my = (clientY - boite.top - vue.y) / vue.z
    for (var i = cadres.length - 1; i >= 0; i--) {
      var c = cadres[i]
      if (!c.racine || mx < c.x || my < c.y || mx > c.x + c.largeur || my > c.y + c.hauteur) continue
      var el = c.iframe.contentDocument.elementFromPoint(mx - c.x, my - c.y)
      while (el && !noeudDe.has(el)) el = el.parentElement
      return el ? noeudDe.get(el) : c.racine
    }
    return null
  }

  // ---------------------------------------------------------------- le volet gauche

  var filtre = ''

  function rangDe(noeud, niveau, plie, ouvert) {
    return (
      '<div class="gd-rang" role="treeitem" id="rang-' + noeud.id + '" data-id="' + noeud.id + '" data-type="' + noeud.type + '"' +
      ' aria-level="' + (niveau + 1) + '" aria-selected="' + (noeud === choix) + '"' +
      (plie ? ' aria-expanded="' + ouvert + '"' : '') + ' style="--niveau:' + niveau + '">' +
      '<span class="gd-rang-pli"' + (plie ? ' data-pli="' + noeud.id + '"' : '') + '>' +
      (plie ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m4.5 2.5 3.5 3.5-3.5 3.5"/></svg>' : '') + '</span>' +
      dessin(noeud.type) + '<span class="gd-rang-nom">' + echapper(noeud.nom) + '</span></div>'
    )
  }

  function dessinerArbre() {
    var html = []
    if (filtre) {
      // En recherche, l arbre s aplatit : les calques dont le nom contient le texte.
      var cherche = sansAccent(filtre)
      cadres.forEach(function (c) {
        if (c.racine) parcourir(c.racine, function (n) {
          if (html.length < 200 && sansAccent(n.nom).indexOf(cherche) >= 0) html.push(rangDe(n, 0, false, false))
        })
      })
      if (!html.length) html.push('<p class="gd-vide">Aucun calque ne porte ce nom.</p>')
    } else {
      var rang = function (noeud, niveau) {
        var plie = noeud.enfants.length > 0
        var ouvert = Boolean(ouverts[noeud.id])
        html.push(rangDe(noeud, niveau, plie, ouvert))
        if (plie && ouvert) noeud.enfants.forEach(function (e) { rang(e, niveau + 1) })
      }
      cadres.forEach(function (c) { if (c.racine) rang(c.racine, 0) })
    }
    arbre.innerHTML = html.join('')
  }

  function sansAccent(t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() }

  arbre.addEventListener('click', function (e) {
    var pli = e.target.closest('[data-pli]')
    if (pli) {
      ouverts[pli.dataset.pli] = !ouverts[pli.dataset.pli]
      dessinerArbre()
      return
    }
    var rang = e.target.closest('.gd-rang')
    if (rang) choisir(index[rang.dataset.id])
  })
  arbre.addEventListener('dblclick', function (e) {
    var rang = e.target.closest('.gd-rang')
    if (rang) { choisir(index[rang.dataset.id]); voirChoix() }
  })
  arbre.addEventListener('pointerover', function (e) {
    var rang = e.target.closest('.gd-rang')
    survoler(rang ? index[rang.dataset.id] : null)
  })
  arbre.addEventListener('pointerleave', function () { survoler(null) })
  id('gd-recherche').addEventListener('input', function (e) {
    filtre = e.target.value.trim()
    dessinerArbre()
  })

  // Les composants : les pieces reprises d un ecran a l autre, et combien de fois.
  var instances = {}
  function dessinerComposants() {
    instances = {}
    cadres.forEach(function (c) {
      parcourir(c.racine, function (n) {
        if (n.composant) (instances[n.composant] = instances[n.composant] || []).push(n)
      })
    })
    var cles = Object.keys(instances)
    id('gd-composants').innerHTML = cles.length
      ? '<ul class="gd-composants">' + cles.map(function (cle) {
          return '<li><button type="button" class="gd-composant" data-composant="' + echapper(cle) + '">' + dessin('instance') +
            '<span class="gd-composant-nom">' + echapper(doc.calques.noms[cle] || cle) + '</span>' +
            '<span class="gd-composant-compte">' + instances[cle].length + '</span></button></li>'
        }).join('') + '</ul><p class="gd-vide">Un clic montre une occurrence sur la toile, un autre clic la suivante.</p>'
      : '<p class="gd-vide">Ce document ne déclare aucun composant.</p>'
  }
  id('gd-composants').addEventListener('click', function (e) {
    var bouton = e.target.closest('[data-composant]')
    if (!bouton) return
    var liste = instances[bouton.dataset.composant]
    var suivant = liste[(liste.indexOf(choix) + 1) % liste.length]
    choisir(suivant)
    voirChoix()
  })

  // Les styles : les couleurs et les textes que la maquette declare.
  var GRAISSES = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' }
  function dessinerStyles() {
    var premier = cadres[0]
    var page = premier.iframe.contentDocument
    var fenetre = premier.iframe.contentWindow
    var couleurs = ''
    ;(doc.jetons || []).forEach(function (j) {
      // Une sonde neuve par couleur : une valeur lue en cours de transition serait fausse.
      var sonde = page.createElement('span')
      sonde.style.cssText = 'transition:none!important;color:var(' + j[0] + ')'
      page.body.appendChild(sonde)
      var c = couleur(fenetre.getComputedStyle(sonde).color)
      sonde.remove()
      if (c) couleurs += ligneCouleur(j[1], c)
    })
    var textes = ''
    ;(doc.stylesTexte || []).forEach(function (t) {
      // Dans le premier cadre qui le montre : tous les ecrans n ont pas tout.
      var el = null
      for (var i = 0; i < cadres.length && !el; i++) el = cadres[i].iframe.contentDocument.querySelector(t[0])
      if (!el) return
      var s = el.ownerDocument.defaultView.getComputedStyle(el)
      textes += caseDe(t[1], (GRAISSES[s.fontWeight] || s.fontWeight) + ' · ' + arrondi(parseFloat(s.fontSize)), true)
    })
    id('gd-styles').innerHTML =
      (couleurs ? bloc('Couleurs', '<ul class="gd-couleurs">' + couleurs + '</ul>') : '') +
      (textes ? bloc('Textes', '<dl class="gd-grille">' + textes + '</dl>') : '') +
      (couleurs || textes ? '' : '<p class="gd-vide">Ce document ne déclare aucun style.</p>')
  }

  function montrerSection(nom) {
    racine.dataset.section = nom
    document.querySelectorAll('[data-section]').forEach(function (b) {
      if (b === racine) return
      b.setAttribute(b.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-pressed', String(b.dataset.section === nom))
    })
    document.querySelectorAll('.gd-pan').forEach(function (p) { p.hidden = p.dataset.pan !== nom })
  }

  // ---------------------------------------------------------------- la fiche

  function arrondi(v) { return Math.round(v * 100) / 100 }
  function echapper(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] })
  }

  // Une couleur calculee par le navigateur, en hexadecimal et en opacite.
  function couleur(valeur) {
    var m = /rgba?\(([^)]+)\)/.exec(valeur)
    var r, v, b, a = 1
    if (m) {
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat)
      r = p[0]; v = p[1]; b = p[2]
      if (p.length > 3) a = p[3]
    } else {
      m = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(valeur)
      if (!m) return null
      r = m[1] * 255; v = m[2] * 255; b = m[3] * 255
      if (m[4] !== undefined) a = parseFloat(m[4])
    }
    if (!(a > 0)) return null
    function hex(n) { return ('0' + Math.round(n).toString(16)).slice(-2) }
    return { hex: ('#' + hex(r) + hex(v) + hex(b)).toUpperCase(), alpha: a, opacite: Math.round(a * 100), css: valeur }
  }

  function caseDe(nom, valeur, grande) {
    return '<div class="gd-case"' + (grande ? ' data-large="true"' : '') + '><dt>' + echapper(nom) + '</dt><dd title="' + echapper(valeur) + '">' + echapper(valeur) + '</dd></div>'
  }
  function bloc(titre, contenu) {
    return '<section class="gd-bloc"><h3 class="gd-bloc-titre">' + titre + '</h3>' + contenu + '</section>'
  }
  function ligneCouleur(nom, c) {
    return '<li class="gd-couleur"><span class="gd-pave" style="background:' + echapper(c.css) + '"></span>' +
      '<span class="gd-couleur-nom">' + echapper(nom) + '</span><span class="gd-couleur-valeur">' + c.hex + (c.opacite < 100 ? ' · ' + c.opacite + ' %' : '') + '</span></li>'
  }

  var TYPES = { ecran: 'Écran', cadre: 'Cadre', texte: 'Texte', vecteur: 'Vecteur', image: 'Image', instance: 'Composant' }

  function ficheCalque(noeud) {
    var el = noeud.el
    var fenetre = noeud.cadre.iframe.contentWindow
    var s = fenetre.getComputedStyle(el)
    var b = boiteDe(noeud)
    var html = '<div class="gd-fiche-tete">' + dessin(noeud.type) + '<span class="gd-fiche-nom">' + echapper(noeud.nom) + '</span></div>' +
      '<p class="gd-fiche-ou">' + TYPES[noeud.type] + (noeud.type === 'ecran' ? '' : ' · ' + echapper(noeud.cadre.nom)) + '</p>'

    html += bloc('Position', '<dl class="gd-grille">' + caseDe('X', arrondi(b.left)) + caseDe('Y', arrondi(b.top)) + '</dl>')

    var mise = caseDe('L', arrondi(b.width)) + caseDe('H', arrondi(b.height))
    var rayon = rayonDe(s, b)
    if (rayon > 0) mise += caseDe('Rayon', arrondi(rayon))
    if (s.opacity !== '1') mise += caseDe('Opacité', Math.round(s.opacity * 100) + ' %')
    html += bloc('Dimensions', '<dl class="gd-grille">' + mise + '</dl>')

    if (noeud.type === 'ecran') {
      var fond = couleur(fenetre.getComputedStyle(el.ownerDocument.body).backgroundColor)
      if (fond) html += bloc('Remplissage', '<ul class="gd-couleurs">' + ligneCouleur('Fond', fond) + '</ul>')
      html += bloc('Appareil', '<dl class="gd-grille">' + caseDe('Format', noeud.cadre.format.nom + ' ' + noeud.cadre.format.largeur, true) +
        (noeud.cadre.ecran.adresse ? caseDe('Adresse', noeud.cadre.ecran.adresse, true) : '') + '</dl>')
      return html
    }

    var remplissages = ''
    var uni = couleur(s.backgroundColor)
    if (uni) remplissages += ligneCouleur('Uni', uni)
    if (s.backgroundImage && s.backgroundImage !== 'none') {
      var genre = s.backgroundImage.indexOf('gradient') >= 0 ? 'Dégradé' : 'Image'
      remplissages += '<li class="gd-couleur"><span class="gd-pave" style="background:' + echapper(s.backgroundImage) + ' center / cover"></span><span class="gd-couleur-nom">' + genre + '</span></li>'
    }
    if (noeud.type === 'vecteur') {
      var trait = couleur(s.color)
      if (trait && el.getAttribute('stroke')) remplissages += ligneCouleur('Trait ' + (el.getAttribute('stroke-width') || ''), trait)
    }
    if (remplissages) html += bloc('Remplissage', '<ul class="gd-couleurs">' + remplissages + '</ul>')

    var contours = ''
    var bord = parseFloat(s.borderTopWidth)
    if (bord > 0 && s.borderTopStyle !== 'none') {
      var cb = couleur(s.borderTopColor)
      if (cb) contours += ligneCouleur('Bordure ' + arrondi(bord), cb)
    }
    var filet = parseFloat(s.outlineWidth)
    if (filet > 0 && s.outlineStyle !== 'none') {
      var co = couleur(s.outlineColor)
      if (co) contours += ligneCouleur((s.outlineStyle === 'dashed' ? 'Pointillé ' : 'Filet ') + arrondi(filet), co)
    }
    if (contours) html += bloc('Contour', '<ul class="gd-couleurs">' + contours + '</ul>')

    if (noeud.type === 'texte' || aDuTexte(el)) {
      var taille = parseFloat(s.fontSize)
      var interligne = s.lineHeight === 'normal' ? 'Auto' : arrondi(parseFloat(s.lineHeight))
      var espace = s.letterSpacing === 'normal' ? '0 %' : arrondi((parseFloat(s.letterSpacing) / taille) * 100) + ' %'
      var police = s.fontFamily.split(',')[0].replace(/["']/g, '')
      var texte = '<dl class="gd-grille">' +
        caseDe('Police', police === 'WuraMi' ? 'Wura mi by GemmaS' : police, true) +
        caseDe('Graisse', GRAISSES[s.fontWeight] || s.fontWeight) + caseDe('Corps', arrondi(taille)) +
        caseDe('Interligne', interligne) + caseDe('Approche', espace) + '</dl>'
      var encre = couleur(s.color)
      if (encre) texte += '<ul class="gd-couleurs" style="margin-top:.4rem">' + ligneCouleur('Couleur', encre) + '</ul>'
      html += bloc('Texte', texte)
    }

    var effets = ''
    if (s.boxShadow && s.boxShadow !== 'none') {
      var ombres = s.boxShadow.split(/,(?![^(]*\))/)
      var internes = ombres.filter(function (o) { return o.indexOf('inset') >= 0 }).length
      if (ombres.length - internes) effets += caseDe('Ombre portée', '× ' + (ombres.length - internes), true)
      if (internes) effets += caseDe('Ombre interne', '× ' + internes, true)
    }
    if (s.filter && s.filter !== 'none') effets += caseDe('Filtre', s.filter.indexOf('drop-shadow') >= 0 ? 'Ombre portée' : s.filter, true)
    var flou = s.backdropFilter || s.webkitBackdropFilter
    if (flou && flou !== 'none') effets += caseDe('Arrière-plan', 'Flou', true)
    if (effets) html += bloc('Effets', '<dl class="gd-grille">' + effets + '</dl>')

    return html
  }

  function fichePage() {
    var fond = couleur(getComputedStyle(toile).backgroundColor)
    return '<div class="gd-fiche-tete"><span class="gd-fiche-nom">' + echapper(doc.nom) + '</span></div>' +
      '<p class="gd-fiche-ou">Page · ' + cadres.length + ' cadres · ' + doc.ecrans.length + ' écrans</p>' +
      (fond ? bloc('Toile', '<ul class="gd-couleurs">' + ligneCouleur('Fond', fond) + '</ul>') : '') +
      bloc('Lecture', '<p class="gd-note">Cliquez un élément sur la toile ou dans les calques pour lire ses mesures, ses couleurs et sa typographie. Les couleurs et les textes de la maquette sont dans Styles.</p>')
  }

  function dessinerFiche() {
    fiche.innerHTML = choix ? ficheCalque(choix) : fichePage()
  }

  function rayonDe(s, b) {
    var brut = s.borderTopLeftRadius
    var r = parseFloat(brut) || 0
    if (brut.indexOf('%') > 0) r = (r / 100) * Math.min(b.width, b.height)
    return Math.min(r, b.width / 2, b.height / 2)
  }

  // ---------------------------------------------------------------- l export en SVG
  //
  // Un cadre, ou un calque, devient un dessin vectoriel que les editeurs de
  // design savent ouvrir : un groupe par calque (son nom en identifiant), un
  // rectangle pour chaque fond ou bordure, les textes ligne par ligne, les
  // icones telles quelles. Ce qui ne se traduit pas proprement (ombres,
  // reflets du verre) est laisse de cote.

  var POLICE_EXPORT = 'Outfit, \'Wura mi by GemmaS\', sans-serif'

  function nombre(v) { return String(Math.round(v * 100) / 100) }
  function xml(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] })
  }
  // Chaque forme exportee ne porte qu une peinture (un fond, ou un trait) : sa
  // transparence s ecrit en "opacity", que tous les editeurs lisent, plutot
  // qu en fill-opacity ou stroke-opacity, que certains ignorent a l import.
  function peinture(attribut, c) {
    return ' ' + attribut + '="' + c.hex + '"' + (c.alpha < 1 ? ' opacity="' + nombre(c.alpha) + '"' : '')
  }

  // Les arguments d une fonction CSS, coupes aux virgules de premier niveau.
  function arguments_(texte) {
    var morceaux = []
    var niveau = 0
    var debut = 0
    for (var i = 0; i < texte.length; i++) {
      var c = texte.charAt(i)
      if (c === '(') niveau++
      else if (c === ')') niveau--
      else if (c === ',' && !niveau) { morceaux.push(texte.slice(debut, i).trim()); debut = i + 1 }
    }
    morceaux.push(texte.slice(debut).trim())
    return morceaux
  }

  // Le premier degrade lineaire d un fond, traduit en <linearGradient>.
  function degrade(fond, b, identifiant) {
    var depart = fond.indexOf('linear-gradient(')
    if (depart < 0) return null
    var niveau = 0
    var fin = -1
    for (var i = depart + 15; i < fond.length; i++) {
      if (fond.charAt(i) === '(') niveau++
      else if (fond.charAt(i) === ')' && --niveau === 0) { fin = i; break }
    }
    if (fin < 0) return null
    var morceaux = arguments_(fond.slice(depart + 16, fin))
    var angle = 180
    var cotes = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }
    if (/deg$/.test(morceaux[0])) angle = parseFloat(morceaux.shift())
    else if (cotes[morceaux[0]] !== undefined) angle = cotes[morceaux.shift()]
    else if (/^to /.test(morceaux[0])) { morceaux.shift(); angle = 135 }
    var arrets = morceaux.map(function (m) {
      var position = /([\d.]+)%\s*$/.exec(m)
      return { couleur: couleur(m) || { hex: '#FFFFFF', alpha: 0 }, position: position ? parseFloat(position[1]) : null }
    })
    if (arrets.length < 2) return null
    if (arrets[0].position === null) arrets[0].position = 0
    if (arrets[arrets.length - 1].position === null) arrets[arrets.length - 1].position = 100
    // Les arrets sans position se repartissent entre leurs voisins.
    for (var k = 1; k < arrets.length - 1; k++) {
      if (arrets[k].position !== null) continue
      var suivant = k
      while (arrets[suivant].position === null) suivant++
      var pas = (arrets[suivant].position - arrets[k - 1].position) / (suivant - k + 1)
      for (var j = k; j < suivant; j++) arrets[j].position = arrets[k - 1].position + pas * (j - k + 1)
    }
    var radians = (angle * Math.PI) / 180
    var dx = Math.sin(radians)
    var dy = -Math.cos(radians)
    var longueur = Math.abs(b.width * dx) + Math.abs(b.height * dy)
    var cx = b.left + b.width / 2
    var cy = b.top + b.height / 2
    return '<linearGradient id="' + identifiant + '" gradientUnits="userSpaceOnUse"' +
      ' x1="' + nombre(cx - (dx * longueur) / 2) + '" y1="' + nombre(cy - (dy * longueur) / 2) + '"' +
      ' x2="' + nombre(cx + (dx * longueur) / 2) + '" y2="' + nombre(cy + (dy * longueur) / 2) + '">' +
      arrets.map(function (a) {
        return '<stop offset="' + nombre(a.position) + '%" stop-color="' + a.couleur.hex + '"' + (a.couleur.alpha < 1 ? ' stop-opacity="' + nombre(a.couleur.alpha) + '"' : '') + '/>'
      }).join('') + '</linearGradient>'
  }

  function exporteur() {
    var definitions = []
    var noms = {}
    var suite = 0

    function identifiant(nom) {
      var base = String(nom).replace(/\s+/g, '_').replace(/[^\wÀ-ɏ.·-]/g, '') || 'calque'
      if (/^[\d.-]/.test(base)) base = '_' + base
      noms[base] = (noms[base] || 0) + 1
      return noms[base] > 1 ? base + '_' + noms[base] : base
    }

    function boite(el, s, b) {
      var sortie = ''
      var rayon = rayonDe(s, b)
      var forme = function (retrait, extra) {
        return '<rect x="' + nombre(b.left + retrait) + '" y="' + nombre(b.top + retrait) + '" width="' + nombre(Math.max(0, b.width - retrait * 2)) +
          '" height="' + nombre(Math.max(0, b.height - retrait * 2)) + '"' + (rayon > 0 ? ' rx="' + nombre(Math.max(0, rayon - retrait)) + '"' : '') + extra + '/>'
      }
      var uni = couleur(s.backgroundColor)
      if (uni) sortie += forme(0, peinture('fill', uni))
      var image = s.backgroundImage
      if (image && image !== 'none') {
        var photo = /url\("?(data:image\/[^")]+)"?\)/.exec(image)
        if (photo) {
          sortie += '<image x="' + nombre(b.left) + '" y="' + nombre(b.top) + '" width="' + nombre(b.width) + '" height="' + nombre(b.height) +
            '" preserveAspectRatio="xMidYMid meet" href="' + photo[1] + '"/>'
        } else {
          var cle = 'degrade' + ++suite
          var definition = degrade(image, b, cle)
          if (definition) {
            definitions.push(definition)
            sortie += forme(0, ' fill="url(#' + cle + ')"')
          }
        }
      }
      var bord = parseFloat(s.borderTopWidth)
      var teinte = bord > 0 && s.borderTopStyle !== 'none' ? couleur(s.borderTopColor) : null
      if (teinte) sortie += forme(bord / 2, ' fill="none"' + peinture('stroke', teinte) + ' stroke-width="' + nombre(bord) + '"')
      var filet = parseFloat(s.outlineWidth)
      var encre = filet > 0 && s.outlineStyle !== 'none' ? couleur(s.outlineColor) : null
      if (encre) {
        var recul = -(parseFloat(s.outlineOffset) || 0) + filet / 2
        sortie += forme(recul, ' fill="none"' + peinture('stroke', encre) + ' stroke-width="' + nombre(filet) + '"' +
          (s.outlineStyle === 'dashed' ? ' stroke-dasharray="' + nombre(filet * 3) + ' ' + nombre(filet * 2) + '"' : ''))
      }
      // Une ombre ne se traduit pas : un filet tres leger garde le bord du calque visible.
      if (!teinte && !encre && s.boxShadow && s.boxShadow !== 'none') {
        sortie += forme(0.25, ' fill="none" stroke="#1B2340" opacity="0.12" stroke-width="0.5"')
      }
      return sortie
    }

    // La hauteur de l oeil au-dessus de la ligne de base, pour poser un texte.
    function metriques(fenetre, s) {
      var toileMesure = fenetre.document.createElement('canvas').getContext('2d')
      toileMesure.font = s.fontStyle + ' ' + s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily
      var m = toileMesure.measureText('Hg')
      var monte = m.fontBoundingBoxAscent || parseFloat(s.fontSize) * 0.9
      var descend = m.fontBoundingBoxDescent || parseFloat(s.fontSize) * 0.25
      return { monte: monte, descend: descend }
    }

    function attributsTexte(s) {
      var c = couleur(s.color) || { hex: '#000000', alpha: 1 }
      var approche = parseFloat(s.letterSpacing)
      return ' font-family="' + POLICE_EXPORT + '" font-size="' + nombre(parseFloat(s.fontSize)) + '" font-weight="' + s.fontWeight + '"' +
        (approche ? ' letter-spacing="' + nombre(approche) + '"' : '') + peinture('fill', c)
    }

    // Les textes d un element, ligne par ligne. Pour un calque de texte, tous
    // ses fragments (un mot en gras garde sa graisse) ; pour un cadre, seulement
    // le texte pose directement dedans, ses enfants etant des calques a part.
    function textes(el, fenetre, profond) {
      var page = el.ownerDocument
      var sortie = ''
      var fragments = []
      if (profond) {
        var marcheur = page.createTreeWalker(el, 4)
        while (marcheur.nextNode()) fragments.push(marcheur.currentNode)
      } else {
        for (var f = el.firstChild; f; f = f.nextSibling) if (f.nodeType === 3) fragments.push(f)
      }
      fragments.forEach(function (n) {
        if (!n.nodeValue.trim()) return
        var s = fenetre.getComputedStyle(n.parentElement)
        if (s.visibility === 'hidden' || s.opacity === '0') return
        // Un texte reserve aux lecteurs d ecran tient dans un point : il ne se dessine pas.
        var place = n.parentElement.getBoundingClientRect()
        if (place.width <= 1 && place.height <= 1) return
        var m = metriques(fenetre, s)
        var plage = page.createRange()
        var lignes = []
        var ligne = null
        for (var i = 0; i < n.nodeValue.length; i++) {
          plage.setStart(n, i)
          plage.setEnd(n, i + 1)
          var r = plage.getClientRects()[0]
          if (!r || !r.width) continue
          if (!ligne || Math.abs(r.top - ligne.haut) > r.height * 0.5) {
            ligne = { haut: r.top, gauche: r.left, hauteur: r.height, texte: '' }
            lignes.push(ligne)
          }
          ligne.texte += n.nodeValue.charAt(i)
        }
        lignes.forEach(function (l) {
          var texte = l.texte.replace(/\s+$/, '')
          if (!texte) return
          var base = l.haut + (l.hauteur * m.monte) / (m.monte + m.descend)
          sortie += '<text x="' + nombre(l.gauche) + '" y="' + nombre(base) + '"' + attributsTexte(s) + ' xml:space="preserve">' + xml(texte) + '</text>'
        })
      })
      return sortie
    }

    function saisie(el, s, b, fenetre) {
      var texte = el.value || el.getAttribute('placeholder') || ''
      if (!texte) return ''
      var m = metriques(fenetre, s)
      var encre = el.value ? s : fenetre.getComputedStyle(el, '::placeholder')
      var c = couleur(encre.color) || { hex: '#64748B', alpha: 1 }
      return '<text x="' + nombre(b.left + parseFloat(s.paddingLeft)) + '" y="' + nombre(b.top + (b.height + m.monte - m.descend) / 2) + '"' +
        ' font-family="' + POLICE_EXPORT + '" font-size="' + nombre(parseFloat(s.fontSize)) + '" font-weight="' + s.fontWeight + '"' + peinture('fill', c) + '>' + xml(texte) + '</text>'
    }

    // Une icone ou un dessin : on en fait une copie dont chaque trait porte
    // ses couleurs en clair, puisque les styles de la page ne suivront pas.
    var FORMES = 'path, rect, circle, ellipse, line, polyline, polygon, text'
    function habiller(originaux, copies, fenetre) {
      for (var i = 0; i < originaux.length; i++) {
        var o = originaux[i]
        var c = copies[i]
        c.removeAttribute('class')
        if (!o.matches(FORMES)) continue
        var s = fenetre.getComputedStyle(o)
        if (s.fill.indexOf('url(') !== 0) {
          var plein = s.fill === 'none' ? null : couleur(s.fill)
          c.setAttribute('fill', plein ? plein.hex : 'none')
          if (plein && plein.alpha < 1) c.setAttribute('fill-opacity', nombre(plein.alpha))
        }
        var trait = s.stroke === 'none' ? null : couleur(s.stroke)
        if (trait) {
          c.setAttribute('stroke', trait.hex)
          if (trait.alpha < 1) c.setAttribute('stroke-opacity', nombre(trait.alpha))
          c.setAttribute('stroke-width', nombre(parseFloat(s.strokeWidth)))
          c.setAttribute('stroke-linecap', s.strokeLinecap)
          c.setAttribute('stroke-linejoin', s.strokeLinejoin)
        } else c.setAttribute('stroke', 'none')
        if (s.opacity !== '1') c.setAttribute('opacity', s.opacity)
        // Le pointille ne servait qu a animer le trace.
        c.removeAttribute('pathLength')
        if (o.tagName.toLowerCase() === 'text') {
          c.setAttribute('font-family', POLICE_EXPORT)
          c.setAttribute('font-size', nombre(parseFloat(s.fontSize)))
          c.setAttribute('font-weight', s.fontWeight)
          if (parseFloat(s.letterSpacing)) c.setAttribute('letter-spacing', nombre(parseFloat(s.letterSpacing)))
        }
      }
    }

    function vecteur(el, b, fenetre) {
      var page = el.ownerDocument
      var copie = el.cloneNode(true)
      habiller(el.querySelectorAll('*'), copie.querySelectorAll('*'), fenetre)
      // Un <use> pointe vers un dessin range ailleurs dans la page : on le recopie ici.
      Array.prototype.forEach.call(copie.querySelectorAll('use'), function (appel) {
        var cible = page.querySelector(appel.getAttribute('href') || appel.getAttribute('xlink:href') || 'none')
        if (!cible) { appel.remove(); return }
        var contenu = cible.cloneNode(true)
        habiller(cible.querySelectorAll('*'), contenu.querySelectorAll('*'), fenetre)
        var groupe = page.createElementNS('http://www.w3.org/2000/svg', 'g')
        while (contenu.firstChild) groupe.appendChild(contenu.firstChild)
        appel.replaceWith(groupe)
      })
      var s = fenetre.getComputedStyle(el)
      var encre = (couleur(s.color) || { hex: '#000000' }).hex
      // Un <svg> imbrique est mal lu par plusieurs editeurs : le dessin devient
      // un groupe, deplace et mis a l echelle de sa boite.
      var vue = (el.getAttribute('viewBox') || '0 0 ' + b.width + ' ' + b.height).split(/[\s,]+/).map(parseFloat)
      var echelle = Math.min(b.width / vue[2], b.height / vue[3])
      var dx = b.left + (b.width - vue[2] * echelle) / 2 - vue[0] * echelle
      var dy = b.top + (b.height - vue[3] * echelle) / 2 - vue[1] * echelle
      var herites = ''
      ;['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].forEach(function (a) {
        var v = el.getAttribute(a)
        if (v) herites += ' ' + a + '="' + (v === 'currentColor' ? encre : xml(v)) + '"'
      })
      var dedans = ''
      var serie = new XMLSerializer()
      for (var e = copie.firstChild; e; e = e.nextSibling) dedans += serie.serializeToString(e)
      return '<g transform="translate(' + nombre(dx) + ' ' + nombre(dy) + ') scale(' + (Math.round(echelle * 10000) / 10000) + ')"' + herites + '>' +
        dedans.replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '') + '</g>'
    }

    function calque(noeud) {
      var el = noeud.el
      var fenetre = noeud.cadre.iframe.contentWindow
      var s = fenetre.getComputedStyle(el)
      var b = el.getBoundingClientRect()
      var sortie = '<g id="' + xml(identifiant(noeud.nom)) + '"' + (s.opacity !== '1' ? ' opacity="' + s.opacity + '"' : '') + '>'
      if (noeud.type === 'vecteur') sortie += vecteur(el, b, fenetre)
      else {
        sortie += boite(el, s, b)
        if (el.tagName.toLowerCase() === 'input') sortie += saisie(el, s, b, fenetre)
        else sortie += textes(el, fenetre, noeud.type === 'texte')
        var dedans = ''
        noeud.enfants.forEach(function (e) { dedans += calque(e) })
        // Un element qui coupe ce qui deborde (une zone qui defile) le coupe aussi ici.
        if (dedans && s.overflowY !== 'visible' && noeud.type !== 'ecran') {
          var cle = 'coupe' + ++suite
          var rayon = rayonDe(s, b)
          definitions.push('<clipPath id="' + cle + '"><rect x="' + nombre(b.left) + '" y="' + nombre(b.top) + '" width="' + nombre(b.width) +
            '" height="' + nombre(b.height) + '"' + (rayon > 0 ? ' rx="' + nombre(rayon) + '"' : '') + '/></clipPath>')
          dedans = '<g clip-path="url(#' + cle + ')">' + dedans + '</g>'
        }
        sortie += dedans
      }
      return sortie + '</g>'
    }

    return {
      // Le dessin d un calque et de tout ce qu il contient.
      svg: function (noeud) {
        var b = noeud.el.getBoundingClientRect()
        var fenetre = noeud.cadre.iframe.contentWindow
        var corps = ''
        if (noeud.type === 'ecran') {
          var fond = couleur(fenetre.getComputedStyle(noeud.el.ownerDocument.body).backgroundColor)
          if (fond) corps += '<rect id="Fond" x="0" y="0" width="' + nombre(noeud.cadre.largeur) + '" height="' + nombre(noeud.cadre.hauteur) + '"' + peinture('fill', fond) + '/>'
        }
        corps += calque(noeud)
        var x = noeud.type === 'ecran' ? 0 : b.left
        var y = noeud.type === 'ecran' ? 0 : b.top
        var l = noeud.type === 'ecran' ? noeud.cadre.largeur : b.width
        var h = noeud.type === 'ecran' ? noeud.cadre.hauteur : b.height
        return '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="' + nombre(l) + '" height="' + nombre(h) + '" viewBox="' + nombre(x) + ' ' + nombre(y) + ' ' + nombre(l) + ' ' + nombre(h) + '">' +
          '<title>' + xml(doc.nom + ' · ' + noeud.nom) + '</title>' +
          (definitions.length ? '<defs>' + definitions.join('') + '</defs>' : '') + corps + '</svg>\n'
      },
    }
  }

  function exporterSvg(noeud) { return exporteur().svg(noeud) }

  function nomDeFichier(texte) {
    return sansAccent(texte).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'maquette'
  }

  function telecharger(nom, contenu, type) {
    var lien = document.createElement('a')
    lien.href = URL.createObjectURL(new Blob([contenu], { type: type }))
    lien.download = nom
    document.body.appendChild(lien)
    lien.click()
    lien.remove()
    setTimeout(function () { URL.revokeObjectURL(lien.href) }, 4000)
  }

  var minuterie = 0
  function annoncer(texte) {
    var annonce = id('gd-annonce')
    annonce.textContent = texte
    annonce.hidden = false
    clearTimeout(minuterie)
    minuterie = setTimeout(function () { annonce.hidden = true }, 4200)
  }

  // ---------------------------------------------------------------- ouvrir et enregistrer

  function lireFichier(fichier) {
    if (!fichier) return
    fichier.text().then(function (texte) {
      var nouveau
      try { nouveau = JSON.parse(texte) } catch (e) { throw new Error('Ce fichier n\'est pas un document .god2 lisible.') }
      return ouvrir(nouveau)
    }).then(function () {
      annoncer('« ' + doc.nom + ' » est ouvert.')
    }).catch(function (e) {
      annoncer(e.message || 'Ce fichier n\'a pas pu être ouvert.')
    })
  }

  id('gd-fichier').addEventListener('change', function (e) {
    lireFichier(e.target.files[0])
    e.target.value = ''
  })

  var survols = 0
  window.addEventListener('dragenter', function (e) {
    if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') < 0) return
    survols++
    id('gd-depose').hidden = false
  }, hors)
  window.addEventListener('dragleave', function () {
    if (--survols <= 0) { survols = 0; id('gd-depose').hidden = true }
  }, hors)
  window.addEventListener('dragover', function (e) { e.preventDefault() }, hors)
  window.addEventListener('drop', function (e) {
    e.preventDefault()
    survols = 0
    id('gd-depose').hidden = true
    if (e.dataTransfer && e.dataTransfer.files.length) lireFichier(e.dataTransfer.files[0])
  }, hors)

  // ---------------------------------------------------------------- le pointeur sur la toile

  var outil = 'deplacer'
  var espace = false
  var pointeurs = new Map()
  var glisse = null
  var pince = null

  function mainActive(e) { return outil === 'main' || espace || e.button === 1 || e.pointerType === 'touch' }

  capteur.addEventListener('pointerdown', function (e) {
    fermerMenus()
    capteur.setPointerCapture(e.pointerId)
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointeurs.size === 2) {
      var p = Array.from(pointeurs.values())
      pince = { ecart: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), z: vue.z }
      glisse = null
      return
    }
    glisse = { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y, bouge: false, main: mainActive(e), toucher: e.pointerType === 'touch' }
    if (glisse.main) e.preventDefault()
  })

  capteur.addEventListener('pointermove', function (e) {
    if (pointeurs.has(e.pointerId)) pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pince && pointeurs.size === 2) {
      var p = Array.from(pointeurs.values())
      var boite = toile.getBoundingClientRect()
      var ecart = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
      zoomer(pince.z * (ecart / pince.ecart), (p[0].x + p[1].x) / 2 - boite.left, (p[0].y + p[1].y) / 2 - boite.top)
      return
    }
    if (glisse) {
      var dx = e.clientX - glisse.x
      var dy = e.clientY - glisse.y
      if (Math.abs(dx) + Math.abs(dy) > 4) glisse.bouge = true
      if (glisse.main && glisse.bouge) {
        racine.dataset.glisse = 'true'
        vue.x = glisse.vx + dx
        vue.y = glisse.vy + dy
        appliquer()
      }
      return
    }
    if (e.pointerType !== 'touch') survoler(outil === 'deplacer' && !espace ? calqueSous(e.clientX, e.clientY) : null)
  })

  function lacher(e) {
    pointeurs.delete(e.pointerId)
    if (pointeurs.size < 2) pince = null
    if (!glisse) return
    var g = glisse
    glisse = null
    racine.dataset.glisse = 'false'
    // Un appui sans deplacement choisit le calque sous le pointeur.
    if (!g.bouge && e.type === 'pointerup' && e.button !== 1 && !espace && (outil === 'deplacer' || g.toucher)) choisir(calqueSous(e.clientX, e.clientY))
  }
  capteur.addEventListener('pointerup', lacher)
  capteur.addEventListener('pointercancel', lacher)
  capteur.addEventListener('pointerleave', function () { if (!glisse) survoler(null) })

  // La molette deplace la toile ; avec Ctrl (ou un pincement au pave tactile), elle zoome.
  toile.addEventListener('wheel', function (e) {
    if (e.target.closest('.gd-volet')) return
    e.preventDefault()
    var boite = toile.getBoundingClientRect()
    if (e.ctrlKey || e.metaKey) {
      zoomer(vue.z * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022)), e.clientX - boite.left, e.clientY - boite.top)
    } else {
      var pas = e.deltaMode ? 32 : 1
      vue.x -= (e.shiftKey ? e.deltaY : e.deltaX) * pas
      vue.y -= (e.shiftKey ? 0 : e.deltaY) * pas
      appliquer()
    }
  }, { passive: false })

  function prendre(nom) {
    outil = nom
    racine.dataset.outil = nom
    document.querySelectorAll('.gd-outil[data-outil]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.outil === nom)) })
    if (nom !== 'deplacer') survoler(null)
  }

  // ---------------------------------------------------------------- menus, volets, theme

  function fermerMenus(sauf) {
    document.querySelectorAll('.gd-menu').forEach(function (m) {
      if (m.id === sauf) return
      m.hidden = true
      var titre = document.querySelector('[data-menu="' + m.id + '"]')
      if (titre) titre.setAttribute('aria-expanded', 'false')
    })
  }

  function volet(nom, ouvert) {
    var v = id(nom)
    if (ouvert === undefined) ouvert = v.dataset.ouvert !== 'true'
    v.dataset.ouvert = String(ouvert)
    document.querySelectorAll('.gd-barre [aria-controls="' + nom + '"]').forEach(function (b) { b.setAttribute('aria-expanded', String(ouvert)) })
  }

  function montrerOnglet(nom) {
    document.querySelectorAll('.gd-onglet').forEach(function (o) { o.setAttribute('aria-selected', String(o.dataset.onglet === nom)) })
    fiche.hidden = nom !== 'design'
    id('gd-export').hidden = nom !== 'export'
  }

  var ACTIONS = {
    'ouvrir': function () { id('gd-fichier').click() },
    'enregistrer': function () {
      telecharger(nomDeFichier(doc.nom) + '.god2', JSON.stringify(doc), 'application/json')
      annoncer('Le fichier .god2 est enregistré dans vos téléchargements.')
    },
    'exporter-choix': function () {
      if (!choix) return ACTIONS['exporter-tout']()
      telecharger(nomDeFichier(choix.cadre.nom + (choix.type === 'ecran' ? '' : ' ' + choix.nom)) + '.svg', exporterSvg(choix), 'image/svg+xml')
      annoncer('« ' + choix.nom + ' » est exporté en SVG.')
    },
    'exporter-tout': function () {
      cadres.forEach(function (c, i) {
        setTimeout(function () { telecharger(nomDeFichier(c.nom) + '.svg', exporterSvg(c.racine), 'image/svg+xml') }, i * 350)
      })
      annoncer(cadres.length + ' cadres exportés en SVG. Le navigateur peut demander d\'autoriser plusieurs téléchargements.')
    },
    'volet-gauche': function () { volet('gd-volet-droit', false); volet('gd-volet-gauche') },
    'volet-droit': function () { volet('gd-volet-gauche', false); volet('gd-volet-droit') },
    'zoom-moins': function () { zoomer(vue.z / 1.25) },
    'zoom-plus': function () { zoomer(vue.z * 1.25) },
    'zoom-ajuster': toutVoir,
    'zoom-choix': voirChoix,
    'zoom-50': function () { zoomer(0.5) },
    'zoom-100': function () { zoomer(1) },
    'zoom-200': function () { zoomer(2) },
    'theme': function () {
      var html = document.documentElement
      html.dataset.theme = html.dataset.theme === 'sombre' ? 'clair' : 'sombre'
      try { localStorage.setItem('god2-design:theme', html.dataset.theme) } catch (e) { /* stockage ferme : le theme ne sera pas retenu */ }
      if (!choix) dessinerFiche()
    },
    'aide': function () { id('gd-aide').showModal() },
    'presenter': function () { presenter(choix ? doc.ecrans.indexOf(choix.cadre.ecran) : 0) },
    'quitter-presentation': function () { quitterPresentation() },
    'presentation-avant': function () { presenter((presente + doc.ecrans.length - 1) % doc.ecrans.length) },
    'presentation-apres': function () { presenter((presente + 1) % doc.ecrans.length) },
  }

  document.addEventListener('click', function (e) {
    var titre = e.target.closest('[data-menu]')
    if (titre) {
      var menu = id(titre.dataset.menu)
      fermerMenus(menu.id)
      menu.hidden = !menu.hidden
      titre.setAttribute('aria-expanded', String(!menu.hidden))
      return
    }
    var bouton = e.target.closest('[data-action], .gd-outil[data-outil], [data-section], [data-onglet]')
    fermerMenus()
    if (!bouton || bouton === racine || bouton.getAttribute('aria-disabled') === 'true') return
    if (bouton.dataset.action) ACTIONS[bouton.dataset.action]()
    else if (bouton.dataset.outil) prendre(bouton.dataset.outil)
    else if (bouton.dataset.section) montrerSection(bouton.dataset.section)
    else if (bouton.dataset.onglet) montrerOnglet(bouton.dataset.onglet)
  }, hors)

  // ---------------------------------------------------------------- la presentation

  var presente = -1

  // Un ecran en vrai : une page a la taille de la fenetre, avec ses survols
  // et ses animations. Sur un telephone, c est la vue de depart.
  function presenter(i) {
    presente = i < 0 ? 0 : i
    var ecran = doc.ecrans[presente]
    presentationTitre.textContent = 'Écran ' + (presente + 1) + ' sur ' + doc.ecrans.length + ' · ' + ecran.nom
    presentationEcran.srcdoc = pageDe(ecran, '', LUMIERE)
    presentation.hidden = false
    presentation.querySelector('[data-action="quitter-presentation"]').focus()
  }
  function quitterPresentation() {
    presentation.hidden = true
    presentationEcran.srcdoc = ''
    presente = -1
    toutVoir()
  }

  // ---------------------------------------------------------------- le clavier

  window.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea, dialog')) return
    if (!presentation.hidden) {
      if (e.key === 'Escape') quitterPresentation()
      else if (e.key === 'ArrowRight') ACTIONS['presentation-apres']()
      else if (e.key === 'ArrowLeft') ACTIONS['presentation-avant']()
      return
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.code === 'Space') { espace = true; racine.dataset.outil = 'main'; e.preventDefault(); return }
    if (e.shiftKey && e.code === 'Digit1') return toutVoir()
    if (e.shiftKey && e.code === 'Digit2') return voirChoix()
    if (e.shiftKey && e.code === 'Digit0') return zoomer(1)
    var touche = e.key.toLowerCase()
    if (touche === 'v') prendre('deplacer')
    else if (touche === 'h') prendre('main')
    else if (touche === 'p') ACTIONS.presenter()
    else if (e.key === '+' || e.key === '=') zoomer(vue.z * 1.25)
    else if (e.key === '-') zoomer(vue.z / 1.25)
    else if (e.key === 'Escape') { fermerMenus(); choisir(null) }
    else if (e.key === 'Enter' && e.shiftKey && choix && choix.parent) choisir(choix.parent)
  }, hors)
  window.addEventListener('keyup', function (e) {
    if (e.code === 'Space') { espace = false; racine.dataset.outil = outil }
  }, hors)
  window.addEventListener('resize', appliquer, hors)

  // ---------------------------------------------------------------- demarrage

  try {
    var retenu = localStorage.getItem('god2-design:theme')
    if (retenu === 'clair' || retenu === 'sombre') document.documentElement.dataset.theme = retenu
  } catch (e) { /* stockage ferme : theme par defaut */ }

  // Chez un hote qui range plusieurs maquettes, le menu Fichier y ramene.
  if (hote && hote.accueil) {
    id('gd-accueil').href = hote.accueil
    id('gd-accueil').hidden = false
    id('gd-accueil-filet').hidden = false
  }

  // De quoi piloter l atelier : pour l hote, les scripts et les essais.
  var atelier = {
    document: function () { return doc },
    cadres: function () { return cadres.map(function (c) { return c.nom }) },
    exporterSvg: function (i) { return exporterSvg(cadres[i || 0].racine) },
    arreter: function () { fin.abort() },
  }
  window.godDesign = atelier

  ouvrir(depart).then(function () {
    // Sur un petit ecran, ou a la demande (#presentation), on montre d abord l ecran en vrai.
    if (location.hash === '#presentation' || !large.matches) presenter(0)
  })
  return atelier
}

// Deux facons de demarrer. Le fichier autonome porte son document dans la
// page : l atelier s ouvre dessus. Dans l application god2-design, c est elle
// qui appelle atelierGod2, une fois la coque posee et le document charge.
window.atelierGod2 = atelierGod2
if (document.getElementById('document-god2')) atelierGod2(JSON.parse(document.getElementById('document-god2').textContent))
