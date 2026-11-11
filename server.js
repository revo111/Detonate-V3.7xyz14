// Serveur des parties privées (Detonate)
// Le serveur est autoritaire : il fait tourner la simulation de la partie.
// Les joueurs envoient leurs commandes et reçoivent régulièrement l'état de la partie.
//
// - sert le jeu (index.html) et gère les salons par code à 5 caractères
// - le serveur calcule la simulation à 60 Hz
// - les joueurs envoient leurs inputs à 60 Hz
// - le serveur envoie les snapshots à environ 30 Hz
// - les places libres sont contrôlées par l'IA côté serveur

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createGame } = require('./game_sim');
const PROFILES = require('./profiles');   // profils des joueurs (XP, niveaux), gardes par le serveur
const { performance } = require('perf_hooks');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

// Taille d'équipe selon la carte :
// nuit = 3v3
// desert = 4v4
// neon = 4v4 (mode Zones)
// neige = 6v6 (mode Code Rouge)
const MAP_SIZE = {
  nuit: 3,
  desert: 4,
  neon: 4,  // Neon Grid : 4v4, mode Zones
  neige: 6,  // Base Polaire : 6v6, mode Code Rouge
  neigeN: 6,  // Base Polaire de nuit (meme carte, ambiance nocturne)
  foret: 5,   // Foret : mode Zombie, 5 equipes de 2 (10 places)
  guerre: 10, // Front : carte de guerre, 10v10
  tetris: 6   // Tetris (V3.6) : mode Cristal, 4 equipes de 3 (12 places)
};
// Front : la taille d'equipe est relue dans index.html (le fichier que la simulation execute) :
// le serveur et le jeu ne peuvent plus diverger, meme si seul index.html a ete mis a jour.
try {
  const html = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
  const mm = /MAPS\.guerre=\(\(\)=>\{const m=\{[\s\S]{0,20000}?"TS":(\d+)/.exec(html);
  if (mm && +mm[1] >= 2 && +mm[1] <= 16) MAP_SIZE.guerre = +mm[1];
} catch (e) {}
// nombre d'equipes : 2 partout, 5 sur la Foret (mode Zombie), 4 sur Tetris (mode Cristal)
const NTEAMS = room => (room.map === 'foret' ? 5 : (room.map === 'tetris' ? 4 : 2));

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ---------- plusieurs serveurs (une machine Fly.io par region) ----------
// FLY_REGION est fourni par Fly.io (ex. « cdg »). REGIONS (fly.toml) liste les regions deployees.
const HERE = process.env.FLY_REGION || '';
const APP = process.env.FLY_APP_NAME || '';
const ENV_REGIONS = String(process.env.REGIONS || '').split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
// lettre de region en tete de chaque code de salon (doit correspondre a la table du jeu, index.html)
const REGION_LETTER = { cdg: 'F', sjc: 'C', lax: 'L', iad: 'V', sin: 'S', fra: 'G', ams: 'A', lhr: 'B', ord: 'H', dfw: 'D',
  sea: 'W', ewr: 'E', yyz: 'Y', gru: 'R', nrt: 'N', syd: 'Z', bom: 'M', jnb: 'J' };
const isRegion = r => /^[a-z]{3}$/.test(r);
const rooms = new Map(); // code -> salon


// ---------- serveur web : jeu + test de santé ----------

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/regions') {
    // ne reveille aucun autre serveur : simple liste lue dans la configuration
    const list = ENV_REGIONS.length ? ENV_REGIONS.slice() : (HERE ? [HERE] : []);
    if (HERE && !list.includes(HERE)) list.push(HERE);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    return res.end(JSON.stringify({ here: HERE, regions: list }));
  }

  // profils des joueurs : creation, XP des parties solo, code de sauvegarde (voir profiles.js)
  if (url.startsWith('/api/profile/') && req.method !== 'OPTIONS') return PROFILES.http(req, res, url);
  // boutique : Stripe previent ici qu'un paiement est fait, rembourse ou conteste (voir profiles.js)
  if (url === '/api/stripe/webhook') return PROFILES.webhook(req, res);

  // Pre-requete du navigateur (jeu ouvert depuis GitHub Pages) : on autorise l'en-tete de routage Fly
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'fly-force-region, fly-prefer-region', 'Access-Control-Max-Age': '600' });
    return res.end();
  }

  // Reveil : le jeu appelle /wake avec l'en-tete « fly-force-region: cdg ». Le proxy Fly.io envoie
  // la requete directement dans cette region et demarre la machine si elle etait arretee.
  // La connexion WebSocket qui suit trouve donc une machine allumee.
  if (url === '/wake') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    return res.end(JSON.stringify({ region: HERE, machine: process.env.FLY_MACHINE_ID || null }));
  }

  // Diagnostic : https://playdetonate.fly.dev/where?region=cdg
  // Fly.io renvoie la demande vers la machine de cette region ; la reponse dit qui a repondu,
  // ou pourquoi Fly.io n'a pas pu joindre la machine.
  if (url === '/where') {
    let want = '';
    try { want = (new URL(req.url, 'http://x').searchParams.get('region') || '').toLowerCase(); } catch (e) {}
    const failed = req.headers['fly-replay-failed'];
    if (HERE && isRegion(want) && want !== HERE && !req.headers['fly-replay-src'] && !failed) {
      res.writeHead(307, { 'fly-replay': 'region=' + want + ';timeout=20s;fallback=force_self', 'Content-Length': '0' });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    return res.end(JSON.stringify({
      demande: want || null,
      repondu_par_region: HERE || null,
      machine: process.env.FLY_MACHINE_ID || null,
      ok: !failed && (!want || want === HERE),
      echec_fly: failed || null
    }, null, 1));
  }

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (url === '/' || url === '/index.html') {
    fs.readFile(INDEX, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('index.html introuvable');
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });

      res.end(data);
    });

    return;
  }

  res.writeHead(404);
  res.end('Introuvable');
});


const wss = new WebSocketServer({
  noServer: true,
  maxPayload: 256 * 1024,
  // Compression des messages (permessage-deflate, géré nativement par les navigateurs) :
  // un état de partie de ~2,7 Ko en JSON passe à ~0,8 Ko -> 3 fois moins de données à 30 Hz,
  // moins de saccades sur les connexions mobiles ou chargées. Niveau 1 : très peu de calcul.
  perMessageDeflate: {
    threshold: 256,
    zlibDeflateOptions: { level: 1, memLevel: 8 },
    zlibInflateOptions: { chunkSize: 16 * 1024 },
    serverNoContextTakeover: false,
    clientNoContextTakeover: false,
    concurrencyLimit: 16
  }
});

// Chaque connexion demande sa region (?region=cdg). Si cette machine n'est pas dans la bonne region,
// on repond « fly-replay » : le proxy Fly.io rejoue la demande vers la machine de cette region
// (et la demarre si elle etait arretee). La negociation WebSocket se fait uniquement sur la bonne machine.
server.on('upgrade', (req, socket, head) => {
  let want = '';
  try { want = (new URL(req.url, 'http://x').searchParams.get('region') || '').toLowerCase(); } catch (e) {}
  const replayed = !!req.headers['fly-replay-src'];
  const failed = req.headers['fly-replay-failed'];
  if (HERE && isRegion(want) && want !== HERE && !replayed && !failed) {
    // si la machine de cette region est injoignable, Fly.io nous renvoie la demande (fallback)
    socket.write('HTTP/1.1 307 Temporary Redirect\r\n' +
      'fly-replay: region=' + want + ';timeout=20s;fallback=force_self\r\n' +
      'Content-Length: 0\r\nConnection: close\r\n\r\n');
    return socket.destroy();
  }
  if (failed) {
    // le serveur demande n'a pas pu etre joint : on previent le joueur avec la raison donnee par Fly.io
    const reason = (/reason=([a-z_]+)/.exec(failed) || [])[1] || 'inconnue';
    console.error('Serveur ' + want + ' injoignable depuis ' + HERE + ' : ' + failed);
    return wss.handleUpgrade(req, socket, head, ws => {
      send(ws, { type: 'error', message: 'Serveur ' + want.toUpperCase() + ' injoignable (' + reason + ').' });
      setTimeout(() => ws.close(), 300);
    });
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});


// ---------- salons ----------
// Un salon garde son code tant qu'il sert : il disparait 15 minutes apres le depart du dernier joueur.
// Chaque joueur recoit un jeton : avec lui, il reprend sa place (dans le salon ou dans la partie en cours) apres une
// deconnexion, un rechargement de la page ou un depart volontaire. Dans le salon : equipes, vote de la carte et du mode,
// bouton « Prêt ». A la fin de chaque partie, tout le monde revient dans le salon.

const IDLE_MS = +process.env.DETONATE_IDLE_MS || 15 * 60 * 1000;      // salon vide depuis 15 min -> supprime
const EMPTY_GAME_MS = 2 * 60 * 1000; // partie sans aucun joueur connecte depuis 2 min -> arretee, retour au salon
const END_LOBBY_MS = 15 * 1000;      // fin de partie : retour au salon 15 s apres l'ecran de fin
// cartes et modes proposes au vote (tdm seulement la ou il existe)
const VOTE_MAPS = ['nuit', 'desert', 'neon', 'neige', 'neigeN', 'foret', 'guerre', 'tetris'];
const TDM_MAPS = new Set(['nuit', 'desert', 'neon']);
const fixMode = (map, mode) => (TDM_MAPS.has(map) && mode === 'tdm' ? 'tdm' : 'obj');
const capOf = map => (map === 'foret' ? 10 : 2 * (MAP_SIZE[map] || 3));   // places d'une carte

const newCode = () => {
  let c;
  do {
    c = Array.from({ length: 5 }, () => ALPHA[Math.random() * ALPHA.length | 0]).join('');
    if (REGION_LETTER[HERE]) c = REGION_LETTER[HERE] + c.slice(1);
  } while (rooms.has(c));
  return c;
};
const newId = () => Math.random().toString(36).slice(2, 10);
const newTok = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
const cleanName = n => String(n || 'Joueur').replace(/[<>&"']/g, '').trim().slice(0, 14) || 'Joueur';
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
const teamOf = (room, slot) => room.map === 'foret' ? (slot >> 1) : (room.map === 'tetris' ? (slot / 3 | 0) : (slot < room.size ? 0 : 1));
const online = room => room.players.filter(p => p.ws);
const sendRoom = (room, o) => { const d = JSON.stringify(o); online(room).forEach(p => { if (p.ws.readyState === 1) p.ws.send(d); }); };

// vote : la carte et le mode qui ont le plus de voix (a egalite : le choix de l'hote, sinon la carte actuelle)
function tally(room) {
  const cm = {}, cmo = {}, np = room.players.length;
  let n = 0;
  for (const p of room.players) {
    if (!p.vote || capOf(p.vote.map) < np) continue;
    n++;
    cm[p.vote.map] = (cm[p.vote.map] || 0) + 1;
  }
  if (!n) return { map: room.map, mode: room.mode, n: 0, cm, cmo };
  const host = room.players.find(p => p.id === room.hostId), hv = host && host.vote;
  const best = (c, cur, hostPick) => {
    const max = Math.max(...Object.values(c));
    const top = Object.keys(c).filter(k => c[k] === max);
    return top.includes(hostPick) ? hostPick : (top.includes(cur) ? cur : top[0]);
  };
  const map = best(cm, room.map, hv && hv.map);
  for (const p of room.players) if (p.vote && p.vote.map === map) cmo[p.vote.mode] = (cmo[p.vote.mode] || 0) + 1;
  const mode = fixMode(map, Object.keys(cmo).length ? best(cmo, room.mode, hv && hv.mode) : room.mode);
  return { map, mode, n, cm, cmo };
}

// nouvelle carte : nouvelle taille d'equipe -> chaque joueur garde son equipe si possible
function setMap(room, map, mode) {
  map = MAP_SIZE[map] ? map : room.map;
  mode = fixMode(map, mode);
  if (map === room.map && mode === room.mode) return false;
  if (capOf(map) < room.players.length) return false;
  const old = room.players.map(p => ({ p, t: teamOf(room, p.slot) }));
  room.map = map; room.mode = mode; room.size = MAP_SIZE[map];
  const nt = NTEAMS(room), used = new Set();
  for (const { p, t } of old) {
    const all = [...Array(capOf(map)).keys()];
    const want = all.filter(s => teamOf(room, s) === t % nt && !used.has(s));
    const s = want.length ? want[0] : all.find(s => !used.has(s));
    if (s === undefined) continue;
    p.slot = s; used.add(s);
  }
  return true;
}

function freeSlot(room, preferTeam) {
  const used = new Set(room.players.map(p => p.slot));
  const host = room.players.find(p => p.id === room.hostId);
  const team = preferTeam !== undefined ? preferTeam : (host ? teamOf(room, host.slot) : 0);
  const all = [...Array(capOf(room.map)).keys()];
  const order = all.filter(s => teamOf(room, s) === team).concat(all.filter(s => teamOf(room, s) !== team));
  return order.find(s => !used.has(s));
}

const publicPlayers = room => room.players.map(p => ({
  id: p.id, name: p.name, slot: p.slot, team: teamOf(room, p.slot), host: p.id === room.hostId,
  ready: !!p.ready, off: !p.ws, vote: p.vote || null, lvl: p.lvl || 0, sk: p.sk || null
}));

// profil du joueur (identifiant + secret envoyes par le jeu) : son niveau s'affiche dans le salon et a la fin de la partie
const pidOk = v => typeof v === 'string' && /^[A-Za-z0-9_-]{4,40}$/.test(v);
function setProfile(room, p, m) {
  if (!pidOk(m.pid) || !pidOk(m.ps) || !pidOk(m.psid)) return;
  p.pid = m.pid; p.ps = m.ps; p.psid = m.psid;
  PROFILES.peek(p.pid, p.ps, p.psid).then(r => {
    if (r.lvl < 0) { if (p.psid === m.psid) noProfile(p); }   // profil ouvert sur un autre appareil : joue en invite
    else { p.lvl = r.lvl; p.sk = r.sk || null; p.own = r.own || []; }
    if (room.players.includes(p)) lobby(room);
  }).catch(() => {});
}
// sans profil (invite) : seuls les skins de la boutique restent (gratuits pendant les tests), les skins de niveau sont retires
const noProfile = p => { p.pid = p.ps = p.psid = null; p.lvl = 0; p.own = null; p.sk = p.sk ? PROFILES.cleanSkins(p.sk, 0, null) : null; };
// statistiques d'une place (pour retirer ce que l'IA a fait pendant l'absence du joueur)
const REP_F = ['k', 'd', 'p', 'df', 'fl', 'zc', 'cr', 'zk'];
const repOf = (g, slot) => { try { return g.report(slot); } catch (e) { return null; } };
const repAdd = (a, b, sign) => { const o = Object.assign({}, a || {}); if (b) for (const f of REP_F) o[f] = (o[f] || 0) + sign * (b[f] || 0); return o; };

// fin de partie en ligne : le serveur calcule l'XP de chaque joueur connecte a partir de sa simulation
// (le joueur n'envoie rien). Moins de 2 joueurs humains : partie face aux bots, comptee dans la limite de 3 000 XP par jour.
const XP_MIN_MS = process.env.DETONATE_XP_MIN_MS !== undefined ? +process.env.DETONATE_XP_MIN_MS : 60 * 1000;   // arrive moins d'une minute avant la fin : pas d'XP
const XP_AWAY_MAX = 0.25;   // deconnecte plus d'un quart de la partie : pas d'XP
function awardXP(room) {
  const g = room.game, now = Date.now(), here = online(room), ai = here.length < 2, list = [], who = [];
  for (const p of here) {
    if (!p.pid) { send(p.ws, { type: 'xp', err: 'profile' }); continue; }
    // partie quittee (bouton Quitter) ou absent plus d'un quart de la partie : 0 XP, meme en revenant avant la fin
    const t0 = Math.max(room.gameT0 || now, p.gt0 || now), away = (p.away || 0) + (p.awayT0 ? now - p.awayT0 : 0);
    if (p.quit || away > (now - t0) * XP_AWAY_MAX) { send(p.ws, { type: 'xp', err: 'left' }); continue; }
    if (now - (p.gt0 || now) < XP_MIN_MS) { send(p.ws, { type: 'xp', err: 'late' }); continue; }
    let r = repOf(g, p.slot);
    if (!r) { send(p.ws, { type: 'xp', err: 'remote' }); continue; }
    // ce que l'IA a fait a sa place (avant son arrivee, pendant une deconnexion) ne compte pas
    if (p.sub) for (const f of REP_F) r[f] = Math.max(0, (r[f] || 0) - (p.sub[f] || 0));
    list.push({ id: p.pid, s: p.ps, sid: p.psid, r, ai }); who.push(p);
  }
  if (!list.length) return;
  PROFILES.award(list).then(out => {
    who.forEach((p, i) => {
      const o = out[i] || {};
      if (o.prof) { p.lvl = o.prof.lvl; if (o.prof.sk) p.sk = o.prof.sk; }
      send(p.ws, o.res ? { type: 'xp', res: o.res, prof: o.prof } : { type: 'xp', err: o.err || 'remote' });
    });
    if (rooms.get(room.code) === room) lobby(room);
  }).catch(e => { console.error('XP de fin de partie :', e); who.forEach(p => send(p.ws, { type: 'xp', err: 'remote' })); });
}

function lobby(room) {
  const T = tally(room);
  sendRoom(room, {
    type: 'lobby', code: room.code, region: HERE, map: room.map, mode: room.mode, size: room.size,
    started: room.started, players: publicPlayers(room), win: { map: T.map, mode: T.mode, n: T.n }, maps: VOTE_MAPS
  });
}

function touch(room) { room.lastActive = Date.now(); }

// l'hote doit etre un joueur connecte
function fixHost(room) {
  const h = room.players.find(p => p.id === room.hostId && p.ws);
  if (!h) { const o = online(room)[0]; if (o) room.hostId = o.id; }
}

// ---------- partie ----------
function startGame(room) {
  const sendAll = msg => sendRoom(room, msg);
  try {
    room.game = createGame(room.map, publicPlayers(room).filter(p => !p.off), sendAll, room.mode);
  } catch (e) {
    console.error('Impossible de lancer la partie :', e);
    room.started = false; room.game = null;
    sendRoom(room, { type: 'tolobby', reason: 'error' });
    return lobby(room);
  }
  room.xpDone = false; room.gameT0 = Date.now();
  room.players.forEach(p => { p.gt0 = p.ws ? Date.now() : 0; p.quit = false; p.away = 0; p.awayT0 = 0; p.sub = null; p.repL = null; });
  const STEP = 1000 / 60, t0 = performance.now();
  let n = 0, endAt = 0, emptyAt = 0, lagMax = 0, lagShown = 0, lagReset = t0;
  const tick = () => {
    if (!room.game) return;
    const now = performance.now();
    const due = Math.floor((now - t0) / STEP);
    lagMax = Math.max(lagMax, now - (t0 + (n + 1) * STEP));
    if (now - lagReset > 1000) { lagShown = Math.round(lagMax); lagMax = 0; lagReset = now; }
    let steps = 0, sendNow = false;
    while (n < due && steps < 6) {
      try { room.game.step(1 / 60); } catch (e) { console.error('Erreur de simulation :', e); }
      n++; steps++;
      if (n % 2 === 0) sendNow = true;
    }
    if (n < due) n = due;
    if (sendNow) {
      try { const st = room.game.snapshot(); st.sl = lagShown; sendAll({ type: 'state', state: st }); }
      catch (e) { console.error('Erreur lors de l’envoi du snapshot :', e); }
    }
    touch(room);
    // fin de partie : tout le monde revient dans le salon
    if (room.game.state() === 'end') {
      endAt = endAt || now;
      if (!room.xpDone) { room.xpDone = true; try { awardXP(room); } catch (e) { console.error('XP :', e); } }
      if (now - endAt > END_LOBBY_MS) return toLobby(room, 'end');
    }
    // plus personne de connecte : la partie s'arrete au bout de 2 min (le salon reste)
    if (!online(room).length) { emptyAt = emptyAt || now; if (now - emptyAt > EMPTY_GAME_MS) return toLobby(room, 'empty'); }
    else emptyAt = 0;
    room.timer = setTimeout(tick, Math.max(0, t0 + (n + 1) * STEP - performance.now()));
  };
  room.timer = setTimeout(tick, STEP);
}

function stopGame(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null; room.game = null;
}

// retour au salon : la partie s'arrete, les joueurs deconnectes quittent la liste (leur jeton reste valable)
function toLobby(room, reason) {
  stopGame(room);
  room.started = false;
  for (const p of room.players.filter(p => !p.ws)) ghost(room, p);
  room.players.forEach(p => { p.ready = false; });
  fixHost(room);
  touch(room);
  sendRoom(room, { type: 'tolobby', reason });
  lobby(room);
}

// joueur parti : on garde son jeton (il pourra revenir), sa place se libere
function ghost(room, p) {
  room.players = room.players.filter(x => x !== p);
  room.ghosts.set(p.tok, { id: p.id, name: p.name, slot: p.slot, vote: p.vote, pid: p.pid, ps: p.ps, psid: p.psid, lvl: p.lvl, sk: p.sk, own: p.own });
}

function launch(room) {
  const T = tally(room);
  setMap(room, T.map, T.mode);
  room.started = true;
  room.players.forEach(p => { p.ready = false; });
  touch(room);
  const players = publicPlayers(room).filter(p => !p.off);
  sendRoom(room, { type: 'start', players, map: room.map, mode: room.mode, size: room.size, server: true });
  startGame(room);
}

// ---------- quitter / deconnexion ----------
function leave(ws) {
  const room = ws.room;
  if (!room) return;
  ws.room = null;
  const p = room.players.find(x => x.ws === ws);
  if (!p) return;
  p.ws = null;
  touch(room);
  if (room.started && room.game) {
    // la partie continue : l'IA reprend sa place ; il pourra revenir avec son jeton
    if (!p.awayT0) { p.awayT0 = Date.now(); p.repL = repOf(room.game, p.slot); }
    room.game.leave(p.slot);
    sendRoom(room, { type: 'peer_left', slot: p.slot });
  } else {
    ghost(room, p);
  }
  fixHost(room);
  lobby(room);
}

// ---------- rejoindre (nouveau joueur ou retour avec son jeton) ----------
function join(ws, m) {
  const code = String(m.code || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) return send(ws, { type: 'error', code, gone: true, message: 'Ce salon n’existe plus (vide depuis plus de 15 minutes) ou le code est faux.' });
  const tok = typeof m.tok === 'string' ? m.tok.slice(0, 40) : '';
  let p = tok && room.players.find(x => x.tok === tok);
  if (p) {
    // deja dans le salon (deconnecte ou autre onglet) : on reprend la connexion
    if (p.ws && p.ws !== ws) { const old = p.ws; old.room = null; send(old, { type: 'kicked' }); try { old.close(); } catch (e) {} }
    p.ws = ws;
  } else {
    const gh = tok && room.ghosts.get(tok);
    const used = new Set(room.players.map(x => x.slot));
    let slot = gh && !used.has(gh.slot) && gh.slot < capOf(room.map) ? gh.slot : freeSlot(room);
    if (slot === undefined) return send(ws, { type: 'error', message: 'Le salon est plein (' + capOf(room.map) + ' joueurs).' });
    p = { id: gh ? gh.id : newId(), tok: gh ? tok : newTok(), name: cleanName(m.name || (gh && gh.name)), slot, ws, ready: false, vote: gh ? gh.vote : null,
      pid: gh && gh.pid, ps: gh && gh.ps, psid: gh && gh.psid, lvl: gh ? gh.lvl : 0, sk: gh ? gh.sk : null, own: gh ? gh.own : null };
    if (gh) room.ghosts.delete(tok);
    room.players.push(p);
  }
  if (m.name) p.name = cleanName(m.name);
  if (room.started && room.game) {
    const now = Date.now();
    if (!p.gt0) { p.gt0 = now; p.sub = repOf(room.game, p.slot); p.away = 0; p.awayT0 = 0; p.repL = null; }   // arrive en cours de partie
    else if (p.awayT0) {   // revient apres une deconnexion : le temps d'absence et ce que l'IA a fait sont retires
      p.away = (p.away || 0) + now - p.awayT0; p.awayT0 = 0;
      if (p.repL) p.sub = repAdd(p.sub, repAdd(repOf(room.game, p.slot), p.repL, -1), 1);
      p.repL = null;
    }
  }
  if (pidOk(m.pid)) { if (m.pid !== p.pid || m.psid !== p.psid) setProfile(room, p, m); }
  else if (p.pid) noProfile(p);   // revient en invite (profil ouvert sur un autre appareil)
  ws.room = room;
  fixHost(room);
  touch(room);
  send(ws, { type: 'joined', code: room.code, id: p.id, tok: p.tok, slot: p.slot, host: p.id === room.hostId, map: room.map, mode: room.mode, size: room.size, started: room.started });
  if (room.started && room.game) {
    // partie en cours : il la rejoint directement (sa place, reprise a l'IA)
    room.game.join(p.slot, p.name, p.id);
    sendRoom(room, { type: 'peer_join', slot: p.slot, name: p.name, id: p.id });
    send(ws, { type: 'start', players: publicPlayers(room).filter(x => !x.off), map: room.map, mode: room.mode, size: room.size, server: true, rejoin: true });
  }
  lobby(room);
}

// ---------- messages WebSocket ----------
wss.on('connection', ws => {
  try { ws._socket.setNoDelay(true); } catch (e) {}
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.budget = 0;

  ws.on('message', raw => {
    ws.budget++;
    if (ws.budget > 150) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const room = ws.room, p = room && room.players.find(x => x.ws === ws);
    if (room) touch(room);

    switch (m.type) {
      case 'ping':
        return send(ws, { type: 'pong', t: m.t });

      case 'create': {
        if (room) leave(ws);
        const code = newCode(), id = newId(), tok = newTok();
        const map = MAP_SIZE[m.map] ? m.map : 'nuit';
        const r = { code, hostId: id, started: false, players: [], ghosts: new Map(), map, mode: fixMode(map, m.mode), size: MAP_SIZE[map], lastActive: Date.now() };
        r.players.push({ id, tok, ws, name: cleanName(m.name), slot: 0, ready: false, vote: null });
        rooms.set(code, r);
        setProfile(r, r.players[0], m);
        ws.room = r;
        send(ws, { type: 'created', code, id, tok, slot: 0, host: true, map: r.map, mode: r.mode, size: r.size, started: false });
        return lobby(r);
      }

      case 'join':
        if (room) {
          if (room.code === String(m.code || '').toUpperCase() && p && p.tok === m.tok) return;   // deja dedans
          leave(ws);
        }
        return join(ws, m);

      // changer d'equipe (salon)
      case 'switch': {
        if (!room || room.started || !p) return;
        const cur = teamOf(room, p.slot), nt = NTEAMS(room);
        let slot;
        for (let k = 1; k < nt && slot === undefined; k++) {
          const s2 = freeSlot(room, (cur + k) % nt);
          if (s2 !== undefined && teamOf(room, s2) === (cur + k) % nt) slot = s2;
        }
        if (slot === undefined || teamOf(room, slot) === cur) return;
        p.slot = slot;
        return lobby(room);
      }

      // vote de la carte et du mode : la carte gagnante devient celle du salon (equipes a la bonne taille)
      case 'vote': {
        if (!room || room.started || !p) return;
        const map = VOTE_MAPS.includes(m.map) ? m.map : null;
        if (map && capOf(map) < room.players.length) return send(ws, { type: 'error', message: 'Trop de joueurs dans le salon pour cette carte (' + capOf(map) + ' places).' });
        p.vote = map ? { map, mode: fixMode(map, m.mode) } : null;
        const T = tally(room);
        setMap(room, T.map, T.mode);
        return lobby(room);
      }

      // pret / pas pret
      case 'ready': {
        if (!room || room.started || !p) return;
        p.ready = !!m.on;
        return lobby(room);
      }

      case 'start': {
        if (!room || room.started || !p || p.id !== room.hostId) return;
        return launch(room);
      }

      case 'input': {
        if (!room || !room.started || !room.game || !p) return;
        if (m.input && typeof m.input === 'object') room.game.input(p.slot, m.input);
        return;
      }

      // fin de partie : l'hote ramene tout le monde au salon sans attendre
      case 'tolobby':
      case 'rematch': {
        if (!room || !room.started || !room.game || room.game.state() !== 'end' || !p || p.id !== room.hostId) return;
        return toLobby(room, 'end');
      }

      // skins equipes : verifies avec le niveau du joueur, puis montres a tout le salon (salon et partie en cours).
      // Un invite (sans profil) est au niveau 0 : seuls les skins de la boutique passent, gratuits pendant les tests.
      case 'sk': {
        if (!room || !p) return;
        p.skReq = m.sk;
        const use = () => {
          if (!room.players.includes(p)) return;
          const sk = PROFILES.cleanSkins(p.skReq, p.pid ? p.lvl || 0 : 0, p.pid ? p.own : null);
          if (JSON.stringify(sk) === JSON.stringify(p.sk)) return;   // rien de nouveau : pas de diffusion
          p.sk = sk; lobby(room);
        };
        // avec profil : niveau et skins possedes relus (un skin vient peut-etre d'etre achete)
        if (p.pid) PROFILES.peek(p.pid, p.ps, p.psid).then(r => { if (r.lvl > 0) { p.lvl = r.lvl; p.own = r.own || []; } use(); }).catch(use);
        else use();
        return;
      }

      case 'leave':
        if (room && p && room.started) p.quit = true;   // bouton Quitter pendant la partie : 0 XP pour cette partie
        return leave(ws);
    }
  });

  ws.on('close', () => leave(ws));
});

// ---------- maintenance ----------
setInterval(() => { wss.clients.forEach(ws => { ws.budget = 0; }); }, 1000);
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.alive) return ws.terminate();
    ws.alive = false;
    try { ws.ping(); } catch {}
  });
}, 25000);
// salons : un salon ou quelqu'un est connecte reste actif ; vide depuis 15 min -> supprime
setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms) {
    if (online(r).length || r.game) { r.lastActive = now; continue; }
    if (now - r.lastActive > IDLE_MS) { stopGame(r); rooms.delete(code); }
  }
}, Math.min(20000, IDLE_MS / 3));

// ---------- demarrage ----------
function shutdown() {
  PROFILES.flush();
  wss.clients.forEach(ws => send(ws, { type: 'closed' }));
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log('Serveur prêt sur le port ' + PORT + (HERE ? ' · région ' + HERE : '') + (APP ? ' · application ' + APP : ''));
});
