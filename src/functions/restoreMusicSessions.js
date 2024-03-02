import { readFileSync, rmSync } from "fs";

import { createVoiceConnection } from "../voiceConnections.js";
import { preloadVideo } from "./preloadVideo.js";

export default async function restoreMusicSessions(client) {
  const traitRaw = readFileSync("./sessions.json").toString();
  rmSync("./sessions.json");
  if (!traitRaw) return;
  const sessionTraits = JSON.parse(traitRaw);
  if (sessionTraits.length === 0) return;

  for (const trait of sessionTraits) {
    const guild = await client.guilds.fetch(trait.guildId).catch(() => null);
    if (!guild) continue;
    const channel = await guild.channels.fetch(trait.channelId).catch(() => null);
    if (!channel) continue;
    const panelMsgChannel = await guild.channels.fetch(trait.panelMsgChannelId).catch(() => null);
    if (!panelMsgChannel) continue;
    const panelMsg = await panelMsgChannel.messages.fetch(trait.panelMsgId).catch(() => null);
    if (!panelMsg) continue;

    const session = createVoiceConnection(channel, panelMsg);
    session.queue = trait.queue;
    session.queue.reduce(
      (promise, info) => promise.then(() => preloadVideo(info)),
      Promise.resolve()
    );

    await panelMsgChannel.send({
      content:
        ":information_source: Botが再起動したため、セッションを復元しました",
    });
  }
}
