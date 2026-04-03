import fs from "fs";
import * as cheerio from "cheerio";

const URL =
  "https://www.footywire.com/afl/footy/ft_player_rankings?year=2025&rt=LT&pt=&st=BO&mg=1";

const INPUT_FILE = "./app/data/public/afl_players.json";
const OUTPUT_FILE = "./app/data/public/afl_bounces.json";

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[.'’\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Fetching FootyWire bounces page...");

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

  const bounceMap = new Map();

  $("table tbody tr").each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 5) return;

    const name = $(tds[1]).text().trim();
    const statText = $(tds[4]).text().trim();

    if (!name) return;

    const bounces = parseFloat(statText);
    if (Number.isNaN(bounces)) return;

    bounceMap.set(normalizeName(name), bounces);
  });

  const updatedPlayers = existingPlayers.map((player) => {
    const normalized = normalizeName(player.name);
    const bounces = bounceMap.get(normalized) ?? 0;

    return {
      ...player,
      points: bounces,
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedPlayers, null, 2), "utf8");

  console.log(`✅ Wrote ${updatedPlayers.length} players to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
});