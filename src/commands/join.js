import { SlashCommandBuilder, ChannelType } from "discord.js";
import { readFileSync } from "fs";

import { CommandError } from "../command-handler.js";
import {
  createVoiceConnection,
  hasPlayableFiles,
} from "../voice-connections.js";

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription(
      "指定したチャンネルまたは現在接続しているボイスチャンネルにBotを参加させます"
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Botを参加させるボイスチャンネル")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    ),
  execute: async (interaction) => {
    const channel =
      interaction.options.getChannel("channel") ||
      interaction.member.voice.channel;
    if (!channel)
      throw new CommandError(
        "参加するチャンネルが指定されていません。コマンドオプションで指定するかチャンネルに接続してください"
      );

    if (readFileSync("playlist.txt").toString().length === 0)
      throw new CommandError(
        "プレイリストが空です。先にプレイリストに楽曲を追加してください。"
      );

    if (!hasPlayableFiles())
      throw new CommandError(
        "再生可能なファイルがまだありません。直近にプレイリストを編集した場合は、数分後に再度お試しください。"
      );

    await interaction.reply({
      content: ":hourglass: 接続中です...",
    });
    createVoiceConnection(channel);
    await interaction.editReply({
      content: `:white_check_mark: ${channel}に接続しました`,
    });
  },
};
