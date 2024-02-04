import { SlashCommandBuilder, ChannelType } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession, createVoiceConnection } from "../voiceConnections.js";

import buildPanel from "../functions/buildPanel.js";
import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription(
      "指定したチャンネルまたは現在接続しているVCにBotを参加させます"
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Botを参加させるVC")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (session) throw new CommandError("既にVCに接続しています");

    const channel =
      interaction.options.getChannel("channel") ||
      interaction.member.voice.channel;
    if (!channel)
      throw new CommandError(
        "接続するVCが指定されていません。コマンドオプションで指定するか任意のVCに接続してから再度このコマンドを実行してください。"
      );

    await interaction.reply({
      content: ":hourglass: 接続中です...",
    });
    createVoiceConnection(
      channel,
      await interaction.channel.send(buildPanel())
    );
    await interaction.editReply({
      content: `:white_check_mark: ${channel}に接続しました`,
    });
    autoDeleteReply(interaction);
  },
};
