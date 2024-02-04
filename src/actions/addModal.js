import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import resolveUrl from "../functions/resolveUrl.js";
import { preloadVideo } from "../functions/preloadVideo.js";
import autoDeleteReply from "../functions/autoDeleteReply.js";
import buildPanel from "../functions/buildPanel.js";
import truncateLines from "../functions/truncateLines.js";

export default {
  data: { name: "addModal" },
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");

    await interaction.reply({
      content: ":hourglass: URLから情報を取得中です...",
    });

    const url = interaction.fields.getTextInputValue("url");
    const infos = await resolveUrl(url).catch(() => null);
    if (!infos || infos.length === 0)
      throw new CommandError(
        "楽曲を取得できませんでした。URLが正しいかもう一度ご確認ください。"
      );

    session.queue.push(...infos);
    infos.reduce(
      (promise, info) => promise.then(() => preloadVideo(info)),
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

    await session.panelMsg.edit(buildPanel(session));
  },
};
