import { writeFileSync } from "fs";

import { CommandError } from "../command-handler.js";
import { getSession } from "../voice-connections.js";

import { preloadVideos } from "../functions/preloadVideos.js";
import validateUrl from "../functions/validateUrl.js";

export default {
  data: { name: "editModal" },
  execute: async (interaction) => {
    const urls = interaction.fields.getTextInputValue("urls").split("\n");

    const failedIdx = urls.findIndex((url) => !validateUrl(url));
    if (failedIdx !== -1)
      throw new CommandError(`無効なURLが含まれています(${failedIdx + 1}番目)`);

    writeFileSync("playlist.txt", urls.join("\n"));

    const content = `:white_check_mark: プレイリストの編集が完了しました(合計${urls.length}件)`;
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
