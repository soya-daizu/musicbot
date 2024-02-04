import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";

import { getMusicSession } from "../voiceConnections.js";

export default {
  data: new SlashCommandBuilder()
    .setName("export")
    .setDescription(
      "現在の再生待ち楽曲をテキストファイルとしてエクスポートします"
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guildId);
    if (!session) throw new CommandError("再生中の楽曲はありません");

    const text = [session.currentVideo, ...session.queue]
      .map((item) => item.sourceUrl)
      .join("\n");

    await interaction.reply({
      content: ":white_check_mark: 再生待ち楽曲をエクスポートしました",
      files: [
        new AttachmentBuilder()
          .setName("queue.txt")
          .setFile(Buffer.from(text, "utf8")),
      ],
    });
  },
};
