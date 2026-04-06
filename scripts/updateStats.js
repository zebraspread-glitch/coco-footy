import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";

const FILE_PATH = "./app/data/public/afl_players26.json";

const URLS = {
  fantasy: "https://www.footywire.com/afl/footy/dream_team_season",
  supercoach: "https://www.footywire.com/afl/footy/supercoach_season",
  goals:
    "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LT&pt=&st=GO&mg=1",
  bounces:
    "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LT&pt=&st=BO&mg=1",
  disposals:
  "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=DI&mg=1",
};

const TEAM_NAME_MAP = {
  Crows: "Adelaide",
  Lions: "Brisbane",
  Blues: "Carlton",
  Magpies: "Collingwood",
  Bombers: "Essendon",
  Dockers: "Fremantle",
  Cats: "Geelong",
  Suns: "Gold Coast",
  Hawks: "Hawthorn",
  Demons: "Melbourne",
  Kangaroos: "North Melbourne",
  Power: "Port Adelaide",
  Tigers: "Richmond",
  Saints: "St Kilda",
  Swans: "Sydney",
  Eagles: "West Coast",
  Bulldogs: "Western Bulldogs",
  Giants: "GWS",
};

const CLUB_ID_PREFIX = {
  Adelaide: "adel",
  Brisbane: "bris",
  Carlton: "carl",
  Collingwood: "coll",
  Essendon: "ess",
  Fremantle: "frem",
  Geelong: "geel",
  "Gold Coast": "gc",
  Hawthorn: "hawk",
  Melbourne: "melb",
  "North Melbourne": "nm",
  "Port Adelaide": "port",
  Richmond: "rich",
  "St Kilda": "stk",
  Sydney: "syd",
  "West Coast": "wc",
  "Western Bulldogs": "wb",
  GWS: "gws",
};

const NAME_OVERRIDES = {
  "thomas liberatore": "tom liberatore",
  "timothy english": "tim english",
  "cameron rayner": "cam rayner",
  "matt carroll": "matthew carroll",
  "lachlan fogarty": "lachie fogarty",
  "lachlan schultz": "lachie schultz",
  "nick murray": "nicholas murray",
  "oliver wines": "ollie wines",
  "jacob weitering": "jake weitering",
  "adam saad": "addy saad",
};

function cleanName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(name) {
  let cleaned = cleanName(name);
  if (NAME_OVERRIDES[cleaned]) cleaned = NAME_OVERRIDES[cleaned];
  return cleaned;
}

function slugifyName(name) {
  return String(name)
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function parseNum(text) {
  const cleaned = String(text).replace(/[^0-9.-]/g, "").trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return data;
}

function createPlayerId(name, club, existingIds) {
  const clubPrefix = CLUB_ID_PREFIX[club] || "player";
  const base = `${clubPrefix}_${slugifyName(name)}`;
  let id = base;
  let counter = 2;

  while (existingIds.has(id)) {
    id = `${base}_${counter}`;
    counter++;
  }

  existingIds.add(id);
  return id;
}

function resetStats(players) {
  for (const player of players) {
    player.points = 0;
    player.supercoachPoints = 0;
    player.goals = 0;
    player.bounces = 0;
    player.disposals = 0;

    if (!player.pos || !Array.isArray(player.pos) || player.pos.length === 0) {
      player.pos = ["MID"];
    }
  }
}

function buildIndexes(players) {
  const byName = new Map();
  const idSet = new Set();

  for (const player of players) {
    const normalized = normalizeName(player.name);
    byName.set(normalized, player);
    idSet.add(player.id);
  }

  return { byName, idSet };
}

function findPlayerByName(players, byName, name) {
  const cleaned = normalizeName(name);

  if (byName.has(cleaned)) {
    return byName.get(cleaned);
  }

  for (const player of players) {
    const cleanedJsonName = normalizeName(player.name);

    if (
      cleanedJsonName === cleaned ||
      cleanedJsonName.includes(cleaned) ||
      cleaned.includes(cleanedJsonName)
    ) {
      byName.set(cleaned, player);
      return player;
    }
  }

  return null;
}

function ensurePlayer(players, byName, idSet, name, teamText) {
  let player = findPlayerByName(players, byName, name);
  if (player) return { player, created: false };

  const club = TEAM_NAME_MAP[teamText] || teamText || "Unknown";
  const id = createPlayerId(name, club, idSet);

  player = {
    id,
    name: name.trim(),
    club,
    pos: ["MID"],
    points: 0,
    supercoachPoints: 0,
    goals: 0,
    bounces: 0,
    disposals: 0,
  };

  players.push(player);
  byName.set(normalizeName(name), player);

  console.log(`Added new player: ${name} (${club})`);

  return { player, created: true };
}

function applyFantasyStats(players, byName, idSet, html) {
  const $ = cheerio.load(html);
  let updated = 0;
  let created = 0;

  $("table tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 7) return;

    const name = $(cols[1]).text().replace(/INJ|SUS/g, "").trim();
    const avg = parseNum($(cols[6]).text());

    if (!name || !Number.isFinite(avg)) return;
    if (name === "Player" || name === "Position") return;

    const teamText = $(cols[2]).text().trim();
    const result = ensurePlayer(players, byName, idSet, name, teamText);

    result.player.points = Number(avg.toFixed(1));
    updated++;
    if (result.created) created++;
  });

  return { updated, created };
}

function applySupercoachStats(players, byName, idSet, html) {
  const $ = cheerio.load(html);
  let updated = 0;
  let created = 0;

  $("table tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 7) return;

    const name = $(cols[1]).text().replace(/INJ|SUS/g, "").trim();
    const avg = parseNum($(cols[6]).text());

    if (!name || !Number.isFinite(avg)) return;
    if (name === "Player" || name === "Position") return;

    const teamText = $(cols[2]).text().trim();
    const result = ensurePlayer(players, byName, idSet, name, teamText);

    result.player.supercoachPoints = Number(avg.toFixed(1));
    updated++;
    if (result.created) created++;
  });

  return { updated, created };
}

function applyRankingStat(players, byName, idSet, html, field, label) {
  const $ = cheerio.load(html);
  let updated = 0;
  let created = 0;

  $("table tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 5) return;

    const name = $(cols[1]).text().replace(/INJ|SUS/g, "").trim();
    const teamText = $(cols[2]).text().trim();
    const value = parseNum($(cols[cols.length - 1]).text());

    if (!name || !Number.isFinite(value)) return;
    if (name === "Player" || name === "Year" || name === "Position") return;

    const result = ensurePlayer(players, byName, idSet, name, teamText);

    result.player[field] = Number(value.toFixed(1));
    updated++;
    if (result.created) created++;
  });

  return { updated, created };
}

async function updateStats() {
  console.log("Reading player file...");
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  const players = JSON.parse(raw);

  resetStats(players);

  const { byName, idSet } = buildIndexes(players);

  console.log("Fetching fantasy points...");
  const fantasyHtml = await fetchHtml(URLS.fantasy);
  const fantasyResult = applyFantasyStats(players, byName, idSet, fantasyHtml);

  console.log("Fetching supercoach points...");
  const supercoachHtml = await fetchHtml(URLS.supercoach);
  const supercoachResult = applySupercoachStats(
    players,
    byName,
    idSet,
    supercoachHtml
  );

  console.log("Fetching goals...");
  const goalsHtml = await fetchHtml(URLS.goals);
  const goalsResult = applyRankingStat(
    players,
    byName,
    idSet,
    goalsHtml,
    "goals",
    "Goals"
  );

  console.log("Fetching bounces...");
  const bouncesHtml = await fetchHtml(URLS.bounces);
  const bouncesResult = applyRankingStat(
    players,
    byName,
    idSet,
    bouncesHtml,
    "bounces",
    "Bounces"
  );

  console.log("Fetching disposals...");
  const disposalsHtml = await fetchHtml(URLS.disposals);
  const disposalsResult = applyRankingStat(
    players,
    byName,
    idSet,
    disposalsHtml,
    "disposals",
    "Disposals"
  );

  players.sort((a, b) => {
    if (a.club !== b.club) return a.club.localeCompare(b.club);
    return a.name.localeCompare(b.name);
  });

  fs.writeFileSync(FILE_PATH, JSON.stringify(players, null, 2));

  console.log("✅ Done updating afl_players26.json");
  console.log(`Fantasy updated: ${fantasyResult.updated}, created: ${fantasyResult.created}`);
  console.log(`Supercoach updated: ${supercoachResult.updated}, created: ${supercoachResult.created}`);
  console.log(`Goals updated: ${goalsResult.updated}, created: ${goalsResult.created}`);
  console.log(`Bounces updated: ${bouncesResult.updated}, created: ${bouncesResult.created}`);
  console.log(`Disposals updated: ${disposalsResult.updated}, created: ${disposalsResult.created}`);
  console.log(`Total players now: ${players.length}`);
}

updateStats().catch((err) => {
  console.error("❌ Failed to update stats");
  console.error(err);
});