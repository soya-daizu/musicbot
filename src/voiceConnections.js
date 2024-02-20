import { EmbedBuilder } from "discord.js";
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
import buildPanel, { fillCurrentVideo } from "./functions/buildPanel.js";

const sessions = new Map();
const scheduler = new ToadScheduler();

async function preparePlayback(session) {
  scheduler.removeById(session.channelId);
  session.recurrenceJob = undefined;
  session.currentVideo = undefined;
  const panelPromise = session.panelMsg.edit(buildPanel(session));

  const [resource, info] = (await getNextResource(session)) || [];
  if (!resource || !info) return;
  session.resource = resource;
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
      await session.panelMsg.edit(buildPanel(session));
    }
  });

  const task = new AsyncTask("progressBar", async () => {
    session.panelMsg = await session.panelMsg.fetch();
    const embed = new EmbedBuilder(session.panelMsg.embeds[0]);
    fillCurrentVideo(embed, session);
    await session.panelMsg.edit({
      embeds: [embed],
    });
  });
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
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });
  connection.subscribe(player);
  const session = {
    channelId: channel.id,
    panelMsg,
    connection,
    player,
    resource: undefined,
    paused: false,
    volume: botConfig.volumeSettings?.[channel.guild.id] ?? 1.0,
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

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`Voice connection ready: ${channel.guild.id} ${new Date()}`);
    preparePlayback(session);
    channel.client.user.setActivity(`${channel.name}で音楽`);
  });
  connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log(
      `Voice connection destroyed: ${channel.guild.id} ${new Date()}`
    );
    scheduler.removeById(session.channelId);
    session.panelMsg.delete();
    sessions.delete(channel.guild.id);
    channel.client.user.setActivity("");
  });
  player.on(AudioPlayerStatus.Idle, () => {
    preparePlayback(session);
  });

  return session;
}

export function getMusicSession(guildId) {
  return sessions.get(guildId);
}
