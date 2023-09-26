import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../command-handler.js";
import { getVoiceConnection } from "@discordjs/voice";
import { getSession } from "../voice-connections.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription(
      "プレイリストの再生を終了し、ボイスチャンネルから退出します"
    ),
  execute: async (interaction) => {
    const { connection } = getSession(interaction.guild.id);
    if (!connection)
      throw new CommandError("ボイスチャンネルに接続していません");
    connection.destroy();

    await interaction.reply({
      content: `:white_check_mark: 接続を終了しました`,
    });
  },
};
