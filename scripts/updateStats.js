import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";

const URL = "https://www.footywire.com/afl/footy/dream_team_season";
const FILE_PATH = "./app/data/public/afl_players26.json";

function cleanName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
  "adam saad": "addy saad"
};

async function updateStats() {
  console.log("Fetching Footywire...");

  const { data: html } = await axios.get(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const $ = cheerio.load(html);

  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  const players = JSON.parse(raw);

  for (const player of players) {
    player.points = 0;
  }

  let updated = 0;
  let unmatched = [];

  $("table tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 7) return;

    let name = $(cols[1]).text().replace(/INJ|SUS/g, "").trim();
    const avg = parseFloat($(cols[6]).text().trim());

    if (!name || isNaN(avg)) return;

    let cleaned = cleanName(name);

    if (NAME_OVERRIDES[cleaned]) {
      cleaned = NAME_OVERRIDES[cleaned];
    }

    let found = false;

    for (const player of players) {
      const cleanedJsonName = cleanName(player.name);

      if (
        cleanedJsonName === cleaned ||
        cleanedJsonName.includes(cleaned) ||
        cleaned.includes(cleanedJsonName)
      ) {
        player.points = Number(avg.toFixed(1));
        updated++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatched.push(name);
      console.log("No match:", name);
    }
  });

  fs.writeFileSync(FILE_PATH, JSON.stringify(players, null, 2));

  console.log(`✅ Updated ${updated} players`);
  console.log(`✅ Unmatched players set to 0: ${unmatched.length}`);
}
updateStats();