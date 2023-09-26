import ytdl from "ytdl-core";
import SpottyDL from "spottydl";
import { createWriteStream, existsSync, readdirSync, mkdirSync } from "fs";
import { once } from "events";
import { join } from "path";
import validateUrl from "./validateUrl.js";

let promises = [];

async function downloadVideo(videoType, videoId) {
  const dirPath = join("videos", videoId);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

  if (videoType === "youtube") {
    const filePath = join(dirPath, "0.webm");
    const stream = ytdl(videoId, {
      filter: (format) =>
        format.audioCodec === "opus" && format.container === "webm",
      quality: "highest",
      highWaterMark: 32 * 1024 * 1024,
    }).pipe(createWriteStream(filePath));
    await once(stream, "finish");
  } else if (videoType === "spotify") {
    await SpottyDL.getTrack(`https://open.spotify.com/track/${videoId}`).then(
      (results) => SpottyDL.downloadTrack(results, dirPath, false)
    );
  } else if (videoType === "spotifyAlbum") {
    await SpottyDL.getAlbum(`https://open.spotify.com/album/${videoId}`).then(
      (results) => SpottyDL.downloadAlbum(results, dirPath, false)
    );
  }
}

export async function preloadVideos(urls, callback) {
  const pendingVideos = urls
    .map((url) => {
      const result = validateUrl(url);
      if (!result) return;

      const [, videoId] = validateUrl(url);
      const dirPath = join("videos", videoId);
      if (existsSync(dirPath)) {
        const files = readdirSync(dirPath).filter((f) => !f.startsWith("."));
        if (files.length > 0) return;
      }

      return result;
    })
    .filter(Boolean);
  if (pendingVideos.length === 0) return;
  console.log(`[動画ダウンロード開始] 件数: ${pendingVideos.length}`);

  let progress = 0;
  console.log(`[動画ダウンロード中] ${progress}/${pendingVideos.length}`);
  callback && callback(progress, pendingVideos.length);

  promises = pendingVideos.map(([videoType, videoId]) =>
    downloadVideo(videoType, videoId).then(() => {
      progress += 1;
      console.log(`[動画ダウンロード中] ${progress}/${pendingVideos.length}`);
      callback && callback(progress, pendingVideos.length);
    })
  );
  Promise.all(promises).then(() => {
    promises = [];
    console.log("[動画ダウンロード完了]");
  });
}

export async function waitForVideoPreload() {
  await Promise.all(promises);
}
