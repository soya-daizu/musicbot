import ytdl from "@distube/ytdl-core";
import mm from "music-metadata";
import ffmpeg from "fluent-ffmpeg";
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
import { Readable } from "stream";

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

  const metadata = await mm.parseFile(filePath);
  info.length = metadata.format.duration * 1000;
  info.cached = undefined;

  writeFileSync(join(dirPath, "info.json"), JSON.stringify(info, null, 2));
  renameSync(filePath, destFilePath);

  return info;
}

async function downloadArbitrary(info) {
  const dirPath = join("videos", info.videoId);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

  const url = new URL(info.url);
  const orgFileName = url.pathname.slice("/").at(-1);
  const destFilePath = join(dirPath, "audio.webm");

  const res = await fetch(url);
  const contentType = res.headers.get("content-type") ?? undefined;
  const buffer = await res.arrayBuffer().then((buf) => Buffer.from(buf));
  const metadata = await mm.parseBuffer(buffer, contentType);

  const newInfo = {
    ...info,
    title: metadata.common.title ?? orgFileName,
    artist: metadata.common.artist ?? "不明なアーティスト",
    length: metadata.format.duration * 1000,
    thumbnail: undefined,
    cached: undefined,
  };

  const thumbnail = metadata.common.picture?.find(
    (p) => p.format === "image/jpeg" || p.format === "image/png"
  );
  if (thumbnail) {
    const extension = thumbnail.format.split("/")[1];
    const thumbnailPath = join(dirPath, `thumbnail.${extension}`);
    writeFileSync(thumbnailPath, thumbnail.data);
    newInfo.thumbnail = thumbnailPath;
  }

  const format = metadata.format;
  if (format.codec === "opus" && format.container === "webm") {
    writeFileSync(destFilePath, buffer);
    writeFileSync(join(dirPath, "info.json"), JSON.stringify(newInfo, null, 2));
  } else {
    const orgStream = Readable.from(buffer);
    const writeStream = createWriteStream(destFilePath);
    ffmpeg(orgStream)
      .audioCodec("libopus")
      .audioBitrate("168k")
      .format("webm")
      .output(writeStream)
      .run();
    await once(writeStream, "finish");
    writeFileSync(join(dirPath, "info.json"), JSON.stringify(newInfo, null, 2));
  }

  return newInfo;
}

export function preloadVideo(info) {
  if (info.cached) return info;

  const videoId = info.videoId;
  const cached =
    existsSync(join("videos", videoId, "info.json")) &&
    existsSync(join("videos", videoId, "audio.webm"));
  if (cached) {
    const info = JSON.parse(readFileSync(join("videos", videoId, "info.json")));
    info.cached = true;
    return info;
  }

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
