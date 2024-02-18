import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";
import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("再生音量を設定します")
    .addIntegerOption((option) =>
      option
        .setName("volume")
        .setDescription("変更後の再生音量")
        .setMinValue(0)
        .setMaxValue(200)
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    const newVolume = interaction.options.getInteger("volume");
    session.volume = newVolume / 100;
    session.resource.volume.setVolumeLogarithmic(session.volume);

    await interaction.reply({
      content: `:white_check_mark: 再生音量を${newVolume}%に設定しました`,
      ephemeral: true,
    });
    autoDeleteReply(interaction);
  },
};
