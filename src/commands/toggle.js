import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../command-handler.js";
import { getSession } from "../voice-connections.js";

export default {
  data: new SlashCommandBuilder()
    .setName("toggle")
    .setDescription("再生を一時停止/再開します"),
  execute: async (interaction) => {
    const result = getSession(interaction.guild.id);
    if (!result) throw new CommandError("ボイスチャンネルに接続していません");

    const { player, paused } = result;
    paused ? player.unpause() : player.pause();
    result.paused = !paused;

    await interaction.reply({
      content: `:white_check_mark: 再生を${
        paused ? "再開" : "一時停止"
      }しました`,
    });
  },
};
