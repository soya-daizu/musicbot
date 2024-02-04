import { scheduleJob } from "node-schedule";

import rankMsgs from "./database/rankMsgs.js";
import voiceSessions from "./database/voiceSessions.js";
import levelRoles from "./database/levelRoles.js";
import expTable from "./database/expTable.js";

import { buildVoiceRankMsgCombined } from "./functions/buildVoiceRankMsg.js";
import { buildInviteRankMsgCombined } from "./functions/buildInviteRankMsg.js";

async function updateRankMsg(client) {
  const rankMsgRefs = rankMsgs.getAll();
  for (const rankMsgRef of rankMsgRefs) {
    const guild = await client.guilds
      .fetch(rankMsgRef.guildId)
      .catch(() => null);
    if (!guild) continue;
    const channel = await guild.channels
      .fetch(rankMsgRef.channelId)
      .catch(() => null);
    if (!channel) continue;
    const msg = await channel.messages
      .fetch(rankMsgRef.msgId)
      .catch(() => null);
    if (!msg) continue;

    let newContent;
    if (rankMsgRef.type === "voice_rank")
      newContent = await buildVoiceRankMsgCombined(
        guild,
        rankMsgRef.days,
        rankMsgRef.itemSize
      ).catch(() => null);
    else if (rankMsgRef.type === "invite_rank")
      newContent = await buildInviteRankMsgCombined(
        guild,
        rankMsgRef.days,
        rankMsgRef.itemSize
      ).catch(() => null);

    if (!newContent) continue;
    await msg.edit(newContent);
  }
}

async function fixVoiceSessionIntegrity(client) {
  const guilds = await client.guilds.fetch();
  for (let guild of guilds.values()) {
    guild = await guild.fetch();
    const sessions = voiceSessions.getAllUnfinished(guild.id);
    for (const session of sessions) {
      const voiceState = guild.voiceStates.cache.get(session.memberId);
      if (voiceState && voiceState.channelId === session.channelId) continue;

      voiceSessions.delete(session.id);
      console.log(`Deleted voice session ${session.id} ${session.memberId}`);
    }
  }
}

async function giveLevelRoles(client) {
  const guilds = await client.guilds.fetch();
  for (let guild of guilds.values()) {
    guild = await guild.fetch();
    const voiceStates = guild.voiceStates.cache;
    for (const voiceState of voiceStates.values()) {
      if (!voiceState.channelId) continue;

      const member = voiceState.member;
      const exp = Math.floor(
        voiceSessions.getVoiceDuration(member.id, guild.id) / 1000 / 60
      );
      const { level } = expTable.findLevelByExp(exp);
      const levelRole = levelRoles.getFirstBeforeOrEqual(guild.id, level);
      if (!levelRole) continue;
      const otherLevelRoles = levelRoles.getAllBefore(
        guild.id,
        levelRole.level
      );
      if (member.roles.cache.has(levelRole.roleId))
        member.roles.add(levelRole.roleId);
      for (const otherLevelRole of otherLevelRoles) {
        if (member.roles.cache.has(otherLevelRole.roleId))
          member.roles.remove(otherLevelRole.roleId);
      }
    }
  }
}

export default function startRunner(client) {
  scheduleJob("*/5 * * * *", () => {
    fixVoiceSessionIntegrity(client);
    updateRankMsg(client);
  });

  scheduleJob("* * * * *", () => {
    giveLevelRoles(client);
  });

  fixVoiceSessionIntegrity(client);
  updateRankMsg(client);
}
