import { writeFileSync } from "fs";

import { getAllMusicSessions } from "../voiceConnections.js";

export default function recordMusicSessions() {
  const musicSessions = getAllMusicSessions();
  if (musicSessions.length === 0) return;

  const trait = musicSessions.map((session) => ({
    guildId: session.guildId,
    channelId: session.channelId,
    panelMsgChannelId: session.panelMsg.channel.id,
    panelMsgId: session.panelMsg.id,
    queue: [session.currentVideo, ...session.queue],
  }));
  writeFileSync("./sessions.json", JSON.stringify(trait));
}
