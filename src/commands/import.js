import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import resolveUrl from "../functions/resolveUrl.js";
import { preloadVideo } from "../functions/preloadVideo.js";
import autoDeleteReply from "../functions/autoDeleteReply.js";
import { updatePanel } from "../functions/buildPanel.js";
import truncateLines from "../functions/truncateLines.js";

export default {
  data: new SlashCommandBuilder()
    .setName("import")
    .setDescription("テキストファイルから楽曲をインポートします")
    .addAttachmentOption((option) =>
      option
        .setName("file")
        .setDescription("インポートする楽曲のテキストファイル")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");

    const file = interaction.options.getAttachment("file");
    if (file.contentType.split(";")[0] !== "text/plain")
      throw new CommandError(
        "添付されたファイルはテキストファイルではありません"
      );
    const text = await fetch(file.url).then((res) => res.text());
    const lines = text
      .trim()
      .split("\n")
      .map((line) => line.trim());
    if (lines.length === 0) throw new CommandError("テキストファイルは空です");

    await interaction.reply({
      content: ":hourglass: URLから情報を取得中です...",
    });

    const infos = await Promise.all(
      lines.map((line, idx) =>
        resolveUrl(line).catch(() => {
          throw new CommandError(
            `楽曲を取得できませんでした。${
              idx + 1
            }行目のURLが正しいかもう一度ご確認ください。`
          );
        })
      )
    ).then((unflattened) => unflattened.flat());
    if (infos.length === 0)
      throw new CommandError(
        "楽曲を取得できませんでした。URLが正しいかもう一度ご確認ください。"
      );

    session.queue.push(...infos);
    session.queue.reduce(
      (promise, info, idx) =>
        promise.then(async () => {
          session.queue[idx] = await preloadVideo(info);
        }),
      Promise.resolve()
    );

    const infoLines = truncateLines(
      infos.map((info) => `${info.title} - ${info.artist}`),
      1500
    );
    let content;
    if (infoLines.length < infos.length) {
      content = `:white_check_mark: 以下の${
        infos.length
      }曲を再生待ちに追加しました
\`\`\`
${infoLines.join("\n")}
他${infos.length - infoLines.length}曲
\`\`\``;
    } else {
      content = `:white_check_mark: 以下の${
        infos.length
      }曲を再生待ちに追加しました
\`\`\`
${infoLines.join("\n")}
\`\`\``;
    }

    await interaction.editReply({
      content,
    });
    autoDeleteReply(interaction);

    await updatePanel(session, ["currentVideo", "fields", "buttons"]);
  },
};
