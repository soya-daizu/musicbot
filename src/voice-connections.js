import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  AudioPlayerStatus,
} from "@discordjs/voice";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "fs";
import { join } from "path";

import validateUrl from "./functions/validateUrl.js";
import { waitForVideoPreload } from "./functions/preloadVideos.js";

const sessions = {};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomURL() {
  const urls = readFileSync("playlist.txt").toString().trim().split("\n");
  return urls[getRandomInt(urls.length)];
}

function getNextResource(failedCount) {
  failedCount ??= 0;
  if (failedCount > 10) return;

  const url = getRandomURL();
  const [, videoId] = validateUrl(url) || [];
  if (!videoId) return getNextResource(failedCount + 1);

  const dirPath = join("videos", videoId);
  if (!existsSync(dirPath)) return getNextResource(failedCount + 1);

  const files = readdirSync(dirPath).filter((f) => !f.startsWith("."));
  if (files.length === 0) return getNextResource(failedCount + 1);
  const filePath = join(dirPath, files[getRandomInt(files.length)]);
  console.log(url, filePath);

  const resource = createAudioResource(createReadStream(filePath), {
    inputType: filePath.endsWith("webm")
      ? StreamType.WebmOpus
      : StreamType.Arbitrary,
  });
  return resource;
}

export function hasPlayableFiles() {
  const resource = getNextResource();
  return Boolean(resource);
}

function writeSessionBackup() {
  const backupObj = Object.entries(sessions).map(([guildId, session]) => ({
    guildId,
    channelId: session.channelId,
  }));
  writeFileSync("sessions.json", JSON.stringify(backupObj));
}

export function createVoiceConnection(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });
  connection.subscribe(player);
  sessions[channel.guild.id] = {
    connection,
    player,
    paused: false,
    channelId: channel.id,
  };

  connection.on(VoiceConnectionStatus.Ready, async () => {
    await waitForVideoPreload();
    player.play(getNextResource());
  });
  connection.on(VoiceConnectionStatus.Destroyed, () => {
    delete sessions[channel.guild.id];
    writeSessionBackup();
  });

  player.on(AudioPlayerStatus.Idle, async () => {
    await waitForVideoPreload();
    player.play(getNextResource());
  });

  writeSessionBackup();
}

export function getSession(guildId) {
  return sessions[guildId];
}

export async function restoreSessions(client) {
  const backupObj = JSON.parse(readFileSync("sessions.json"));
  for (const { guildId, channelId } of backupObj) {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);
    createVoiceConnection(channel);
  }
}
