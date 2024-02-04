import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("再生待ちリストから楽曲をすべて削除します"),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");

    if (session.queue.length === 0)
      throw new CommandError("再生待ちリストは既に空です");
    if (session.queueRepeat.enabled) session.queue = [session.currentVideo];
    else session.queue = [];

    if (interaction.isButton())
      await interaction.update({
        content: `:white_check_mark: 再生待ちリストをクリアしました`,
        components: [],
      });
    else
      await interaction.reply({
        content: `:white_check_mark: 再生待ちリストをクリアしました`,
      });
    autoDeleteReply(interaction);
  },
};
