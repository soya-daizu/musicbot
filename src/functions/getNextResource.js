import {
  createAudioResource,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { createReadStream, existsSync, readdirSync } from "fs";
import { join } from "path";

import { waitForVideoPreload } from "./preloadVideo.js";

async function waitForSupply(session) {
  session.awaitingSupply = true;

  let counter = 0;
  while (session.queue.length === 0) {
    if (counter >= 180) return false;
    if (session.connection.state.status === VoiceConnectionStatus.Destroyed)
      return;

    await new Promise((resolve) => setTimeout(resolve, 1000));
    counter += 1;
  }
  session.awaitingSupply = false;

  return true;
}

export default async function getNextResource(session) {
  const { queue, queueRepeat } = session;

  if (queue.length === 0) {
    if (session.awaitingSupply) return;

    const result = await waitForSupply(session);
    if (result === undefined) return;
    if (!result) {
      // Timeout, disconnecting
      session.connection.destroy();
      session.panelMsg.channel.send({
        content:
          ":alarm_clock: 3分間新しい楽曲が追加されなかったため、自動でVCを切断しました",
      });
      return;
    }
  }

  let info;
  if (queueRepeat.enabled) {
    if (queueRepeat.shuffle) {
      const currentIndex = session.queueRepeat.index;
      while (queue.length > 1 && queueRepeat.index === currentIndex)
        queueRepeat.index = Math.floor(Math.random() * queue.length);
    } else {
      queueRepeat.index = (queueRepeat.index + 1) % queue.length;
    }

    info = queue[queueRepeat.index];
  } else {
    info = queue.shift();
  }

  await waitForVideoPreload(info.videoId);
  const dirPath = join("videos", info.videoId);
  if (!existsSync(dirPath)) return getNextResource(session);

  const fileName = readdirSync(dirPath).find((f) => f === "audio.webm");
  if (!fileName) return getNextResource(session);
  const filePath = join(dirPath, fileName);
  console.log(info.url, filePath);

  const resource = createAudioResource(createReadStream(filePath), {
    inlineVolume: true,
    inputType: StreamType.WebmOpus,
  });
  resource.volume.setVolumeLogarithmic(session.volume);

  return [resource, info];
}
