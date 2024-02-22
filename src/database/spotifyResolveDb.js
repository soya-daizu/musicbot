import { db } from "./db.js";
import { rmSync } from "fs";
import { join } from "path";

export class SpotifyResolveDb {
  constructor() {}

  get(id) {
    const record = db
      .prepare("SELECT * FROM spotifyResolveDb WHERE spotifyId = ?")
      .get(id);
    if (record)
      db.prepare(
        "UPDATE spotifyResolveDb SET lastUsed = ? WHERE spotifyId = ?"
      ).run(Date.now(), id);
    return record;
  }

  put(id, youtubeId) {
    db.prepare("INSERT OR REPLACE INTO spotifyResolveDb VALUES (?, ?, ?)").run(
      id,
      youtubeId,
      Date.now()
    );
  }

  prune(days) {
    const deletedEntried = db
      .prepare("DELETE FROM spotifyResolveDb WHERE lastUsed < ? RETURNING *")
      .all(Date.now() - days * 24 * 60 * 60 * 1000);
    for (const entry of deletedEntried) {
      rmSync(join("videos", entry.youtubeId), { recursive: true, force: true });
    }
  }
}

export default new SpotifyResolveDb();
