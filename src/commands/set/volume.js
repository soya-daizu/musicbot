import { SlashCommandSubcommandBuilder } from "discord.js";

import { CommandError } from "../../CommandHandler.js";
import { getMusicSession } from "../../voiceConnections.js";
import botConfig, { writeCurrentConfig } from "../../botConfig.js";

import autoDeleteReply from "../../functions/autoDeleteReply.js";
import { updatePanel } from "../../functions/buildPanel.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("volume")
    .setDescription("再生音量を設定します (デフォルト: 20%)")
    .addIntegerOption((option) =>
      option
        .setName("volume")
        .setDescription("変更後の再生音量 (0-200%)")
        .setMinValue(0)
        .setMaxValue(200)
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");

    const volume = interaction.options.getInteger("volume");
    session.volume = volume / 100;
    if (session.currentVideo)
      session.player.state.resource.volume.setVolumeLogarithmic(session.volume);

    botConfig.volumeSettings = {
      ...botConfig.volumeSettings,
      [interaction.guild.id]: session.volume,
    };
    writeCurrentConfig();

    await interaction.reply({
      content: `:white_check_mark: 再生音量を${volume}%に設定しました`,
    });
    autoDeleteReply(interaction);

    await updatePanel(session, ["currentVideo", "fields"]);
  },
};
