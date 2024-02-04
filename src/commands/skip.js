import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription(
      "現在の楽曲の再生を終了し、再生待ちリストから次の楽曲を再生します。"
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    const { player } = session;
    player.stop();

    await interaction.reply({
      content: `:white_check_mark: 次の楽曲を再生します`,
    });
    autoDeleteReply(interaction);
  },
};
