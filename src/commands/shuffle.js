import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";
import { updatePanel } from "../functions/buildPanel.js";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription(
      "再生待ちをシャッフルします。全体リピート中はシャッフルモードを切り替えます"
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    const { queue, queueRepeat } = session;
    if (queueRepeat.enabled) {
      queueRepeat.shuffle = !queueRepeat.shuffle;
      await interaction.reply({
        content: `:white_check_mark: 全体リピートのシャッフルモードを${
          queueRepeat.shuffle ? "有効" : "無効"
        }にしました`,
      });
    } else {
      queue.sort(() => Math.random() - 0.5);
      await interaction.reply({
        content: `:white_check_mark: 再生待ちをシャッフルしました`,
      });
    }
    autoDeleteReply(interaction);

    await updatePanel(session, ["currentVideo", "fields", "buttons"]);
  },
};
