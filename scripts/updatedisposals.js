import fs from "fs";
import * as cheerio from "cheerio";

const URL =
  "https://www.footywire.com/afl/footy/ft_player_rankings?year=2025&rt=LA&pt=&st=DI&mg=1";

const INPUT_FILE = "./app/data/public/afl_players.json";
const OUTPUT_FILE = "./app/data/public/afl_disposals.json";

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[.'’\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Fetching FootyWire disposals page...");

  const res = await fetch(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch FootyWire page: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const existingPlayers = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const disposalMap = new Map();

  $("table tbody tr").each((_, row) => {
    const tds = $(row).find("td");

    // rank, player, team, games, average
    if (tds.length < 5) return;

    const name = $(tds[1]).text().trim();
    const avgText = $(tds[4]).text().trim();

    if (!name || !avgText) return;

    const disposals = parseFloat(avgText);
    if (Number.isNaN(disposals)) return;

    disposalMap.set(normalizeName(name), disposals);
  });

  console.log(`Found ${disposalMap.size} disposal averages from FootyWire.`);

  let matched = 0;
  let unmatched = 0;

  const updatedPlayers = existingPlayers.map((player) => {
    const normalized = normalizeName(player.name);
    const disposals = disposalMap.get(normalized);

    if (disposals !== undefined) {
      matched++;
      return {
        ...player,
        points: disposals,
      };
    }

    unmatched++;
    return {
      ...player,
      points: 0,
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedPlayers, null, 2), "utf8");

  console.log(`✅ Wrote ${updatedPlayers.length} players to ${OUTPUT_FILE}`);
  console.log(`✅ Matched: ${matched}`);
  console.log(`⚠️ Unmatched: ${unmatched}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
});