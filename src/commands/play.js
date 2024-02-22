import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { createVoiceConnection, getMusicSession } from "../voiceConnections.js";

import resolveUrl from "../functions/resolveUrl.js";
import { preloadVideo } from "../functions/preloadVideo.js";
import buildPanel, { updatePanel } from "../functions/buildPanel.js";
import autoDeleteReply from "../functions/autoDeleteReply.js";
import truncateLines from "../functions/truncateLines.js";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("指定した楽曲を参加中のVCで再生します")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("再生させたい楽曲のURL")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    await interaction.reply({
      content: ":hourglass: URLから情報を取得中です...",
    });

    const url = interaction.options.getString("url");
    const infos = await resolveUrl(url).catch(() => null);
    if (!infos || infos.length === 0)
      throw new CommandError(
        "楽曲を取得できませんでした。URLが正しいかもう一度ご確認ください。"
      );

    let session = getMusicSession(interaction.guild.id);
    const coldStart = !session;
    if (coldStart) {
      const channel = interaction.member.voice.channel;
      if (!channel)
        throw new CommandError(
          "VCに接続していません。`/join`でBotを接続させるか、任意のVCに参加してから再度このコマンドを実行してください。"
        );

      await interaction.editReply({
        content: ":hourglass: 接続中です...",
      });
      session = createVoiceConnection(
        channel,
        await interaction.channel.send(buildPanel())
      );
      await interaction.editReply({
        content: `:white_check_mark: ${channel}に接続しました`,
      });
    }

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

    if (coldStart) {
      const followUpMsg = await interaction.followUp({
        content,
      });
      autoDeleteReply(interaction).then(() => followUpMsg.delete());
    } else {
      await interaction.editReply({
        content,
      });
      autoDeleteReply(interaction);
      await session.panelMsg.edit(buildPanel(session));
      await updatePanel(session, ["currentVideo", "fields", "buttons"]);
    }
  },
};
