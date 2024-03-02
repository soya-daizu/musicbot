import ytdl from "@distube/ytdl-core";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  createWriteStream,
} from "fs";
import { once } from "events";
import { join } from "path";
import writeVideoInfo from "./writeVideoInfo.js";

const jobs = new Map();

async function downloadYouTubeVideo(info) {
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

  info.cached = undefined;

  writeVideoInfo(info);
  renameSync(filePath, destFilePath);

  return info;
}

export function preloadVideo(info) {
  if (info.cached) {
    writeVideoInfo(info);
    return info;
  }

  const videoId = info.videoId;
  let promise;
  if (videoId.startsWith("__")) promise = downloadArbitrary(info);
  else promise = downloadYouTubeVideo(info);

  jobs.set(videoId, promise);
  promise.then(() => jobs.delete(videoId));

  return promise;
}

export async function waitForVideoPreload(videoId) {
  const promise = jobs.get(videoId);
  if (!promise) return;
  await promise;
}
