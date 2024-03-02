import {
  joinVoiceChannel,
  createAudioPlayer,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  AudioPlayerStatus,
} from "@discordjs/voice";
import { ToadScheduler, AsyncTask, SimpleIntervalJob } from "toad-scheduler";

import botConfig from "./botConfig.js";

import getNextResource from "./functions/getNextResource.js";
import buildPanel from "./functions/buildPanel.js";
import { updatePanel } from "./functions/buildPanel.js";
import recordMusicSessions from "./functions/recordMusicSessions.js";

const sessions = new Map();
const scheduler = new ToadScheduler();

async function preparePlayback(session) {
  scheduler.removeById(session.channelId);
  session.recurrenceJob = undefined;
  session.currentVideo = undefined;
  const panelPromise = updatePanel(session);

  const [resource, info] = (await getNextResource(session)) || [];
  if (!resource || !info) return;
  session.currentVideo = info;

  session.player.play(resource);
  panelPromise.then(async () => {
    const channel = session.panelMsg.channel;
    const newerMsgs = await channel.messages.fetch({
      after: session.panelMsg.id,
      limit: 3,
    });
    if (newerMsgs.size >= 3) {
      await session.panelMsg.delete();
      session.panelMsg = await channel.send(buildPanel(session));
    } else {
      await updatePanel(session);
    }
    recordMusicSessions();
  });

  const task = new AsyncTask("progressBar", () =>
    updatePanel(session, ["currentVideo", "fields"])
  );
  session.recurrenceJob = new SimpleIntervalJob(
    { milliseconds: Math.max(session.currentVideo.length / 20, 10 * 1000) },
    task,
    { id: session.channelId }
  );
  scheduler.addSimpleIntervalJob(session.recurrenceJob);
}

export function createVoiceConnection(channel, panelMsg) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });
  connection.subscribe(player);
  const session = {
    guildId: channel.guild.id,
    channelId: channel.id,
    panelMsg,
    connection,
    player,
    paused: false,
    volume: botConfig.volumeSettings?.[channel.guild.id] ?? 1.0,
    bitrate: 64000,
    currentVideo: undefined,
    queue: [],
    queueRepeat: {
      enabled: false,
      shuffle: false,
      index: 0,
    },
    awaitingSupply: false,
    recurrenceJob: undefined,
  };
  sessions.set(channel.guild.id, session);

  connection.on(VoiceConnectionStatus.Ready, (_, newState) => {
    const connectionChannelId =
      newState.subscription?.connection.joinConfig.channelId;
    const channelMoved = connectionChannelId !== session.channelId;
    if (channelMoved) {
      session.channelId = connectionChannelId;
      return;
    }

    console.log(`Voice connection ready: ${channel.guild.id} ${new Date()}`);
    preparePlayback(session);
    channel.client.user.setActivity(`${channel.name}で音楽`);
  });
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
      // Seems to be reconnecting to a new channel - ignore disconnect
    } catch (error) {
      // Seems to be a real disconnect which SHOULDN'T be recovered from
      connection.destroy();
    }
  });
  connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log(
      `Voice connection destroyed: ${channel.guild.id} ${new Date()}`
    );
    scheduler.removeById(session.channelId);
    session.panelMsg.delete();
    sessions.delete(channel.guild.id);
    channel.client.user.setActivity("");
    recordMusicSessions();
  });
  player.on(AudioPlayerStatus.Idle, () => {
    preparePlayback(session);
  });
  player.on("stateChange", (oldState, newState) => {
    console.log(`player stateChange: ${oldState.status} -> ${newState.status}`);
  });
  connection.on("stateChange", (oldState, newState) => {
    console.log(`connection stateChange: ${oldState.status} -> ${newState.status}`);
  })

  return session;
}

export function getMusicSession(guildId) {
  return sessions.get(guildId);
}

export function getAllMusicSessions() {
  return [...sessions.values()];
}
