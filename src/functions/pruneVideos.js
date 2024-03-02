import { readdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";

import { getAllMusicSessions } from "../voiceConnections.js";

export default function pruneVideos() {
  const videoPaths = readdirSync("videos").map((path) => join("videos", path));
  const sessions = getAllMusicSessions();

  let removedCount = 0;
  for (const path of videoPaths) {
    const info = JSON.parse(readFileSync(join(path, "info.json")));
    if (
      !info.lastUsed ||
      (info.lastUsed < Date.now() - 1000 * 60 * 60 * 24 * 7 &&
        sessions.every((s) => s.queue.every((q) => q.videoId !== info.videoId)))
    ) {
      rmSync(path, { recursive: true });
      removedCount++;
    }
  }

  console.log(`Removed ${removedCount} videos`);
}
