import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("プレイリストの再生を終了し、VCから退出します"),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");

    session.connection.destroy();

    if (interaction.isButton())
      await interaction.update({
        content: `:white_check_mark: 接続を終了しました`,
        components: [],
      });
    else
      await interaction.reply({
        content: `:white_check_mark: 接続を終了しました`,
      });
    autoDeleteReply(interaction);
  },
};
