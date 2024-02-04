import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import formatTime from "../functions/formatTime.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("再生待ちの楽曲を一覧表示します"),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (session.queue.length === 0)
      throw new CommandError("再生待ちの楽曲はありません");

    const infoLines = session.queue.map(
      (item, idx) =>
        `${idx + 1}. ${item.title} - ${item.artist} (${formatTime(
          item.length
        )})`
    );
    let infoCharCount = 0,
      infoDispMaxLines = 0;
    for (const line of infoLines) {
      // 正確な文字列長ではないが大まかに分かれば問題ない
      infoCharCount += line.length + 1;
      if (infoCharCount > 1500) break;
      infoDispMaxLines += 1;
    }

    let content;
    if (infoDispMaxLines < infoLines.length) {
      content = `:card_box: 再生待ちの楽曲:
\`\`\`
${infoLines.slice(0, infoDispMaxLines - 1).join("\n")}
他${infoLines.length - infoDispMaxLines}曲
\`\`\``;
    } else {
      content = `:card_box: 再生待ちの楽曲:
\`\`\`
${infoLines.join("\n")}
\`\`\``;
    }

    await interaction.reply({
      content,
    });
  },
};
