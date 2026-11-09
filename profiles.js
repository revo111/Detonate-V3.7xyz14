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
//   le serveur le borne (valeurs plausibles, 90 s de jeu, 90 s entre deux parties, 3 000 XP par jour face aux bots).

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
const LMAX = 30;
const need = n => Math.round(250 + 120 * (n - 1) + 4 * (n - 1) * (n - 1));
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
const pub = P => ({ id: P.id, n: P.n, xp: P.xp, lvl: lvlOf(P.xp), g: P.g, w: P.w, k: P.k, d: P.d, mvp: P.mvp });
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
function xpFrom(r, first) {
  // bareme (V3.7) : tous les points divises par deux, plus de division par deux contre l'IA
  // (le meme bareme est affiche dans le jeu : bouton « Calcul de l'XP » de la fenetre du profil)
  const L = [], add = (k, v, n) => { v = Math.round(v); if (v > 0) L.push([k, v, n || 0]); };
  add('kills', r.k * 5, r.k);
  switch (r.mode) {
    case 'zombie': add('zombies', r.zk * 1, r.zk); add('waves', r.wv * 5, r.wv); break;
    case 'cristal': add('crystals', r.cr * 15, r.cr); break;
    case 'zones': add('zone', Math.min(75, r.zc * 0.25), r.zc); break;
    case 'war': add('war', r.p * 10 + r.df * 7.5); break;
    case 'hack': add('hack', r.p * 12.5 + r.fl * 20 + r.df * 10); break;
    case 'tdm': add('flags', r.fl * 10, r.fl); break;
    default: add('bomb', r.p * 12.5 + r.df * 15 + r.fl * 10);
  }
  add('done', 25);
  if (r.win) add('win', 50);
  if (r.mvp && r.mode !== 'zombie') add('mvp', 25);
  if (first) add('daily', 75);
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
// applique une partie a un profil ; renvoie le resultat affiche par le jeu
// bots : partie face aux bots (solo, ou salon prive avec moins de 2 joueurs humains) -> 3 000 XP par jour au plus
const BOT_CAP = 3000;
function apply(P, r, bots, opt) {
  opt = opt || {};
  const d = day(), first = !!r.win && P.day !== d;
  let { L, tot } = xpFrom(r, first);
  let note = '';
  if (P.sd !== d) { P.sd = d; P.sx = 0; }
  if (opt.solo) {
    // parties solo : 90 s de jeu au moins, 90 s entre deux parties
    const now = Date.now();
    if (num(opt.dur, 1e6) < 90) note = 'short';
    else if (now - (P.st || 0) < 90000) note = 'fast';
    // partie trop courte ou trop rapprochee : ni XP ni statistiques
    if (note) return { L, tot: 0, x0: P.xp, x1: P.xp, l0: lvlOf(P.xp), l1: lvlOf(P.xp), ai: !!bots, note };
    P.st = now;
  }
  if (bots) { if (P.sx + tot > BOT_CAP) { tot = Math.max(0, BOT_CAP - P.sx); note = 'cap'; } P.sx += tot; }
  const x0 = P.xp, x1 = Math.min(XMAX, x0 + tot);
  P.xp = x1; P.g++; if (r.win) P.w++; P.k += r.k; P.d += r.d; if (r.mvp && r.mode !== 'zombie') P.mvp++;
  if (first && tot > 0) P.day = d;
  save();
  return { L, tot: x1 - x0, x0, x1, l0: lvlOf(x0), l1: lvlOf(x1), ai: !!bots, note };
}

// ---------- creation (avec reprise du profil local de l'etape 1, plafonnee) ----------
const created = new Map();   // limite de creations par adresse (20 par heure)
function create(name, mig, ip) {
  const now = Date.now(), h = created.get(ip) || [];
  const recent = h.filter(t => now - t < 3600000);
  if (recent.length >= 20) return null;
  recent.push(now); created.set(ip, recent);
  let id; do { id = crypto.randomBytes(6).toString('base64url'); } while (DB[id]);
  const s = crypto.randomBytes(15).toString('base64url');
  const m = mig && typeof mig === 'object' ? mig : {};
  const P = { id, sk: sha(s), n: cleanName(name), xp: num(m.xp, 3000), g: num(m.g, 100), w: num(m.w, 100), k: num(m.k, 2000), d: num(m.d, 2000), mvp: num(m.mvp, 50), day: '', sd: '', sx: 0, st: 0, c: now, ls: now };
  DB[id] = P; save();
  const sid = newSid(); SESS.set(id, { sid, t: now });
  return { id, s, sid, prof: pub(P) };
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
    const r = create(m.n, m.mig, ip);
    return r ? out(res, 200, r) : out(res, 429, { err: 'limit' });
  }
  if (op === 'award') {
    // XP des parties en ligne, envoyee par les serveurs du jeu (cle partagee)
    if (m.key !== KEY) return out(res, 403, { err: 'key' });
    return out(res, 200, { list: awardLocal(m.list) });
  }
  if (op === 'peek') {
    if (m.key !== KEY) return out(res, 403, { err: 'key' });
    return out(res, 200, { lvl: peekLocal(m.id, m.s, m.sid) });
  }
  const P = auth(m.id, m.s);
  if (!P) return out(res, 404, { err: 'profile' });
  if (op === 'get') return out(res, 200, { prof: pub(P) });
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
  if (op === 'name') { const n = cleanName(m.n); if (n !== P.n) { P.n = n; save(); } return out(res, 200, { prof: pub(P) }); }
  if (op === 'solo') {
    const r = cleanReport(m.r, true);
    const res_ = apply(P, r, true, { solo: true, dur: m.dur });
    return out(res, 200, { res: res_, prof: pub(P) });
  }
  return out(res, 404, { err: 'op' });
}

// ---------- appels entre serveurs ----------
function awardLocal(list) {
  if (!STORE_OK) return (Array.isArray(list) ? list : []).map(a => ({ id: a && a.id, err: 'remote' }));
  return (Array.isArray(list) ? list : []).slice(0, 32).map(a => {
    const P = auth(a && a.id, a && a.s);
    if (!P) return { id: a && a.id, err: 'profile' };
    if (!sessOk(P.id, a.sid)) return { id: P.id, err: 'session' };   // profil ouvert sur un autre appareil pendant la partie
    const r = cleanReport(a.r, false);
    return { id: P.id, res: apply(P, r, !!a.ai), prof: pub(P) };
  });
}
async function remote(op, o) {
  const url = (process.env.PROFILE_URL || 'https://' + APP + '.fly.dev') + '/api/profile/' + op;   // PROFILE_URL : tests sur ordinateur
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
  if (!APP && !process.env.PROFILE_URL) return list.map(a => ({ id: a.id, err: 'config' }));
  const j = await remote('award', { list });
  return j && j.list ? j.list : list.map(a => ({ id: a.id, err: 'remote' }));
}
// niveau d'un joueur (affiche dans le salon et dans le tableau de fin) ; 0 si inconnu, -1 si sa session n'est pas la session en cours
function peekLocal(id, s, sid) {
  const P = STORE_OK && auth(id, s);
  if (!P) return 0;
  return sessOk(P.id, sid) ? lvlOf(P.xp) : -1;
}
async function peek(id, s, sid) {
  if (!id || !s) return 0;
  if (IS_PRIMARY) return peekLocal(id, s, sid);
  if (!APP && !process.env.PROFILE_URL) return 0;
  const j = await remote('peek', { id, s, sid });
  return j && j.lvl ? j.lvl : 0;
}

module.exports = { http, award, peek, flush, lvlOf, xpFrom, IS_PRIMARY, PRIMARY };
