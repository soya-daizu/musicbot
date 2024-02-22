import { SlashCommandBuilder } from "discord.js";

import volume from "./set/volume.js";
import bitrate from "./set/bitrate.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set")
    .setDescription("再生設定を変更します")
    .addSubcommand(volume.data)
    .addSubcommand(bitrate.data),
  execute: async (interaction) => {
    const subcommandName = interaction.options.getSubcommand();
    if (subcommandName === "volume") await volume.execute(interaction);
    else if (subcommandName === "bitrate") await bitrate.execute(interaction);
  },
};
