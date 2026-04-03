import fs from "fs";
import * as cheerio from "cheerio";

const URL =
  "https://www.footywire.com/afl/footy/ft_player_rankings?year=2025&rt=LT&pt=&st=GO&mg=1";

const INPUT_FILE = "./app/data/public/afl_goals.json";
const OUTPUT_FILE = "./app/data/public/afl_goals.json";

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Fetching FootyWire goals page...");

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

  // name -> { club, goals }
  const footywireMap = new Map();

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get();

    // Rank | Player | Team | Games | Total
    if (cells.length >= 5) {
      const playerName = cells[1];
      const teamName = cells[2];
      const totalGoals = parseInt(cells[4], 10);

      if (playerName && teamName && !Number.isNaN(totalGoals)) {
        footywireMap.set(normalizeName(playerName), {
          club: teamName,
          goals: totalGoals,
        });
      }
    }
  });

  console.log(`Found ${footywireMap.size} goal entries from FootyWire`);

  const raw = fs.readFileSync(INPUT_FILE, "utf8");
  const players = JSON.parse(raw);

  const aliases = {
    "alex neal bullen": "alex neal bullen",
    "alex neal-bullen": "alex neal bullen",
    "lachie fogarty": "lachlan fogarty",
    "mitchell hinge": "mitch hinge",
    "nicholas murray": "nick murray",
    "zac merrett": "zach merrett",
    "archer day wicks": "archer day wicks",
    "archer day-wicks": "archer day wicks",
    "reilly obrien": "reilly obrien",
    "reilly o brien": "reilly obrien",
    "cam rayner": "cameron rayner",
    "callum m brown": "callum brown",
    "nic martin": "nicholas martin",
    "mitch owens": "mitchell owens",
    "liam oconnell": "liam oconnell",
    "liam o connell": "liam oconnell",
    "lachie schultz": "lachlan schultz",
    "tim english": "tim english",
    "jye simpkin": "jy simpkin",
  };

  let matched = 0;
  let unmatched = 0;
  const unmatchedNames = [];
  const correctedClubNames = [];

  const updatedPlayers = players.map((player) => {
    const normalized = normalizeName(player.name);
    const lookup = aliases[normalized] || normalized;
    const match = footywireMap.get(lookup);

    if (match) {
      matched++;

      if (player.club !== match.club) {
        correctedClubNames.push(
          `${player.name}: ${player.club} -> ${match.club}`
        );
      }

      return {
        ...player,
        club: match.club,
        points: match.goals,
      };
    }

    unmatched++;
    unmatchedNames.push(player.name);

    return {
      ...player,
      points: 0,
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedPlayers, null, 2), "utf8");

  console.log(`✅ Updated file: ${OUTPUT_FILE}`);
  console.log(`Matched players: ${matched}`);
  console.log(`Unmatched players set to 0 goals: ${unmatched}`);
  console.log(`Corrected club names: ${correctedClubNames.length}`);

  if (correctedClubNames.length) {
    console.log("\nCorrected clubs:");
    console.log(correctedClubNames.join("\n"));
  }

  if (unmatchedNames.length) {
    console.log("\nUnmatched names:");
    console.log(unmatchedNames.join("\n"));
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
});