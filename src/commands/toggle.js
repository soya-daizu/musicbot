import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";
import buildPanel from "../functions/buildPanel.js";

export default {
  data: new SlashCommandBuilder()
    .setName("toggle")
    .setDescription("再生を一時停止/再開します"),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    const { player, paused } = session;
    if (paused) {
      player.unpause();
      session.recurrenceJob?.start();
      session.paused = false;
    } else {
      player.pause();
      session.recurrenceJob?.stop();
      session.paused = true;
    }

    await interaction.reply({
      content: `:white_check_mark: 再生を${
        paused ? "再開" : "一時停止"
      }しました`,
    });
    autoDeleteReply(interaction);

    await session.panelMsg.edit(buildPanel(session));
  },
};
