// Profils des joueurs (XP, niveaux, statistiques), gardes par le serveur : le joueur ne peut pas modifier son XP.
//
// - Un seul serveur garde les profils : celui de la region PROFILE_REGION (par defaut la region principale de Fly,
//   « primary_region » dans fly.toml). Les autres regions lui renvoient les demandes (fly-replay) ou lui envoient
//   l'XP de leurs parties (HTTP, avec une cle partagee).
// - Les profils sont ecrits dans un fichier JSON sur le volume Fly monte sur /data (sinon dans le dossier du serveur,
//   ce qui ne survit pas a un redeploiement : un avertissement le rappelle dans les journaux).
// - Chaque profil a un identifiant et un secret (le « code de sauvegarde » du joueur). Le serveur n'en garde que l'empreinte.
// - XP des parties en ligne : calculee par le serveur a partir de la simulation (le joueur n'envoie rien).
// - XP des parties solo contre l'IA (elles tournent dans le navigateur) : le joueur envoie le resume de sa partie,
//   le serveur le borne (valeurs plausibles, duree mesuree par le serveur, 90 s au moins, 40 XP par minute au plus).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HERE = process.env.FLY_REGION || '';
const APP = process.env.FLY_APP_NAME || '';
const PRIMARY = (process.env.PROFILE_REGION || process.env.PRIMARY_REGION || HERE || '').toLowerCase();
const IS_PRIMARY = !HERE || HERE === PRIMARY;
// cle partagee entre les serveurs du jeu (fly secrets set PROFILE_KEY=...) ; a defaut, derivee de l'image deployee
// (identique sur toutes les machines d'un meme deploiement, jamais envoyee aux joueurs)
const KEY = process.env.PROFILE_KEY || crypto.createHash('sha256').update('detonate|' + APP + '|' + (process.env.FLY_IMAGE_REF || 'local')).digest('hex');
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data'));
const FILE = path.join(DATA_DIR, 'profiles.json');

// ---------- niveaux : 1 a 30, de plus en plus longs (meme courbe que le jeu, index.html) ----------
// 136 184 XP pour le niveau 30 : environ 13 h de jeu pour le niveau 10, 62 h pour le 20, 160 h pour le 30 (joueur moyen)
const LMAX = 30;
const need = n => Math.round(300 + 200 * (n - 1) + 6 * (n - 1) * (n - 1));
const TOT = [0, 0]; for (let n = 1; n < LMAX; n++) TOT[n + 1] = TOT[n] + need(n);
const XMAX = TOT[LMAX];
const lvlOf = xp => { let n = 1; while (n < LMAX && xp >= TOT[n + 1]) n++; return n; };

// ---------- stockage ----------
// Le code de sauvegarde d'un joueur ne doit jamais changer : le serveur refuse donc de gerer les profils (reponse 503,
// le jeu garde le code et reessaie plus tard) plutot que de repartir d'une liste vide quand :
//  - sur Fly, le volume n'est pas monte sur /data (les profils crees seraient perdus au deploiement suivant) ;
//  - le fichier des profils existe mais ne peut pas etre lu (il n'est alors jamais ecrase).
let DB = {}, dirty = false, saving = false, STORE_OK = true, lastBackup = '';
const isMount = d => { try { return fs.statSync(d).dev !== fs.statSync('/').dev; } catch (e) { return false; } };
if (IS_PRIMARY) {
  if (HERE && !process.env.DATA_DIR && !isMount('/data')) {
    STORE_OK = false;
    console.error('Profils : ERREUR, pas de volume monte sur /data dans cette region. Profils desactives (le jeu reste jouable). Voir [mounts] dans fly.toml.');
  } else {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
    if (fs.existsSync(FILE)) {
      try { DB = JSON.parse(fs.readFileSync(FILE, 'utf8')); if (!DB || typeof DB !== 'object') throw new Error('contenu invalide'); }
      catch (e) { STORE_OK = false; DB = {}; console.error('Profils : ERREUR, ' + FILE + ' illisible (' + e.message + '). Fichier laisse intact, profils desactives. Restaurer une sauvegarde profiles-AAAA-MM-JJ.json du meme dossier.'); }
    }
    if (STORE_OK) console.log('Profils : ' + Object.keys(DB).length + ' charges depuis ' + FILE);
  }
}
// copie du fichier une fois par jour (profiles-AAAA-MM-JJ.json, les 7 dernieres sont gardees)
function backup() {
  const d = new Date().toISOString().slice(0, 10);
  if (d === lastBackup) return;
  lastBackup = d;
  try {
    fs.copyFileSync(FILE, path.join(DATA_DIR, 'profiles-' + d + '.json'));
    const old = fs.readdirSync(DATA_DIR).filter(f => /^profiles-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(0, -7);
    old.forEach(f => { try { fs.unlinkSync(path.join(DATA_DIR, f)); } catch (e) {} });
  } catch (e) { console.error('Profils : copie du jour impossible', e.message); }
}
function save(now) {
  if (!IS_PRIMARY || !STORE_OK) return;
  dirty = true;
  if (saving && !now) return;
  saving = true;
  const run = () => {
    dirty = false;
    const tmp = FILE + '.tmp';
    try { fs.writeFileSync(tmp, JSON.stringify(DB)); fs.renameSync(tmp, FILE); backup(); } catch (e) { console.error('Profils : ecriture impossible', e.message); }
    saving = false;
    if (dirty) save();
  };
  if (now) run(); else setTimeout(run, 1500);
}
function flush() { if (IS_PRIMARY && STORE_OK && (dirty || saving)) { saving = false; save(true); } }

const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const day = () => new Date().toISOString().slice(0, 10);
const num = (v, max) => Math.max(0, Math.min(max, Math.floor(+v || 0)));
const cleanName = n => String(n || '').replace(/[<>&"']/g, '').trim().slice(0, 14);
// ---------- skins : niveau qui debloque chaque skin (meme table que le jeu, index.html : SKIN) ----------
// tenue (o), bonnet (h), arme (g), sac (b), aura (a). Le serveur ne garde et ne transmet que des skins debloques.
// Dans le profil, les skins equipes sont dans « skn » (« sk » est l'empreinte du secret du joueur).
const SKIN_LV = {
  o: { foret: 4, arctique: 9, urbain: 14, hazmat: 19, furtif: 23, elite: 27 },
  h: { casquette: 3, bonnet: 8, beret: 13, ranger: 17, viking: 22, couronne: 29 },
  g: { sable: 2, carbone: 7, glacier: 12, neon: 18, lave: 24, or: 28 },
  b: { tactique: 5, sport: 10, radio: 15, jetpack: 21, cristal: 26 },
  a: { braise: 6, givre: 11, toxique: 16, electrique: 20, ombre: 25, royale: 30 }
};
// Reglages reserves aux tests sur ordinateur : sans effet en production (NODE_ENV=production dans le Dockerfile).
const TEST = process.env.NODE_ENV !== 'production', tenv = k => TEST ? process.env[k] : undefined;
// ---------- boutique : skins vendus a l'unite, paiement par Stripe (page de paiement hebergee par Stripe) ----------
// Meme liste que le jeu (« shop:1 » dans index.html) : [rarete 0 commun..3 legendaire, nom affiche sur la page de paiement].
// Un skin de la boutique n'est accepte (equipe, montre aux autres joueurs) que s'il est possede : liste « own » du profil.
// Secrets Fly : STRIPE_SECRET_KEY (cle sk_test_... ou sk_live_...), STRIPE_WEBHOOK_SECRET (cle whsec_... du webhook).
const SHOP = {
  o: { costard: [0, 'Costard'], squelette: [1, 'Squelette'], astronaute: [1, 'Astronaute'], samourai: [2, 'Samouraï'], hologramme: [3, 'Hologramme'] },
  h: { bandana: [0, 'Bandana'], kabuto: [1, 'Casque de samouraï'], bulle: [1, 'Casque spatial'], kitsune: [2, 'Masque de kitsune'], aureole: [3, 'Auréole'], laurier: [1, 'Laurier doré'], crane: [2, 'Crâne ardent'], eclats: [2, 'Cristaux gravitants'], couronne: [3, 'Couronne de cristal'] },
  g: { bambou: [0, 'Bambou'], graffiti: [1, 'Graffiti'], circuit: [2, 'Circuit'], galaxie: [2, 'Galaxie'], prisme: [3, 'Prisme'] },
  b: { carapace: [0, 'Carapace'], katanas: [1, 'Katanas croisés'], drone: [2, 'Drone compagnon'], demon: [2, 'Ailes de démon'], ange: [3, "Ailes d'ange"] },
  a: { notes: [0, 'Mélodie'], petales: [1, 'Pétales de cerisier'], orbite: [2, 'Orbite'], cercle: [2, "Cercle d'énergie"], spectre: [3, 'Flammes spectrales'], trainee: [2, 'Traînée ardente'], puissance: [3, 'Aura de puissance'], dragon: [3, 'Dragon céleste'] }
};
// prix en centimes selon la rarete (commun, rare, epique, legendaire)
// prix fixes en euros : 0,99 / 1,49 / 1,99 / 2,99 ; au choix du joueur, prix en dollars americains convertis au cours du jour (voir FX)
const PRICE = [99, 149, 199, 299], SHOP_CUR = 'eur', SHOP_CURS = ['eur', 'usd'];
// Packs : plusieurs skins vendus ensemble a prix fixe, toujours en boutique (hors selection tournante). Leurs skins ne se vendent pas a l'unite.
// Un achat de pack est note { c: 'p', id: <pack> } dans le profil ; il donne tous les skins du pack.
const PACKS = {
  rubis: { n: ['Pack Rubis', 'Ruby Pack'], p: 499, r: 3, items: [['g', 'rubis', 'arme Rubis'], ['b', 'ailesrubis', 'Ailes de rubis']] }
};
const PACK_ITEM = new Set(); for (const k in PACKS) for (const [c, id] of PACKS[k].items) PACK_ITEM.add(c + ':' + id);
const isPack = (c, id) => c === 'p' && Object.prototype.hasOwnProperty.call(PACKS, id);
// skins donnes par un achat : ceux du pack, ou le skin lui-meme
const itemsOf = (c, id) => isPack(c, id) ? PACKS[id].items.map(x => [x[0], x[1]]) : [[c, id]];
const CATN = { o: 'Tenue', h: 'Bonnet', g: 'Arme', b: 'Sac', a: 'Aura' }, RARN = ['commun', 'rare', 'épique', 'légendaire'];
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '', STRIPE_WH = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_API = tenv('STRIPE_API') || 'https://api.stripe.com';   // STRIPE_API : faux Stripe (tests sur ordinateur seulement)
// cle Stripe reelle (sk_live_ ou rk_live_) : seuls les paiements reels comptent ; les achats faits en mode test sont effaces au demarrage
const LIVE = /^(sk|rk)_live_/.test(STRIPE_KEY);
const SHOP_ALL = []; for (const c in SHOP) for (const id in SHOP[c]) SHOP_ALL.push(c + ':' + id);
// Selection : la boutique propose 8 skins a la fois, deux par rarete, tires au hasard toutes les 8 heures (0 h, 8 h, 16 h UTC).
// Le tirage ne depend que du creneau horaire : toutes les regions et tous les joueurs voient la meme boutique.
// Une meme paire ne sort jamais deux creneaux de suite pour une rarete.
const ROT_MS = 8 * 3600 * 1000, ROT_N = 2;
const BY_R = [[], [], [], []]; for (const c in SHOP) for (const id in SHOP[c]) BY_R[SHOP[c][id][0]].push({ c, id });
const rnd32 = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function rotation(slot) {
  const res = [];
  BY_R.forEach((L, r) => {
    const draw = k => { const a = L.slice(), f = rnd32(Math.imul(k, 2654435761) + r * 104729 + 977); f(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const pair = (a, o) => a.slice(o, o + ROT_N), key = q => q.map(x => x.c + ':' + x.id).sort().join();
    // pas de meme paire deux creneaux de suite : on repart d'un creneau repere (tous les 64) et on avance jusqu'au creneau demande
    const s0 = Math.floor(slot / 64) * 64, b = draw(s0 - 1), a0 = draw(s0), no = [key(pair(b, 0)), key(pair(b, 1))];
    let cur = pair(a0, 0); for (let o = 0; o + ROT_N <= a0.length; o++) { cur = pair(a0, o); if (!no.includes(key(cur))) break; }
    for (let k = s0 + 1; k <= slot; k++) { const a = draw(k); cur = key(pair(a, 0)) === key(cur) ? pair(a, 1) : pair(a, 0); }
    for (const it of cur) res.push({ c: it.c, id: it.id, r, p: PRICE[r] });
  });
  return res;
}
const slotNow = () => Math.floor(Date.now() / ROT_MS) + (+tenv('SHOP_SLOT_ADD') || 0);   // SHOP_SLOT_ADD : tests sur ordinateur
const inRotation = (c, id) => tenv('SHOP_ANY') === '1' || rotation(slotNow()).some(x => x.c === c && x.id === id);   // SHOP_ANY=1 : tests
// ---------- cours du dollar : cours de reference de la Banque centrale europeenne (1 euro = FX.usd dollars) ----------
// Relu au demarrage puis toutes les 6 heures (la BCE le publie chaque jour ouvre vers 16 h, heure de Paris). Le dernier cours
// connu est garde dans fx.json : si la BCE est injoignable, il reste utilise ; a defaut, FX_USD ou 1,10.
// FX_URL : autre adresse (tests). Le prix en dollars d'un skin = prix en euros x cours, arrondi au cent.
const FX_FILE = path.join(DATA_DIR, 'fx.json'), FX_URL = tenv('FX_URL') || 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
let FX = { usd: +process.env.FX_USD || 1.10, day: '', t: 0 };
const fxOk = r => typeof r === 'number' && r > 0.5 && r < 2.5;
async function fxLoad() {
  try {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 10000);
    const r = await fetch(FX_URL, { signal: c.signal }); const x = await r.text(); clearTimeout(t);
    const m = /currency=['"]USD['"]\s+rate=['"]([0-9.]+)['"]/.exec(x), d = /time=['"]([0-9-]+)['"]/.exec(x), v = m ? +m[1] : 0;
    if (!r.ok || !fxOk(v)) throw new Error('reponse inattendue');
    FX = { usd: v, day: d ? d[1] : '', t: Date.now() };
    try { fs.writeFileSync(FX_FILE, JSON.stringify(FX)); } catch (e) {}
    console.log('Boutique : cours du dollar ' + v + ' (BCE, ' + FX.day + ')');
  } catch (e) { console.error('Boutique : cours du dollar non relu (' + e.message + '), cours utilise : ' + FX.usd); }
}
// passage en production : les achats faits en mode test (sessions cs_test_) sont effaces, leurs skins retires et desequipes
function purgeTest() {
  let n = 0, p = 0;
  for (const k in DB) {
    const P = DB[k];
    if (!Array.isArray(P.buy) || !P.buy.some(b => /^cs_test_/.test(b.cs || ''))) continue;
    const test = P.buy.filter(b => /^cs_test_/.test(b.cs || '')), keep = P.buy.filter(b => !/^cs_test_/.test(b.cs || ''));
    for (const b of test) { takeBack(P, b, keep); n++; }
    P.buy = keep; if (!P.buy.length) delete P.buy; p++;
  }
  if (n) { save(); console.log('Boutique : passage en production, ' + n + ' achat(s) de test efface(s) sur ' + p + ' profil(s)'); }
}
if (IS_PRIMARY) {
  try { const j = JSON.parse(fs.readFileSync(FX_FILE, 'utf8')); if (fxOk(j.usd)) FX = { usd: j.usd, day: j.day || '', t: j.t || 0 }; } catch (e) {}
  fxLoad(); setInterval(fxLoad, 6 * 3600 * 1000).unref();
}
const inCur = (eur, cur) => cur === 'usd' ? Math.round(eur * FX.usd) : eur;
// Mode test des skins : SKINS_ALL_KEY (variable du serveur) est le mot a mettre dans l'adresse du jeu, ?skin=<mot>. Le profil qui l'ouvre
// est note « testeur » : tous les skins lui sont debloques (casier, boutique, salons en ligne), sans paiement. ?skin=off l'enleve.
// Sans la variable, le mode n'existe pas et les profils testeurs redeviennent normaux. Un testeur porte la marque '*' dans sa liste « own ».
const SKA_KEY = process.env.SKINS_ALL_KEY || '';
const ownOf = P => SKA_KEY && P.ska ? (P.own || []).concat('*') : (P.own || []).slice();
const priceOf = (c, id) => isPack(c, id) ? PACKS[id].p : SHOP[c] && Object.prototype.hasOwnProperty.call(SHOP[c], id) ? PRICE[SHOP[c][id][0]] : 0;
const owns = (own, c, id) => isPack(c, id) ? PACKS[id].items.every(x => owns(own, x[0], x[1])) : Array.isArray(own) && own.includes(c + ':' + id);
// retrait d'un achat (remboursement, litige, achat de test) : chaque skin est repris, sauf s'il reste paye par un autre achat
const stillPaid = (buy, c, id) => buy.some(x => x.st === 'paid' && itemsOf(x.c, x.id).some(y => y[0] === c && y[1] === id));
function takeBack(P, b, buy) {
  for (const [c, id] of itemsOf(b.c, b.id)) {
    if (stillPaid(buy, c, id)) continue;
    P.own = (P.own || []).filter(x => x !== c + ':' + id);
    if (P.skn && P.skn[c] === id) P.skn[c] = '';
  }
}
if (IS_PRIMARY && STORE_OK && LIVE) purgeTest();
function cleanSkins(sel, lvl, own) {
  const o = {};
  const all = Array.isArray(own) && own.includes('*');   // testeur : tout skin connu est accepte
  for (const c in SKIN_LV) {
    const id = sel && typeof sel[c] === 'string' ? sel[c] : '';
    o[c] = (SKIN_LV[c][id] && (all || lvl >= SKIN_LV[c][id])) || (all && (priceOf(c, id) || PACK_ITEM.has(c + ':' + id))) || ((priceOf(c, id) || PACK_ITEM.has(c + ':' + id)) && owns(own, c, id)) ? id : '';
  }
  return o;
}
// ---------- code PIN : il protege l'affichage du code de sauvegarde dans le jeu ----------
// 4 chiffres choisis par le joueur ; le serveur n'en garde que l'empreinte. 5 erreurs : 5 minutes d'attente.
// PIN oublie : le joueur le demande, puis peut en choisir un nouveau 24 heures plus tard (un curieux de passage ne peut pas le changer).
const PIN_WAIT = (+tenv('PIN_WAIT_MS') || 24 * 3600 * 1000), PIN_LOCK = 5 * 60 * 1000;
const pinHash = (P, pin) => sha('pin|' + P.id + '|' + pin), pinOk = v => typeof v === 'string' && /^[0-9]{4}$/.test(v);
const PINF = new Map();   // identifiant du profil -> { n, t } erreurs recentes
// deux compteurs par profil : l'appareil du joueur (« own ») et les saisies du code sur un nouvel appareil (« imp »),
// pour qu'un inconnu qui essaie des PIN au hasard ne bloque pas le joueur sur son propre appareil
function pinTry(P, pin, who) {
  const kf = P.id + '|' + (who || 'own'), f = PINF.get(kf), now = Date.now();
  if (f && f.n >= 5 && now - f.t < PIN_LOCK) return { err: 'locked', wait: Math.ceil((PIN_LOCK - (now - f.t)) / 1000) };
  if (pinOk(pin) && P.pin === pinHash(P, pin)) { PINF.delete(kf); return { ok: 1 }; }
  const n = f && now - f.t < PIN_LOCK ? f.n + 1 : 1; PINF.set(kf, { n, t: now });
  return n >= 5 ? { err: 'locked', wait: PIN_LOCK / 1000 } : { err: 'pin', left: 5 - n };
}
const pub = P => { const l = lvlOf(P.xp); return { pin: P.pin ? 1 : 0, pinr: P.pinr ? P.pinr + PIN_WAIT : 0, id: P.id, n: P.n, xp: P.xp, lvl: l, g: P.g, w: P.w, k: P.k, d: P.d, mvp: P.mvp, sk: cleanSkins(P.skn, l, ownOf(P)), own: ownOf(P) }; };
function auth(id, s) {
  const P = typeof id === 'string' && DB[id];
  if (!P || typeof s !== 'string' || sha(s) !== P.sk) return null;
  P.ls = Date.now();
  return P;
}

// ---------- une seule session par profil : un profil ne joue que sur un appareil (un onglet) a la fois ----------
// Chaque page du jeu ouvre une session (login) et la garde avec un signal toutes les 20 s (ping). Un autre appareil
// ne peut ouvrir le profil que si la session en cours est silencieuse depuis 75 s, ou en la reprenant (take) :
// l'ancien appareil passe alors en invite. L'XP (solo et en ligne) n'est comptee que pour la session en cours.
// Les sessions sont en memoire : apres un redemarrage du serveur, la premiere session qui se manifeste est reprise.
const SESS = new Map();   // identifiant du profil -> { sid, t }
const SESS_TTL = 75 * 1000;
// ---------- un seul appareil par profil ----------
// Chaque navigateur a un identifiant d'appareil (tire au hasard, garde par le jeu). Le profil retient l'appareil autorise (« dev ») :
// celui ou le profil a ete cree, puis le dernier ou le code de sauvegarde a ete saisi. Saisir le code sur un nouvel appareil
// deconnecte donc tous les autres pour de bon (reponse 410 : le jeu y oublie le code et repasse en invite) ; pour y revenir,
// il faut y saisir le code a nouveau. Sur l'appareil autorise, un seul onglet a la fois (session, voir plus haut).
const devOk = v => typeof v === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(v);
const newSid = () => crypto.randomBytes(12).toString('base64url');
function sessOk(id, sid) {
  if (typeof sid !== 'string' || !sid || sid.length > 40) return false;
  const S = SESS.get(id);
  if (!S) { SESS.set(id, { sid, t: Date.now() }); return true; }
  if (S.sid !== sid) return false;
  S.t = Date.now();
  return true;
}

// ---------- calcul de l'XP d'une partie (meme bareme pour les parties en ligne et solo) ----------
// r : { mode, k, d, p, df, fl, zc, cr, zk, wv, win, mvp } ; lignes [cle, xp, nombre] (le jeu traduit les cles)
// fin de partie par mode : [partie terminee, victoire]. Les parties longues rapportent plus, pour une XP par heure
// proche dans tous les modes (environ 850 XP/h pour un joueur moyen, mesure sur des parties simulees).
const FIN = { bomb: [30, 60], tdm: [15, 30], zones: [15, 30], cristal: [10, 40], hack: [100, 200], zombie: [40, 120], war: [50, 100] };
function xpFrom(r, first) {
  // le meme bareme est affiche dans le jeu : bouton « Calcul de l'XP » de la fenetre du profil
  const L = [], add = (k, v, n) => { v = Math.round(v); if (v > 0) L.push([k, v, n || 0]); };
  const F = FIN[r.mode] || FIN.bomb;
  add('kills', r.k * 5, r.k);
  switch (r.mode) {
    case 'zombie': add('zombies', r.zk * 1, r.zk); add('waves', r.wv * 5, r.wv); break;
    case 'cristal': add('crystals', r.cr * 10, r.cr); break;
    case 'zones': add('zone', Math.min(75, r.zc * 0.25), r.zc); break;
    case 'war': add('war', r.p * 10 + r.df * 7.5); break;
    case 'hack': add('hack', r.p * 12.5 + r.fl * 20 + r.df * 10); break;
    case 'tdm': add('flags', r.fl * 10, r.fl); break;
    default: add('bomb', r.p * 12.5 + r.df * 15 + r.fl * 10);
  }
  add('done', F[0]);
  if (r.win) add('win', F[1]);
  if (r.mvp && r.mode !== 'zombie') add('mvp', 25);
  if (first) add('daily', 150);
  return { L, tot: L.reduce((s, l) => s + l[1], 0) };
}
const MODES = new Set(['zombie', 'cristal', 'zones', 'war', 'hack', 'tdm', 'bomb']);
function cleanReport(r, solo) {
  r = r && typeof r === 'object' ? r : {};
  // bornes : larges pour une vraie partie, elles empechent seulement les valeurs absurdes envoyees a la main
  const c = solo ? { k: 80, d: 200, p: 40, df: 40, fl: 20, zc: 900, cr: 12, zk: 600, wv: 25 } : { k: 1e4, d: 1e4, p: 1e4, df: 1e4, fl: 1e4, zc: 1e5, cr: 1e3, zk: 1e5, wv: 1e3 };
  const o = { mode: MODES.has(r.mode) ? r.mode : 'bomb', win: r.win ? 1 : 0, mvp: r.mvp ? 1 : 0 };
  for (const k in c) o[k] = num(r[k], c[k]);
  return o;
}
// applique une partie a un profil ; renvoie le resultat affiche par le jeu. Pas de limite d'XP par jour.
// Parties solo (elles tournent dans le navigateur) : le serveur mesure lui-meme leur duree (debut annonce par le jeu,
// operation « start ») ; 90 s au moins, et pas plus de 60 XP par minute de jeu, hors premiere victoire du jour
// (un joueur moyen en gagne environ 14, un tres bon joueur une quarantaine : seul un jeu modifie atteint ce plafond).
const SOLO = new Map();   // identifiant du profil -> { t, mode } : partie solo en cours
const SOLO_RATE = 60;
function apply(P, r, opt) {
  opt = opt || {};
  const d = day(), first = !!r.win && P.day !== d;
  let note = '';
  const none = n => ({ L: [], tot: 0, x0: P.xp, x1: P.xp, l0: lvlOf(P.xp), l1: lvlOf(P.xp), note: n });
  let sec = 0;
  if (opt.solo) {
    const S = SOLO.get(P.id);
    SOLO.delete(P.id);
    if (!S) return none('nostart');                 // debut de partie jamais recu : ni XP ni statistiques
    sec = (Date.now() - S.t) / 1000;
    if (sec < 90) return none('short');             // partie trop courte : ni XP ni statistiques
    r.mode = S.mode;                                // le mode annonce au debut fait foi
  }
  let { L, tot } = xpFrom(r, first);
  if (opt.solo) { const dl = first ? 150 : 0, max = Math.ceil(sec / 60 * SOLO_RATE) + dl; if (tot > max) { tot = max; note = 'rate'; } }
  const x0 = P.xp, x1 = Math.min(XMAX, x0 + tot);
  P.xp = x1; P.g++; if (r.win) P.w++; P.k += r.k; P.d += r.d; if (r.mvp && r.mode !== 'zombie') P.mvp++;
  if (first && tot > 0) P.day = d;
  save();
  return { L, tot: x1 - x0, x0, x1, l0: lvlOf(x0), l1: lvlOf(x1), note };
}

// ---------- creation (avec reprise du profil local de l'etape 1, plafonnee) ----------
const created = new Map();   // limite de creations par adresse (20 par heure)
function create(name, mig, ip, dev, pin) {
  // code PIN obligatoire a la creation (PIN_OPTIONAL=1 : tests sur ordinateur seulement)
  if (!pinOk(pin) && tenv('PIN_OPTIONAL') !== '1') return { err: 'pin' };
  const now = Date.now(), h = created.get(ip) || [];
  const recent = h.filter(t => now - t < 3600000);
  if (recent.length >= 20) return null;
  recent.push(now); created.set(ip, recent);
  let id; do { id = crypto.randomBytes(6).toString('base64url'); } while (DB[id]);
  const s = crypto.randomBytes(15).toString('base64url');
  const m = mig && typeof mig === 'object' ? mig : {};
  const P = { id, sk: sha(s), n: cleanName(name), xp: num(m.xp, 3000), g: num(m.g, 100), w: num(m.w, 100), k: num(m.k, 2000), d: num(m.d, 2000), mvp: num(m.mvp, 50), day: '', sd: '', sx: 0, st: 0, c: now, ls: now };
  if (devOk(dev)) P.dev = dev;
  if (pinOk(pin)) P.pin = pinHash(P, pin);
  DB[id] = P; save();
  const sid = newSid(); SESS.set(id, { sid, t: now });
  return { id, s, sid, prof: pub(P) };
}

// ---------- joueurs en ligne ----------
const ONLINE = new Map(), ONIP = new Map(), ON_TTL = +tenv('ONLINE_TTL_MS') || 75000;   // appareil -> { t, g }
function onlineCount(now) {
  let n = 0, g = 0;
  for (const [d, o] of ONLINE) { if (now - o.t > ON_TTL) ONLINE.delete(d); else { n++; if (o.g) g++; } }
  if (ONIP.size > 5000) for (const [k, v] of ONIP) if (!v.some(d => ONLINE.has(d))) ONIP.delete(k);
  return { n, g };
}

// ---------- API HTTP (le jeu envoie du JSON en text/plain : pas de pre-requete CORS) ----------
const HDR = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
function out(res, code, o) { res.writeHead(code, HDR); res.end(JSON.stringify(o)); }
function body(req) {
  return new Promise(ok => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 8192) { b = ''; req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok(null); } });
    req.on('error', () => ok(null));
  });
}
async function http(req, res, url) {
  // ce serveur ne garde pas les profils : Fly.io rejoue la demande dans la region qui les garde
  if (!IS_PRIMARY && !req.headers['fly-replay-src']) {
    res.writeHead(307, { 'fly-replay': 'region=' + PRIMARY + ';timeout=20s', 'Content-Length': '0' });
    return res.end();
  }
  if (!IS_PRIMARY) return out(res, 503, { err: 'unavailable' });
  if (!STORE_OK) return out(res, 503, { err: 'storage' });   // jamais « profil inconnu » : le jeu garde le code du joueur
  if (req.method !== 'POST') return out(res, 405, { err: 'method' });
  const m = await body(req);
  if (!m) return out(res, 400, { err: 'json' });
  const op = url.slice('/api/profile/'.length);
  const ip = String(req.headers['fly-client-ip'] || req.socket.remoteAddress || '');
  if (op === 'new') {
    const r = create(m.n, m.mig, ip, m.dev, m.pin);
    return !r ? out(res, 429, { err: 'limit' }) : r.err ? out(res, 400, r) : out(res, 200, r);
  }
  if (op === 'award') {
    // XP des parties en ligne, envoyee par les serveurs du jeu (cle partagee)
    if (m.key !== KEY) return out(res, 403, { err: 'key' });
    return out(res, 200, { list: awardLocal(m.list) });
  }
  if (op === 'peek') {
    if (m.key !== KEY) return out(res, 403, { err: 'key' });
    return out(res, 200, peekLocal(m.id, m.s, m.sid));
  }
  // joueurs en ligne : chaque jeu ouvert (avec ou sans profil) se signale toutes les 30 secondes avec l'identifiant de son appareil
  // et dit s'il est en partie. Reponse : { n : jeux ouverts, g : en partie }. Un jeu silencieux depuis 75 secondes n'est plus compte.
  if (op === 'here') {
    const now = Date.now();
    if (devOk(m.dev)) {
      const old = ONLINE.get(m.dev);
      if (old || ONLINE.size < 100000) {
        let ok = true;
        if (!old) { const k = ONIP.get(ip) || []; const live = k.filter(d => ONLINE.has(d)); ok = live.length < 30; if (ok) { live.push(m.dev); ONIP.set(ip, live); } }   // 30 appareils au plus par adresse
        if (ok) ONLINE.set(m.dev, { t: now, g: m.g ? 1 : 0 });
      }
    }
    return out(res, 200, onlineCount(now));
  }
  // boutique du moment : les 4 skins proposes, leurs prix et l'heure du prochain changement (sans profil : les invites la voient aussi)
  if (op === 'shop') {
    const sl = slotNow();
    return out(res, 200, { on: STRIPE_KEY ? 1 : 0, cur: SHOP_CUR, curs: SHOP_CURS, fx: { usd: FX.usd, day: FX.day }, items: rotation(sl).map(x => Object.assign(x, { pu: inCur(x.p, 'usd') })), packs: Object.keys(PACKS).map(k => ({ id: k, n: PACKS[k].n, r: PACKS[k].r, p: PACKS[k].p, pu: inCur(PACKS[k].p, 'usd'), items: PACKS[k].items.map(x => ({ c: x[0], id: x[1] })) })), now: Date.now(), next: (Math.floor(Date.now() / ROT_MS) + 1) * ROT_MS });
  }
  const P = auth(m.id, m.s);
  if (!P) return out(res, 404, { err: 'profile' });
  if (op === 'get') return out(res, 200, { prof: pub(P) });
  // appareil autorise : la saisie du code (login avec imp) le change ; tout autre appareil est refuse (410)
  const dev = devOk(m.dev) ? m.dev : '';
  // PIN oublie, demande depuis un appareil non autorise (avec le code) : nouveau PIN possible 24 heures plus tard.
  // Le joueur, sur son appareil, en est averti et annule la demande en entrant son PIN.
  if (op === 'pin' && m.a === 'forgot' && P.dev && dev !== P.dev) { if (P.pin && !P.pinr) { P.pinr = Date.now(); save(); } return out(res, 200, { pinr: P.pinr ? P.pinr + PIN_WAIT : 0 }); }
  if (op === 'login' && m.imp && dev) {
    // nouvel appareil : le code de sauvegarde ne suffit pas si le profil a un code PIN
    if (P.pin && P.dev && P.dev !== dev) {
      const info = { pinr: P.pinr ? P.pinr + PIN_WAIT : 0 };
      if (P.pinr && Date.now() - P.pinr >= PIN_WAIT) {   // delai du PIN oublie ecoule : le joueur choisit un nouveau PIN
        if (!pinOk(m.npin)) return out(res, 403, Object.assign({ err: 'newpin' }, info));
        P.pin = pinHash(P, m.npin); delete P.pinr; PINF.delete(P.id + '|own'); PINF.delete(P.id + '|imp');
      } else if (typeof m.pin !== 'string' || !m.pin) return out(res, 403, Object.assign({ err: 'needpin' }, info));
      else { const r = pinTry(P, m.pin, 'imp'); if (!r.ok) return out(res, 403, Object.assign(r, info)); delete P.pinr; }
    }
    P.dev = dev; save(); m.take = true;
  }
  else if (P.dev && dev !== P.dev) return out(res, 410, { err: 'device' });
  else if (!P.dev && dev) { P.dev = dev; save(); }   // profil d'avant cette regle : le premier appareil qui se presente le garde
  // ouvrir le profil sur cet appareil : refuse (409 busy) s'il est en cours d'utilisation ailleurs, sauf reprise (take)
  if (op === 'login') {
    const S = SESS.get(P.id), now = Date.now();
    if (S && S.sid !== m.sid && now - S.t < SESS_TTL && !m.take) return out(res, 409, { err: 'busy' });
    const sid = S && S.sid === m.sid ? m.sid : newSid();
    SESS.set(P.id, { sid, t: now });
    return out(res, 200, { sid, prof: pub(P) });
  }
  if (op === 'logout') { const S = SESS.get(P.id); if (S && S.sid === m.sid) SESS.delete(P.id); return out(res, 200, { ok: 1 }); }
  // toutes les autres operations : seulement pour la session en cours (sinon 409 kicked : le profil est ouvert ailleurs)
  if (!sessOk(P.id, m.sid)) return out(res, 409, { err: 'kicked' });
  if (op === 'ping') return out(res, 200, { ok: 1, prof: pub(P) });
  // debut d'une partie solo : le serveur note l'heure et le mode (la duree de la partie est mesuree par lui)
  if (op === 'start') { SOLO.set(P.id, { t: Date.now(), mode: MODES.has(m.mode) ? m.mode : 'bomb' }); return out(res, 200, { ok: 1 }); }
  // skins equipes : enregistres dans le profil (seulement ceux que le niveau du joueur debloque)
  if (op === 'skins') { P.skn = cleanSkins(m.sk, lvlOf(P.xp), ownOf(P)); save(); return out(res, 200, { prof: pub(P) }); }
  // mode test des skins (voir SKA_KEY) : le bon mot debloque tout pour ce profil, « off » l'enleve
  if (op === 'test') {
    if (!SKA_KEY) return out(res, 404, { err: 'off' });
    if (m.key === 'off') { if (P.ska) { delete P.ska; P.skn = cleanSkins(P.skn, lvlOf(P.xp), ownOf(P)); save(); } return out(res, 200, { on: 0, prof: pub(P) }); }
    const kf = P.id + '|ska', f = PINF.get(kf), now = Date.now();   // 5 mauvais mots : 5 minutes d'attente
    if (f && f.n >= 5 && now - f.t < PIN_LOCK) return out(res, 403, { err: 'locked' });
    if (String(m.key || '') !== SKA_KEY) { PINF.set(kf, { n: (f && now - f.t < PIN_LOCK ? f.n : 0) + 1, t: now }); return out(res, 403, { err: 'key' }); }
    PINF.delete(kf);
    if (!P.ska) { P.ska = 1; save(); console.log('Mode test des skins : profil ' + P.id); }
    return out(res, 200, { on: 1, prof: pub(P) });
  }
  // achat : le serveur ouvre une page de paiement Stripe pour ce skin et ce profil, le jeu y envoie le joueur
  if (op === 'buy') {
    const c = String(m.c || ''), id = String(m.it || ''), pr = priceOf(c, id);
    if (!pr) return out(res, 400, { err: 'item' });
    if (owns(P.own, c, id)) return out(res, 409, { err: 'owned' });
    if (!isPack(c, id) && !inRotation(c, id)) return out(res, 409, { err: 'rotation' });   // la boutique a change : le jeu recharge la liste
    if (!STRIPE_KEY) return out(res, 503, { err: 'shop' });
    const ret = retUrl(m.ret);
    if (!ret) return out(res, 400, { err: 'ret' });
    const pk = isPack(c, id) ? PACKS[id] : null, [r, name] = pk ? [pk.r, pk.n[0]] : SHOP[c][id], md = { pid: P.id, c, id }, cur = SHOP_CURS.includes(m.cur) ? m.cur : SHOP_CUR;
    const q = {
      mode: 'payment', locale: 'auto', client_reference_id: P.id,
      success_url: ret + '?shop=ok&cs={CHECKOUT_SESSION_ID}', cancel_url: ret + '?shop=cancel',
      'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': cur, 'line_items[0][price_data][unit_amount]': String(inCur(pr, cur)),
      'line_items[0][price_data][product_data][name]': 'Detonate – ' + name,
      'line_items[0][price_data][product_data][description]': pk ? 'Pack ' + RARN[r] + ' : ' + pk.items.map(x => x[2]).join(' + ') + '. Skins cosmétiques, sans avantage de jeu.' : CATN[c] + ' (' + RARN[r] + '). Skin cosmétique, sans avantage de jeu.',
      'custom_text[submit][message]': 'Contenu numérique livré immédiatement dans le jeu. En payant, tu demandes cette livraison immédiate et renonces au droit de rétractation de 14 jours.'
    };
    for (const k in md) { q['metadata[' + k + ']'] = md[k]; q['payment_intent_data[metadata][' + k + ']'] = md[k]; }
    const cs = await stripe('POST', 'checkout/sessions', q);
    if (!cs || typeof cs.url !== 'string') return out(res, 502, { err: 'stripe' });
    return out(res, 200, { url: cs.url });
  }
  // retour de la page de paiement : le serveur demande a Stripe si ce paiement est bien passe (sans attendre le webhook)
  if (op === 'claim') {
    const cs = String(m.cs || '');
    if (!/^cs_[A-Za-z0-9_]{8,250}$/.test(cs)) return out(res, 400, { err: 'cs' });
    if (!STRIPE_KEY) return out(res, 503, { err: 'shop' });
    const o = await stripe('GET', 'checkout/sessions/' + cs);
    if (!o) return out(res, 502, { err: 'stripe' });
    const g = fromSession(o);
    if (!g || g.pid !== P.id) return out(res, 404, { err: 'cs' });
    return out(res, 200, { st: g.st, c: g.c, it: g.id, items: itemsOf(g.c, g.id), prof: pub(P) });
  }
  // code PIN du profil : set (choisir ou changer), check (verifier), forgot (demander un nouveau PIN dans 24 h)
  if (op === 'pin') {
    const now = Date.now();
    if (m.a === 'check') { if (!P.pin) return out(res, 200, { ok: 1, prof: pub(P) }); const r = pinTry(P, m.pin); if (r.ok && P.pinr) { delete P.pinr; save(); } return out(res, r.ok ? 200 : 403, Object.assign(r, { prof: pub(P) })); }
    if (m.a === 'forgot') { if (P.pin && !P.pinr) { P.pinr = now; save(); } return out(res, 200, { prof: pub(P) }); }
    if (m.a === 'set') {
      if (!pinOk(m.pin)) return out(res, 400, { err: 'format' });
      if (P.pin && !(P.pinr && now - P.pinr >= PIN_WAIT)) { const r = pinTry(P, m.old); if (!r.ok) return out(res, 403, Object.assign(r, { prof: pub(P) })); }
      P.pin = pinHash(P, m.pin); delete P.pinr; PINF.delete(P.id + '|own'); PINF.delete(P.id + '|imp'); save();
      return out(res, 200, { ok: 1, prof: pub(P) });
    }
    return out(res, 400, { err: 'action' });
  }
  if (op === 'name') { const n = cleanName(m.n); if (n !== P.n) { P.n = n; save(); } return out(res, 200, { prof: pub(P) }); }
  if (op === 'solo') {
    const r = cleanReport(m.r, true);
    const res_ = apply(P, r, { solo: true });
    return out(res, 200, { res: res_, prof: pub(P) });
  }
  return out(res, 404, { err: 'op' });
}

// ---------- boutique : Stripe ----------
// adresse de retour apres paiement : la page du jeu (https, ou http://localhost pour les tests), sans parametres
function retUrl(u) {
  try { const x = new URL(String(u || '')); if (x.protocol === 'https:' || (x.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(x.hostname))) return x.origin + x.pathname; } catch (e) {}
  return '';
}
async function stripe(method, pth, params) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(STRIPE_API + '/v1/' + pth, { method, headers: { Authorization: 'Bearer ' + STRIPE_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params ? new URLSearchParams(params).toString() : undefined, signal: c.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('Boutique : Stripe refuse (' + r.status + ') : ' + (j.error && j.error.message || '?')); return null; }
    return j;
  } catch (e) { console.error('Boutique : Stripe injoignable : ' + e.message); return null; } finally { clearTimeout(t); }
}
// skin achete : ajoute au profil une seule fois par paiement (le retour du joueur et le webhook peuvent arriver tous les deux)
function grant(P, c, id, info) {
  if (!Array.isArray(P.buy)) P.buy = [];
  if (P.buy.some(b => b.cs === info.cs)) return false;
  P.buy.push({ cs: info.cs, pi: info.pi || '', c, id, amt: info.amt | 0, cur: info.cur || '', t: Date.now(), st: 'paid' });
  if (!Array.isArray(P.own)) P.own = [];
  for (const [ic, ii] of itemsOf(c, id)) if (!P.own.includes(ic + ':' + ii)) P.own.push(ic + ':' + ii);
  save(); console.log('Boutique : achat ' + c + ':' + id + ' (' + ((info.amt | 0) / 100) + ' ' + (info.cur || '') + ') profil ' + P.id);
  return true;
}
// session de paiement Stripe -> { pid, c, id, st } ; donne le skin si le paiement est fait
function fromSession(o) {
  const md = o && o.metadata || {}, P = typeof md.pid === 'string' && DB[md.pid], c = String(md.c || ''), id = String(md.id || '');
  if (!P || !priceOf(c, id) || typeof o.id !== 'string') return null;
  if (LIVE && (o.livemode === false || /^cs_test_/.test(o.id))) return null;   // paiement de test refuse en production
  if (o.payment_status === 'paid') {
    grant(P, c, id, { cs: o.id, pi: typeof o.payment_intent === 'string' ? o.payment_intent : (o.payment_intent && o.payment_intent.id) || '', amt: o.amount_total, cur: o.currency });
    return { pid: P.id, c, id, st: 'paid' };
  }
  return { pid: P.id, c, id, st: o.status === 'expired' ? 'expired' : 'pending' };
}
// paiement rembourse en entier ou conteste : le skin est retire (s'il n'a pas ete paye une autre fois)
function revoke(pi, why) {
  if (typeof pi !== 'string' || !pi) return 0;
  let n = 0;
  for (const k in DB) {
    const P = DB[k];
    if (!Array.isArray(P.buy)) continue;
    for (const b of P.buy) {
      if (b.pi !== pi || b.st !== 'paid') continue;
      b.st = why; n++;
      takeBack(P, b, P.buy);
      console.log('Boutique : ' + (why === 'refunded' ? 'remboursement' : 'litige') + ', ' + (b.c === 'p' ? 'pack ' : 'skin ') + b.c + ':' + b.id + ' retire, profil ' + P.id);
    }
  }
  if (n) save();
  return n;
}
// signature du webhook (en-tete Stripe-Signature : t=...,v1=...) : HMAC SHA-256 du texte exact recu, 5 minutes de tolerance
function sigOk(raw, h) {
  if (!STRIPE_WH || typeof h !== 'string') return false;
  let t = 0; const v1 = [];
  for (const kv of h.split(',')) { const i = kv.indexOf('='), k = kv.slice(0, i).trim(), v = kv.slice(i + 1).trim(); if (k === 't') t = +v; else if (k === 'v1') v1.push(v); }
  if (!t || !v1.length || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const exp = Buffer.from(crypto.createHmac('sha256', STRIPE_WH).update(t + '.').update(raw).digest('hex'));
  return v1.some(v => { const b = Buffer.from(v); return b.length === exp.length && crypto.timingSafeEqual(b, exp); });
}
// webhook Stripe (/api/stripe/webhook) : paiement fait, rembourse ou conteste
async function webhook(req, res) {
  if (!IS_PRIMARY && !req.headers['fly-replay-src']) { res.writeHead(307, { 'fly-replay': 'region=' + PRIMARY + ';timeout=20s', 'Content-Length': '0' }); return res.end(); }
  if (!IS_PRIMARY || !STORE_OK) return out(res, 503, { err: 'storage' });   // Stripe renvoie plus tard
  if (req.method !== 'POST') return out(res, 405, { err: 'method' });
  if (!STRIPE_WH) { console.error('Boutique : webhook recu mais STRIPE_WEBHOOK_SECRET manque'); return out(res, 503, { err: 'config' }); }
  const raw = await new Promise(ok => { const ch = []; let n = 0; req.on('data', c => { n += c.length; if (n > 524288) { req.destroy(); return ok(null); } ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', () => ok(null)); });
  if (!raw) return out(res, 400, { err: 'body' });
  if (!sigOk(raw, req.headers['stripe-signature'])) return out(res, 400, { err: 'signature' });
  let ev; try { ev = JSON.parse(raw.toString('utf8')); } catch (e) { return out(res, 400, { err: 'json' }); }
  const o = ev && ev.data && ev.data.object || {}, piOf = v => typeof v === 'string' ? v : (v && v.id) || '';
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') fromSession(o);
  else if (ev.type === 'charge.refunded') { if (o.refunded) revoke(piOf(o.payment_intent), 'refunded'); }
  else if (ev.type === 'charge.dispute.created') revoke(piOf(o.payment_intent), 'dispute');
  return out(res, 200, { ok: 1 });
}

// ---------- appels entre serveurs ----------
function awardLocal(list) {
  if (!STORE_OK) return (Array.isArray(list) ? list : []).map(a => ({ id: a && a.id, err: 'remote' }));
  return (Array.isArray(list) ? list : []).slice(0, 32).map(a => {
    const P = auth(a && a.id, a && a.s);
    if (!P) return { id: a && a.id, err: 'profile' };
    if (!sessOk(P.id, a.sid)) return { id: P.id, err: 'session' };   // profil ouvert sur un autre appareil pendant la partie
    const r = cleanReport(a.r, false);
    return { id: P.id, res: apply(P, r), prof: pub(P) };
  });
}
async function remote(op, o) {
  const url = (tenv('PROFILE_URL') || 'https://' + APP + '.fly.dev') + '/api/profile/' + op;   // PROFILE_URL : tests sur ordinateur
  for (let k = 0; k < 3; k++) {
    try {
      const c = new AbortController(), t = setTimeout(() => c.abort(), 25000);
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain', 'fly-force-region': PRIMARY }, body: JSON.stringify(Object.assign({ key: KEY }, o)), signal: c.signal });
      clearTimeout(t);
      if (r.ok) return await r.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}
// XP de fin de partie en ligne : list = [{ id, s, r, ai }] ; renvoie [{ id, res, prof } | { id, err }]
async function award(list) {
  if (!list.length) return [];
  if (IS_PRIMARY) return awardLocal(list);
  if (!APP && !tenv('PROFILE_URL')) return list.map(a => ({ id: a.id, err: 'config' }));
  const j = await remote('award', { list });
  return j && j.list ? j.list : list.map(a => ({ id: a.id, err: 'remote' }));
}
// niveau et skins d'un joueur (affiches dans le salon, en partie et dans le tableau de fin) :
// { lvl, sk } ; lvl 0 si inconnu, -1 si sa session n'est pas la session en cours (profil ouvert sur un autre appareil)
function peekLocal(id, s, sid) {
  const P = STORE_OK && auth(id, s);
  if (!P) return { lvl: 0 };
  if (!sessOk(P.id, sid)) return { lvl: -1 };
  const l = lvlOf(P.xp);
  return { lvl: l, sk: cleanSkins(P.skn, l, ownOf(P)), own: ownOf(P) };
}
async function peek(id, s, sid) {
  if (!id || !s) return { lvl: 0 };
  if (IS_PRIMARY) return peekLocal(id, s, sid);
  if (!APP && !tenv('PROFILE_URL')) return { lvl: 0 };
  const j = await remote('peek', { id, s, sid });
  return j && typeof j.lvl === 'number' ? j : { lvl: 0 };
}

module.exports = { rotation, http, webhook, award, peek, flush, lvlOf, xpFrom, cleanSkins, IS_PRIMARY, PRIMARY };
