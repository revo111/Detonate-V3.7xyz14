# Detonate — prototype V3.5

## Contenu
| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu complet (solo contre bots et client en ligne). C'est aussi le code que le serveur exécute pour simuler les parties. |
| `server.js` | Serveur des parties privées (WebSocket, salons par code, simulation à 60 Hz). |
| `game_sim.js` | Lance la simulation du jeu (le dernier `<script>` de `index.html`) côté serveur, sans affichage. |
| `package.json` | Dépendance unique : `ws`. |
| `Dockerfile` | Image Node 20 pour Fly.io. |
| `fly.toml` | Application Fly.io `detonate-prototype` (régions cdg, lax, iad, sin). |

## Nouveau en V3.5 : mode Zombie (étape 1)
Carte **Forêt · mode Zombie** dans le menu : 5 équipes de 2, carte sombre, poignard + briquet (3 min),
une vague de zombies par minute (20 vagues), la dernière équipe en vie gagne.
Étape 2 : sac de 3 emplacements, butin aléatoire (armes, munitions, ressources), fouille des voitures (4 s),
pistolet et fusil d'assaut (le bruit attire les zombies), bandages, sac laissé au sol à la mort.
Étape 3 : faim et soif (6 et 9 min ; sous 20 % on ralentit, à zéro on perd 1 PV toutes les 2 s), saignement après une morsure
(bandage, aussi sur un coéquipier en 5 s), animaux (poulet, cochon, vache : viande et cuir), boire et pêcher aux étangs,
**essence** pour recharger le briquet (+1:30), **torche** fabriquée avec 1 bois au feu de camp (grande lumière 2 min),
menu d'artisanat (touche C ou bouton 🔨) : feu de camp, torche, raviver, cuire, lance, canne à pêche, barricades (les zombies
les frappent, les brutes les cassent vite ; E maintenu pour démonter), cocktail Molotov, bandages, sac en cuir (arme de rechange).
`server.js` a changé à l'étape 1 (salons de 10 places en 5 équipes) : il faut le redéployer avec `index.html`.

## Tester en solo sur GitHub Pages
1. Pousse ces fichiers sur un dépôt GitHub.
2. Settings → Pages → Source : branche `main`, dossier `/ (root)`.
3. Ouvre `https://<ton-compte>.github.io/<dépôt>/` puis « Jouer contre l'IA ».

## Tester en ligne (parties privées)
Le jeu ouvert depuis GitHub Pages se connecte à `wss://detonate-prototype.fly.dev`
(constante `DEFAULT_SERVER` dans `index.html`). Déploie le serveur prototype :

```
fly deploy --config fly.toml
```

Pour viser un autre serveur sans modifier le fichier : ajoute `?server=wss://autre-app.fly.dev` à l'adresse du jeu.

Le serveur doit toujours être déployé avec **le même `index.html`** que celui de GitHub Pages
(il exécute la même logique de jeu).
