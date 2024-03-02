import { writeFileSync } from "fs";
import { join } from "path";

export default function writeVideoInfo(info) {
  const writingInfo = {
    ...info,
    lastUsed: Date.now(),
    cached: undefined,
  };
  writeFileSync(
    join("videos", info.videoId, "info.json"),
    JSON.stringify(writingInfo, null, 2)
  );
}
