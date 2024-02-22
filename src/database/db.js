import Database from "better-sqlite3";

async function initializeDB() {
  const db = new Database("main.db", {
    //verbose: console.log,
  });
  db.pragma("journal_mode = WAL");

  db.prepare(
    `CREATE TABLE IF NOT EXISTS spotifyResolveDb(
      spotifyId TEXT PRIMARY KEY,
      youtubeId TEXT,
      lastUsed INTEGER
    )`
  ).run();

  return db;
}

export const db = await initializeDB();
