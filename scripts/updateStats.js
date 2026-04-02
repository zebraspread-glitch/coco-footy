import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";

const URL = "https://www.footywire.com/afl/footy/dream_team_season";
const FILE_PATH = "./app/data/public/afl_players26.json";

// normalize names so matching works better
function cleanName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();
}

async function updateStats() {
  console.log("Fetching Footywire...");

  const { data: html } = await axios.get(URL);
  const $ = cheerio.load(html);

  // load your existing JSON
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  const players = JSON.parse(raw);

  // make lookup map from your JSON
  const playerMap = {};
  Object.keys(players).forEach((name) => {
    playerMap[cleanName(name)] = name;
  });

  let updated = 0;

$("table tbody tr").each((_, row) => {
  const cols = $(row).find("td");

  if (cols.length < 7) return;

  let name = $(cols[1]).text().replace(/INJ|SUS/g, "").trim();
  const avg = parseFloat($(cols[6]).text().trim());

  if (!name || isNaN(avg)) return;

  const cleaned = cleanName(name);

  // loop through your JSON array
  let found = false;

  for (let player of players) {
    const cleanedJsonName = cleanName(player.name);

    if (
      cleanedJsonName.includes(cleaned) ||
      cleaned.includes(cleanedJsonName)
    ) {
      player.points = avg;
      updated++;
      found = true;
      break;
    }
  }

  if (!found) {
    console.log("No match:", name);
  }
});

  // save back to file
  fs.writeFileSync(FILE_PATH, JSON.stringify(players, null, 2));

  console.log(`✅ Updated ${updated} players`);
}

updateStats();