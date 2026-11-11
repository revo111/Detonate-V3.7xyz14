# Detonate — prototype V3.7

## Contenu
| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu complet (solo contre bots et client en ligne). C'est aussi le code que le serveur exécute pour simuler les parties. |
| `server.js` | Serveur des parties privées (WebSocket, salons par code, simulation à 60 Hz). |
| `game_sim.js` | Lance la simulation du jeu (le dernier `<script>` de `index.html`) côté serveur, sans affichage. |
| `profiles.js` | Profils des joueurs (XP, niveaux, statistiques) gardés par le serveur, sur le volume `/data` de la région `iad`. |
| `package.json` | Dépendance unique : `ws`. |
| `Dockerfile` | Image Node 20 pour Fly.io. |
| `fly.toml` | Application Fly.io `detonate-prototype` (régions cdg, lax, iad, sin ; volume `/data` pour les profils). |

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
Sons du mode Zombie refaits : voix des zombies (grognements selon le type, râle avant de frapper, morsure, cri du hurleur, mort et chute),
pas des zombies proches, coup de poignard et de lance (souffle + impact dans la chair), briquet, objets, feux qui crépitent, ambiance de forêt (vent, grillons, chouette). Début de vague : deux coups de cloche au loin (plus discrets que l'ancienne corne).
Touches PC du mode Zombie : objets é " ' (et ( pour la 4e case), A = changer d'arme (maintenir : la lâcher), V = grenade / Molotov, W = alliance, X = refuser une alliance,
G = briquet, E = ramasser / fouiller / boire, B = bandage, C = artisanat, H = aide. Canne à pêche : touche de son emplacement (ou E au bord
de l'eau quand on n'a pas soif), 4 s sans bouger, elle casse au 2e poisson. Sac en cuir (1 cuir) : à utiliser, +1 case dans le sac.
Étape 4 : à zéro PV, on reste **à terre** 30 s (on rampe) si un coéquipier ou un allié debout peut nous **relever** (E maintenu 4 s, on repart avec 35 PV) ;
**alliances** entre deux équipes (touche W ou bouton 🤝 : proposer, accepter, rompre) : pas de dégâts entre alliés, on se voit dans le noir et on peut se relever ;
quand il ne reste que deux équipes alliées, l'alliance prend fin après 10 s. Après la vague 20, **brouillard toxique** : la zone sûre se resserre par paliers
(dégâts croissants dehors). Bots : déplacements par la grille de navigation (ils ne tournent plus autour des maisons), ils suivent le joueur humain, relèvent leurs alliés.
Emotes d'alliance au-dessus des personnages : 🤝? (doré) une équipe propose une alliance, 💭 elle réfléchit à ta proposition,
🤝✔ (vert) alliance conclue, ✖ refus ; en t'approchant des bots : 🤝 (contour vert) ils accepteraient, ⚔️ ils n'en veulent pas. Refuser : touche X (bouton ✖).
Tir allié : pendant une alliance, on peut blesser ses alliés ; toucher un allié (balle, poignard, lance) est une **trahison** : l'alliance est rompue
sur-le-champ, 🗡️ au-dessus des traîtres, et les bots trahis deviennent hostiles. Les bots ne tirent pas quand un ami est dans la ligne de tir et trahissent
parfois un allié affaibli en fin de partie. Panneau des commandes (H) refait : toutes les touches, textes ajustés.
Étape 5 (bots et équilibrage) : les bots lancent leurs grenades sur les groupes, gardent leurs balles (poignard sur les rôdeurs isolés),
fabriquent une lance quand leur arme est vide, font un feu de camp pour cuire la viande, remplissent leurs bouteilles, défendent puis relèvent
leurs coéquipiers, et ne fuient pas quand leur joueur humain est à terre. Équilibrage : plus de munitions (butin, voitures, et sur les zombies :
14 % ; brutes 70 %), brute 280 PV et un peu plus rare, vagues un peu moins nombreuses, horde plafonnée selon le nombre d'équipes en vie,
saignement qui s'arrête après 25 s, faim 11 min, soif 7 min, à terre 40 s. Sur 12 parties de bots : vague finale moyenne 18,5 (avant : 13,9).
Manger et boire sur place : près d'une nourriture ou d'une eau au sol, appui court sur E = la ramasser, maintenir E (0,4 s) = la manger / la boire
tout de suite sans passer par le sac (sac plein : un simple appui suffit) ; les bots font de même quand ils ont faim ou soif.
Manger et boire prennent 2 s (on est ralenti ; un coup reçu ou une attaque interrompt, la portion prise au sol y est reposée) ; la cuisson prend
5 s par aliment près du feu. Entraide : un bot donne à son coéquipier (toi ou un autre bot) un bandage, de l'eau ou de la nourriture dès qu'il en a
besoin (🎁 au-dessus du bot), en gardant le minimum pour lui.
Correctifs du mode Zombie : les bots ne restent plus bloqués à ramasser puis lâcher une bouteille vide (sac plein), ne reprennent plus
une arme à feu vide à la place de leur lance, ni le bandage ou la nourriture qu'ils viennent de poser à tes pieds quand ton sac est plein
(le cadeau t'est réservé 60 s). Bandage : on se soigne soi-même quand on a moins de vie que son coéquipier (avant, on soignait parfois
l'autre). Le saignement, la faim ou la soif à zéro et le brouillard n'interrompent plus le repas (2 s) ni la pêche. À terre ou mort pendant
un repas : la portion prise au sol y retombe. Maintenir E près d'une nourriture qu'on ne peut pas manger ne bloque plus les autres actions
(boire à l'étang, ramasser). Un joueur à terre ne saigne plus après une morsure. Briquet vide : un message s'affiche. Bouton tactile :
« BOIRE » pour l'eau au sol. À terre : plus de coup ni de tir affiché côté client ; le menu d'artisanat se ferme. « Cuire » explique
pourquoi c'est impossible pendant un repas. Menu d'artisanat et tableau des équipes plus opaques (les annonces ne passent plus au travers).
**Arbalète** (artisanat : 2 bois + 2 métal) : arme de tir rapide (un carreau toutes les 0,3 s, 38 dégâts, précise), presque silencieuse
(les zombies ne l'entendent qu'à 160 px, contre 600 pour le pistolet), sans rechargement ; 60 carreaux, puis elle casse. Elle se prend en main
à la fabrication (l'arme tenue tombe au sol) ; posée au sol, son nom indique les carreaux restants. Les bots en fabriquent une quand ils n'ont plus
d'arme de tir utilisable. Sons « personnels » (manger, boire, ramasser, soin, artisanat, toux, à terre, alliance) : ils étaient muets, ils sont rétablis.
Mini-carte de la Forêt : 20 % plus petite, sans les voitures.
Bots : ils se soignent plus tôt (au calme dès qu'il leur manque 35 PV, et même avec des zombies à distance quand leur vie est très basse),
vont chercher un bandage au sol quand ils sont blessés, et prennent ce que leur coéquipier humain leur pose (bandage, nourriture, eau, munitions,
grenade) même avec un sac plein : ils lâchent alors ce qui leur sert le moins (pierre, bois, bouteille...). Carte du coéquipier sous la mini-carte :
nom, vie (ou « À TERRE »), saignement, faim et soif ; une icône clignote au-dessus de lui quand il a faim ou soif. Sac : la molette ou un clic
choisit un objet (clic sur l'objet déjà choisi : l'utiliser) ; touche T : lâcher 1 objet choisi (munitions : 10), maintenir T : toute la pile.
Plus de munitions : boîtes plus fréquentes dans les chalets, les voitures et la forêt (+50 à +70 %) et plus grosses (24 à 42 balles),
fouille de voiture 30 à 45 balles, zombies 21 % (10 à 19 balles), brutes 80 % (18 à 30). Sur 10 parties de bots : temps sans munitions
6 % (avant 23 %), vague finale moyenne 23,6 (avant 20,5).
Bot coéquipier : il boit vraiment au lac (il s'arrêtait 4 px trop loin de l'eau, puis abandonnait l'étang pour toute la partie), boit en passant
quand il est au bord de l'eau, et sa soif presque vide passe avant un combat à distance ; face à une horde, il se replie vers toi au lieu de
s'enfuir ailleurs et ne s'éloigne plus à plus de 240 px en combattant ; il t'aide à achever un animal que tu viens de frapper ; il fouille les
voitures proches de toi (il n'en fouillait jamais, et ceux qui essayaient restaient parfois trop loin de la voiture). À terre : on est à plat ventre,
tourné dans le sens où l'on rampe (plus vers la visée), bras qui tirent et jambes qui poussent en alternance ; on rampe un peu plus vite (45 px/s) ;
un bot à terre rampe vers son coéquipier pour être relevé plus vite.
Fouille des voitures par les bots : ils ne choisissent plus une voiture que quelqu'un fouille déjà, se placent sur un point libre à portée de
fouille, et s'arrêtent dès que la voiture est à portée (avant, ils pouvaient faire du surplace contre la carrosserie sans jamais fouiller).
Éclair de tir : il s'éteint maintenant 0,06 s après le coup (en mode Zombie il restait allumé en permanence au bout de l'arme).
Bandage au sol : comme la nourriture, on peut s'en servir sans le mettre dans le sac (maintenir E ; sac plein : un simple appui) ; interrompu,
il retombe au sol. Les bots blessés font de même. Carte de la Forêt : 6 chalets de plus (19 au total), placés dans les plus grands vides (coins et
bords de la carte, loin des points de départ), porte tournée vers la route la plus proche, clairière dégagée autour ; le reste de la carte est
identique ; un peu plus d'objets de départ dans les chalets (même quantité par chalet).
Mobile (mode Zombie) : barre de vie (ATH) et inventaire deux fois plus petits.
- **ATH mobile** : barre de vie et inventaire agrandis de 15 % ; l'inventaire a la même largeur que la barre de vie et il est centré dessus ; la carte du coéquipier est centrée sous la mini-carte ; mini-carte mobile réduite de 15 %.

- **Chiffres de l'inventaire sur mobile** : taille minimale de police, pastille sombre derrière les quantités et les munitions ; l'état du briquet et le texte « fabriquer » sont masqués sur mobile pour libérer la place.

- **Case de l'arme sur mobile** : nouvelle mise en page, avec l'icône à gauche et les munitions « chargeur/réserve » à droite, sans chevauchement. La taille du texte s'adapte. L'icône du poignard se retire quand la place manque.

- **Son** : les tirs, les impacts et les sons du joueur sont prioritaires. Les grognements, les pas et l'ambiance ne peuvent plus leur prendre leur place. Le nombre de sons simultanés est limité, plus fortement sur mobile. Les voix des zombies sont plus légères sur mobile (2 formants) et il y a moins de bruits de pas. Les sons sont planifiés un peu en avance, ce qui évite les clics. Sur mobile, le tampon audio est plus grand. Le son reprend après une interruption (appel, autre application, relâchement du doigt sur l'écran).
- **Brouillard de fin de partie** : sur la mini-carte, il reste dans le cadre. Il est hachuré, avec un liseré lumineux et la prochaine zone en pointillés qui défilent. À l'écran, le cercle est calculé sur la partie visible de la carte. Cela corrige l'écran entièrement vert au début du brouillard, et le « trou » de la zone sûre qui n'apparaissait pas sur la mini-carte. Le brouillard a maintenant des volutes qui dérivent, un halo le long du bord et un mur de brume animé.
- **Munitions** : environ 45 % de munitions en moins sur la carte. Poids : maisons 48→30, véhicules 46→30, forêt 24→14, voitures 36→26. Quantités : au sol 18 à 32, voitures fouillées 22 à 34.

- **Sac du joueur mort** : quand un joueur meurt, ses armes (avec leurs munitions) et tout son sac restent dans un sac au sol, à son nom. On l'ouvre avec E (PC) ou le bouton OUVRIR LE SAC (mobile) pour voir son contenu. On touche un objet pour le prendre, ou TOUT PRENDRE. Une arme prise remplace celle qu'on tient, qui va dans le sac. Sac plein : on touche l'objet voulu puis la case de son sac à échanger. Les bots fouillent aussi ces sacs.
- **Manger** : il faut maintenir l'action pour manger ou boire au sol (0,8 s ; 1,5 s pour la viande ou le poisson crus). Un appui court ne fait plus manger, même sac plein. La viande et le poisson crus pris dans le sac demandent un deuxième appui pour confirmer. Appuyer de nouveau sur E (ou sur ANNULER) pendant un repas l'arrête, sans perdre l'aliment.
- **Échanger un objet** : sac plein, sur PC, E prend l'objet au sol à la place de la case choisie (molette ou clic) ; l'ancien objet reste au sol. Sur mobile, le bouton ÉCHANGER puis un toucher sur la case à remplacer.
- **Munitions** : +20 % d'apparition (maisons 30→36, véhicules 30→36, forêt 14→17, voitures 26→31).

- **Équipes du mode Zombie** : ALPHA (bleu), DELTA (orange), SIERRA (violet), COBRA (jaune) et GHOST (vert). Avant : Loups, Renards, Corbeaux, Lynx, Vipères. Les bots s'appellent « Delta 1 », « Sierra 2 », etc.

- **Rangs d'équipe (mode Zombie)** : le rang dépend des zombies tués par l'équipe. I Bronze : 20 ; II Argent : 60 ; III Or : 120 ; IV Diamant : 210. Chaque palier demande plus que le précédent (+20, +40, +60, +90). Bonus pour toute l'équipe : I : +8 % vie, +5 % cadence de tir, +5 % vitesse ; II : +12 %, +8 %, +8 % ; III : +15 %, +15 %, +15 % ; IV : +20 %, +20 %, +20 %. La vie gagnée s'ajoute tout de suite. Chaque rang a sa forme d'écusson : I Bronze un bouclier arrondi (sans brillance), II Argent un écusson à pointe, III Or un hexagone, IV Diamant un losange. Argent, Or et Diamant brillent, sans halo autour : reflet en haut et éclat lumineux qui les traverse de temps en temps. L'insigne du rang est visible à gauche de la barre de vie de chaque joueur, à côté de la vie dans l'ATH, sur les pastilles d'équipe et dans le tableau (TAB). La montée de rang est annoncée.
- **ATH du haut refait** : une première carte centrée avec la vague, les zombies en vie au centre, le minuteur et les 5 équipes (joueurs en vie + insigne de rang). Une deuxième carte montre le rang de l'équipe, la progression vers le rang suivant et les bonus (vie, cadence de tir, vitesse) ; sans rang, ce sont ceux du rang I, en gris. Sur mobile, l'ATH du haut est réduit d'environ 25 % (236 px de large au lieu de 300, 89 px de haut au lieu de 108). Avec les bots, on atteint Bronze vers la vague 6, Argent vers la 11, Or vers la 16 et Diamant vers la 21.

- **AR (mode Zombie)** : le fusil d'assaut est remplacé par l'AR de la carte Neige. Même modèle (corps sombre, repère rouge, canon rond), raccourci d'environ un tiers, en main et au sol, avec une nouvelle icône. Il a les effets de tir de la Neige : tracé orange lumineux, éclair au bout du canon, petits nuages d'impact. Il fait 32 dégâts par balle au lieu de 22, donc plus que le pistolet (28), car il est plus rare. Cadence et chargeur inchangés.

- **Moins de texte à l'écran (mode Zombie)** : plus de messages pour la zone qui se resserre (« Brouillard toxique », « La zone se resserre »), ni pour les alliances (propositions, alliance conclue, fin, trahison). Les sons sont gardés, et le bouton d'alliance s'allume toujours sur mobile. Seul l'avertissement « HORS DE LA ZONE ! » reste, et seulement quand on est dehors.

- **AR** : +15 % d'apparition (poids 8→9,2 dans les maisons, 5→5,75 dans les voitures).
- **Visée tactile (mobile)** : portée plus longue, 680 px avec le pistolet ou l'AR (460 avant) et 620 px avec l'arbalète. Un ennemi (joueur) dans la direction visée devient la cible principale, devant les zombies.
- **Fin de partie** (vague 20, 2e resserrement du brouillard, ou 3 équipes au plus) : les bots attaquent. Ils voient plus loin, ne fuient plus les joueurs, tirent sur les ennemis avant les zombies, sauf un zombie collé, et vont chercher l'équipe ennemie la plus proche dans la zone sûre. Sur 8 parties entre bots : morts tués par un joueur 21 → 61, morts dans le brouillard 26 → 2, parties d'environ 21 min au lieu de 24.
- **Essence au sol** : maintenir l'action recharge le briquet (+1:30) sans passer par le sac ; un appui court la ramasse.

- **Vagues toutes les 50 s** (au lieu de 60). **Bois** : +15 % d'apparition en forêt (poids 30 → 34,5).

- **Fusil à pompe (mode Zombie)** : nouvelle arme. 8 plombs en éventail, 18 dégâts chacun à bout portant, 50 % en bout de course (portée d'environ 290 px). Chaque plomb traverse un premier zombie, ce qui en fait une arme de zone contre la horde : un rôdeur meurt en un coup de près. Contre un joueur, les plombs font 60 % de leurs dégâts. 6 cartouches (les munitions normales), un tir toutes les 0,8 s, rechargement en 2,4 s, très bruyant. Il a son modèle en main et au sol, son icône et un son de pompe. On le trouve dans les maisons (poids 5, environ 4 %) et les voitures (poids 4, environ 3,6 %). Les bots le prennent et s'approchent pour tirer.
- **Une arme en réserve dans le sac** : en ramassant une arme alors qu'on en tient déjà une, celle-ci va dans une case libre du sac au lieu de tomber au sol. Une seule arme peut y être rangée à la fois, sinon elle tombe comme avant. Toucher la case (ou sa touche sur PC) échange l'arme rangée avec celle en main. Lâcher la case pose l'arme entière au sol, avec ses balles.
- **Chargeur étendu** : nouvelle recette pour 2 métal. Il s'applique à l'arme en main (pistolet, AR ou fusil à pompe), une seule fois par arme, et donne +50 % de balles (pistolet 18, AR 45, fusil à pompe 9). Il reste sur l'arme au sol, dans le sac et dans le sac d'un joueur mort. Une pastille jaune « + » le signale sur l'arme, et l'étiquette au sol indique « chargeur étendu ». Les bots le fabriquent quand ils ont 2 métal.
- **Largage de ravitaillement (rare)** : à partir de la vague 5, 9 % de chance par vague, 5 vagues d'écart au moins, 2 par partie au plus. Sur 8 parties entre bots, il y en a eu environ 0,75 par partie. Un avion passe avec ses feux de position, et une caisse descend en parachute en 16 s, avec son ombre et le compte à rebours au point d'atterrissage. Elle tombe sur un sol libre, dans la prochaine zone sûre si le brouillard est là. Elle est repérée sur la mini-carte et par une flèche au bord de l'écran, et une fusée rouge l'éclaire. Elle s'ouvre comme un sac (« RAVITAILLEMENT ») et contient un AR ou un fusil à pompe chargé (une fois sur deux avec chargeur étendu), 40 à 60 munitions, 2 ou 3 bandages, 1 ou 2 grenades, 2 métal, de l'eau ou des snacks, parfois de l'essence. Son atterrissage attire les zombies. Les bots vont la chercher.

- **Base Polaire de nuit : reflet des lampes sur les objets** : les lampadaires, projecteurs, portes, fenêtres et tentes éclairent maintenant les arbres (aiguilles, écorce, neige sur les branches), les rochers, les murs, les véhicules, les caisses et les poteaux, et pas seulement le sol. Chaque objet lit la carte de lumière du sol juste devant ses faces : la face tournée vers une lampe prend sa couleur (orangée pour les lampadaires, blanche pour les projecteurs), la face opposée reste dans l'ombre portée de l'objet, et un objet caché derrière un autre reste sombre. La lumière baisse avec la hauteur, et les toits ne la prennent pas. Il n'y a aucune lumière en plus : une seule texture est lue dans le shader. La carte de jour et les autres cartes ne changent pas.

- **Forêt : deux voitures qui se chevauchaient** (au centre de la carte, vers x 3500-3600) : la deuxième est déplacée à côté, sur un sol libre (3770, 2945). Les collisions, la fouille et le butin suivent.
- **Bouton arme (mobile, mode Zombie)** : un nouveau bouton à côté de R passe à l'arme suivante : arme en main → arme de rechange → arme rangée dans le sac → poignard. Son icône montre l'arme qu'on va prendre. La touche Q sur PC suit le même cycle et inclut maintenant l'arme rangée dans le sac.
- **Boutons mobiles réorganisés en arc autour de R** : arme à gauche, grenade en diagonale, action (ramasser, fouiller…) au-dessus, briquet un peu plus loin, alliance au-dessus de la grenade. Les boutons sont espacés pour que le pouce les atteigne sans en toucher deux.

- **Base Polaire en 6 contre 6** (jour et nuit, mode Code Rouge) au lieu de 5 contre 5, pour mieux équilibrer l'attaque et la défense. Il y a 12 places par salon et une apparition de plus par camp. L'ATH (pastilles A1 à A5 / E1 à E6), le tableau des scores, le lobby et le menu affichent 6 contre 6. Contre l'IA, chaque équipe a aussi 6 joueurs. `server.js` change : `MAP_SIZE.neige` et `MAP_SIZE.neigeN` passent de 5 à 6, il faut le redéployer.

- **V3.6 · étape 1 : nouvelle carte de guerre « FRONT » (8 contre 8)**. La carte est symétrique : les deux camps sont exactement équivalents.
  - Une rivière en S traverse la carte du nord au sud. On ne peut pas la franchir à pied, mais les balles et la vue passent au-dessus.
  - Il y a 3 ponts routiers (nord, centre, sud), qui seront destructibles au C4 à l'étape 2, et 2 passerelles en bois pour l'infanterie.
  - Une ligne de tranchées en zigzag protège chaque camp, avec un parapet en sacs de sable côté ennemi et des caillebotis. Des tranchées avancées longent la rivière.
  - Le no man's land contient des herissons tchèques et des barbelés (on ne les franchit pas, les balles passent), des cratères d'obus, des arbres brûlés, des épaves de chars et de camions en feu, et des villages en ruine.
  - Chaque camp a un QG en béton, des tentes, des caisses de munitions, des fûts, des camions, des miradors, des canons sous filet de camouflage et des drapeaux aux couleurs de l'équipe (ACIER contre CENDRE).
  - L'ambiance est chaotique : obus qui tombent au loin (décor, sans dégâts), fumées, feux, rafales et canons au loin.
  - Les emplacements des cibles (lance-missiles et antennes satellite), du tank et du 4x4 sont déjà réservés pour l'étape 2.
  - En attendant le mode Escorte, la carte se joue en match à mort à 8 contre 8 (premier à 80).
  - `server.js` change : `MAP_SIZE.guerre = 8` (16 places).

- **V3.6 · étape 2 : mode « FRONT » (escorte du tank), 8 contre 8**. Contre l'IA comme en ligne, la carte Front se joue maintenant dans ce mode (plus en match à mort).
  - **But** : chaque équipe escorte son tank jusqu'au camp adverse pour détruire au canon les 4 cibles ennemies. Les cibles sont des stations d'antenne satellite (A1, A2…) et des lance-missiles (B1, B2…). Elles sont tirées au sort à chaque manche, dans 4 des 8 emplacements du camp, avec un mélange au hasard de A et de B. Il faut 6 obus pour détruire une cible (6 barres de vie).
  - **Manche** : elle dure 6 min et la première équipe à 4 manches gagne. Détruire les 4 cibles adverses donne la manche tout de suite. Au chrono, l'équipe qui a détruit le plus de cibles gagne ; en cas d'égalité, celle qui a fait le plus de dégâts, puis celle qui a atteint ce score en premier. On réapparaît 5 s après sa mort.
  - **Tank** (piloté librement par un joueur) :
    - il est lent et plus grand, avec un nouveau modèle détaillé (tourelle, long canon, jupes, trappe du chef) ;
    - son conducteur est invincible et le tank ne craint pas les grenades ;
    - le tireur, debout dans la trappe, peut être visé et tué ;
    - le canon tire des obus explosifs et recharge en 8 s ;
    - le tank écrase les ennemis à pied et pousse un 4x4 qui lui barre la route.
  - **4x4 blindé**, façon Humvee : une mitrailleuse en tourelle, un tireur exposé, une barre de vie visible au-dessus. Il résiste à 4 grenades, un obus en enlève 2 et le C4 le détruit. Il réapparaît au garage 20 s après sa destruction.
  - **Commandes** :
    - **E**, ou le bouton d'action sur mobile : monter, passer au canon, descendre.
    - **E maintenu** : poser le C4.
    - Si un bot occupe une place, le joueur la prend : le bot passe au canon ou descend.
  - **Équipement** : 1 C4 et 1 grenade par vie.
    - **3 C4 sur un grand pont (1 sur une passerelle)** le font exploser 8 s plus tard (au départ il en fallait 4). Le pont reste détruit jusqu'à la fin de la manche : l'eau le remplace et plus personne ne passe. Il faut donc s'organiser en équipe.
    - **C4 sur le tank ennemi** : il est immobilisé 4 s. Ajout d'équilibrage : on ne peut pas reposer de C4 sur ce tank pendant les 3 s qui suivent, pour éviter qu'il reste bloqué en permanence.
  - **La carte Front est plus petite** : 4200 × 2800 (elle faisait 7600 × 4800 à l'étape 1), donc on atteint le camp adverse beaucoup plus vite. Elle est aussi plus chargée :
    - des hameaux en ruine ;
    - des rangées de blocs de béton ;
    - plus d'épaves, de hérissons, de barbelés, de nids de sacs de sable et de dépôts de caisses ;
    - des camps mieux remplis.
    Les ponts routiers sont élargis pour le tank. Le générateur vérifie que le tank et le 4x4 peuvent rejoindre tous les ponts et toutes les cibles adverses.
  - **ATH** :
    - sous le score, l'état des 4 cibles de chaque camp avec leurs points de vie ;
    - au-dessus des cibles et des véhicules, leur nom, leur vie et leur état ;
    - au bord de l'écran, des flèches vers les cibles ennemies et vers votre tank ;
    - sur les ponts, les C4 posés et le compte à rebours ;
    - un panneau du véhicule (rechargement du canon, blindage du 4x4), le compteur de C4, des bandeaux pour les événements (cible détruite, pont détruit…) et une carte de fin de manche ;
    - sur la mini-carte : les cibles, les véhicules et les ponts minés ou détruits.
  - **Bots** : ils ont des rôles (équipage du tank et du 4x4, escorte, défense). Le tank bot choisit un pont différent de celui du tank ennemi, s'arrête à portée pour tirer et contourne les blocages. Les défenseurs vont au-devant du tank ennemi pour tuer le tireur et poser le C4.
  - L'état du mode passe par le réseau : cibles, véhicules, obus, ponts, C4 et effets.
  - **Textures et décor retravaillés** :
    - **Ponts routiers** : tablier en dalles de béton avec joints, chaussée usée (traces de pneus, ligne centrale effacée, rustines, fissures, flaques), bordures, et un vrai treillis d'acier riveté et rouillé avec des contreventements au-dessus. Les piles sont tachées par l'eau.
    - **Passerelles** : planches de bois veinées et clouées, avec des fentes, sur des pilotis.
    - **Pont détruit** : poutres tordues et chaussée effondrée dans l'eau.
    - **Station d'antenne** : refaite en version militaire, voir plus bas (« Station d'antenne satellite plus militaire »).
    - **Lance-missiles** : roues sculptées avec jantes, châssis en acier, réservoirs, cabine vitrée avec calandre, vérins de calage déployés, rampe de lancement levée par deux vérins. Le missile porte des repères de roulis, des inscriptions et une ogive.
    - **Peinture des véhicules** : lignes de panneaux, rivets, coulures et boue en bas de caisse.
    - **Sol** : texture de détail beaucoup plus fine (cailloux en relief, touffes d'herbe sèche, boue sèche fissurée, brindilles) sur deux échelles pour casser la répétition. Plaques d'herbe sèche et de terre humide, traces de chenilles dans les camps.
    - **Arbres morts** : environ 90 grands arbres secs aux branches nues (parfois cassés), en plus des souches brûlées.
  - **Mitrailleuse du 4x4** : nouveau son de mitrailleuse lourde, plus grave et plus puissant. Il combine le claquement du départ, le souffle de la bouche, un coup sourd dans les basses, le bruit métallique de la culasse, la queue qui résonne et, de temps en temps, une douille qui tinte. Il s'assourdit avec la distance et se place à gauche ou à droite. En ligne, les autres joueurs l'entendent aussi (seules les balles de mitrailleuse portent un marqueur en plus).
  - **Ruines variées** : 6 styles de murs (brique rouge, brique jaune, pierre, crépi écaillé, parpaings, béton). Chaque hameau garde son style. Les murs portent de la suie, des impacts, des fissures et des traces d'humidité, et leurs arêtes cassées sont noircies. Des poutres calcinées et des tuiles tombées traînent dans les gravats.
  - **Camps près du spawn** :
    - tentes en 3 toiles (olive, kaki, vert-gris) avec pignons, plancher, mât et haubans ;
    - caisses en bois et caisses de munitions marquées, sous des bâches ;
    - fûts peints et rouillés avec couvercles ;
    - camions militaires détaillés : cabine vitrée, calandre, roues à jantes, bâche tendue sur des arceaux ;
    - miradors en rondins avec toit en tôle ;
    - bunker en béton banché avec meurtrière et porte blindée ;
    - canons d'artillerie.
  - **Bots plus malins face aux véhicules** :
    - **Esquive** :
      - quand un tank fonce sur eux, les bots s'écartent d'un pas de côté ; s'il est encore loin, ils fuient en diagonale (le tank, plus lent, doit tourner) ;
      - ils réagissent parfois en retard, donc on peut encore en écraser ;
      - pour poser le C4, ils abordent le tank ennemi par le flanc ou par l'arrière, plus par l'avant ;
      - le tank n'écrase plus qu'avec l'avant de la caisse : un soldat frôlé sur le côté est seulement bousculé.
    - **Conduite** :
      - les trajectoires sont tendues, sans zigzag ;
      - le tank va se placer face à sa cible, avec une vue dégagée, au lieu de foncer vers son centre, et ralentit à l'approche ;
      - les fausses marches arrière au départ et à la sortie des ponts ont disparu ;
      - le 4x4 roule de concert avec le tank et le contourne au lieu de le bloquer.
    - **Ligne de tir** :
      - le mitrailleur du 4x4 et le canon du tank ne tirent plus si un véhicule (allié ou ennemi) ou un mur se trouve entre eux et leur cible : ils changent de cible ou attendent ;
      - les véhicules bloquent aussi la vue : on peut se cacher derrière un tank.
    - **Mesures sur des parties entre bots** :
      - tirs de mitrailleuse bloqués par un obstacle : de 85 % à 13 % ;
      - manœuvres de dégagement des véhicules : de 34 à 0 en 6 minutes ;
      - quand un tank chasse les bots : 9 fois moins d'écrasements.
  - **Étape 3 : lance-missiles et antenne satellite** (chaque camp a au moins une antenne et un lance-missiles) :
    - **Lance-missiles (B)** :
      - E près de son lanceur ouvre le poste de tir ; on vise un véhicule ennemi (cadre jaune « VERROUILLÉ », ou flèche au bord de l'écran s'il est loin), puis un clic lance un missile guidé ;
      - sur le tank, le missile l'immobilise 8 s ; sur le 4x4, il fait les dégâts d'un obus (2 points de blindage) ;
      - un seul missile pour toute l'équipe toutes les 1 min 30 ; le missile est visible sur la rampe quand il est prêt ;
      - le missile monte, vire vers sa cible en laissant une traînée de fumée, puis plonge dessus.
    - **Antenne (A)** :
      - E près de son antenne révèle tous les ennemis pendant 5 s : losanges rouges à l'écran (même derrière les murs) et cercles sur la mini-carte ;
      - une onde radar part de l'antenne ; la recharge est de 1 min 30.
    - **ATH et sons** :
      - sous le score, l'état du missile et de l'antenne de son camp (prêt ou compte à rebours) et l'alerte « REPÉRÉS » quand l'ennemi utilise son antenne ;
      - au-dessus de ses propres cibles, « MISSILE PRÊT » ou « ANTENNE PRÊTE » ;
      - l'équipe visée reçoit l'alerte « MISSILE EN APPROCHE » avec des bips, un ⚠ au-dessus du véhicule et une flèche vers le missile ;
      - sons : départ du missile, impact, impulsion radar.
    - **Bots** : un défenseur va tirer le missile quand le tank ennemi passe la rivière ou approche des cibles ; un autre active l'antenne quand des ennemis approchent.
    - **En ligne et sur mobile** :
      - missiles, recharges et révélation passent par le réseau ;
      - sur mobile, le bouton d'action devient MISSILE, ANTENNE ou QUITTER, et on tire avec le bouton de tir.
  - **Toits des véhicules** (plus de surfaces plates unies) :
    - **4x4** :
      - toit en tôles camouflées avec coutures, rangées de boulons, bandes antidérapantes, trappe arrière et numéro peint ;
      - capot à persiennes ;
      - couronne de tourelle en acier boulonnée, rampe de feux orange et rails de toit ;
      - plancher arrière en tôle larmée avec jerricans, bâche roulée et caisse.
    - **Tank** :
      - dessus de caisse et de tourelle en tôles soudées et boulonnées, avec antidérapant, poussière et rayures ;
      - câbles de remorquage, pelle et pioche, jerricans, coffre arrière et bâche roulée sur la tourelle.
    - **Lance-missiles** : toit de cabine avec trappe, climatiseur et gyrophare.
    - **Camions du camp** :
      - toit de cabine avec coutures, boulons, anneau de trappe et gyrophare ;
      - plateau en tôle larmée.
    - **Épaves de camions et de chars** : tôles calcinées (rouille, cloques, trous d'éclats, cendre), capot arraché et trappe ouverte.
  - **Garde-corps des ponts** :
    - les véhicules ne passent plus à travers : la collision suit maintenant le contour de la caisse, coins compris, face à l'eau et aux garde-corps ;
    - les garde-corps sont solides sur toute la longueur des ponts, y compris au-dessus des berges ;
    - testé en fonçant dans les garde-corps sous 6 angles : la caisse ne dépasse plus (0 px).
  - **Missile contre les cibles** :
    - le lance-missiles peut aussi viser les antennes et les lance-missiles ennemis : un missile leur retire 1 case de vie ;
    - le défenseur concerné reçoit l'alerte « MISSILE EN APPROCHE : votre B1 ! » ;
    - quand aucun véhicule ne menace, les bots s'en servent sur la cible ennemie la plus abîmée, un lance-missiles de préférence.
  - **Ponts** :
    - il faut maintenant 3 C4 pour un grand pont et 1 seul pour une passerelle (affichage « C4 n/3 » ou « n/1 ») ;
    - les bots font sauter :
      - le grand pont près duquel ils repèrent le tank ennemi ;
      - en début de manche (7 fois sur 10), un grand pont que leur propre tank n'emprunte pas ;
      - une passerelle empruntée par des ennemis à pied ;
      - un pont déjà en partie miné, qu'ils terminent.
    - Ils ne détruisent jamais le dernier grand pont intact, ni celui que leur tank va prendre.
    - Ils quittent un pont piégé, et le tank bot change d'itinéraire si son pont est piégé.
  - **Véhicules ennemis repérés** :
    - le tank et le 4x4 ennemis n'apparaissent sur la mini-carte que si un allié les voit directement (centre ou coin de la caisse en vue), s'ils viennent de tirer, ou pendant la révélation de l'antenne ;
    - même règle pour le verrouillage du missile et pour les décisions des bots ;
    - en ligne, le serveur envoie à chaque équipe ce qu'elle a repéré.
  - **Lance-missiles tournés vers l'ennemi** : ils sont toujours posés dans le sens de la longueur, rampe et missile pointés vers le camp adverse (plus aucun lanceur tourné vers le sud ou le nord). Le missile part dans cette direction.
  - **Fusil d'assaut rangé dans les véhicules** :
    - dans le tank, le 4x4 et au poste du lance-missiles, le fusil du soldat ne s'affiche plus : il ne dépasse plus de la tourelle ni de la mitrailleuse ;
    - l'éclair de tir apparaît maintenant à la bouche de la mitrailleuse du 4x4.
  - **Second 4x4 blindé** par camp :
    - il est garé de l'autre côté du tank ;
    - le premier 4x4 escorte le tank ; le second défend les cibles : il intercepte les véhicules ennemis repérés et les soldats ennemis qui approchent, sinon il patrouille autour des cibles, sans traverser la rivière (il choisit un point de patrouille qu'il peut atteindre, il ne reste plus bloqué au garage) ;
    - les bots lui affectent un conducteur et un tireur (après le premier défenseur) ;
    - les 4x4 contournent le véhicule le plus proche pour ne pas se bloquer entre eux.
  - **Sons des véhicules** (refaits ; continus, spatialisés : volume selon la distance, gauche ou droite selon la position) :
    - **Moteurs** : le bruit est construit explosion de cylindre par explosion de cylindre, comme un vrai moteur, au lieu d'un simple bourdonnement. Deux enregistrements de synthèse par moteur (ralenti et haut régime) sont mélangés selon le régime ; le son s'ouvre (plus de mordant) quand on accélère.
    - **Tank** : diesel 6 cylindres lent et lourd (ralenti vers 700 tr/min, 2000 au maximum), sifflement du turbo qui monte avec le régime, grondement grave en roulant, moteur électrique de la tourelle. Plus aucun bruit de chenilles (ni claquement des patins, ni grincement en virage).
    - **4x4 blindé** : moteur 8 cylindres en V au battement irrégulier, plus nerveux (jusqu'à 3300 tr/min), passages de rapports, roulement des pneus et crissement du gravier, moteur de tourelle.
    - **Démarrage et extinction** : démarreur plus discret quand un conducteur s'installe ; le moteur s'éteint doucement quand il descend ; ralenti à l'arrêt.
    - **Chocs** : un véhicule qui percute un obstacle à bonne vitesse fait un choc de tôle (moins fort qu'avant), avec un peu de poussière.
    - **Volume nettement baissé** (mesuré par rapport à une rafale de mitrailleuse du 4x4) :
      - tank qui roule tout près : environ 13 dB en dessous de la mitrailleuse (au début : 6 dB au-dessus) ;
      - tank au ralenti : 22 dB en dessous ; 4x4 qui passe tout près : 12 dB en dessous ;
      - on entend un tank jusqu'à 1400 px et un 4x4 jusqu'à 1100 px, le son baisse vite avec la distance ;
      - à l'intérieur d'un véhicule, son propre moteur est un peu atténué.
    - **Réglages** :
      - le timbre est réglé pour rester audible aussi sur les haut-parleurs de téléphone (peu d'infrabasses) ;
      - les sons se coupent quand l'onglet est caché ou hors du mode Front.
  - **Explosion des véhicules détruits** :
    - **4x4** : son et souffle puissants. Dégâts à tous ceux qui sont proches, alliés compris, jusqu'à 150 px du bord du véhicule : environ 90 PV au contact, 65 à 90 px, 37 à 140 px.
    - **Carburant du 4x4** : il se rallume 1 à 2 s plus tard (seconde explosion plus petite, jusqu'à 60 PV). Il vaut mieux s'éloigner de l'épave.
    - **Lance-missiles détruit** : souffle jusqu'à 190 px (130 PV au maximum), puis le carburant du missile explose une seconde fois.
    - **Antenne détruite** : souffle jusqu'à 150 px (100 PV au maximum).
    - **Protection** : un mur ou un véhicule entre l'explosion et soi protège ; les conducteurs restent à l'abri du blindage ; un 4x4 tout proche est abîmé.
    - **Le kill** est attribué à celui qui a détruit le véhicule.
  - **Traces de pneus et de chenilles** :
    - **Tank** : deux larges bandes de terre tassée, avec un bourrelet sur les bords et la marque des patins tous les quelques pixels ; dans les virages, les traces suivent la courbe.
    - **4x4 blindé** : même système que les camionnettes de la map Neige, en couleurs de terre :
      - une trace par roue : les roues arrière marquent franchement, les roues avant plus légèrement ; en virage, les traces avant s'écartent un peu des traces arrière ;
      - creux tassé aux bords adoucis, sculptures en chevrons qui se raccordent d'un bout de trace à l'autre, fine crête de terre repoussée sur les bords ;
      - en marche arrière, les chevrons gardent leur sens par rapport au 4x4.
    - **Résolution** : sur PC, les traces sont dessinées en pleine résolution (les sculptures restent nettes) ; sur téléphone, en demi-résolution pour économiser la mémoire.
    - Les traces disparaissent en 10 s au plus : elles restent nettes quelques secondes, puis s'effacent en fondu ; tout est effacé à chaque nouvelle manche.
    - Pas de traces sur les ponts (tablier en dur) ; marche arrière comprise.
  - **Essence des 4x4 blindés** (contre le camping) :
    - 1 min 30 d'essence à plein régime. Elle baisse dès que quelqu'un est à bord ; à l'arrêt, le moteur au ralenti consomme 40 % (s'arrêter économise l'essence).
    - Jauge en secondes dans le panneau du conducteur et du tireur (« presque à sec » sous 22 s) ; petite jauge jaune sous la barre de vie des 4x4 alliés.
    - À sec : le moteur tousse et cale, la mitrailleuse n'a plus de courant. L'équipage descend au bout d'une seconde (joueurs compris) et personne ne peut plus y remonter : on combat à pied.
    - Le 4x4 vide reste sur place (« ⛽ À SEC · garage dans N s » au-dessus, gris sur la mini-carte) ; le tank peut le pousser.
    - Pas de plein sur le terrain : **45 s après la panne, le 4x4 réapparaît à son garage avec le plein** (un 4x4 détruit revient, lui, au bout de 20 s), et chaque manche repart avec le plein.
    - Le tank n'a pas d'essence.
  - **Réglages** :
    - rechargement du canon du tank : 8 s (au lieu de 4) ;
    - antennes et lance-missiles : 6 barres de vie, donc 6 obus pour les détruire (au lieu de 4) ; le missile en enlève toujours une ;
    - essence du 4x4 : 1 min 30 à plein régime (au ralenti : 40 % de la consommation).
    - balles 20 % plus rapides (fusils et mitrailleuse du 4x4 : 1152 px/s au lieu de 960), portée inchangée ; vaut pour toutes les cartes.
    - Le tank bot reste en position tant qu'il tire (il ne repart que si rien n'a été tiré depuis un rechargement + 3 s).
  - **Faire descendre les ennemis d'un véhicule** :
    - à pied, contre un véhicule ennemi (tank ou 4x4) arrêté ou presque (moins de 40 px/s) qui a un équipage : **maintenir X 2 s** fait descendre tout l'équipage, joueurs comme bots ;
    - ils ne peuvent pas remonter dans ce véhicule pendant 8 s (message pour le joueur). Pendant les 2 s, on est exposé au tireur sur le toit, et un véhicule qui repart annule tout ;
    - sur téléphone : maintenir le bouton d'action quand on n'a plus de C4 (avec un C4, le bouton pose le C4) ;
    - les bots le font aussi : sans C4, ils viennent sur le flanc d'un véhicule ennemi arrêté et font descendre l'équipage ; les défenseurs le font contre un tank ennemi arrêté près des cibles.
  - **Barrières de protection des camps** :
    - une rangée de « dents de dragon » (pyramides de béton) ferme chaque zone d'apparition (600 px depuis le bord de la carte, de y 1060 à 1740) : les soldats passent entre les blocs, **aucun véhicule ne passe** ;
    - trois portails, là où sortent les routes principales : la barrière se lève pour les véhicules du camp et reste fermée aux véhicules ennemis ;
    - les bots en tiennent compte dans leurs trajets ; barrières et portails sont dessinés sur la mini-carte (portails verts chez soi, rouges chez l'ennemi).
  - **Anti-camping des joueurs (touche X)** :
    - dans un véhicule (tank ou 4x4), **X** fait descendre tout de suite, quelle que soit la place ;
    - à pied, **maintenir X 1,2 s** près d'un véhicule allié où se trouve un joueur fait descendre les joueurs à bord (les bots ne sont pas concernés : on les remplace déjà en montant) ; ils ne peuvent pas remonter dans ce véhicule pendant 15 s et un message les prévient ;
    - sur téléphone (pas de touche X) : maintenir le bouton d'action près d'un véhicule allié plein dont un joueur occupe une place ;
    - aide à l'écran (« Maintiens X · faire sortir le joueur du 4x4 »), barre de progression, et « X : sortir » dans le panneau du siège.
  - **4x4 40 % plus lent** : 159 px/s au lieu de 265 (accélération réduite d'autant).
  - **4x4 bots économes** : ils s'arrêtent au lieu de tourner en rond.
    - Le 4x4 de défense ne tourne plus autour de la menace : il prend un poste fixe avec vue sur elle (le tireur arrose) et n'en change que si la menace se déplace de plus de 250 px, si la vue est bouchée ou au bout de 20 s.
    - Postes de patrouille tenus 12 s (au lieu de 2,5), postes de raid 10 s (et tant que le tireur tire), postes de l'éclaireur 8 s.
    - Tank qui tire : l'escorte reste sur un flanc au lieu de faire des allers-retours toutes les 9 s.
    - Garde-fou : un 4x4 qui a roulé plus de 700 px en 12 s sans s'éloigner de plus de 200 px s'arrête 6 s et change de but.
  - **Bots : routes, escorte, défense** (mesures sur des parties de bots de 6 min) :
    - **Routes** : les véhicules suivent une carte de conduite où les routes principales et les grands ponts coûtent 1, le bord de route 1,7 et le hors-piste 3 (tank 2,4) ; un raccourci en ligne droite n'est pris que s'il ne sort pas de la route. Part du trajet sur la route : 4x4 environ 63 % → 73 %, tank environ 82 % → 90 %.
    - **Moins de zigzags** : cap lissé, but gardé tant qu'il bouge de moins de 110 px, contournement seulement du véhicule qui est devant. Inversions du volant : 4x4 environ −30 %, tank environ −60 %.
    - **Variantes d'escorte**, tirées pour chaque équipe à chaque manche et rappelées sur la carte d'intro (« Escorte des bots… ») ; le rôle s'affiche sur les 4x4 alliés (TÊTE, QUEUE, FLANC, ÉCLAIREUR, DÉFENSE) :
      - convoi : un 4x4 devant le tank, sur la route qu'il va prendre (il le double par le côté libre au départ), un derrière, exactement sur sa trace ;
      - éclaireur : un devant, un qui part en repérage ;
      - garde : un sur le flanc, un qui défend les cibles ;
      - reco : un en repérage, un derrière.
    - **Éclaireur** : il file vers le camp ennemi par les routes (sortie des grands ponts), puis observe les cibles ennemies de loin. Il repère les ennemis jusqu'à 1150 px : les véhicules apparaissent sur la mini-carte de son équipe, et les bots connaissent la position des soldats.
    - Un 4x4 qui se trouve dans le passage du tank se range sur le côté (avant, le tank pouvait rester coincé derrière son propre 4x4). Tank arrêté parce qu'il est bloqué (et pas pour tirer) : l'escorte garde sa place sur la route.
    - **Défense** :
      - deux défenseurs dès le départ (au lieu d'un), postés face à la rivière (d'où viennent les ennemis) et regardant dans cette direction ;
      - l'équipage du 2e 4x4, une fois son 4x4 hors d'usage, défend les cibles ;
      - **menace** = tank ennemi repéré ou entendu de notre côté à moins de 1500 px d'une cible, ou soldats ennemis connus à moins de 1000 px. Les bots libres de notre côté les plus proches viennent en renfort : 4 contre un tank, jusqu'à 5 en tout ;
      - contre le tank : avec un C4, on arrive par l'arrière ; sinon on se place à 300 px, de biais, pour abattre le tireur sur le toit. Contre les soldats : on va sur leur dernière position connue ;
      - banc d'essai (tank ennemi en position de tir près d'une cible) : défenseurs autour du tank en moyenne 0,6 à 3,8 → 2,4 à 3,6 ; C4 posés sur le tank en 75 s : 0 à 5 → 5 à 6.
  - **Conduite des bots** (mesurée sur des parties de bots de 8 min) :
    - **4x4 immobiles** : un 4x4 occupé par des bots restait arrêté 57 à 75 % du temps (à attendre à côté d'un tank sans équipage, planté à son point de patrouille, ou sans chemin quand le tank barrait la route). C'est maintenant moins de 3 %.
    - **Escorte fluide** : le 4x4 roule à la vitesse du tank avec un rappel doux vers sa place, et garde la même place tant qu'elle est libre (plus de saut d'un flanc à l'autre). Les à-coups sont divisés par 3 environ, les coups de volant par 4.
    - **Tank arrêté (il tire)** : le 4x4 se met sur son flanc, hors de la ligne du canon, et change de position toutes les 9 s.
    - **Tank sans conducteur** (équipage mort) : l'escorte n'attend plus à côté, elle part harceler les défenseurs près des cibles ennemies.
    - **4x4 de défense** : patrouille de point en point autour de nos cibles. Quand un ennemi approche, il tourne autour de lui (le tireur arrose) au lieu de rester arrêté. Il ignore les ennemis de l'autre côté de la rivière.
    - **Route barrée** (tank sur un pont, véhicule en travers) : le 4x4 prend un autre chemin ou change de but. Demi-tour en marche avant quand il y a la place, au lieu de longues marches arrière. S'il n'approche plus de son but pendant 5 s, il en change.
    - **Conducteur seul** : il va chercher son tireur qui arrive à pied.
    - **Tank** : un bot seul au canon reprend le volant quand il n'a plus rien tiré depuis 6 s, puis cherche une autre position. Le tank garde sa cible jusqu'au bout (plus d'allers-retours entre deux cibles).
    - **Dernier recours contre le camping** : un véhicule de bots qui n'a ni bougé ni tiré depuis 25 s change de position ; au bout de 3 fois, les bots descendent et ne remontent pas avant 20 s.
  - **4x4 à sec : retour au garage en 45 s** :
    - quand un 4x4 n'a plus d'essence, l'équipage descend comme avant ; 45 s après la panne, le 4x4 disparaît et réapparaît à son garage, plein fait et réparé, prêt à repartir ;
    - au-dessus du 4x4 allié à sec : « ⛽ À SEC · garage dans N s » ; si la place du garage est occupée, il réessaie toutes les 2 s ; détruit pendant l'attente, il revient comme un 4x4 détruit (20 s).
  - **4x4 encore 15 % plus lent** : 135 px/s au lieu de 159 (accélération 214 au lieu de 252).
  - **Station d'antenne satellite plus militaire** (même emprise de 150 × 150, mêmes règles) :
    - enceinte de bastions HESCO (gabions de géotextile sable dans leur grillage) coiffée de barbelés concertina, entrée côté ennemi avec barrière levante rouge et blanche ;
    - **grande parabole SATCOM** vert olive de 112 de diamètre (au lieu de 106, blanche) sur une vraie tourelle : socle béton, tourelle d'azimut, fourche d'élévation avec moteur et contrepoids, structure arrière à 12 nervures, cornet d'alimentation et sous-réflecteur Cassegrain sur 4 bras ;
    - **pylône en treillis de 140** (au lieu d'un mât de 96) : trois jambes qui s'affinent, croisillons, deux plateformes, trois grandes antennes secteurs, deux faisceaux hertziens, balises rouges, et **un radar de veille qui tourne au sommet** (il s'arrête quand la station est détruite) ;
    - **radome géodésique** sur son socle ;
    - **abri de transmissions** (conteneur militaire nervuré « SATCOM ») sous un **filet de camouflage**, avec une antenne log-périodique HF en arête de poisson sur son toit et un fouet VHF ;
    - groupe électrogène derrière des sacs de sable, fûts de carburant, chemins de câbles entre les équipements ; la bande de couleur de l'équipe court sur le bord de la dalle, autour de l'abri et du radome.
  - **Interface du Front simplifiée** (pour qu'un nouveau joueur s'y retrouve) :
    - **couleurs relatives partout** : bleu = votre camp, rouge = l'ennemi (étiquettes, mini-carte, flèches, cartes des joueurs ennemis en haut), quel que soit votre camp (ACIER ou CENDRE) ; les bandes de couleur des antennes et lance-missiles suivent la même règle ;
    - **contour au sol** autour de chaque cible : rouge et pulsé autour des cibles ennemies, bleu autour des vôtres ; il disparaît quand la cible est détruite ;
    - **étiquettes en clair** au lieu des codes A1 / B2 : « VOTRE ANTENNE », « ANTENNE ENNEMIE », « VOTRE LANCE-MISSILES », « LANCE-MISSILES ENNEMI », avec une icône (parabole, missile), une barre de vie et, chez vous, l'état (« MISSILE PRÊT », « antenne dans 0:45 ») ; les cibles ennemies ont des repères de visée autour de l'icône ;
    - **véhicules** : vos tank et 4x4 ont une petite étiquette (icône et deux ronds pour les places : plein = occupé), le 4x4 garde sa barre de blindage et sa jauge d'essence ; les véhicules ennemis ont un chevron rouge (et la barre de blindage du 4x4) ; le rôle des 4x4 bots (TÊTE, QUEUE…) n'est plus affiché ;
    - **bandeau sous le score** : vos 4 cibles (« À DÉFENDRE ») face aux 4 cibles ennemies (« À DÉTRUIRE 0/4 »), en icônes avec leur vie, une croix quand elles sont détruites ; dessous, l'état de votre missile et de votre antenne, et « REPÉRÉS ! » quand l'antenne ennemie vous révèle ;
    - flèches au bord de l'écran avec l'icône de la cible ou du tank au lieu d'un code ; mini-carte avec icônes ;
    - **intro de manche** réduite à l'essentiel : l'objectif en une phrase, une légende (votre tank en bleu, antenne et lance-missiles ennemis en rouge) et trois commandes (E : monter, E maintenu : C4, X : sortir) ; les détails (essence, escorte des bots, durées) sont retirés ;
    - **panneau des commandes** du Front réduit à 9 lignes courtes (il débordait) ; panneau du véhicule réorganisé (Blindage, Essence, Canon prêt / Rechargement alignés) ;
    - messages en clair : « Antenne ennemie détruite ! », « MISSILE EN APPROCHE : votre lance-missiles ! » ; pas d'étiquettes pendant le décompte (elles passaient sur la carte d'intro), et elles s'estompent quand elles passent sous le haut de l'écran.
  - **10 contre 10** (au lieu de 8 contre 8) :
    - deux points d'apparition de plus par camp (entre les apparitions et le tank) ; 20 soldats, étiquettes et grenades prévus pour 20 ;
    - bots de chaque camp : équipages du tank et des deux 4x4, 2 défenseurs, 2 « poseurs de C4 » qui partent vers les cibles ennemies ;
    - **`server.js` a changé** (taille du salon Front : 10 par camp) : il faut le redéployer avec `index.html`.
  - **C4 sur les antennes et les lance-missiles** (la défense compte davantage) :
    - au bord d'une antenne ou d'un lance-missiles ennemi, **maintenir E 2 s** (téléphone : bouton d'action « C4 ») pose le C4 ; il explose 3 s plus tard : **1 case de vie en moins** et dégâts aux ennemis tout autour ;
    - toujours 1 C4 par vie ; on ne peut pas poser plus de C4 en attente que la cible n'a de cases de vie ;
    - un compte à rebours s'affiche sur le C4 (jaune sur les cibles ennemies, rouge sur les vôtres) ; quand l'ennemi en pose un sur votre cible : message « C4 posé sur votre antenne ! », bip, cible qui clignote sur la mini-carte et flèche au bord de l'écran ;
    - les bots « poseurs de C4 » vont poser le leur sur les cibles ennemies, et les autres bots à pied le font quand une cible ennemie est à moins de 550 px ; les défenseurs abattent les ennemis qui approchent de leurs cibles.
  - **Lance-missiles et antenne : recharge de 45 s** (au lieu de 1 min 30) ; **le missile retire 2 cases** à une antenne ou un lance-missiles (au lieu d'une ; le tank reste immobilisé 8 s).
  - **Plus de cartes de joueurs sous le tableau des scores** dans le Front : le bandeau des cibles remonte juste sous le score.
  - **Corrections (parties en ligne)** :
    - **sons du Front rétablis** : depuis la refonte de l'interface, plus aucun son propre au Front ne sortait (départ et impact des missiles, coup de canon du tank, bips du C4 et du pont piégé, impulsion de l'antenne, moteurs du tank et des 4x4). Un nom de couleur de l'interface masquait celui du système audio ; c'est réparé, en solo comme en ligne ;
    - **les messages à l'écran ont un signal sonore** : deux notes montantes pour une bonne nouvelle (cible ennemie détruite…), descendantes pour une mauvaise (votre 4x4 détruit, C4 sur votre cible…), une note pour une info neutre ; pas de doublon quand un bip est déjà joué ;
    - **choix de l'équipe CENDRE** : le jeu est en 10 contre 10, mais un serveur resté en 8 contre 8 (ancien `server.js` sur Fly) plaçait le joueur choisi chez CENDRE dans la place n° 9, que le jeu attribue à ACIER. Désormais le serveur lit la taille d'équipe directement dans `index.html` (le même fichier que sa simulation) : les deux ne peuvent plus diverger. Et si le serveur n'est pas à jour, le salon l'affiche en rouge (« Serveur pas à jour… redéploie server.js et index.html ») ;
    - le salon du Front affiche « Escorte du tank · premier à 4 manches » (au lieu de « Bombe · manches »).
  - **Camps ALLIÉS et AXE, couleurs fixes** :
    - les camps s'appellent **ALLIÉS** (bleu, ex-ACIER) et **AXE** (marron-orangé, ex-CENDRE) : salon, score, fin de manche, carte d'intro (« Votre camp : ALLIÉS · ennemi : AXE ») ;
    - les couleurs ne dépendent plus du joueur : tout ce qui appartient aux ALLIÉS est **bleu** (bandes et contour au sol des antennes et lance-missiles, étiquettes, barres de vie, icônes du bandeau, flèches, mini-carte, tank et 4x4 avec un camouflage gris-bleu et des bandes bleues) ; tout ce qui appartient à l'AXE est **marron-orangé** (camouflage sable, bandes, contours, étiquettes, icônes) ;
    - le texte reste relatif (« VOTRE ANTENNE » / « ANTENNE ENNEMIE ») et les cibles ennemies gardent leurs repères de visée et leur contour qui pulse ; les alertes (C4 sur votre cible, missile en approche, repérés) restent en rouge.
  - **Drapeaux de la seconde guerre mondiale** (décor) : 3 mâts par camp (au QG et près des portails nord et sud), avec socle en béton, boule dorée et drisse ; le drapeau flotte presque à plat dans le vent pour être lisible vu d'en haut :
    - ALLIÉS : États-Unis (version à 48 étoiles, 1912-1959), Royaume-Uni (Union Jack), URSS (version 1936) ;
    - AXE : Allemagne (drapeau noir-blanc-rouge officiel de 1933 à 1935 ; pas de croix gammée, symbole interdit dans plusieurs pays), Royaume d'Italie (tricolore à l'écu de Savoie couronné), Japon (Hinomaru de 1870) ;
    - chaque mât montre les drapeaux du camp qui occupe ce côté de la carte (les camps changent de côté d'une manche à l'autre).
  - **Drapeaux améliorés, 25 % plus petits, mâts plus hauts** :
    - tissu de 28,5 de haut (au lieu de 38) ; mât de 165 (au lieu de 136) : le drapeau flotte bien au-dessus du camp ;
    - textures deux fois plus fines (étoiles, Union Jack contre-changé, faucille et marteau en croissant, couronne d'Italie à fleurons et perles), trame du tissu, gaine de drisse blanche à œillets côté mât, bout libre un peu effiloché ;
    - le vent fait courir une vague vers le bout libre, qui s'affaisse un peu, avec des rafales ; mât plus fin, pomme et collerette dorées, drisse claire.
  - **Drapeaux vus depuis le camp de l'AXE** : la caméra du camp de l'est est retournée d'un demi-tour, et les drapeaux apparaissaient de dos, à l'envers et écrasés. Le tissu et la drisse tournent maintenant avec la caméra : chaque joueur voit les drapeaux de face, mât à gauche, dans le bon sens, quel que soit son camp.
  - **Menu** : le texte du mode Front indiquait encore « 8 contre 8 » ; il affiche « 10 contre 10 ».
  - **Serveur allégé en mode Front** (moins de latence) :
    - les grilles de conduite des véhicules sont préparées pendant le décompte de début de manche (avant : tout se calculait au premier instant de jeu, d'où un à-coup de 50 ms et plus) ;
    - les pilotes bots décident 20 fois par seconde au lieu de 60, et les tests de collision écartent d'abord les véhicules et barrières trop loin ;
    - le code des bots et des véhicules n'est plus recompilé sans cesse par le moteur JavaScript (objets de forme stable, cache de chemins sans désoptimisation) ;
    - mesure sur une partie de bots : **environ 32 % de calcul en moins** par seconde de jeu, et le pas de simulation le plus long passe de 77 ms à 22 ms. Important sur Fly en `shared-cpu-1x` : la machine n'a droit qu'à environ 6 % d'un processeur en continu, et le serveur est freiné quand il dépasse.
  - **Conduite des bots corrigée** (tank et 4x4) :
    - **freinage** : un véhicule qui en a un autre devant lui, dans sa voie, ralentit puis s'arrête à distance ; s'il suit un véhicule qui roule dans le même sens, il cale sa vitesse sur la sienne. Les collisions entre véhicules passent d'environ 4 par minute à presque zéro ;
    - **face à face** sur une route ou un pont : le moins prioritaire (le 4x4 devant un tank, sinon le numéro le plus haut) recule un court instant et passe ailleurs ; un tank qui cède devant un véhicule ennemi prend un autre pont ;
    - **véhicule arrêté devant** : après 2,5 s d'attente (6 s si c'est un allié avec équipage, qui va repartir), le bot le contourne, seulement si le détour reste raisonnable ;
    - **plus de longues marches arrière** : un but derrière le véhicule fait faire demi-tour en marche avant (le tank pivote sur place) ; il ne reste que de courtes manœuvres de dégagement d'une seconde, jamais vers un véhicule tout proche ;
    - **plus de toupie** : un 4x4 ne choisit plus à chaque instant quel véhicule contourner (son itinéraire basculait d'un côté à l'autre et il tournait sur place) ; l'escorte du tank garde sa place au moins 1,5 s ; un véhicule qui tourne quand même sur lui-même abandonne son but et marque une pause ;
    - **épave du 4x4** : quand l'autre 4x4 est garé sur son garage, il réapparaît juste à côté (avant, la réapparition était reportée sans fin et l'épave redevenait solide une seconde sur deux au milieu de la route).
  - **Bots qui restent dans un véhicule à l'arrêt** :
    - un véhicule bot qui ne progresse plus (moins de 100 px en 11 s, sans tirer) change de but, puis au 2e constat l'équipage descend. Avant, le compteur repartait à zéro juste après chaque constat, et l'équipage ne descendait jamais ;
    - 3 blocages rapprochés (attente sans fin, toupie, impasse) font aussi descendre l'équipage ;
    - les bots descendus vont aider à pied pendant 30 s : C4 sur les cibles ennemies, défense, attaque ; le véhicule abandonné n'est pas repris tout de suite ;
    - jamais de descente forcée quand un joueur humain est à bord.
  - **Soldats bots coincés contre un véhicule** : celui qui a un véhicule juste devant lui le longe comme un mur, du côté qui va vers son but, et le pas de côté quand il est coincé tient compte des véhicules. Le temps passé coincé passe d'environ 27 s à moins d'une seconde par minute de jeu.
  - Mesures sur 9 parties de bots de 5 minutes, avant → après : collisions entre véhicules 3,9 → 0,02 par minute ; chocs 3,3 → 0,2 ; toupies 2 → 0,6 ; marche arrière 19 s → 4 s par minute (plus aucune de plus de 1,5 s) ; soldats coincés 4 → 0,4 par minute. Matchs complets joués jusqu'à la fin sans erreur.
  - Seul `index.html` change pour cette étape (le serveur lit sa simulation dans `index.html`) : à remplacer sur GitHub et sur Fly.
  - **Bots groupés autour du tank** (ils le laissaient vide les deux tiers du temps) :
    - **reprise du tank** : dès qu'une place du tank est vide, les bots libres les plus proches (son équipage d'abord, jamais un défenseur loin de chez lui) y montent, même en plein combat quand la voie est libre ; le tank attend jusqu'à 6 s l'équipier qui arrive ;
    - **le tank n'est plus abandonné** : son équipage ne descend plus quand il est bloqué, le tank change de position à la place ;
    - **défense du tank** : quand des soldats ennemis s'approchent à moins de 450 px du tank, les 3 bots libres les plus proches vont les chasser ;
    - **attaque concentrée** : toute l'équipe frappe la même cible (celle que vise le tank, sinon la plus abîmée). Les attaquants accompagnent le tank tant qu'il en est loin, puis se postent autour de la cible ; les poseurs de C4 et le canon des bots la visent en priorité ;
    - mesures sur 10 parties de bots de 5 minutes, avant → après : tank sans équipage 52 % → 20 % du temps, tank avec ses deux places occupées 29 % → 49 %, cibles détruites +40 %.
  - **Canon du tank** :
    - **l'obus passe au-dessus des obstacles** (bâtiments, murs, son propre camp) et touche la première cible, le premier véhicule ou le premier soldat ennemi sur sa trajectoire ; il vole en cloche ;
    - **portée réduite** de 1 150 à 850 ; les bots se mettent en position de tir entre 440 et 630 px de leur cible ;
    - **viseur** quand on est au canon : réticule au point d'impact, avec le nom de ce qui sera touché (« LANCE-MISSILES B2 », « ANTENNE A1 », « 4x4 ENNEMI », « TANK ENNEMI », « SOLDAT ENNEMI » ou « RIEN EN VUE · portée max »), la vie de la cible et l'état du canon (prêt, rechargement, immobilisé). Un petit cercle montre où la tourelle va se tourner.
  - **Visée automatique sur mobile** : un conducteur à l'abri dans son véhicule n'est plus visé ; seul un tireur sur le toit l'est (on ne vide plus son chargeur sur un véhicule vide en haut).
  - **Noms des cibles** : antennes A1, A2… et lance-missiles B1, B2… sur les étiquettes (« A1 · ANTENNE ENNEMIE »), les flèches au bord de l'écran, la mini-carte, le bandeau sous le score (icône + numéro) et les messages (« Lance-missiles ennemi B2 détruit ! », « C4 posé sur votre antenne A1 ! »).
  - **Nouvelle commande du lance-missiles** : près de son lance-missiles, missile prêt, E (ou le bouton MISSILE) ouvre une **carte de tir** de toute la carte :
    - tout y apparaît : antennes, lance-missiles, tank et 4x4 ennemis (même non repérés), avec leurs noms ; vos propres cibles et véhicules en retrait, votre lance-missiles marqué « VOUS » ;
    - **toucher (ou cliquer) une cible** : le missile part, guidé sur elle ; à la souris, la cible survolée s'allume et la trajectoire s'affiche, avec l'effet du tir en en-tête ;
    - **toucher un autre point de la carte** : un viseur « TIRER ICI » apparaît, il faut le toucher pour confirmer (pas de missile perdu par erreur) ; le missile fait des dégâts autour du point et touche la cible ou le tank qui s'y trouve ;
    - **FERMER** (ou E, ou le bouton QUITTER sur mobile) quitte le lance-missiles ;
    - marche en solo et en ligne (le choix part au serveur avec les commandes du joueur).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Tanks sur des routes séparées : ils ne se croisent plus** :
    - **la cause** : chaque tank tirait un pont au sort, mais il visait la sortie de ce pont de l'autre côté de la rivière, et le plus court chemin vers cette sortie passait presque toujours par le pont du milieu. Les deux tanks y allaient et restaient face à face ;
    - chaque tank va maintenant d'abord à l'**entrée** de son pont, de son côté, puis à la sortie, et garde son pont jusqu'à l'autre rive ;
    - le **pont du tank ennemi lui est interdit** (le pont qu'il va prendre, et tout grand pont près duquel il se trouve) ; s'il est bloqué, il prend un autre pont, jamais le plus court chemin par celui de l'ennemi ; un tank ennemi conduit par un joueur qui s'engage sur son pont le fait aussi changer ;
    - une fois passé, il ne revient plus de l'autre côté : sa cible et sa position de tir se choisissent au plus court **par les routes** (avant, à vol d'oiseau, il refaisait parfois tout le tour par sa base) ;
    - **variété** : 3 fois sur 4, chaque tank prend un autre pont qu'à la manche précédente ;
    - le tank démarre 150 px en retrait de la porte de sa base : il peut tourner vers les sorties nord et sud au lieu de rester coincé dans la porte ; s'il n'a pas la place de faire demi-tour, il recule un peu (1,6 s au plus) ;
    - **conducteur seul** : quand le tireur est tué et que des ennemis sont tout près, le conducteur bot ne monte plus au canon (il y serait exposé) ; il se replie vers la sortie de son pont et y attend son tireur ;
    - mesures, avant → après : tanks qui se rencontrent 4 manches sur 6 → 0 sur plus de 40 manches ; sortie de la base en 20 s → 12 s en moyenne ; tank sans équipage environ 20 % du temps dans les deux cas ; cibles détruites +30 %.
  - **4x4 : une seule escorte au plus, des missions variées** :
    - 11 combinaisons tirées au sort à chaque manche (jamais la même que la manche d'avant, rôles des deux 4x4 échangés au hasard) : tête, queue, flanc, attaque, garde, éclaireur, pointe, sentinelle, commando, patrouille, veille. **Jamais deux escortes** ; dans 4 combinaisons sur 11, personne n'escorte ;
    - **attaque** (nouveau) : le 4x4 choisit une antenne ou un lance-missiles qui n'est pas la cible du tank ni celle de l'autre 4x4, y va par un autre pont que celui de son tank ; tout près, l'équipage bot qui a du C4 descend le poser (le tireur sans C4 reste au canon et couvre), puis remonte. Sans C4, il tourne autour de la cible et son tireur arrose les défenseurs ;
    - **défense** et **repérage** comme avant (l'éclaireur passe par le pont de son tank en dernier) ;
    - la mission change en cours de manche (toutes les 1 min 20 à 2 min 30, et au retour au garage, 6 fois sur 10), toujours sans deuxième escorte ;
    - un 4x4 arrêté sur lequel son tank attend (poste de défense dans une sortie de la base) lui laisse la place ;
    - mesures : deux escortes en même temps 12 % du temps → 0 %.
  - **Plus de toupie** : un 4x4 qui tourne en rond (plus d'un demi-tour sans s'éloigner) s'arrête un instant et change de point au lieu de continuer à tourner ; un 4x4 d'escorte dont la place est juste derrière lui reste où il est au lieu de faire demi-tour sur place. Toupies 0,8 → 0,36 par minute de jeu.
  - **Son du 4x4 moins répétitif** :
    - boucles du moteur de 4,8 s et 2,2 s au lieu de 1,8 s et 0,55 s, avec une force d'explosion qui varie d'un cycle à l'autre ; le régime flotte un peu (plus au ralenti) ;
    - passages de rapport variés : seuils propres à chaque 4x4, sans va-et-vient entre deux rapports, coupure des gaz au passage, coup de gaz en rétrogradant ;
    - lever de pied (le moteur retombe, petites détonations à l'échappement), cliquetis de caisse sur les bosses, gravier bien plus présent hors de la route, pneus qui frottent dans les virages serrés, sifflement de transmission qui suit la vitesse ;
    - chaque 4x4 a sa propre voix (moteur un peu plus grave ou plus aigu) ;
    - la répétition mesurée en croisière passe de 0,46 à 0,12 (corrélation du son avec lui-même au bout d'une boucle).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Conduite des véhicules par le joueur, plus simple** : les commandes suivent le véhicule, plus l'écran. Haut (Z / W / ↑) = avancer, bas (S / ↓) = reculer, gauche / droite = tourner le véhicule sur lui-même vers sa gauche / sa droite, quelle que soit sa direction à l'écran. Plus de demi-tour automatique : avant, le véhicule tournait pour se mettre dans la direction de la touche et faisait demi-tour tout seul quand on appuyait à l'opposé. Même chose au joystick sur mobile (haut = avancer, bas = reculer, côtés = tourner). À pied, rien ne change.
  - **Bots : plus de demi-tour forcé pour les 4x4** : quand leur chemin repart derrière eux, ils tournent normalement vers lui ; ils ne reculent un peu que si la caisse ne peut pas tourner (passage étroit). Le tank garde son demi-tour (il pivote sur place).
  - **Les deux 4x4 d'une équipe ne prennent jamais la même route** :
    - chaque 4x4 qui sort (attaque, repérage) a son propre grand pont, jamais celui de l'autre 4x4 ni, si possible, celui du tank (que suit l'escorte) ; au départ, chacun prend le pont du côté de la base où il est garé ;
    - le pont de l'autre 4x4 est fermé dans sa carte de conduite : il ne l'emprunte pas non plus pour revenir ou pour aller plus loin ;
    - l'éclaireur passe par son pont puis observe les cibles de ce côté ; le 4x4 en raid (tank sans conducteur) passe par le pont du tank ;
    - si les deux 4x4 se retrouvent quand même à moins de 300 px hors de la base, le moins prioritaire (défense < repérage < attaque < escorte) s'écarte ; un poste de défense n'est jamais pris à côté de l'autre 4x4 ; jamais deux 4x4 en défense ;
    - mesures sur 16 parties de bots de 5 minutes, avant → après : passages de rivière par le même pont que l'autre 4x4 3 sur 51 → 1 sur 46 en moyenne ; les deux 4x4 à moins de 350 px l'un de l'autre hors de la base 10 % → 4 % du temps (surtout des croisements brefs pendant un combat).
  - **Menu** : la version affichée est V3.5.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Base de départ refaite (carte Front, les deux camps)** :
    - **le gros bunker en béton est retiré**, ainsi que le bric-à-brac du milieu de la base (sacs de sable, arbres morts, caisses, trous d'obus) ;
    - **aire de stationnement** en dalles de béton (joints, taches d'huile, traces de pneus) avec les emplacements peints en jaune : « TANK » au centre, « 4x4 » au nord et au sud, flèches vers la porte ;
    - **spawn reculé** : le tank part 280 px plus au fond (x 300 au lieu de 580, dans la porte avant), les 4x4 à côté de lui, les soldats tout au fond de la base. Rien ne gêne le tank dans un cercle de 120 px : il pivote sur place sans rien toucher, vers la porte est ou vers les sorties nord et sud ;
    - contre le fond : tentes, caisses de munitions et fûts, drapeau du camp et antenne radio ;
    - **deux tours de guet**, une à chaque bout de la base : quatre pieds en rondins contreventés, plate-forme à 100 de haut, parapet de sacs de sable, toit à deux pans en tôle ondulée, échelle, antenne, et un **projecteur qui balaie lentement l'avant de la base** (cône de lumière) ;
    - **grillage de guerre** à la place des dents de dragon : poteaux d'acier sur socles en béton, treillis en losanges rouillé, bavolets inclinés vers l'extérieur avec trois fils de barbelés, concertina de barbelés au pied côté extérieur, bande de terre retournée. Il arrête maintenant aussi les soldats (les balles et la vue passent au travers) : on sort par les portails ;
    - **portails coulissants** sur les trois sorties : poteaux rayés jaune et noir avec gyrophares, rail au sol, vantail grillagé sur roulettes avec un panneau STOP. Le vantail glisse le long de la clôture quand un véhicule du camp arrive à moins de 280 px ou qu'un soldat passe, puis **se referme derrière** (environ 1 s, gyrophares qui clignotent et bruit du moteur). Les véhicules ennemis ne passent toujours pas ;
    - au départ, le 4x4 d'escorte suit le tank tant qu'il n'est pas sorti de la base (il ne cherche plus à le doubler ou à se mettre sur son flanc dans la porte) ;
    - mesures : sortie du tank en 10 à 17 s (médiane selon les séries), les soldats quittent la base en 4 s, aucun soldat coincé.
  - **Commandes** : le panneau rappelle la conduite (« ↑ ↓ ← → · au volant : avancer · reculer · tourner »).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Base sans dalle de béton** : l'aire de stationnement en béton est retirée ; le sol de la base est une cour en terre battue (bords adoucis, gravier, traces).
  - **Bouts des routes** : les routes nord et sud ne s'arrêtent plus net au milieu de la base, elles rejoignent la route centrale dans la cour (simple décor, la conduite des bots ne change pas) ; les routes ont des bouts et des virages arrondis, et les pistes qui finissent en pleine campagne s'élargissent et s'effacent dans la terre.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Marquages jaunes au sol** : les emplacements du tank (« TANK ») et des deux 4x4 (« 4x4 ») et les flèches vers la porte sont peints à même la terre de la base, peinture usée, sans dalle.
  - **Lance-missiles dans le grillage** : les deux emplacements de cibles collés à la clôture de chaque base sont 60 px plus loin ; un lance-missiles (et son missile) ne touche plus le grillage.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Départ des véhicules (Front)** : plus de tank ni de 4x4 bloqués au début de la manche.
    - le tank sort d'abord ; les 4x4 restent garés à leur place jusqu'à ce qu'il ait quitté la base (il ne les attend plus : un 4x4 garé qui attend son tour est contourné tout de suite), puis ils partent un par un ;
    - **chaque 4x4 sort par le portail de son pont** (nord, est ou sud) : l'attaque et le repérage prennent un pont du côté de la base où ils sont garés (celui du nord ne traverse plus la base devant le tank), l'escorte passe par le portail du tank, la défense par un portail que n'utilisent ni l'autre 4x4 ni le tank ;
    - 4x4 de défense : plus de halte devant un portail ni sur une route près de la base (il barrait la sortie du tank) ;
    - un véhicule coincé tout contre le grillage, dans une case où la conduite ne passe pas, se croyait arrivé à son but et ne bougeait plus : il ne s'arrête maintenant que s'il est vraiment arrivé ;
    - mesures sur 60 débuts de manche, avant → après : véhicules bloqués plus de 6 s près de la base 23 sur 40 débuts → 3 sur 60 (des haltes de défense brèves, hors de la base) ; 4x4 jamais sortis de la base en 60 s 5 → 0 ; sortie du tank 10 s → 8 s, des 4x4 12 s → 11 s ; les deux 4x4 d'une équipe par la même sortie 15 sur 80 → 2 sur 120, ensemble sur la même route 3 à 11 % du temps → 1 %.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Épaves des 4x4 (Front)** : la carcasse d'un 4x4 détruit disparaît 5 s après l'explosion, dans une bouffée de fumée (elle ne bloque plus le passage ni les tirs).
  - **Chrono de retour du 4x4** : à sa place de garage dans la base, un anneau jaune se remplit avec les secondes restantes et « RETOUR DU 4x4 » (vert dans les 3 dernières secondes) ; le même chrono s'affiche dans le bandeau du haut (« 4x4 dans 12 s ») et sur la mini-carte, à l'emplacement du 4x4 dans la base.
  - **Passage barré par un véhicule** : un bot au volant qui reste 6 s immobile derrière un autre véhicule (ou coincé contre lui) change d'itinéraire.
    - à 6 s, il contourne le véhicule même si le détour est long, et pivote vers le détour au lieu d'attendre arrêté ;
    - s'il n'y a pas de détour (pont barré) ou si rien n'a bougé 2 s plus tard, il prend un autre chemin : le tank change de pont (un pont barré par un véhicule vide ou allié est évité 45 s, même si le seul autre pont est près de l'axe du tank ennemi), un 4x4 d'attaque ou de repérage prend un autre pont ;
    - un 4x4 qui cède le passage s'écarte sur le côté du chemin du véhicule qui attend, au lieu de reculer devant lui ; une escorte qui gêne son tank change de place ;
    - mesures (un 4x4 vide garé en travers de la route juste devant le véhicule), avant → après : tank immobile au plus 12,5 s → 6,5 s (médiane), plus de 15 s dans 2 cas sur 6 → 1, tank qui finit par passer ailleurs 4 sur 6 → 5 sur 6 ; 4x4 immobile au plus 12,5 s → 6,3 s, plus de 15 s 3 cas sur 8 → 0 ; conduite générale : toupies 0,38 → 0,22 par minute, marches arrière 4,3 → 3,7, équipages immobiles 1,3 → 0,8 ; les tanks ne se croisent toujours pas.
  - **Traductions anglaises** : menu (❄️ SNOW, 🧟 FOREST · ZOMBIE MODE, ⚔️ FRONT · WAR 10 VS 10), noms de cartes du salon (POLAR BASE · DAY · 6 vs 6, NEON GRID · 4 vs 4, FRONT · 10 vs 10…), équipes du Front (ALLIES / AXIS), « Code Red · first to 4 rounds », fins de manche du Front (Targets destroyed, Time up, Draw), « 6 players ready. », « READY ✓ ».
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Bots plus forts et plus malins (Front)**
    - **Missiles** : le bot le plus proche du lance-missiles tire dès que le missile est prêt (avant : seulement après 20 s d'attente sans menace) ; cible : le véhicule ennemi menaçant, sinon la cible ennemie qu'on peut achever, un lance-missiles ennemi ou la cible attaquée par notre tank. Un défenseur y va plutôt qu'un attaquant qui vient de réapparaître, et il ne reste plus planté à 50 px du lanceur sans s'en servir.
    - **Antenne** : activée aussi pour préparer l'assaut (notre tank ou deux bots près d'une cible ennemie : les défenseurs sont révélés).
    - **C4 sur les antennes et lance-missiles** : 3 attaquants à pied par équipe (au lieu de 2) ; loin de la cible, ils font route avec notre tank au lieu de traverser seuls ; près du point de pose, ils avancent en tirant au lieu de s'arrêter à chaque duel ; ils gardent leur C4 pour les cibles (plus de ponts à faire sauter pour eux, plus de C4 sur un véhicule de passage, sauf s'il leur barre le chemin ou menace nos cibles) ; quand notre tank est près de la cible commune, les bots libres à moins de 1400 px viennent la miner ; davantage de 4x4 en mission d'attaque au C4, et tout équipage de 4x4 qui passe à moins de 340 px d'une cible ennemie descend la miner.
    - **Tir** : réaction plus rapide, cadence et précision meilleures (mode Front seulement) ; pas de tir dans le grillage de la base ennemie.
    - mesures (20 manches entre bots), avant → après : missiles sur les cibles 0,32 → 0,80 par minute, missile prêt mais inutilisé 32 → 10 s par minute, C4 posés sur les cibles 0,17 → 0,48 par minute (près de 3 fois plus), antennes activées 1,0 → 2,0 par minute, cibles détruites par manche 1,8 → 2,05.
  - **Grillage et portails de la base** : ils arrêtent les balles des ennemis (étincelle et son métallique) ; les balles de l'équipe de la base passent. Aucun ennemi ne peut entrer dans la base : les portails sont fermés pour les soldats ennemis (c'était déjà le cas pour leurs véhicules) et ne s'ouvrent plus à leur approche. Les bots ne visent plus et ne poursuivent plus un ennemi derrière ce grillage.
  - **Véhicules +15 %** : tank 76 → 87, 4x4 135 → 155.
  - **Véhicule bloqué sur un pont** : après un blocage, il ne pivote plus sur le tablier (il se coinçait en travers contre le parapet) : il se remet dans l'axe du pont et roule ou recule tout droit jusqu'à en être sorti ; coincé sans pouvoir pivoter, il avance au pas pour retrouver de la place. Un pont barré par un véhicule fait choisir un autre pont, mais jamais celui du tank ennemi.
  - **Anglais** : « Allié 4 » restait en français dans le fil des éliminations (« Ally 4 »).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Carte du Front : la longue ligne de tranchée en zigzag disparaît** (avec ses murets de sacs de sable, des deux côtés) ; le reste de la carte ne change pas.
  - **Tranchées creusées** : les tranchées près de la rivière (mêmes emplacements) sont de vraies fosses en 3D : sol découpé, parois boisées, fond boueux, caillebotis, poteaux de soutènement, terre retournée et mottes tout autour. Un soldat qui y descend apparaît plus bas ; les véhicules ne roulent plus dedans (les bots les contournent).
  - **Rivière** : berges au contour irrégulier (boue humide sombre en bord d'eau, terre sèche au-dessus, cailloux), eau plus claire sur les bords et plus sombre au milieu, courant, stries d'écume, écume le long des berges, quelques reflets.
  - **Sol** : texture de détail à trois échelles (plus de motif qui se répète), flaques d'eau de pluie, touffes d'herbe sèche et cailloux en relief (hors routes, rivière, tranchées et bases).
  - **Traces de pas** : chaque soldat à pied laisse des empreintes de bottes qui s'effacent en 16 s (pas sur les ponts ni dans l'eau) ; d'anciennes traces légères partent des bases et des tranchées.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Traces de pas** : elles s'effacent maintenant au bout de 5 s (nettes 2,5 s puis fondu) ; plus d'anciennes traces permanentes.
  - **Grenades des bots (Front)** : les bots à pied lancent leur grenade (1 par vie) sur un ennemi qui pose du C4 à portée, sur un ennemi repéré à couvert (hors de vue) ou dans une tranchée, ou sur au moins deux ennemis groupés, entre 150 et 420 px, jamais près d'un allié ; avant, ils ne la lançaient presque jamais (1 grenade en 20 min de parties simulées → 157).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Rivière animée** : le temps de l'eau n'était jamais mis à jour (une ligne du code était passée derrière un commentaire), le courant restait figé. L'eau bouge maintenant : courant, stries d'écume et écume des berges qui défilent, vaguelettes éclairées qui descendent le courant avec quelques reflets du soleil, et débris flottants (branches, feuilles, plaques d'écume) emportés par le courant.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Lance-missiles et antennes écartés** : devant chaque base, deux emplacements de cibles voisins (au nord et au sud) étaient à 34 px l'un de l'autre, un lance-missiles touchait presque l'antenne d'à côté ; ces deux places sont déplacées de 50 à 60 px, il y a maintenant au moins 110 px entre deux cibles (un soldat passe entre elles). Le petit décor et les cratères sous les nouvelles places sont retirés ; même chose en miroir chez l'adversaire.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Salon de partie privée refait** :
    - **Salon permanent** : le code reste le même partie après partie ; un salon disparaît seulement après 15 minutes sans aucun joueur.
    - **Vote de la carte et du mode** dans le salon : chacun vote (Nuit, Désert, Neon, Neige jour/nuit, Forêt, Front, puis Objectif ou Match à mort quand la carte le permet). La carte la plus votée devient celle du salon (encadré jaune), en cas d'égalité c'est le choix de l'hôte. Plus besoin de recréer un code pour changer de mode. Une carte trop petite pour le nombre de joueurs n'est pas votable.
    - **Bouton « Je suis prêt »** : les joueurs prêts ont un ✓ PRÊT dans la liste, l'hôte voit « Lancer la partie · 2/3 prêts » et « Tout le monde est prêt ! ».
    - **Retour au salon à la fin de chaque partie** : 15 s après l'écran de fin, tout le monde revient dans le salon (compte à rebours affiché). Le bouton « SALON » y va tout de suite ; celui de l'hôte y ramène tout le monde.
    - **Quitter et revenir quand on veut** : chaque joueur reçoit un jeton. En revenant, il reprend sa place, son pseudo et son vote, dans le salon ou dans la partie en cours (l'IA joue à sa place pendant son absence). On peut aussi rejoindre une partie déjà lancée avec le code.
    - **Déconnexion non voulue** : le jeu se reconnecte tout seul (jusqu'à 8 essais) et le joueur reprend la partie là où elle en est.
    - **Salons récents** dans « Partie privée » : la liste des derniers salons rejoints, avec « Rejoindre » et ✕ pour les retirer. Un bouton « ↩ Revenir dans le salon » apparaît aussi sur le menu principal pendant 15 minutes. Le pseudo est retenu.
    - Les joueurs déconnectés apparaissent « · déconnecté » dans le salon ; si le même compte rejoint depuis un autre onglet, l'ancien onglet revient au menu.
    - Un clic sur le petit texte à l'intérieur d'un bouton du menu (ex. « CDG » sous un serveur) ne se perd plus. Les messages d'erreur de l'écran « Partie privée » s'affichent enfin (avant, ils étaient cachés dans le salon).
  - **Cette fois `server.js`, `game_sim.js`, `index.html` et `fly.toml` changent tous les quatre** : les remplacer sur GitHub, puis redéployer sur Fly (`fly deploy`). `fly.toml` passe à `auto_stop_machines = 'suspend'` : sans ça, Fly arrête la machine quand plus personne n'est connecté et les salons sont perdus avant les 15 minutes.
  - **Tirs (Front, et toutes les parties en ligne)** :
    - Deux balles pouvaient partager le même trait lumineux chez un joueur en ligne : une balle cachée après un impact gardait son trait, une nouvelle balle le reprenait, puis la première, en disparaissant, cachait la nouvelle en plein vol ou la faisait sauter ailleurs. Chaque balle a maintenant son propre trait.
    - Ses propres tirs ne reculent plus : quand le serveur confirmait le tir, le trait parti au clic était ramené en arrière de 50 à 200 px selon le ping. Il garde maintenant sa course, et le tir confirmé est associé au bon trait.
    - Plus de tir fantôme : la cadence prédite est exactement celle du serveur, et les munitions tiennent compte des tirs pas encore reçus par le serveur. Un trait non confirmé va au bout de sa course au lieu de disparaître au bout de 0,45 s.
    - Les tirs des autres joueurs et des mitrailleuses partent du canon affiché (avant : 50 à 300 px devant le tireur). L'éclair de la mitrailleuse est à la bouche du canon, et le trait s'arrête sur l'ennemi touché au lieu de le traverser.
    - Obus du tank : ils partent de la bouche du canon, puis rattrapent leur position réelle en quelques images.
    - Hauteur des traits : depuis une tranchée, le trait part à hauteur du fusil (plus bas) ; celui de la mitrailleuse du 4x4 part à hauteur du canon.
  - **Zones de collision des arbres ramenées au tronc** : 13 px pour les arbres brûlés (avant 22) et 16 px pour les arbres morts (avant 24). On passe au ras du tronc, et les balles s'arrêtent sur le tronc au lieu du vide à côté. Le bas du tronc des arbres morts est droit, pour rester dans sa zone.
  - **Tranchées dégagées** : retrait du hérisson tchèque planté dans une tranchée, de l'épave de camion (avec son feu) posée sur le bout d'une autre, et des cratères qui débordaient dedans. Les parapets de sacs de sable restent.
  - **Tank : vitesse −5 %** (87 → 82,65).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Traces de pas plus grandes (Front)** : chaque empreinte passe de 7 × 13 à 12 × 22 px (1,7 fois plus grande), avec une semelle et un talon plus nets, des crampons visibles et un bord clair adouci. Elles restent lisibles sur la terre sombre, hors du faisceau de la lampe. Les pas sont plus longs pour que les empreintes ne se chevauchent pas, et elles restent à l'écart du bord des tranchées et des ponts. Les anciennes pistes près des camps ont la même taille. Elles s'effacent toujours en 5 s.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **V3.6 · nouvelle carte TETRIS et nouveau mode CRISTAL (4 équipes de 3)** :
    - **Carte Tetris** : un puits carré (3 264 px) au sol quadrillé, avec des couverts en tétriminos colorés (I, O, T, S, Z, J, L) et des murs de blocs gris tout autour. De grands tétriminos dérivent dans le vide autour du puits. Les 4 bases sont dans les coins, chacune avec sa dalle et son emblème. Un quart de la carte est dessiné et les trois autres en sont la rotation : les 4 équipes ont exactement les mêmes chemins et couverts.
    - **Équipes** : CYAN, VIOLET, ORANGE et VERT, 3 joueurs chacune. Les places libres sont jouées par l'IA.
    - **Le cristal** : un cristal brillant, aux couleurs tirées au hasard, apparaît à un endroit aléatoire. Le joueur qui passe dessus le porte sur son dos ; il est un peu plus lent (−10 %) et tout le monde le voit sur la mini-carte.
    - **Dépôt** : il faut amener le cristal dans la zone de dépôt dorée, elle aussi placée au hasard. L'équipe marque +1 cristal, puis un nouveau cristal et une nouvelle zone apparaissent 4 s plus tard.
    - **Porteur éliminé** : le cristal tombe sur place et n'importe qui peut le reprendre. Oublié 20 s, il réapparaît ailleurs.
    - **Victoire** : la première équipe à 8 cristaux gagne. Sinon, c'est celle qui en a le plus au bout de 10 minutes (égalité possible).
    - **Rangs d'équipe**, comme en mode Zombie mais gagnés avec les cristaux déposés : I Bronze (1 cristal), II Argent (2), III Or (4) et IV Diamant (6). Chaque rang donne un bonus de vie, de cadence de tir et de vitesse : +8/5/5 %, +12/8/8 %, +15/15/15 % puis +20/20/20 %. L'insigne du rang s'affiche à côté de la barre de vie de chaque joueur.
    - **ATH** : en haut, les 4 équipes (cristaux et rang), le minuteur, l'état du cristal, le rang de son équipe et la progression vers le suivant. Des repères à l'écran indiquent le cristal et la zone, avec une flèche au bord quand ils sont hors de l'écran.
    - **Annonces, sons et tableaux** : annonces et sons quand un cristal est pris, tombe ou est déposé (effet « ligne complète »), et quand une équipe monte de rang. Le tableau des scores et l'écran de fin affichent les 4 équipes, avec une colonne « Cristaux ».
    - **Vision par équipe** : on ne voit un adversaire que si l'un de ses coéquipiers le voit. Seul le porteur du cristal est visible de tous.
    - **Bots** : les deux plus proches vont chercher le cristal et le troisième se place vers la zone. Le porteur fonce vers la zone en tirant ; un coéquipier l'escorte et l'autre tient la zone. Face à un porteur ennemi, deux le poursuivent et un bloque la zone. Ils lancent leur grenade sur le porteur ennemi. Sur 10 parties de bots simulées, les 4 équipes marquent autant les unes que les autres, à la chance près.
    - **En ligne** : la carte fait partie du vote du salon (💎 TETRIS), le salon affiche les 4 équipes de 3, et « Changer d'équipe » fait passer d'une équipe à l'autre. Le menu affiche V3.6.
  - **Cette fois `server.js` et `index.html` changent** : le serveur connaît la nouvelle carte (12 places en 4 équipes). Les remplacer sur GitHub, puis redéployer sur Fly (`fly deploy`).
  - **Carte Tetris réduite** : même plan, mêmes couverts et mêmes bases, mais à l'échelle 0,75. Les cases font 48 px au lieu de 64, ce qui donne une carte de 2 448 px au lieu de 3 264 (presque deux fois moins de surface), donc des combats plus rapprochés. Tout suit cette échelle : points d'apparition, dalles des bases, places du cristal et de la zone de dépôt, distance entre le cristal et la zone. La zone de dépôt passe de 110 à 96 px de rayon.
  - **Menu** : le bouton de la carte devient « 💎 TETRIS - CRISTAL » (« 💎 TETRIS - CRYSTAL » en anglais) ; le vote du salon affiche 💎 TETRIS.
  - **Équilibre entre les 4 équipes (bots)** : les bases du bas gagnaient plus souvent (7 et 6 victoires sur 18 parties simulées, contre 2 et 3 pour celles du haut). La cause : quand deux chemins étaient aussi courts, les bots prenaient toujours celui « en haut à gauche ». Les égalités se départagent maintenant de la même façon pour les 4 bases (en tournant autour du centre), et les positions des bots autour du cristal et de la zone suivent l'orientation de leur base. Sur 10 nouvelles parties : 2, 4, 2 et 2 victoires.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.

  - **Armes de la carte Tetris** : le fusil d'assaut et la grenade classique y sont remplacés par deux armes au style Tetris. Seuls l'apparence et le son changent : dégâts, cadence, chargeur de 30, portée, rayon et mèche de la grenade restent les mêmes.
    - **Blaster L** : un tétrimino L en blocs biseautés de la couleur de l'équipe, avec un canon en pixels lumineux de plus en plus petits. Le L est à plat, pour se lire vu du dessus. L'éclair au bout du canon est un petit cube clair.
    - **Tirs** : chaque tir est un cube lumineux de la couleur de l'équipe qui tourne sur lui-même, suivi d'une traînée de petits cubes, avec un reflet au sol. À l'impact, il éclate en pixels qui rebondissent et rapetissent par paliers.
    - **Sons « 8 bits »** : un « piou » en onde carrée, un peu plus aigu ou plus grave selon l'équipe, et un petit « tic » à l'impact.
    - **Grenade T** : un tétrimino T qui tourne en vol. Au sol, il se couche, pivote d'un quart de tour à chaque bip, et son bloc central clignote. La zone de danger devient une grille de cases qui se remplit ligne par ligne depuis le bas : quand la pile atteint le haut, la grenade explose.
    - **Explosion « ligne complète »** : flash, cases qui clignotent en blanc puis s'effacent du centre vers les bords, onde carrée, blocs de toutes les couleurs projetés qui rebondissent, et une petite fanfare montante.
    - **Interface** : l'icône de grenade (barre du bas et bouton sur mobile) est un T de la couleur de l'équipe, comme les traits du chargeur et la visée de la grenade.
    - Les autres cartes gardent leurs armes. Testé en solo, en ligne à 2 joueurs (on voit les tirs et les grenades des 4 équipes), puis en repassant sur une autre carte.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Mode Cristal : il faut maintenant 10 cristaux pour gagner** (au lieu de 8). La limite de 10 minutes ne change pas. Sur 6 parties de bots simulées, une partie dure de 6 à 10 minutes (avant : 4 à 7 minutes), et environ une sur six se termine au temps. Le haut de l'écran, l'écran d'intro et l'aide du menu affichent « premier à 10 ».
  - **Correction : la grille d'explosion de la grenade T restait au sol**. À chaque explosion, le jeu recréait par erreur une nouvelle réserve d'effets. L'effet de l'explosion précédente n'était alors plus animé et restait figé par terre (grille de cases et carré lumineux). La réserve est maintenant créée une seule fois : tout disparaît en moins de 2 secondes, comme prévu. Sur les autres cartes, la trace noire de la grenade classique s'efface toujours en 2 secondes.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Mode Cristal : messages d'annonce plus petits** (« Tu portes le cristal », « Cristal déposé ! », « Cristal pris par… », montée de rang…). Le titre passe de 19 à 13 px (12 sur mobile), la ligne du dessous de 12 à 10 px, et le cadre est plus fin. Ils cachent beaucoup moins le jeu. Le panneau du haut, la carte d'intro et les repères du cristal et de la zone ne changent pas.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Nouveau menu** : le menu est refait en entier, sur tout l'écran, au-dessus de la carte en 3D.
    - **La carte choisie s'affiche en fond** : le fond survole en 3D la carte sélectionnée. Un court fondu au noir cache son chargement. Le menu reprend la couleur de chaque carte : bleu pour Nuit, sable pour Désert, rose pour Neon Grid, glace pour la Base polaire, vert pour la Forêt, orange pour le Front et violet pour Tetris.
    - **À gauche** : le nom de la carte en grand, son mode et le format des équipes, une phrase qui explique le but, puis le choix Objectif / Match à mort (Nuit, Désert, Neon) ou Jour / Nuit (Base polaire). En dessous, deux grands boutons : « Jouer contre l'IA » et « Partie privée ».
    - **En bas, les 7 cartes** : chacune a une vignette dessinée à partir de son vrai plan (obstacles, sites de bombe, zones ; sur Tetris, les blocs gardent leurs couleurs), avec son nom, son mode et ses équipes.
    - **La dernière carte choisie est gardée** : à la prochaine visite, elle est sélectionnée et sert de fond dès l'ouverture. Si on lance une partie sur cette carte, elle est déjà chargée.
    - **Partie privée** : le pseudo, puis « Créer un salon » (carte choisie, serveur, bouton) et « Rejoindre un salon » (code, salons récents). Le bouton « Revenir dans le salon » est gardé.
    - **Salon** : le code en grand avec « Copier », les votes, les équipes, et les boutons en bas (« Je suis prêt » ou « Lancer la partie », « Changer d'équipe », « Quitter le salon »). Le fond montre la carte qui sera jouée, et le menu prend sa couleur.
    - **En haut** : le logo et la version, la carte du fondateur (Revo, lien X) et le choix FR / EN.
    - **Trois mises en page** : ordinateur (cartes en bande en bas), téléphone à l'horizontale (actions à gauche, cartes à droite) et téléphone à la verticale (une colonne qui défile, cartes à faire glisser, fondateur et langue en bas).
    - **Police** : les titres et les boutons utilisent Chakra Petch (Google Fonts), chargée sans bloquer la page ; sans connexion à Google Fonts, la police du système prend le relais. Tout le reste du jeu ne change pas (mêmes boutons, même logique pour les salons et les parties en ligne).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Menu : vraies images des cartes** dans le choix de la carte, à la place des plans dessinés. Ce sont des vues en 3D rendues par le jeu lui-même : le site B de Nuit, l'oasis du Désert, les immeubles de Neon Grid, la base de la Base polaire, le lac de la Forêt, le pont du Front et le centre de Tetris. Avec l'ambiance Nuit, la Base polaire affiche sa vue de nuit. Les cartes non choisies sont un peu atténuées, et la carte choisie ou survolée s'affiche en pleine couleur. Les 8 images (WebP, 400 × 250) pèsent environ 100 Ko en tout et sont intégrées à `index.html` : rien à héberger à côté.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Menu plus rapide et plus réactif** (mesures faites dans un navigateur sans carte graphique, donc plus lent qu'un vrai appareil) :
    - **Démarrage** : la page répond au bout de 0,55 s au lieu de 4,3 s. Le menu s'affiche tout de suite avec l'image floue de la carte en fond, et la carte 3D se charge juste après (avant, la page attendait la fin de ce chargement).
    - **Changement de carte** : l'image de la carte apparaît tout de suite en grand (floue) en fond, dès le clic. La 3D, qui fige la page de 0,1 à 1 s pendant son chargement, ne se charge plus qu'une fois les clics arrêtés (un quart de seconde après le dernier). On peut donc parcourir les cartes sans aucun blocage, et la page ne fait qu'un seul chargement à la fin, au lieu d'un par clic.
    - **Fond 3D plus léger** : 30 images par seconde dans le menu, au lieu de 60 (ou 120 sur certains écrans), car la caméra y dérive lentement. Sur téléphone, il est aussi rendu en définition réduite, avec jusqu'à 2,5 fois moins de pixels. La définition normale revient dès que la partie commence.
    - **Plus de flou derrière les panneaux et les cartes** : il était recalculé à chaque image au-dessus de la 3D, ce qui coûtait très cher sur téléphone. Les fonds sont simplement un peu plus opaques.
    - **Plus d'écritures inutiles à chaque image** dans le menu (position des boutons son et plein écran, effacement de l'ATH).
    - **Boutons sur mobile** : plus de délai lié au double appui (zoom) sur les boutons du menu.
    - **Partie privée** : le serveur est réveillé et la connexion ouverte dès qu'on ouvre (ou survole) « Partie privée », ou qu'on change de serveur. Pendant qu'on tape son pseudo, le serveur se réveille. « Créer le salon » ne refait plus de réveil quand la connexion est déjà prête : avec le serveur local, le salon s'affiche en 0,4 s au lieu de 1,8 à 2,4 s. Avec un serveur Fly endormi, le gain est encore plus grand.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Salon : Tetris absent du vote = serveur pas à jour**. La liste des cartes du vote vient du serveur. Si Tetris n'y est pas, c'est que le `server.js` déployé sur Fly date d'avant la V3.6. Le salon affiche maintenant un avertissement dans ce cas : « Le serveur n'est pas à jour… remplace server.js sur GitHub, puis redéploie sur Fly ». Le `server.js` de ce dossier connaît bien Tetris (vote, 12 places en 4 équipes).
  - **`index.html` change, et `server.js` (déjà fourni avec la carte Tetris) doit être redéployé sur Fly** s'il ne l'a pas encore été.
  - **Menu : fond 3D en haute qualité**. La version précédente réduisait trop le fond 3D pour gagner en vitesse, et l'image était floue et vue de trop haut.
    - **Pleine définition** : le fond est rendu à la définition réelle de l'écran (jusqu'à × 2 sur les écrans haute densité et les téléphones), au lieu de × 0,85 sur téléphone et × 1 au maximum ailleurs.
    - **Nouvelle caméra** : une vue de trois quarts, plus proche, qui tourne lentement autour du coin le plus parlant de chaque carte (le même que sa vignette : site B de Nuit, oasis du Désert, immeubles de Neon Grid, base de la Base polaire, lac de la Forêt, pont du Front, centre de Tetris). Avant, la caméra dérivait très haut au-dessus de toute la carte.
    - **Cadrage sur grand écran** : l'image est décalée vers la droite pour que la carte reste visible à côté du panneau de gauche (un peu plus dans le salon, dont le panneau est plus large).
    - **Fluidité** : toutes les images sont rendues sur ordinateur ; sur téléphone, le fond reste à 30 images par seconde pour ménager la batterie.
    - La définition et le cadrage normaux du jeu reviennent dès que la partie commence.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Mode Zombie sur mobile : visée, tir et poignard**
    - **Visée automatique** : les zombies n'étaient jamais visés (seuls les joueurs ennemis l'étaient), à cause d'une ligne de code passée par erreur dans un commentaire. Ils sont de nouveau des cibles : ceux qui sont dans la lumière, et ceux qu'on voit dans le noir grâce à leurs yeux qui luisent (jusqu'à 560 px). Zombies et joueurs ennemis sont au même rang : c'est le plus proche (ou le plus près de la direction visée) qui est choisi. Les animaux ne passent qu'après eux.
    - **Tir avec une arme à feu : le même système que dans les autres modes**. Un appui sans glisser tire tout seul sur la cible visible la plus proche. Glisser vise à la main, aimanté sur la cible la plus proche de la direction. Sans cible, le tir part à partir de 22 px. Avant, le mode Zombie bloquait le tir tant que la cible n'était pas à portée. La cible est marquée du même viseur (cercle et quatre traits) que dans les autres modes.
    - **Poignard et lance : un bouton à droite au lieu du joystick**. Quand on n'a pas d'arme à feu en main, le joystick droit disparaît, remplacé par un grand bouton poignard (ou lance) à la place du bouton R, au centre des autres boutons.
      - Le personnage se tourne tout seul vers ce qui est le plus proche à portée : zombie ou ennemi, puis animal. Il peut être derrière soi.
      - Un appui frappe tout de suite. Bouton maintenu : on frappe dès que la cible arrive à portée, puis à chaque fois que le coup est prêt.
      - Le bord du bouton devient rouge quand quelque chose est à portée, et un cercle discret entoure la cible. Un anneau sur le bouton montre le temps avant le prochain coup.
      - Avec une arme à feu en main, le joystick revient. Sur ordinateur, rien ne change.
    - **Serveur** : depuis le nouveau menu, le serveur gardait la boucle d'affichage du jeu et notait une erreur sans gravité à chaque partie créée. C'est corrigé dans `index.html` : le serveur coupe de nouveau le script au bon endroit, sans changer `server.js`.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Messages en jeu et écrans de fin au style du menu, sur toutes les cartes**
    - **Même style que le menu** :
      - les titres sont en Chakra Petch, la police du menu, et en minuscules comme dans le menu (« Vous attaquez », « Manche gagnée », « Victoire ») ;
      - chaque carte reprend sa couleur du menu (bleu pour Nuit, sable pour Désert, rose pour Neon Grid, bleu glacier pour Base polaire, vert pour Forêt, orange pour Front, violet pour Tetris) ;
      - les panneaux sont sombres avec un bord fin, et une barre de couleur à gauche, comme les joueurs dans le salon.
    - **Annonce de début de manche ou de partie** (toutes les cartes et tous les modes) :
      - en haut, les pastilles du menu : mode (à la couleur de la carte), format et manche, plus « Balle de match » ou « Dernière manche » quand c'est le cas ;
      - le compte à rebours est un anneau en haut à droite du panneau ;
      - en dessous, le grand titre, l'objectif en phrases courtes, puis une ligne de pied (score, « Premier à 7 », durée).
    - **Tetris** : l'annonce de départ est très simplifiée. Elle tient en trois lignes : « Vous êtes Cyan », « Ramenez le cristal dans la zone dorée. », « Premier à 10 cristaux ». Les explications sur les rangs sont retirées, car le rang et ses bonus sont déjà affichés en haut de l'écran.
    - **Fin de manche** (Nuit, Désert, Base polaire, Front) : même panneau, avec « Manche gagnée » ou « Manche perdue », l'équipe qui marque, la raison, le score et le rôle à la manche suivante. En Code Rouge, la manche n'affiche plus « / 13 » (la partie se joue en 4 manches gagnantes), et « Fin de la partie » apparaît au bon moment.
    - **Bandeaux en cours de partie** : même petit panneau partout, avec un titre de couleur, un sous-titre gris et une barre de couleur à gauche. C'est le cas pour :
      - « Ramasse la bombe » ;
      - les zones de Neon Grid ;
      - les annonces du cristal ;
      - les vagues du mode Zombie ;
      - les alertes du Front ;
      - l'écran « Éliminé · Réapparition dans 3 s » ;
      - le boost du drapeau.

      Les textes sont en minuscules (« Vague 3 », « Cristal déposé ! », « Zone 2 active »).
    - **Écrans de fin** :
      - les pastilles carte, mode et format, puis un grand « Victoire » (à la couleur de la carte), « Défaite » ou « Égalité », avec l'équipe gagnante et le score ;
      - les équipes sont des lignes à barre de couleur, avec les intitulés des colonnes au-dessus, le meilleur joueur marqué d'une étoile et d'une pastille « MVP », et ta ligne en surbrillance ;
      - quand il y a beaucoup de joueurs (Front, Tetris, Zombie), les équipes se placent sur deux colonnes si l'écran est assez large : plus besoin de lignes minuscules ;
      - les boutons sont ceux du menu : « Rejouer » (ou « Salon » en ligne) couleur de la carte à coins coupés, et « Quitter » sombre.
    - **Tableaux en cours de partie** (toucher le score ou maintenir TAB, et « Équipes » en mode Zombie) : même présentation.
    - **Téléphone** :
      - les panneaux restent au-dessus de la vie et des munitions ;
      - l'annonce du mode Zombie ne passe plus sous le bouton briquet ;
      - l'aide « Stick gauche : bouger… » est dans une pastille lisible, même sur la neige ou le sable.
    - **Anglais** : les intitulés des colonnes sont traduits (Kills, Deaths, Plants, Defuses, Flags).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Nuit : conteneurs plus hauts**. Ils passent de 34 à 58 de haut, plus proches des vraies proportions d'un conteneur. Ils ressemblent moins à des dalles posées au sol. Seul l'aspect change : les collisions et les tirs restent les mêmes.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Menu : retour à l'animation 3D d'avant**. Le survol cinématographique est retiré. On retrouve la vue de trois quarts qui tourne lentement autour du coin le plus parlant de chaque carte. Les conteneurs plus hauts de Nuit sont gardés.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Menu : vignette de Nuit mise à jour**. L'image de Nuit dans le choix des cartes est rendue de nouveau, avec les conteneurs plus hauts (même vue sur le site B, même taille d'environ 10 Ko).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Roues des véhicules refaites, sur toutes les cartes**
    - **Nuit et Désert (voitures)** : avant, les roues étaient tournées dans le mauvais sens (vues de face, cachées dans la caisse). Elles sont maintenant dans le bon axe, posées au sol, et dépassent un peu de la carrosserie pour se voir depuis la caméra. Chaque roue a un pneu au flanc bombé, une jante métal, un creux sombre, 6 rayons et un moyeu chromé.
    - **Forêt (voitures abandonnées)** : même roue, en version épave : pneu usé, jante et moyeu rouillés. Les pneus à plat restent écrasés.
    - **Base polaire (camionnettes)** : leurs roues étaient déjà détaillées ; elles gagnent un enjoliveur central chromé.
    - **Front (camions, 4x4, tank)** : les pneus à sculptures gardent leur texture et gagnent des flancs bombés, un cercle de jante kaki et un moyeu qui dépasse.
    - Seul l'aspect change : collisions, déplacements et tirs restent les mêmes.
  - **Menu : vignette de Nuit recentrée**. Le point B est de nouveau au centre de l'image, comme avant. La dernière prise de vue reprenait par erreur le décalage du fond 3D du menu, ce qui poussait le point B vers la droite. L'image montre maintenant les conteneurs plus hauts et les nouvelles roues.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Icône de l'onglet : explosion** (choix n°12 parmi 12 propositions)
    - **Le dessin** : une explosion rouge, orange et jaune au centre blanc, sur le fond sombre du menu. Le dessin est original et reste net même à 16 px.
    - **Les formats** :
      - SVG pour les navigateurs récents (net à toutes les tailles) ;
      - PNG 32 px en secours pour les autres navigateurs ;
      - PNG 180 px pour l'écran d'accueil (« Ajouter à l'écran d'accueil » sur iPhone et Android), en carré plein puisque le téléphone arrondit lui-même les coins.
    - La barre du navigateur mobile prend aussi la couleur sombre du jeu.
    - **Intégration** : tout est intégré dans `index.html` (environ 15 Ko), comme les vignettes du menu. Rien à héberger à côté, rien à changer dans `server.js`. L'icône peut mettre quelques minutes à apparaître à cause du cache du navigateur ; recharger la page aide.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Menu : nom du jeu plus grand**. « DETONATE » passe de 22 à 36 px sur ordinateur, avec une légère ombre pour ressortir sur le fond 3D. Le badge « V3.6 » passe de 11 à 16 px. Sur téléphone (à l'horizontale et à la verticale), le nom passe de 16 à 24 px et le badge de 10 à 12,5 px. La barre du haut tient toujours sur une ligne.
  - **Tetris : bots moins précis**. Leur précision passe d'environ 29 % à 16 % des tirs qui touchent (mesuré sur des parties simulées entre bots), et ils font environ 23 % d'éliminations en moins. Quatre réglages, uniquement sur Tetris :
    - leur visée flotte lentement autour de la cible (± 0,23 rad), donc des rafales entières passent à côté ;
    - ils anticipent moins bien le déplacement de la cible (55 % au lieu de 100 %) ;
    - leurs tirs sont plus dispersés (0,28 rad au lieu de 0,12) ;
    - ils réagissent 0,12 s plus tard.

    Les autres cartes ne changent pas. En ligne, ce sont les bots du serveur qui tirent : il faut donc aussi déployer ce `index.html` sur Fly.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Tetris : le cristal clignote sur la mini-carte**. Tant qu'il est au sol, il clignote (environ deux fois par seconde) avec un halo, et envoie des ondes comme un radar : on voit tout de suite où il est.
    - Pendant les 6 secondes après son apparition, il est plus gros et les ondes sont doubles et plus grandes.
    - Un cristal lâché a des ondes blanches au lieu de dorées.
    - Porté par un joueur, il garde le cercle à la couleur de l'équipe du porteur.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Menu : barre du haut agrandie et alignée**
    - **Carte du fondateur (Revo, lien X)** :
      - plus grande : 46 px de haut sur ordinateur au lieu d'environ 38 ;
      - photo de 30 à 36 px, nom de 13 à 16 px, bouton « Suivre » de 11,5 à 13,5 px.
    - **Choix FR / EN** : même hauteur que la carte du fondateur, lettres de 11,5 à 14 px, fond sombre identique.
    - **Boutons « Couper le son » et « Plein écran »** :
      - dans le menu, ronds de 46 px (40 px sur téléphone), au même style que les deux pastilles ;
      - centrés sur la même ligne que le logo, le fondateur et les langues, avec 10 px d'écart entre chaque élément ;
      - le dernier bouton s'aligne sur le bord droit du menu (avant, ils étaient plus petits, plus hauts et collés au bord de l'écran).
    - **Plein écran sur ordinateur** : le bouton apparaît maintenant aussi sur ordinateur quand le navigateur le permet (avant, seulement sur téléphone). La barre du haut lui réserve sa place.
    - **Téléphone** :
      - à l'horizontale : tout tient sur une ligne de 40 px ;
      - à la verticale : le logo, le plein écran et le son sont sur la ligne du haut ; le fondateur et les langues sont en bas, alignés sur les mêmes bords.
    - **En jeu** : ces boutons gardent leur place et leur taille habituelles en haut à droite.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Désert : oasis corrigée dans le fond 3D du menu**
    - **Le bug** : le désert a un voile de sable sur toute la carte, juste au-dessus du sol. Ce voile est volontairement « tiré » vers la caméra pour ne pas clignoter avec le sol. L'herbe, la berge, la boue et l'eau de l'oasis ne sont que quelques millimètres plus haut et n'avaient pas ce réglage. Vue de haut (en jeu), ça passait. Vue de biais (le fond 3D du menu), le voile recouvrait l'oasis : l'anneau d'herbe disparaissait et les bords clignotaient selon l'angle de la caméra.
    - **La correction** : chaque couche de l'oasis est maintenant tirée vers la caméra plus fort que le voile et plus fort que la couche du dessous (herbe, berge, boue, eau claire, eau turquoise, eau profonde, rides, nénuphars). Leur ordre est garanti quel que soit l'angle : l'anneau d'herbe et les berges s'affichent toujours, sans clignotement.
    - **Vignette** : l'image du Désert dans le choix des cartes est refaite (même cadrage), avec l'oasis entourée de son herbe.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **V3.7 · Profil du joueur, XP et niveaux (étape 1 sur 2 ; les skins et les récompenses viendront à l'étape 2)**
    - **Profil** :
      - créé automatiquement à la première visite et gardé dans le navigateur (`localStorage`, clé `detonate_profile`) ;
      - contient le pseudo, l'XP, le niveau et les statistiques : parties, victoires, éliminations, morts, MVP ;
      - le pseudo est le même que celui des parties privées.
    - **Code de sauvegarde** :
      - dans la fenêtre du profil, un code (`DTN1.…`) à copier permet de retrouver son profil sur un autre appareil ou après avoir vidé le navigateur ;
      - un contrôle détecte un code incomplet ou mal recopié ;
      - importer un profil avec moins d'XP que le sien demande confirmation ;
      - en navigation privée (sauvegarde impossible), un avertissement invite à copier le code.
    - **XP gagnée à la fin de chaque partie**, une seule fois par partie :

      | Gain | XP |
      |---|---|
      | Élimination | +10 |
      | Bombe posée / désamorcée / drapeau | +25 / +30 / +20 |
      | Antenne / missile / mallette renvoyée (Code Rouge) | +25 / +40 / +20 |
      | C4 / obus au but (Front) | +20 / +15 |
      | Temps dans la zone (Neon Grid) | 0,5 par seconde, au plus +150 |
      | Cristal déposé (Tetris) | +30 |
      | Zombie tué / vague survécue (Forêt) | +2 / +10 |
      | Partie terminée | +50 |
      | Victoire | +100 |
      | MVP (hors mode Zombie) | +50 |
      | Première victoire du jour | +150 |
      | Partie contre l'IA (solo) | XP totale × 0,5 |
    - **Niveaux : 1 à 30**, une montée volontairement longue. Il faut 250 XP pour passer au niveau 2, puis de plus en plus (4 730 XP pour passer de 29 à 30), soit environ 87 000 XP en tout. Avec environ 400 XP par partie en ligne, cela donne environ 18 parties pour le niveau 10 et environ 215 pour le niveau 30 (deux fois plus contre l'IA). L'XP s'arrête au niveau 30.
    - **Menu** :
      - une pastille de profil à droite du logo (insigne hexagonal doré avec le niveau, pseudo, barre d'XP, « Niv. 6 · 380 / 950 ») ;
      - un toucher ouvre la fenêtre du profil : pseudo modifiable, niveau, barre d'XP et XP restante, 6 statistiques, comment gagner de l'XP, code de sauvegarde, récupération d'un profil ;
      - sur téléphone à la verticale, la pastille est sous le logo.
    - **Écrans de fin (toutes les cartes, y compris le mode Zombie)** :
      - un bandeau XP sous le titre : insigne du niveau, « +250 XP », barre qui se remplit en 2 secondes (elle repart de zéro à chaque niveau gagné) ;
      - « Niveau 6 atteint ! » avec un son au passage de niveau ;
      - sur ordinateur, le détail des gains.
    - **En ligne** : l'XP est comptée sur l'appareil du joueur, sans la division par deux. Les autres joueurs ne voient pas encore ton niveau (prévu avec l'étape 2).
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **V3.7 · Profil et XP : ratio K/D, niveaux dans les tableaux, XP comptée par le serveur**
    - **Ratio K/D** :
      - nouvelle colonne « K/D » (éliminations ÷ morts, 2 décimales, par exemple « 2,33 ») dans tous les tableaux de fin de partie et dans le tableau des scores en cours de partie, sur toutes les cartes ;
      - avec 0 mort, le ratio vaut le nombre d'éliminations ;
      - mode Zombie : zombies et joueurs éliminés ÷ morts ;
      - dans la fenêtre du profil, la case « Morts » devient « Ratio K/D ».
    - **Bandeau XP des écrans de fin** :
      - le texte du bas (détail des gains) est retiré ; le bandeau est plus bas (56 px au lieu de 70 sur ordinateur) ;
      - pendant que le serveur compte l'XP : « Calcul de l'XP… » ;
      - si l'XP n'a pas pu être comptée, le bandeau le dit en rouge (serveur injoignable, profil pas encore créé, arrivé moins d'une minute avant la fin) ;
      - les textes trop longs rétrécissent sur téléphone au lieu de se chevaucher.
    - **Niveau des joueurs dans les tableaux des parties privées** :
      - un petit insigne hexagonal doré avec le niveau, devant le pseudo de chaque joueur humain (écran de fin et tableau des scores en cours de partie) ;
      - les bots n'en ont pas ; la place est gardée pour que les pseudos restent alignés ;
      - le niveau vient du serveur : il est à jour à la fin de la partie, XP de la partie comprise ;
      - les en-têtes de colonnes rétrécissent si besoin (6 colonnes sur téléphone).
    - **XP comptée par le serveur (fin de l'XP modifiable sur l'appareil du joueur)** :
      - les profils sont gardés par le serveur du jeu, dans `/data/profiles.json` sur un volume Fly, sur la seule machine de la région `iad` (variable `PROFILE_REGION`) ;
      - le navigateur ne garde plus que l'identifiant du profil, son secret et une copie pour l'affichage : modifier le `localStorage` ne change plus rien ;
      - **parties en ligne** : le serveur calcule l'XP de chaque joueur à partir de sa propre simulation (le joueur n'envoie rien), puis l'envoie à chacun ; partie à moins de 2 joueurs humains : XP divisée par deux ; un joueur arrivé moins d'une minute avant la fin ne gagne rien ; un serveur d'une autre région (cdg, lax, sin) envoie l'XP à celui d'`iad` avec une clé partagée ;
      - **parties solo contre l'IA** (elles tournent dans le navigateur) : le jeu envoie le résumé de la partie ; le serveur le borne (valeurs plausibles), exige 90 s de jeu, 90 s entre deux parties solo, au plus 3 000 XP par jour en solo, puis divise par deux ;
      - le barème d'XP et la courbe des niveaux ne changent pas ;
      - **code de sauvegarde** : il devient `DTN2.<identifiant>.<secret>` ; le serveur ne garde que l'empreinte du secret ; importer un code demande le profil au serveur ;
      - **profils de l'étape précédente** : repris automatiquement une fois à la première visite, avec l'XP plafonnée à 3 000 (niveau 6) ; les anciens codes `DTN1` ne s'importent plus ;
      - sans serveur (jeu ouvert en fichier local, serveur injoignable) : le profil affiché est la dernière copie et l'XP n'est pas comptée.
    - **Fichiers modifiés** : `index.html`, `server.js`, `game_sim.js`, nouveau `profiles.js`, `Dockerfile` (copie `profiles.js`), `fly.toml` (volume `/data` et `PROFILE_REGION = 'iad'`), `.gitignore` (dossier `data/` en local).
    - **À faire une seule fois sur Fly, avant `fly deploy`** :
      1. Vérifier qu'il y a **une seule machine par région** (cdg, lax, iad, sin) avec `fly machine list`. S'il y en a deux dans une région : `fly scale count 1 --region iad` (remplace `iad` par la région concernée).
      2. Créer un volume de 1 Go dans chaque région (un par machine, même nom) :
         ```
         fly volumes create detonate_data -r iad -s 1 -y
         fly volumes create detonate_data -r cdg -s 1 -y
         fly volumes create detonate_data -r lax -s 1 -y
         fly volumes create detonate_data -r sin -s 1 -y
         ```
         Seul celui d'`iad` sert, mais Fly en demande un par machine dès que `fly.toml` contient `[mounts]`.
      3. Recommandé : une clé partagée entre les serveurs, sans redéployer tout de suite :
         ```
         fly secrets set PROFILE_KEY=<une longue suite de lettres et chiffres> --stage
         ```
         Sans elle, la clé est tirée de l'image déployée : ça marche, mais pendant un déploiement, l'XP des parties qui finissent hors d'`iad` peut ne pas être comptée.
      4. Remplacer les fichiers sur GitHub, puis `fly deploy`.
      5. Contrôle : `fly logs -r iad` doit afficher « Profils : … chargés depuis /data/profiles.json », sans « ATTENTION ».
      6. Sauvegarde (de temps en temps) : `fly ssh console -r iad -C "cat /data/profiles.json" > profiles-sauvegarde.json`. Fly garde aussi une copie quotidienne du volume pendant 5 jours.
    - **Tests** :
      - serveur local avec deux joueurs : profils créés, niveaux dans le salon et à la fin, XP calculée par le serveur ;
      - deux serveurs locaux (`iad` qui garde les profils, `cdg` qui joue la partie) : l'XP passe d'une région à l'autre ;
      - parties solo : partie trop courte refusée, deux parties en moins de 90 s refusées, valeurs absurdes bornées, reprise du profil de l'étape 1 ;
      - les 7 cartes démarrent sans erreur, simulations Zombie et Cristal sans erreur.
  - `index.html`, `server.js`, `game_sim.js`, `profiles.js` (nouveau), `Dockerfile`, `fly.toml` et `.gitignore` changent pour cette étape : à mettre à jour sur GitHub, puis créer les volumes sur Fly et redéployer.
  - **Fly sans terminal : bouton GitHub « Fly : volumes et déploiement »**
    - Nouveau fichier `.github/workflows/fly.yml`, lancé à la main depuis l'onglet « Actions » du dépôt GitHub.
    - Il remplace les commandes du terminal :
      - il vérifie qu'il y a une seule machine par région ;
      - il crée les 4 volumes `detonate_data` de 1 Go (iad, cdg, lax, sin), seulement s'ils manquent ;
      - il crée la clé `PROFILE_KEY` (une seule fois) ;
      - il déploie (`fly deploy`).
    - On peut le relancer sans risque : rien n'est créé deux fois.
    - **Mise en place, une seule fois** :
      1. Sur fly.io : ouvrir l'application `detonate-prototype` → **Tokens** → créer un jeton → le copier.
      2. Sur GitHub : dépôt → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, nom `FLY_API_TOKEN`, valeur : le jeton.
      3. Envoyer les fichiers sur GitHub, dont `.github/workflows/fly.yml` (créer le fichier avec ce chemin exact si on passe par « Add file → Create new file »).
      4. **Actions** → « Fly : volumes et déploiement » → **Run workflow**.
    - Le fichier suppose que `fly.toml` est à la racine du dépôt.
  - Seul `.github/workflows/fly.yml` est nouveau pour cette étape (les autres fichiers ne changent pas) : à ajouter sur GitHub.
  - **Version V3.7**
    - Le badge à côté de « DETONATE » dans le menu affiche maintenant **V3.7** (au lieu de V3.6).
    - Le dossier et l'archive s'appellent maintenant `detonate-v3.7` et `detonate-v3.7.zip`, et le titre de ce README est « prototype V3.7 ».
    - Le profil du joueur, l'XP, les niveaux, le ratio K/D et l'XP comptée par le serveur font partie de la V3.7.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Tester la V3.7 sans la publier (dépôt GitHub de test)**
    - **Le risque** : telle quelle, la V3.7 se déploierait sur l'application Fly de production (`detonate-prototype`, nommée dans `fly.toml`). De plus, ouverte depuis GitHub Pages, elle se connecterait au serveur de production.
    - **Dossier `detonate-v3.7-test`** (archive `detonate-v3.7-test.zip`) : mêmes fichiers que `detonate-v3.7`, seul `fly.toml` change :
      - application séparée `detonate-v37-test` ;
      - une seule région (`iad`) pour limiter le coût : une machine mise en pause quand personne ne joue, et un volume de 1 Go.
    - **`.github/workflows/fly.yml`** lit maintenant le nom de l'application et les régions dans `fly.toml`. Le même fichier sert donc aux deux dépôts :
      - il crée l'application si elle n'existe pas encore ;
      - il crée les volumes des régions de `fly.toml` ;
      - il déploie sans machine de secours (`--ha=false`) et affiche l'adresse du jeu.
    - **Mise en place du dépôt de test** :
      1. Envoyer le contenu de `detonate-v3.7-test` dans le dépôt de test, dossier `.github` compris.
      2. Sur fly.io : choisir l'organisation dans la liste → **Tokens** → créer un jeton d'organisation. Il en faut un d'organisation (et non d'application), puisque l'application de test n'existe pas encore.
      3. Dans le dépôt de test : **Settings** → **Secrets and variables** → **Actions** → secret `FLY_API_TOKEN` = ce jeton.
      4. **Actions** → « Fly : volumes et déploiement » → **Run workflow**.
      5. Jouer sur **https://detonate-v37-test.fly.dev** : le jeu y utilise automatiquement le serveur de test (profils, XP, parties privées). Depuis GitHub Pages, il faut ajouter `?server=wss://detonate-v37-test.fly.dev` à l'adresse.
    - Les profils de test sont séparés de ceux de la production.
    - **Pour publier ensuite** : envoyer le dossier `detonate-v3.7` (avec le `fly.toml` de production) dans le dépôt principal, puis lancer le même bouton depuis ce dépôt, avec son propre secret `FLY_API_TOKEN` (un jeton de l'application `detonate-prototype` suffit).
    - Si le nom `detonate-v37-test` est déjà pris sur Fly, changer `app = '…'` dans le `fly.toml` de test.
  - Seuls `.github/workflows/fly.yml` (les deux dossiers) et `fly.toml` (dossier de test) changent pour cette étape : à mettre sur le dépôt de test.
  - **Bouton GitHub : ajout des serveurs dans les autres régions**
    - `.github/workflows/fly.yml` s'appelle maintenant « Fly : serveurs, volumes et déploiement ». Il lit `app`, `primary_region` et `REGIONS` dans `fly.toml`, puis :
      1. il vérifie l'application, et qu'il n'y a pas deux machines dans une même région (sinon il s'arrête avec un message) ;
      2. il crée la clé `PROFILE_KEY` (une seule fois) et les volumes manquants des machines existantes ;
      3. il déploie la version du dépôt ;
      4. pour chaque région de `REGIONS` sans machine, il ajoute une machine : une copie de celle de la région principale (512 Mo), avec son propre volume neuf.
    - Il sert au dépôt de test et au dépôt de production. On peut le relancer : rien n'est créé deux fois, et les profils restent.
    - Vérifié sur une simulation des commandes Fly :
      - application de test (une machine à `iad`) → 4 machines et 4 volumes ;
      - application neuve → création, puis 4 machines ;
      - production (4 machines sans volume) → 4 volumes, aucune machine en plus ;
      - deux machines dans une même région → arrêt avec un message ;
      - second lancement → rien de créé.
    - **Dossier `detonate-v3.7-test`** : `fly.toml` reprend celui du dépôt de test, créé par Fly Launch (application `detonate-v3-7xyz14`, 4 régions, volume `/data`).
    - **Profil identique quelle que soit la région** : tous les profils sont dans un seul fichier, sur le volume de la machine `iad` (`PROFILE_REGION`). Les machines de cdg, lax et sin n'en gardent aucun :
      - elles envoient l'XP de leurs parties à `iad` ;
      - Fly leur renvoie les demandes de profil du navigateur vers `iad` ;
      - le navigateur garde l'identifiant du profil, et le code de sauvegarde sert pour un autre appareil.
    - **Redéploiement** : les profils restent. Le volume `/data` survit aux déploiements, aux redémarrages et aux mises en pause. Ils seraient perdus seulement :
      - si l'on supprime le volume `iad` ou l'application ;
      - si l'on retire `[mounts]` de `fly.toml` (le journal affiche alors « ATTENTION ») ;
      - si l'on change `PROFILE_REGION` (les profils resteraient sur l'ancien volume).
      Fly garde aussi une copie quotidienne du volume pendant 5 jours.
  - Seuls `.github/workflows/fly.yml` (les deux dossiers) et `fly.toml` (dossier de test) changent pour cette étape : à mettre sur le dépôt de test.
  - **Code de sauvegarde : unique et permanent**
    - **Principe** :
      - le code `DTN2.<identifiant>.<secret>` est créé une seule fois par le serveur, à la première visite ;
      - l'identifiant est tiré au hasard et vérifié unique, le secret fait 120 bits ;
      - le code ne contient ni l'XP ni le pseudo : il ne change ni après une partie, ni après un changement de pseudo, de région, d'appareil, ni après un redéploiement (l'ancien code `DTN1` contenait l'XP et changeait à chaque partie).
    - **Rangé par serveur** : le navigateur garde le code du serveur de test et celui de la production séparément. Jouer sur l'un ne remplace jamais le code de l'autre. Les codes déjà créés sont repris tels quels.
    - **Jamais perdu sans trace** :
      - si un code est remplacé sur un appareil (import d'un autre code, ou profil inconnu du serveur), l'ancien est gardé dans la liste `detonate_pid_old` (10 derniers) ;
      - après un import, le message affiche l'ancien code de l'appareil, qui reste valable ;
      - importer le code déjà utilisé le signale au lieu de le refaire ;
      - si le serveur est injoignable, le message ne dit plus « aucun profil ».
    - **Côté serveur** (`profiles.js`), pour ne jamais repartir d'une liste vide (ce qui aurait donné de nouveaux codes à tout le monde) :
      - sur Fly, sans volume monté sur `/data`, ou avec un fichier des profils illisible, le serveur refuse de gérer les profils (réponse 503) ;
      - le jeu reste jouable et chaque joueur garde son code ;
      - le fichier illisible n'est jamais écrasé, et le journal affiche « Profils : ERREUR … ».
    - **Copie quotidienne** : `profiles-AAAA-MM-JJ.json` dans `/data`, les 7 dernières sont gardées, en plus des copies du volume faites par Fly.
    - **Testé** (serveur local, deux navigateurs) :
      - même code après rechargement, après une partie et après un changement de pseudo ;
      - deux appareils → deux codes différents ;
      - import du code de A sur B → même XP et même pseudo, l'ancien code de B gardé ;
      - code invalide, code inconnu, double import → messages justes ;
      - redémarrage du serveur → mêmes codes et même XP ;
      - fichier abîmé ou « Fly sans volume » → codes gardés, fichier intact ;
      - code d'une version précédente → repris à l'identique.
    - **En ligne** : les 4 serveurs du test (iad, cdg, lax, sin) répondent chacun depuis leur région.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub (puis relancer le bouton « Fly : serveurs, volumes et déploiement », ou laisser Fly redéployer).
  - **Profil : mode invité, un seul appareil à la fois, 0 XP pour une partie quittée**
    - **Invité à la première visite** :
      - aucun profil n'est créé automatiquement : le joueur est « Invité » (pastille grise « Invité · Créer un profil ») ;
      - en invité, la partie se joue normalement, mais l'XP n'est pas sauvegardée. Le bandeau de fin le dit : « Partie en invité : XP non sauvegardée · crée ton profil dans le menu » ;
      - la fenêtre du profil propose « Créer mon profil » (il suffit d'un pseudo) et « J'ai déjà un profil » (coller son code) ;
      - le serveur ne crée un profil que sur ce bouton : plus de profils inutiles pour les simples visiteurs ;
      - un joueur qui avait une progression de l'étape 1 dans ce navigateur la retrouve à la création (3 000 XP au plus) ;
      - les profils déjà créés restent actifs, avec le même code.
    - **Un profil ne joue que sur un appareil (un onglet) à la fois** :
      - chaque page du jeu ouvre une session sur le serveur et la garde avec un signal toutes les 20 s ;
      - si le profil est déjà ouvert ailleurs, cet appareil reste en invité et la fenêtre du profil affiche « Profil ouvert sur un autre appareil » avec le bouton « Jouer ici avec mon profil » ;
      - en appuyant sur ce bouton, l'autre appareil passe en invité dans les 20 s, avec le message « Ton profil vient d'être ouvert sur un autre appareil : tu joues maintenant en invité. » ;
      - une page fermée libère le profil au bout de 75 s ; recharger la page garde la session (pas de blocage) ;
      - l'XP (solo et en ligne) n'est comptée que pour la session en cours : une partie finie sur l'appareil remplacé affiche « XP non comptée : ton profil est ouvert sur un autre appareil » ;
      - en ligne, un profil ouvert ailleurs rejoint le salon en invité (sans niveau affiché).
    - **Partie quittée ou non terminée : 0 XP** :
      - solo : l'XP n'est donnée qu'à l'écran de fin, quitter avant ne rapporte rien ;
      - en ligne :
        - bouton « Quitter » pendant la partie : 0 XP, même en revenant avant la fin (« XP non comptée : partie quittée ») ;
        - déconnecté plus d'un quart de la partie : 0 XP ;
        - une courte coupure reste acceptée, mais ce que l'IA a fait à sa place pendant l'absence (ou avant son arrivée en cours de partie) ne compte pas ;
      - la fenêtre « Quitter la partie ? » le rappelle (« … ne te rapportera pas d'XP »).
    - **XP totale pour atteindre chaque niveau** (au niveau 30, l'XP s'arrête) :

      | Niveau | XP totale | Pour le suivant |
      |---|---|---|
      | 1 | 0 | 250 |
      | 2 | 250 | 374 |
      | 3 | 624 | 506 |
      | 4 | 1 130 | 646 |
      | 5 | 1 776 | 794 |
      | 6 | 2 570 | 950 |
      | 7 | 3 520 | 1 114 |
      | 8 | 4 634 | 1 286 |
      | 9 | 5 920 | 1 466 |
      | 10 | 7 386 | 1 654 |
      | 11 | 9 040 | 1 850 |
      | 12 | 10 890 | 2 054 |
      | 13 | 12 944 | 2 266 |
      | 14 | 15 210 | 2 486 |
      | 15 | 17 696 | 2 714 |
      | 16 | 20 410 | 2 950 |
      | 17 | 23 360 | 3 194 |
      | 18 | 26 554 | 3 446 |
      | 19 | 30 000 | 3 706 |
      | 20 | 33 706 | 3 974 |
      | 21 | 37 680 | 4 250 |
      | 22 | 41 930 | 4 534 |
      | 23 | 46 464 | 4 826 |
      | 24 | 51 290 | 5 126 |
      | 25 | 56 416 | 5 434 |
      | 26 | 61 850 | 5 750 |
      | 27 | 67 600 | 6 074 |
      | 28 | 73 674 | 6 406 |
      | 29 | 80 080 | 6 746 |
      | 30 | 86 826 | — |

      Correction : il faut 6 746 XP (et non 4 730, comme écrit plus haut) pour passer du niveau 29 au niveau 30.
    - **Testé** :
      - serveur avec 5 joueurs (dont un invité) : invité → aucune XP, « Quitter » puis retour → 0 XP, coupure de 2 s → XP comptée, profil repris par un autre appareil pendant la partie → XP refusée, ouverture ailleurs sans reprise → refusée ;
      - navigateur : invité sans profil créé, création du profil, même code au rechargement, import sur un téléphone → « ouvert sur un autre appareil », « Jouer ici » → le PC passe en invité, second onglet → bloqué.
  - `index.html`, `server.js` et `profiles.js` changent pour cette étape : à remplacer sur GitHub (dépôt de test), puis redéployer sur Fly (bouton « Fly : serveurs, volumes et déploiement »).
  - **XP divisée par deux, plus de ×0,5 contre l'IA, fenêtre du profil refaite**
    - **Nouveau barème** : tous les points sont divisés par deux, et la division par deux contre l'IA est retirée. Une partie solo rapporte donc autant qu'avant, une partie en ligne deux fois moins. Les niveaux ne changent pas (86 826 XP pour le niveau 30).

      | Gain | XP |
      |---|---|
      | Partie terminée | +25 |
      | Victoire | +50 |
      | Élimination | +5 |
      | MVP (hors mode Zombie) | +25 |
      | Première victoire du jour | +75 |
      | Bombe : posée / désamorcée / drapeau | +12,5 / +15 / +10 |
      | Code Rouge : antenne / missile / mallette renvoyée | +12,5 / +20 / +10 |
      | Escorte : C4 / obus au but | +10 / +7,5 |
      | Zones : seconde dans la zone | +0,25 (75 au plus) |
      | Cristal déposé | +15 |
      | Zombie tué / vague survécue | +1 / +5 |
      | Match à mort : drapeau | +10 |

      Chaque ligne est arrondie à l'entier (une bombe posée : +13).
    - **Face aux bots** : toujours 3 000 XP par jour au plus. Cette limite compte maintenant aussi les salons privés à moins de 2 joueurs humains, pour qu'un salon vide ne la contourne pas. Les règles solo restent (90 s de jeu, 90 s entre deux parties).
    - **Fenêtre du profil** :
      - une barre de titre en haut (« Mode invité », « Mon profil » ou « Calcul de l'XP ») avec la croix alignée à droite : elle ne chevauche plus le contenu et reste visible quand on fait défiler ;
      - invité : une carte courte et centrée (insigne « + », « Crée ton profil pour sauvegarder ton XP. », pseudo + « Créer ») ;
      - le long texte d'explication est retiré ; l'import du code est caché derrière « J'ai déjà un code » (« Changer de profil » pour un joueur connecté) ;
      - profil ouvert ailleurs : une phrase et le bouton « Jouer ici avec mon profil ».
    - **Bouton « Calcul de l'XP »** (dans la fenêtre du profil, pour tous) : il ouvre le barème complet, en trois blocs (chaque partie terminée, objectifs du mode, règles), avec un bouton retour. Échap revient en arrière.
    - Testé : barème vérifié sur le serveur pour les 7 modes ; partie en ligne → +150 (25 + 50 + 75) au lieu de +300 ; captures sur ordinateur et téléphone.
  - `index.html`, `server.js` et `profiles.js` changent pour cette étape : à remplacer sur GitHub (dépôt de test), puis redéployer sur Fly.
  - **Plus de limite d'XP par jour, système d'XP recalculé (montée de niveau difficile)**
    - **Mesure** : des parties complètes jouées par les bots, 3 à 5 par mode, ont servi à mesurer l'XP gagnée par heure. Avec l'ancien barème, elle allait du simple au triple selon le mode : 453 XP/h en Code Rouge (parties de 30 min) contre 1 260 XP/h en Cristal (parties de 7 min), parce que les bonus de fin de partie étaient les mêmes partout.
    - **Fin de partie par mode** : les parties longues rapportent plus. On gagne maintenant à peu près la même XP par heure dans tous les modes (de 773 à 1 013 XP/h, environ 870 en moyenne pour un joueur moyen) : aucun mode ne sert de raccourci.

      | Mode | Partie terminée | Victoire |
      |---|---|---|
      | Bombe | +30 | +60 |
      | Match à mort | +15 | +30 |
      | Zones | +15 | +30 |
      | Cristal | +10 | +40 |
      | Code Rouge | +100 | +200 |
      | Zombie | +40 | +120 |
      | Escorte | +50 | +100 |

      Les autres gains ne changent pas (élimination +5, MVP +25, première victoire du jour +75, objectifs des modes), sauf le cristal déposé : +10 au lieu de +15.
    - **Courbe des niveaux plus raide** : 300 XP pour le niveau 2, puis 300 + 200 × (n − 1) + 6 × (n − 1)² pour passer du niveau n au suivant. Il faut 136 184 XP pour le niveau 30 (au lieu de 86 826), soit environ 13 h de jeu pour le niveau 10, 60 h pour le 20 et 156 h pour le 30 pour un joueur moyen.

      | Niveau | XP totale | Pour le suivant | Temps de jeu (joueur moyen) |
      |---|---|---|---|
      | 1 | 0 | 300 | 0 h |
      | 2 | 300 | 506 | 0 h |
      | 3 | 806 | 724 | 1 h |
      | 4 | 1 530 | 954 | 2 h |
      | 5 | 2 484 | 1 196 | 3 h |
      | 6 | 3 680 | 1 450 | 4 h |
      | 7 | 5 130 | 1 716 | 6 h |
      | 8 | 6 846 | 1 994 | 8 h |
      | 9 | 8 840 | 2 284 | 10 h |
      | 10 | 11 124 | 2 586 | 13 h |
      | 11 | 13 710 | 2 900 | 16 h |
      | 12 | 16 610 | 3 226 | 19 h |
      | 13 | 19 836 | 3 564 | 23 h |
      | 14 | 23 400 | 3 914 | 27 h |
      | 15 | 27 314 | 4 276 | 31 h |
      | 16 | 31 590 | 4 650 | 36 h |
      | 17 | 36 240 | 5 036 | 42 h |
      | 18 | 41 276 | 5 434 | 47 h |
      | 19 | 46 710 | 5 844 | 54 h |
      | 20 | 52 554 | 6 266 | 60 h |
      | 21 | 58 820 | 6 700 | 68 h |
      | 22 | 65 520 | 7 146 | 75 h |
      | 23 | 72 666 | 7 604 | 83 h |
      | 24 | 80 270 | 8 074 | 92 h |
      | 25 | 88 344 | 8 556 | 101 h |
      | 26 | 96 900 | 9 050 | 111 h |
      | 27 | 105 950 | 9 556 | 122 h |
      | 28 | 115 506 | 10 074 | 133 h |
      | 29 | 125 580 | 10 604 | 144 h |
      | 30 | 136 184 | — | 156 h |

      Les profils existants gardent leur XP ; leur niveau est recalculé avec la nouvelle courbe.
    - **Limite de 3 000 XP par jour retirée** (solo comme en ligne).
    - **Anti-triche en solo** : les parties solo tournent dans le navigateur, et la limite par jour était la seule protection contre un jeu modifié. Elle est remplacée par :
      - au début d'une partie solo, le jeu l'annonce au serveur, qui note l'heure et le mode ;
      - à la fin, le serveur mesure lui-même la durée (90 s au moins) et utilise le mode annoncé au début ;
      - au plus 60 XP par minute de jeu, hors première victoire du jour : un joueur moyen en gagne environ 14, un très bon joueur une quarantaine ;
      - une partie dont le début n'a pas été reçu ne rapporte rien (« début de partie non reçu par le serveur ») ;
      - la règle « 90 s entre deux parties solo » disparaît.
    - Les parties en ligne restent calculées entièrement par le serveur.
    - **Bouton « Calcul de l'XP »** : le barème affiché est mis à jour (fin de partie par mode, pendant la partie, objectifs, règles, niveau 30 = 136 184 XP).
    - Testé : 24 parties simulées avec le nouveau barème ; serveur (partie sans début → refusée, partie de moins de 90 s → refusée, mode changé à la fin → ignoré, rapport truqué → plafonné) ; en ligne (Escorte gagnée → +225 = 50 + 100 + 75) ; jeu (annonce du début de partie solo).
  - `index.html`, `server.js` et `profiles.js` changent pour cette étape : à remplacer sur GitHub (dépôt de test), puis redéployer sur Fly.
  - **V3.7 · Skins : 29 modèles en 5 catégories (étape « modèles » ; le déblocage par le serveur et l'affichage aux autres joueurs viendront ensuite)**
    - **Principe** : une récompense par niveau, du niveau 2 au niveau 30. Les modèles sont faits pour la vue du jeu (caméra presque au-dessus) : coiffes, épaules, sac dans le dos, arme et aura au sol. Aperçu de tous les modèles : `detonate-v3.7-skins.png` (vue 3/4 et vue de jeu).

      | Niveau | Skin | Catégorie | Rareté |
      |---|---|---|---|
      | 2 | Sable | Arme | Commun |
      | 3 | Casquette | Bonnet | Commun |
      | 4 | Camouflage forêt | Tenue | Commun |
      | 5 | Sac tactique | Sac | Commun |
      | 6 | Braise | Aura | Commun |
      | 7 | Carbone | Arme | Commun |
      | 8 | Bonnet gamer | Bonnet | Commun |
      | 9 | Camouflage arctique | Tenue | Rare |
      | 10 | Sac de sport | Sac | Rare |
      | 11 | Givre | Aura | Rare |
      | 12 | Glacier | Arme | Rare |
      | 13 | Béret | Bonnet | Rare |
      | 14 | Urbain | Tenue | Rare |
      | 15 | Sac radio | Sac | Rare |
      | 16 | Toxique | Aura | Rare |
      | 17 | Chapeau ranger | Bonnet | Épique |
      | 18 | Néon | Arme | Épique |
      | 19 | Hazmat | Tenue | Épique |
      | 20 | Électrique | Aura | Épique |
      | 21 | Jetpack | Sac | Épique |
      | 22 | Casque à cornes | Bonnet | Épique |
      | 23 | Furtif | Tenue | Épique |
      | 24 | Lave | Arme | Épique |
      | 25 | Ombre | Aura | Légendaire |
      | 26 | Cristal | Sac | Légendaire |
      | 27 | Élite dorée | Tenue | Légendaire |
      | 28 | Or massif | Arme | Légendaire |
      | 29 | Couronne | Bonnet | Légendaire |
      | 30 | Aura royale | Aura | Légendaire |

      Les niveaux sont une proposition : ils se changent dans `SKIN` (champ `lv` de chaque skin).
    - **Tenues (6)** : tissu du torse, des bras et des jambes, plus des pièces ajoutées (écharpe, col en fourrure, gilet et radio d'épaule, bandes de sécurité et cartouche, lignes lumineuses qui pulsent, épaulières et liserés dorés).
    - **Bonnets (6)** : ils remplacent le casque (casquette avec visière vers l'avant, bonnet à pompon, béret avec insigne, chapeau à large bord, casque à cornes, couronne avec pierres).
    - **Armes (6)** : finition de l'arme (camouflage sable, carbone, glace brillante, néon qui change de couleur, lave dont les fissures pulsent, or gravé). Elle s'applique à toutes les armes du jeu : fusil standard, armes du mode Zombie, armes de Tetris et de Neon Grid.
    - **Sacs (5)** : dans le dos (sac tactique avec natte roulée, sac de sport, radio avec antenne et voyant qui clignote, jetpack avec flammes, cristaux lumineux). Le sac est caché pendant qu'on porte la bombe, pour laisser voir son voyant.
    - **Auras (6)** : effet animé au sol autour du personnage (braises, éclats de glace qui tournent, bulles toxiques, arcs électriques, fumée d'ombre, anneaux et diamants dorés). L'aura disparaît à la mort et n'est visible que si le personnage l'est.
    - **Lisibilité des équipes** : l'anneau de couleur au sol reste intact (les auras sont creuses à cet endroit) et toutes les tenues portent un brassard à la couleur de l'équipe sur chaque bras.
    - **Toutes les cartes** : les skins se posent sur les trois modèles de personnages (soldat standard, Neon Grid, survivant du mode Zombie). Un skin retiré rend le personnage d'origine.
    - **Casier** (fenêtre du profil → bouton « Skins ») :
      - aperçu 3D du personnage qui tourne (on peut le faire pivoter au doigt ou à la souris) et bouton « Vue de jeu » pour le voir du dessus, comme en partie ;
      - 5 onglets (Tenue, Bonnet, Arme, Sac, Aura), une vignette 3D par skin, la rareté en couleur ;
      - un skin verrouillé affiche son niveau (🔒 Niv. 12) ; on peut l'essayer dans l'aperçu, mais pas l'équiper ;
      - un invité ne débloque rien : le casier l'invite à créer son profil.
    - **En jeu, pour l'instant** : le joueur voit ses propres skins sur son personnage, en solo comme en ligne. Les autres joueurs ne les voient pas encore, et le déblocage est vérifié dans le navigateur (niveau du profil). L'étape suivante : skins équipés enregistrés dans le profil sur le serveur, niveau vérifié par le serveur, skins visibles par tous en partie privée, annonce de la récompense à chaque niveau gagné.
    - **Pour tester** : ajouter `?skins=all` à l'adresse du jeu débloque tous les skins sur cet appareil (réglage de test, à retirer à l'étape suivante).
    - Testé : les 29 modèles rendus un par un (vue 3/4 et vue de jeu) ; skins portés en partie sur les 7 cartes sans erreur ; casier sur ordinateur, téléphone à la verticale et à l'horizontale ; le serveur fait toujours tourner les parties.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Première victoire du jour : +150 XP (au lieu de +75)**
    - Le bonus est doublé sur le serveur (`profiles.js`) et dans le barème affiché par le bouton « Calcul de l'XP ».
    - Le plafond des parties solo (60 XP par minute) laisse toujours passer ce bonus en plus.
    - Durée estimée pour le niveau 30, joueur moyen : environ 134 jours à 1 h par jour (144 avant), environ 72 jours à 2 h par jour (75 avant).
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Skins : armes or et néon plus brillantes, gros cristal, nouveau bonnet ; écran de fin toujours au-dessus**
    - **Or massif** :
      - métal gravé qui brille même sur les cartes de nuit ;
      - arêtes polies lumineuses sur toutes les pièces de l'arme ;
      - halo doré qui pulse autour de l'arme ;
      - reflet blanc qui balaie l'arme toutes les 2 secondes, et éclats en étoile qui scintillent.
    - **Néon** :
      - toutes les arêtes de l'arme deviennent des tubes de néon, avec une couleur qui défile (cyan, violet, magenta) ;
      - halo de la même couleur qui pulse ;
      - étincelles qui courent le long de l'arme.
    - Ces effets suivent l'arme dans toutes ses formes : fusil standard, Neon Grid, Tetris et chaque arme du mode Zombie.
    - **Cristal** (remplace le « Sac à cristaux », même niveau 26) :
      - un seul gros cristal violet (prisme à six faces et deux pointes) qui flotte et tourne sur lui-même dans le dos ;
      - facettes nettes qui renvoient de vrais reflets d'un décor lumineux : un reflet passe sur chaque face pendant la rotation ;
      - cœur lumineux à l'intérieur, halo violet, éclats qui scintillent sur les pointes ;
      - tenu par un support : plaque dans le dos, deux pinces, deux bandes lumineuses.
    - **Bonnet gamer** (remplace le « Bonnet à pompon » rouge, même niveau 8) : bonnet côtelé anthracite légèrement penché en arrière, revers à côtes, étiquette orange devant, et casque audio par-dessus (arceau, oreillettes avec un anneau lumineux cyan qui pulse, petit micro). Un joueur qui portait le bonnet à pompon porte automatiquement le nouveau.
    - **Écran de fin de partie** :
      - le fil des éliminations (« Joueur ✕ Joueur », en haut à droite) était dessiné après l'écran de fin et passait par-dessus le résumé ; c'était aussi le cas de la carte des missiles (Front) et des joysticks tactiles ;
      - l'écran de fin et le tableau des scores sont maintenant dessinés en tout dernier, sur toutes les cartes ;
      - mode Zombie : l'inventaire, le sac et le menu de fabrication ne s'affichent plus pendant l'écran de fin.
    - Testé : rendu des nouveaux skins (vue 3/4 et vue de jeu), en partie sur Nuit et Forêt, écrans de fin avec le fil des éliminations rempli, les 7 cartes démarrent sans erreur.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Skins : reflet de l'or corrigé, béret et bonnet gamer refaits**
    - **Or massif** :
      - le reflet est maintenant une bande de lumière qui glisse sur le métal de l'arme, de la crosse jusqu'au bout de la carcasse, et s'arrête avant le canon ;
      - avant, c'était une barre qui traversait toute la longueur, canon compris, et dépassait sous l'arme ;
      - le reflet suit la forme de chaque pièce (carcasse, poignée, rail) sur toutes les armes : fusil standard et armes du mode Zombie (les canons ronds ne sont jamais balayés).
    - **Béret** :
      - feutre bordeaux plus fin et mat ;
      - forme plus ronde qui retombe doucement sur le côté droit ;
      - bandeau de cuir plus fin, petit nœud à l'arrière ;
      - insigne sur le bord gauche : écusson sombre, étoile dorée en relief dans un cercle doré.
    - **Bonnet gamer** :
      - côtes qui montent jusqu'au sommet ;
      - revers épais et moelleux avec une rayure turquoise ;
      - étiquette orange tissée sur le côté ;
      - casque audio plus fin : arceau plat avec une bande intérieure, curseurs en métal, oreillettes arrondies avec un anneau lumineux et un logo orange ;
      - le micro est retiré.
    - Dans le casier, les vignettes des bonnets sont vues de trois quarts gauche, pour montrer l'insigne du béret.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Skins : enregistrés sur le serveur, visibles par tous, annonce des récompenses**
    - **Enregistrement sur le serveur** (`profiles.js`) :
      - les skins équipés sont gardés dans le profil, champ `skn` ;
      - le serveur connaît le niveau qui débloque chaque skin (table `SKIN_LV`, la même que dans le jeu) et ne garde que des skins débloqués : un jeu modifié ne peut pas porter un skin verrouillé ;
      - équiper ou retirer un skin dans le casier l'enregistre aussitôt ; sur un autre appareil (même code), on retrouve les mêmes skins ;
      - si le serveur est injoignable au moment d'équiper, le choix est renvoyé dès qu'il revient ;
      - le réglage de test `?skins=all` est retiré.
    - **Skins visibles par tous en partie privée** (`server.js`) :
      - à l'entrée dans un salon, le serveur lit les skins du profil et les envoie à tout le salon avec la liste des joueurs ;
      - en partie, chaque joueur voit les skins des autres joueurs humains (les bots n'en ont pas) ;
      - changer de skin dans le casier pendant qu'on est dans un salon le montre tout de suite aux autres (message `sk`, vérifié par le serveur avec le niveau du joueur) ;
      - un joueur passé au niveau supérieur à la fin d'une partie peut porter ses nouveaux skins dès la suivante ;
      - un profil ouvert sur un autre appareil, ou un invité, joue sans skins.
    - **Annonce des récompenses** :
      - à la fin d'une partie, quand un niveau gagné débloque un ou plusieurs skins, une carte s'ouvre après l'animation de la barre d'XP : « Niveau 8 atteint ! », vignette 3D de chaque skin, catégorie, rareté, bouton « Équiper », puis « Continuer » ;
      - dans le casier, un badge « NOUVEAU » sur chaque skin débloqué pas encore vu, et un point sur l'onglet concerné ;
      - un point doré sur la pastille du profil (menu) et un compteur sur le bouton « Skins » tant qu'il reste des skins nouveaux ;
      - dans la fenêtre du profil, la prochaine récompense : « Prochaine récompense · niveau 9 », avec sa vignette, son nom et sa rareté.
    - **Serveur de test** : `fly.toml` du dossier `detonate-v3.7-test` contient `SKINS_ALL = '1'`, qui débloque tous les skins pour tout le monde sur ce serveur, pour pouvoir les essayer à plusieurs. Supprimer cette ligne pour tester la vraie progression. Le `fly.toml` de production ne l'a pas.
    - Testé :
      - serveur : skin verrouillé refusé, skins transmis au salon, changement en direct, profil dans une autre région ;
      - navigateur, deux joueurs : skins équipés dans le casier, retrouvés après rechargement sans copie locale ; skins d'Alice visibles chez Bob en partie ; carte de récompense et bouton « Équiper » ;
      - les 7 cartes démarrent sans erreur.
  - `index.html`, `server.js` et `profiles.js` changent pour cette étape, ainsi que `fly.toml` du dossier de test : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Serveur de test : `SKINS_ALL` retiré, sauvegarde des skins vérifiée**
    - La ligne `SKINS_ALL = '1'` est retirée du `fly.toml` de test : les skins se débloquent maintenant par niveau, comme en production.
    - Le serveur (sans `SKINS_ALL`) a passé 24 vérifications de la sauvegarde des skins :
      - skins débloqués enregistrés dans `profiles.json` (champ `skn`), y compris après un arrêt brutal du serveur 0,2 s après le choix (l'arrêt force l'écriture) ;
      - clé secrète du profil intacte ;
      - mêmes skins après redémarrage et sur un autre appareil ;
      - l'ancien appareil, remplacé, ne peut plus les changer ;
      - skins verrouillés, faux noms, données invalides et mauvais code refusés ou nettoyés ;
      - anciens profils sans skins : connexion normale ;
      - un skin au-dessus du niveau du joueur (si les niveaux changent un jour) est caché mais gardé dans le fichier ;
      - salon : skins transmis aux autres joueurs, invité sans skins, skin verrouillé refusé ;
      - copie quotidienne du fichier présente.
    - Test complet dans le navigateur, sans raccourci :
      - un nouveau profil au niveau 1 ne peut qu'essayer « Sable » ;
      - une vraie partie en ligne (Escorte gagnée : +300 XP) le fait passer au niveau 2, et la carte « Niveau 2 atteint ! » propose « Sable » ;
      - « Équiper » l'enregistre sur le serveur et le montre tout de suite à l'autre joueur du salon ;
      - le même code sur un autre appareil retrouve le niveau 2 et l'arme « Sable » ;
      - le fichier du serveur contient bien le skin.
  - Seul `fly.toml` du dossier de test change pour cette étape : à remplacer sur le dépôt de test, puis redéployer sur Fly.
  - **Pastille du profil corrigée sur mobile, couleurs de rareté des skins**
    - **Bug corrigé** : le point doré « nouveaux skins » de la pastille du profil était placé à une distance fixe du bord gauche. Sur téléphone à l'horizontale (pastille plus étroite), il recouvrait le début du pseudo. Il est maintenant dans le coin en haut à droite de la pastille, sur tous les écrans.
    - **Couleurs de rareté** :

      | Rareté | Couleur |
      |---|---|
      | Commun | gris clair `#a3b1c2` |
      | Rare | bleu `#3fa2ff` |
      | Épique | violet `#b768ff` |
      | Légendaire | orange doré `#ffae2b` (distinct du jaune de l'interface) |

    - **Cartes du casier** :
      - bord et fond légèrement teintés de la couleur de rareté ;
      - halo de cette couleur derrière le modèle (vignettes sur fond transparent) ;
      - trait coloré sous la vignette et pastille de rareté en majuscules ;
      - épique : léger halo autour de la carte ; légendaire : halo plus fort et reflet lumineux qui fait le tour du bord ;
      - skin équipé : contour blanc et coche ✓ ;
      - skin verrouillé : vignette assombrie, étiquette « 🔒 Niv. 12 » en haut à droite, mais rareté toujours visible.
    - **Partout ailleurs** : même style sur la carte de récompense de fin de partie et sur « Prochaine récompense » dans la fenêtre du profil.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Point « nouveaux skins » dans le coin en haut à gauche de la pastille du profil** : vérifié sur ordinateur, sur téléphone à l'horizontale et à la verticale. Il ne recouvre jamais le pseudo.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **25 skins de la boutique ajoutés au jeu, gratuits pendant les tests**
    - La boutique n'existe pas encore. En attendant, ces 25 skins sont utilisables par tout le monde, sans niveau requis, pour pouvoir les tester en jeu.
    - **Les skins** :

      | Catégorie | Commun | Rare | Épique | Légendaire |
      |---|---|---|---|---|
      | Tenue | Costard | Squelette, Astronaute | Samouraï | Hologramme |
      | Bonnet | Bandana | Casque de samouraï, Casque spatial | Masque de kitsune | Auréole |
      | Arme | Bambou | Graffiti | Circuit, Galaxie | Prisme |
      | Sac | Carapace | Katanas croisés | Drone compagnon, Ailes de démon | Ailes d'ange |
      | Aura | Mélodie | Pétales de cerisier | Orbite, Cercle d'énergie | Flammes spectrales |

    - **Casier** : dans chaque catégorie, les skins de la boutique sont sous les skins de niveau, après un titre « Boutique · gratuit pendant les tests ». Ils s'équipent d'un clic, même en invité.
    - **Ce qui ne change pas** : les 29 skins de niveau, leurs niveaux et l'annonce des récompenses. Les skins de la boutique ne comptent ni dans « Prochaine récompense », ni dans la carte de fin de partie, ni dans le point doré « nouveaux skins ».
    - **Serveur** (`profiles.js`) : nouvelle liste `SKIN_SHOP`. Le serveur accepte et enregistre ces skins pour tout profil, et les transmet aux autres joueurs du salon. Un invité les voit sur lui, mais les autres joueurs ne les voient que s'il a un profil (comme pour les skins de niveau).
    - **Quand la boutique existera** : il faudra remplacer « gratuit pour tous » par « possédé par le profil », au même endroit dans le jeu (`unl`, dans `SKIN`) et sur le serveur (`cleanSkins`, dans `profiles.js`).
    - **Dans le code** : chaque skin de la boutique porte `shop:1` et sa rareté `r` (0 commun à 3 légendaire). Les plumes de chaque aile sont réunies dans une seule géométrie pour ne pas alourdir le jeu.
    - **Vérifié** :
      - en jeu sur 5 cartes (personnage classique, néon, survivant du mode Zombie), les 25 skins portés, sans erreur ;
      - casier sur ordinateur et sur téléphone à l'horizontale ;
      - serveur : les 25 skins acceptés au niveau 1, skins de niveau verrouillés toujours refusés, mauvaise catégorie refusée, sauvegarde gardée après redémarrage (6 vérifications, plus les 24 de la sauvegarde des skins) ;
      - 7 cartes lancées sans erreur.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Arme qui dépassait dans le dos, vue 3D du casier refaite**
    - **Arme dans le dos (corrigé)** : la crosse du fusil du soldat standard (cartes Nuit, Désert, Base polaire, Front) sortait de 2,5 derrière le dos et traversait le sac. Elle s'arrête maintenant dans le torse. Le soldat Neon Grid et le survivant du mode Zombie n'avaient pas ce défaut.
    - **Halo des armes** (Néon, Or massif, Circuit, Galaxie, Prisme) : il commence à l'arrière de l'arme et ne déborde plus derrière le dos ; il dépasse toujours un peu devant le canon.
    - **Rotation qui ne suivait pas (bug corrigé)** : à chaque appui sur l'aperçu, le jeu capturait aussi le pointeur pour son grand canevas, si bien que l'aperçu ne recevait plus les mouvements. Le casier garde maintenant ses appuis pour lui. Même correction sur la carte de récompense de fin de partie, où un appui pouvait déclencher le bouton de l'écran de fin dessiné dessous.
    - **Rotation fluide** :
      - vitesse calée sur le temps et non sur le nombre d'images : même vitesse sur tous les écrans (environ un tour en 15 s) ;
      - glisser gauche-droite pour tourner, haut-bas pour incliner la vue ; élan au lâcher, puis reprise douce de la rotation automatique ;
      - molette ou pincement à deux doigts pour zoomer (jusqu'à 2,5 fois plus près) ; double-clic ou double tape pour revenir à la vue complète ;
      - passage « Vue de jeu » / « Vue 3/4 » en transition douce.
    - **Tout le skin dans l'image** : le cadrage est calculé à partir du personnage et de tous ses skins (arme, ailes, drone, aura), relevés à plusieurs instants de leur animation. Il est le même sous tous les angles, donc l'image ne zoome pas pendant la rotation. Avec de grandes ailes ou une grande aura, le personnage apparaît plus petit : le zoom permet de regarder de plus près.
    - **Vignettes** : calculées par un moteur à part, quelques-unes par image, sans bloquer ni redimensionner l'aperçu (avant, l'ouverture d'un onglet figeait l'aperçu un instant). Les vignettes d'armes montrent l'arme entière, canon compris.
    - **Performances** : tant que le casier est ouvert, le décor du menu caché derrière n'est plus redessiné ; il reprend à la fermeture.
    - **Vérifié** : rotation automatique, glisser avec élan, inclinaison, zoom et double-clic ; cadrage complet sur ordinateur, téléphone à l'horizontale et à la verticale, avec trois ensembles de skins et sous quatre angles ; armes vues de près en partie ; 7 cartes lancées sans erreur.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Skins de la boutique visibles par tous en partie privée**
    - **Avant** : le serveur ne relayait les skins que pour les joueurs avec profil, et le jeu ne les annonçait au salon qu'au moment d'un changement dans le casier. Un invité portant un skin de la boutique restait donc sans skin aux yeux des autres.
    - **Serveur** (`server.js`) : le message « sk » est accepté de tout joueur du salon. Un invité est traité au niveau 0 : seuls les skins de la boutique passent (gratuits pendant les tests), les skins de niveau restent refusés. Un joueur qui perd son profil en cours de salon garde ses skins de boutique. Un envoi identique au précédent n'est pas rediffusé.
    - **Jeu** (`index.html`) : il annonce ses skins au serveur dès l'entrée dans un salon, puis à chaque changement, avec ou sans profil.
    - **Vérifié** :
      - salon à trois (un profil, deux invités) : skins de boutique vus par tous, skins de niveau verrouillés refusés, données invalides nettoyées, skins toujours transmis une fois la partie lancée (8 vérifications) ;
      - deux navigateurs en partie privée, tous deux invités : chacun voit les skins de l'autre dans le salon et en partie, y compris après un changement de sac dans le salon ;
      - sauvegarde des skins : 24 + 6 vérifications toujours bonnes.
  - `index.html` et `server.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly. `profiles.js` doit être celui de l'étape « 25 skins de la boutique » (il contient la liste `SKIN_SHOP`).
  - **Boutique : skins de la boutique payants, paiement par Stripe (mode test pour l'instant)**
    - **Principe** : chaque skin de la boutique s'achète à l'unité en euros. Le paiement se fait sur la page hébergée par Stripe (carte, Apple Pay, Google Pay selon le compte) : le jeu ne voit jamais de numéro de carte. Le serveur ne donne le skin que lorsque Stripe confirme le paiement. Fin de la gratuité : un skin de la boutique n'est équipé et montré aux autres que s'il est acheté.
    - **Prix** (table `PRICE` dans `profiles.js`, une seule ligne à changer) :

      | Rareté | Prix |
      |---|---|
      | Commun | 0,99 € |
      | Rare | 1,99 € |
      | Épique | 3,99 € |
      | Légendaire | 6,99 € |

    - **Dans le jeu** (Profil → Skins) :
      - section « Boutique » sous les skins de niveau, prix en pastille dorée sur chaque carte non achetée ;
      - un clic essaie le skin sur le personnage et affiche une barre « Acheter » ;
      - confirmation avant paiement : livraison immédiate et renonciation au droit de rétractation de 14 jours (même mention sur la page de Stripe) ;
      - après paiement, retour dans le jeu : le serveur vérifie le paiement auprès de Stripe, le skin est équipé et le casier s'ouvre dessus (« Merci ! … est à toi ») ; paiement annulé : message, rien n'est prélevé ;
      - un invité voit les prix et peut essayer, mais doit créer un profil pour acheter (le skin est enregistré dans le profil).
    - **Serveur** (`profiles.js`, `server.js`) :
      - nouvelles opérations `shop` (prix, sans profil), `buy` (ouvre la page de paiement, réservé à la session en cours), `claim` (retour de paiement : demande à Stripe si le paiement est passé) ;
      - webhook `/api/stripe/webhook` : signature vérifiée (clé `whsec_`, 5 minutes de tolérance) ; paiement confirmé = skin donné, même si le joueur ne revient pas dans le jeu ; remboursement complet ou litige = skin retiré et déséquipé ;
      - un même paiement ne compte qu'une fois (retour du joueur et webhook peuvent arriver tous les deux) ;
      - dans le profil : `own` (skins achetés) et `buy` (historique : session et paiement Stripe, montant, date, état). Aucune donnée de carte ni e-mail n'est enregistrée ;
      - salon : le serveur relit les skins possédés quand un joueur change de skin, donc un skin acheté pendant le salon est visible aussitôt ;
      - plusieurs régions : comme les profils, l'achat et le webhook sont renvoyés vers la région qui garde les profils.
    - **Secrets Fly à ajouter** (app de test d'abord) : `STRIPE_SECRET_KEY` (clé `sk_test_…`) et `STRIPE_WEBHOOK_SECRET` (clé `whsec_…`). Sans clé Stripe, la boutique affiche « bientôt disponible » et refuse les achats. `SHOP_FREE=1` rend la boutique gratuite (ancien comportement, pour un serveur de test).
    - **Webhook Stripe** : adresse `https://<app>.fly.dev/api/stripe/webhook`, événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`.
    - **Tester en mode test** : carte `4242 4242 4242 4242`, date future quelconque, code quelconque. Aucun argent réel.
    - **Avant le mode réel** : clés `sk_live_` et nouveau webhook en mode réel, entreprise déclarée, pages conditions de vente, mentions légales et remboursement. Les skins équipés pendant la période gratuite mais non achetés sont retirés automatiquement.
    - **Vérifié** : 38 vérifications du serveur avec un faux Stripe (achat, attente, retour, double retour, webhook signé ou falsifié, webhook reçu deux fois, remboursement partiel et complet, litige, annulation, salon, achat pendant le salon, redémarrage, sans clé, `SHOP_FREE`) ; parcours complet dans le navigateur (invité, achat, paiement, retour, annulation) ; anciens tests des skins et 7 cartes sans erreur.
  - `index.html`, `server.js` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly, après avoir ajouté les deux secrets Stripe.
  - **Boutique dans le menu : 4 skins, un par rareté, renouvelés toutes les 8 heures**
    - **Bouton « Boutique »** dans le menu principal, sous « Partie privée ». Il ouvre une fenêtre avec l'aperçu 3D et 4 cartes : un skin commun, un rare, un épique et un légendaire, avec leur prix et un compte à rebours « Nouveaux skins dans … ».
    - **Achat retiré du profil** : le casier (Profil → Skins) ne montre plus que les skins de niveau et, sous le titre « Achetés », les skins de boutique déjà possédés. Plus de prix ni de bouton d'achat dans le casier.
    - **Rotation** (serveur, `profiles.js`) :
      - changement à 0 h, 8 h et 16 h UTC ; la sélection ne dépend que de l'heure, donc tous les joueurs et toutes les régions voient la même boutique ;
      - pour chaque rareté, les skins passent dans un ordre mélangé : tous sont proposés avant qu'un seul ne revienne, et jamais le même deux fois de suite ;
      - le serveur refuse l'achat d'un skin qui n'est pas dans la sélection du moment ; si la boutique change pendant que la fenêtre est ouverte, le jeu charge la nouvelle sélection ;
      - un paiement commencé avant le changement reste valable.
    - **Dans la fenêtre** : un clic essaie le skin sur le personnage, puis « Acheter », confirmation et paiement Stripe comme avant. Un skin déjà possédé est marqué « Possédé » et s'équipe d'un clic. Après paiement, le casier s'ouvre sur le skin acheté, équipé.
    - **Vérifié** : rotation sur 400 créneaux (un skin par rareté, aucune répétition, tous les skins passent), achat hors sélection refusé, créneau suivant différent (11 vérifications) ; les 38 vérifications de paiement ; parcours dans le navigateur sur ordinateur et téléphone à l'horizontale (bouton du menu, boutique, achat, retour, « Possédé », casier sans prix).
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Prix de la boutique en dollars, code de sauvegarde masqué, message de prévention**
    - **Nouveaux prix** (dollars américains, table `PRICE` dans `profiles.js`) : commun 0,99 $, rare 1,49 $, épique 1,99 $, légendaire 2,99 $. Le paiement Stripe se fait en dollars ; les prix de l'étape précédente (euros) ne sont plus valables.
    - **Code de sauvegarde masqué** (fenêtre du profil) : il est remplacé par des points. Le bouton « Voir » l'affiche pendant 15 secondes, puis il se masque à nouveau, comme à la fermeture de la fenêtre. « Copier » copie le vrai code sans l'afficher. Personne ne peut donc le lire par-dessus l'épaule, sur une capture ou en direct.
    - **Message de prévention** sous le code : le code est la seule clé du profil (XP, niveau, skins achetés), le profil est perdu sans lui en cas de changement d'appareil ou d'effacement des données du navigateur, et il ne faut jamais le donner ni le montrer. Après « Copier », le jeu conseille de le coller dans un endroit sûr et privé.
    - **Vérifié** : code masqué au départ, copie du vrai code, « Voir » puis re-masquage à la réouverture, sur ordinateur et téléphone ; prix affichés en dollars dans la boutique ; 38 + 11 vérifications du serveur avec les nouveaux prix.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Boutique en euros (dollars au choix), 8 skins tirés au hasard, code PIN pour le code de sauvegarde**
    - **Devise** : les prix sont en euros par défaut (0,99 € commun, 1,49 € rare, 1,99 € épique, 2,99 € légendaire). Un bouton « € EUR / $ USD » en haut de la boutique affiche les prix en dollars américains ; le paiement se fait alors en dollars, aux mêmes montants (0,99 $, 1,49 $, 1,99 $, 2,99 $). Le choix est retenu sur l'appareil.
    - **Boutique à 8 skins** : deux communs, deux rares, deux épiques et deux légendaires, tirés au hasard par le serveur toutes les 8 heures (0 h, 8 h, 16 h UTC). Le tirage ne dépend que de l'heure : même boutique pour tous les joueurs et toutes les régions. Une même paire ne sort jamais deux fois de suite pour une rareté. L'achat reste limité à la sélection du moment.
    - **Code PIN** (fenêtre du profil) :
      - « Voir » et « Copier » demandent un code PIN à 4 chiffres ; au premier appui, le joueur le choisit ;
      - une fois accepté, il reste valable 60 secondes, puis il est redemandé ; tout se referme avec la fenêtre ;
      - le PIN est vérifié par le serveur, qui n'en garde que l'empreinte : 5 erreurs bloquent les essais pendant 5 minutes ;
      - « PIN oublié ? » : le joueur peut choisir un nouveau PIN 24 heures après sa demande (quelqu'un qui emprunte l'appareil ne peut pas le changer sur le moment) ; s'il retrouve son PIN entre-temps, la demande est annulée ;
      - le PIN suit le profil : il est aussi demandé sur un autre appareil.
    - **Limite à connaître** : le PIN protège l'affichage dans le jeu (regards, captures, direct). Le code reste enregistré dans le navigateur pour que le profil s'ouvre tout seul : quelqu'un qui a un accès technique complet à l'appareil peut encore le retrouver.
    - **Vérifié** : 19 vérifications du PIN (choix, erreurs, blocage, changement, oubli, redémarrage, empreinte seule dans le fichier) ; tirage sur 600 créneaux (8 skins, deux par rareté, pas de doublon, pas de paire répétée, tous les skins passent) ; achat en euros et en dollars (40 vérifications) ; parcours dans le navigateur (PIN, boutique, devise, achat en dollars) sur ordinateur et téléphone.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Un seul appareil par profil : saisir le code ailleurs déconnecte les autres pour de bon**
    - **Règle** : le profil n'est autorisé que sur un appareil à la fois, celui où il a été créé, puis le dernier où le code de sauvegarde a été saisi. Saisir le code sur un nouvel appareil déconnecte tous les autres : ils repassent en invité, oublient le code et ne peuvent plus revenir sur le profil sans le saisir à nouveau (ce qui déconnecte alors l'autre).
    - **Avant** : l'ancien appareil gardait le code et pouvait reprendre le profil d'un clic (« Jouer ici »), si bien que plusieurs appareils restaient liés au même profil.
    - **Comment** : chaque navigateur a un identifiant d'appareil tiré au hasard. Le serveur garde dans le profil l'appareil autorisé (`dev`) et répond 410 à tout autre ; le jeu efface alors le code de cet appareil et affiche un message.
    - **Appareil déconnecté** : il l'apprend à son prochain échange avec le serveur (20 secondes au plus s'il est ouvert, sinon à sa prochaine ouverture). L'XP d'une partie en cours n'est pas comptée.
    - **Même appareil, deux onglets** : rien ne change. Le second onglet voit « Ouvert dans un autre onglet » et peut reprendre le profil ; le code reste sur l'appareil.
    - **Profils existants** : ils n'ont pas encore d'appareil enregistré. Le premier appareil qui se présente après la mise à jour est retenu ; les autres appareils qui avaient le même code sont déconnectés.
    - **À savoir** : quelqu'un qui obtient le code d'un joueur peut prendre son profil et déconnecter son appareil. Le joueur ne le récupère que s'il a gardé son code (d'où le message de prévention). Le code PIN ne protège que l'affichage du code, pas sa saisie sur un autre appareil.
    - **Vérifié** : 20 vérifications du serveur (appareil non autorisé refusé même avec « reprendre », toutes les opérations refusées, redémarrage, retour par saisie du code, deuxième onglet, anciens profils) ; deux navigateurs (B saisit le code : A passe en invité et le reste après rechargement ; A le ressaisit : les deux onglets de B sont déconnectés) ; tous les tests précédents.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Code PIN demandé lors de la saisie du code sur un nouvel appareil**
    - **Règle** : si le profil a un code PIN, le code de sauvegarde ne suffit plus pour l'ouvrir sur un nouvel appareil : il faut aussi le PIN. Un code volé est donc inutilisable seul. Un profil sans PIN s'ouvre comme avant avec le code ; ressaisir le code sur l'appareil déjà autorisé ne demande pas le PIN.
    - **Dans le jeu** (Profil → « J'ai déjà un code ») : après le code, le jeu demande le PIN, puis « Importer ». PIN incorrect : essais restants affichés ; 5 erreurs : 5 minutes d'attente. Tant que le PIN n'est pas bon, l'appareil du joueur reste connecté.
    - **Compteurs séparés** : les essais faits depuis un nouvel appareil ne bloquent pas le joueur sur son propre appareil.
    - **PIN oublié sur un nouvel appareil** : « PIN oublié ? » lance une demande ; 24 heures plus tard, le joueur ressaisit son code et choisit un nouveau PIN. Pendant ces 24 heures, le joueur est averti sur son appareil autorisé (bandeau) et annule la demande en entrant son PIN (« Voir »). Quelqu'un qui aurait volé le code doit donc attendre 24 heures sans que le joueur ouvre le jeu.
    - **Conseil aux joueurs** : choisir un PIN (premier appui sur « Voir » ou « Copier ») ; sans PIN, le profil n'a pas cette protection.
    - **Vérifié** : 19 vérifications du serveur (PIN demandé, mauvais PIN, blocage, joueur non bloqué, demande d'oubli, annulation, nouveau PIN après le délai) ; deux navigateurs (code puis PIN sur le nouvel appareil, ancien appareil déconnecté seulement après le bon PIN) ; tests précédents.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Boutique et casier corrigés sur téléphone à la verticale**
    - **Bug corrigé** : à la verticale, la colonne des cartes prenait toute la hauteur de son contenu au lieu de se limiter au panneau. Elle dépassait de l'écran et ne pouvait pas défiler. Elle tient maintenant dans le panneau et défile au doigt. Le casier (Profil → Skins) avait le même défaut et est corrigé aussi.
    - **Mise en page à la verticale** : aperçu 3D un peu moins haut, cartes de la boutique plus compactes (deux rangées entières visibles), barre d'achat et bouton de devise resserrés.
    - **Vérifié** : téléphones 390 × 844 et 360 × 640 à la verticale, 844 × 390 à l'horizontale ; défilement au doigt simulé dans les trois cas.
  - Seul `index.html` change pour cette étape aussi : à remplacer sur GitHub et sur Fly.
  - **Code PIN obligatoire à la création du profil**
    - **Création** : la fenêtre « Mode invité » demande maintenant un pseudo et un code PIN à 4 chiffres, avec une explication (il sera demandé pour voir le code de sauvegarde et pour ouvrir le profil sur un autre appareil). Sans PIN valide, le profil n'est pas créé.
    - **Serveur** (`profiles.js`) : la création est refusée sans PIN à 4 chiffres ; le PIN est enregistré (empreinte seulement) avec le profil. Tout nouveau profil est donc protégé dès le départ contre un code de sauvegarde volé.
    - **Profils déjà créés sans PIN** : rien ne change pour eux ; le PIN leur est demandé au premier appui sur « Voir » ou « Copier ».
    - **Vérifié** : 7 vérifications du serveur (création sans PIN ou avec un PIN invalide refusée, PIN actif dès la création, demandé sur un nouvel appareil) ; création dans le navigateur sur ordinateur et téléphone ; tests précédents.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Prix en dollars convertis au cours du jour**
    - **Principe** : les prix sont fixés en euros (0,99 / 1,49 / 1,99 / 2,99 €). En mode « $ USD », chaque prix est converti au cours de référence de la Banque centrale européenne et arrondi au cent ; le paiement Stripe se fait en dollars à ce montant. Exemple au cours de 1,1193 (9 novembre 2026) : 1,11 $ / 1,67 $ / 2,23 $ / 3,35 $.
    - **Dans la boutique** : en dollars, l'en-tête affiche « Prix convertis au cours du jour : 1 € = … $ ». Le prix affiché, celui de la barre d'achat et celui de la page de paiement sont le même, calculé par le serveur.
    - **Serveur** (`profiles.js`) : le cours est lu au démarrage puis toutes les 6 heures sur `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml` (publié chaque jour ouvré vers 16 h, heure de Paris). Le dernier cours connu est gardé dans `fx.json` sur le volume : si la BCE est injoignable, il reste utilisé ; sans aucun cours connu, le serveur prend `FX_USD` ou 1,10. Un cours aberrant est ignoré.
    - **À savoir** : le cours ne bouge pas le week-end ni les jours fériés ; un prix en dollars peut changer d'un cent d'un jour à l'autre.
    - **Vérifié** : 7 vérifications du cours (lecture, arrondi, secours, cours gardé après redémarrage, cours aberrant ignoré) ; prix en dollars dans la boutique et achat à 3,35 $ dans le navigateur ; 41 vérifications de paiement. Le format réel de la page de la BCE a été vérifié ; la lecture depuis le serveur Fly reste à constater dans ses journaux (« Boutique : cours du dollar … »).
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Nombre de joueurs en ligne dans le menu**
    - **Affichage** : « ● 12 joueurs en ligne · 5 en partie », avec un point vert. Sur ordinateur, en haut à droite sous l'en-tête ; sur téléphone, près des boutons du menu. Mis à jour toutes les 30 secondes.
    - **Ce qui est compté** : chaque jeu ouvert et visible à l'écran, avec ou sans profil (un par appareil). « En partie » : les joueurs qui ne sont pas dans le menu (partie contre l'IA ou partie privée). Un jeu fermé ou en arrière-plan disparaît du total au bout de 75 secondes.
    - **Serveur** (`profiles.js`) : nouvelle opération `here`, traitée par le serveur qui garde les profils, donc le total est le même dans toutes les régions. 30 appareils au plus par adresse, pour qu'on ne puisse pas gonfler le chiffre facilement.
    - **À savoir** : le chiffre est en mémoire (remis à zéro si le serveur redémarre, puis juste en 30 secondes). Comme chaque jeu ouvert se signale, le serveur de la région principale reste éveillé tant qu'au moins un joueur a le jeu ouvert.
    - **Menu à la verticale** : « Partie privée » et « Boutique » sont maintenant côte à côte ; avant, le bouton « Boutique » sortait de l'écran en bas.
    - **Vérifié** : 8 vérifications du serveur (comptage, en partie, doublons, expiration, limite par adresse) ; plusieurs fenêtres dans le navigateur, dont une en partie ; affichage sur ordinateur, téléphone à l'horizontale et à la verticale.
  - `index.html` et `profiles.js` changent pour cette étape : à remplacer sur GitHub, puis redéployer sur Fly.
  - **Passage en production : accès « tout débloqué » supprimés, achats de test effacés**
    - **Supprimé** : les interrupteurs `SKINS_ALL` (tous les skins débloqués) et `SHOP_FREE` (boutique gratuite) n'existent plus, ni côté serveur ni dans le jeu (plus de champ `ska`, plus de mention « gratuit sur ce serveur de test »). Le `?skins=all` du jeu avait déjà été retiré lors d'une étape précédente.
    - **Réglages de test** (`SHOP_ANY`, `SHOP_SLOT_ADD`, `PIN_OPTIONAL`, `PIN_WAIT_MS`, `ONLINE_TTL_MS`, `STRIPE_API`, `FX_URL`, `PROFILE_URL`) : ils ne servent plus qu'aux tests sur ordinateur et sont sans effet en production (`NODE_ENV=production` dans le `Dockerfile`), même s'ils étaient ajoutés par erreur dans Fly.
    - **Achats de test effacés automatiquement** : quand le serveur démarre avec une clé Stripe réelle (`sk_live_` ou `rk_live_`), il efface tous les achats faits en mode test (sessions `cs_test_`), retire et déséquipe les skins correspondants, puis l'écrit dans le journal (« Boutique : passage en production, N achat(s) de test effacé(s) »). L'XP, le niveau, le PIN et les achats réels ne sont pas touchés.
    - **Paiements de test refusés en production** : avec une clé réelle, une session de test reçue par le retour de paiement ou le webhook ne donne aucun skin.
    - **Profils de production** : l'app de production a ses propres profils (son propre volume), séparés de l'app de test ; les skins achetés en test n'y existent pas.
    - **Basculer en production** :
      1. Stripe, mode réel : activer le compte (informations de l'entreprise et compte bancaire) ; dans Développeurs → Clés API, créer une clé restreinte avec l'autorisation « Checkout Sessions : écriture » (ou utiliser la clé secrète réelle).
      2. Stripe, mode réel : Développeurs → Webhooks → ajouter `https://detonate-prototype.fly.dev/api/stripe/webhook`, événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created` ; noter la clé `whsec_…`.
      3. Fly, app `detonate-prototype` → Secrets : `STRIPE_SECRET_KEY` (clé `rk_live_…` ou `sk_live_…`) et `STRIPE_WEBHOOK_SECRET` (clé `whsec_…` du webhook réel).
      4. Dépôt GitHub de production : remplacer tout son contenu par celui du dossier `detonate-v3.7` (avec son `fly.toml` de production et `.github/workflows/fly.yml`), puis lancer le déploiement par le bouton GitHub Actions.
      5. Vérifier dans les journaux Fly : « Boutique : cours du dollar … », puis faire un vrai petit achat et le rembourser depuis Stripe : le skin doit apparaître, puis disparaître.
    - **Avant d'encaisser** : pages mentions légales, conditions de vente et politique de remboursement à mettre en ligne (obligations de vente en ligne, à vérifier avec un professionnel).
    - **Vérifié** : 13 vérifications du passage en production (achats de test effacés et déséquipés, fichier nettoyé, achat réel accepté et gardé après redémarrage, webhook de test refusé, réglages de test sans effet avec `NODE_ENV=production`) ; tous les tests précédents (165 vérifications) ; profil, boutique et achat dans le navigateur.
  - `index.html` et `profiles.js` changent pour cette étape. Pour la production, c'est tout le dossier `detonate-v3.7` qu'il faut mettre sur le dépôt de production, puis déployer sur Fly après avoir ajouté les deux secrets Stripe réels.
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
