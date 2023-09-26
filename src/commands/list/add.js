import { SlashCommandSubcommandBuilder } from "discord.js";
import { readFileSync, writeFileSync } from "fs";

import { CommandError } from "../../command-handler.js";
import { getSession } from "../../voice-connections.js";

import { preloadVideos } from "../../functions/preloadVideos.js";
import validateUrl from "../../functions/validateUrl.js";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("プレイリストに楽曲を追加します")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("追加する楽曲のURL(YouTubeまたはSpotify)")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const url = interaction.options.getString("url");
    if (!validateUrl(url)) throw new CommandError("指定したURLは無効です");

    const urls = readFileSync("playlist.txt").toString().trim().split("\n");
    if (urls.includes(url))
      throw new CommandError("指定したURLは既にプレイリストに存在します");

    urls.push(url);
    writeFileSync("playlist.txt", urls.join("\n"));

    const content = `:white_check_mark: ${url} をプレイリストに追加しました`;
    await interaction.reply(content);

    const result = getSession(interaction.guild.id);
    if (result && !result.paused) {
      result.player.pause();
      result.paused = true;
    }

    await preloadVideos(urls, (progress, total) => {
      let progressContent = content;
      if (progress !== total) {
        progressContent += `\n:hourglass: 動画ダウンロード中... ${progress}/${total}`;
      } else {
        progressContent += "\n:white_check_mark: 動画ダウンロード完了";
        if (result && result.paused) {
          result.player.unpause();
          result.paused = false;
        }
      }
      interaction.editReply({
        content: progressContent,
      });
    });
  },
};
