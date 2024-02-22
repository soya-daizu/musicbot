import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";
import { updatePanel } from "../functions/buildPanel.js";

export default {
  data: new SlashCommandBuilder()
    .setName("repeat")
    .setDescription("再生中の楽曲をリピート再生します")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("リピート再生する回数")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    let count = 1;
    if (interaction.isChatInputCommand())
      count = interaction.options.getInteger("count") || 1;

    const { queue, currentVideo } = session;
    queue.unshift(...new Array(count).fill(0).map(() => currentVideo));

    await interaction.reply({
      content: `:white_check_mark: 再生中の楽曲を${count}回リピート再生します`,
    });
    autoDeleteReply(interaction);

    await updatePanel(session, ["fields", "buttons"]);
  },
};
