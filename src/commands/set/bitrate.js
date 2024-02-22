import { SlashCommandSubcommandBuilder } from "discord.js";

import { CommandError } from "../../CommandHandler.js";
import { getMusicSession } from "../../voiceConnections.js";

import autoDeleteReply from "../../functions/autoDeleteReply.js";
import { updatePanel } from "../../functions/buildPanel.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("bitrate")
    .setDescription("再生ビットレートを設定します (デフォルト: 64kbps)")
    .addIntegerOption((option) =>
      option
        .setName("bitrate")
        .setDescription(
          "変更後の再生ビットレート (通信環境によっては途切れやすくなるため上げすぎ注意)"
        )
        .setChoices(
          { name: "8kbps", value: 8 },
          { name: "16kbps", value: 16 },
          { name: "32kbps", value: 32 },
          { name: "64kbps", value: 64 },
          { name: "128kbps", value: 128 },
          { name: "168kbps", value: 168 }
        )
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");

    const bitrate = interaction.options.getInteger("bitrate");
    session.bitrate = bitrate * 1000;
    if (session.currentVideo)
      session.player.state.resource.encoder.setBitrate(session.bitrate);

    await interaction.reply({
      content: `:white_check_mark: 再生ビットレートを${bitrate}kbpsに設定しました`,
    });
    autoDeleteReply(interaction);

    await updatePanel(session, ["currentVideo", "fields"]);
  },
};
