import ytdl from "ytdl-core";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  createWriteStream,
  writeFileSync,
  renameSync,
} from "fs";
import { once } from "events";
import { join } from "path";

const jobs = new Map();

async function downloadVideo(info) {
  const dirPath = join("videos", info.videoId);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

  let filePath, destFilePath;

  filePath = join(dirPath, "_audio.webm");
  destFilePath = join(dirPath, "audio.webm");

  const stream = ytdl(info.videoId, {
    filter: (format) =>
      format.audioCodec === "opus" && format.container === "webm",
    quality: "highest",
    highWaterMark: 32 * 1024 * 1024,
  }).pipe(createWriteStream(filePath));
  await once(stream, "finish");

  writeFileSync(join(dirPath, "info.json"), JSON.stringify(info, null, 2));
  renameSync(filePath, destFilePath);
}

export function preloadVideo(info) {
  const videoId = info.videoId;
  const dirPath = join("videos", videoId);
  if (existsSync(dirPath)) {
    const cached = readdirSync(dirPath).some(
      (f) => f === "audio.webm" || f === "audio.mp3"
    );
    if (cached) return;
  }

  const promise = downloadVideo(info);
  jobs.set(videoId, promise);
  promise.then(() => jobs.delete(videoId));

  return promise;
}

export async function waitForVideoPreload(videoId) {
  const promise = jobs.get(videoId);
  if (!promise) return;
  await promise;
}
