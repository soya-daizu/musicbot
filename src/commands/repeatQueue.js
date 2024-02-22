import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";
import { updatePanel } from "../functions/buildPanel.js";

export default {
  data: new SlashCommandBuilder()
    .setName("repeat_queue")
    .setDescription("全体リピートモードを切り替えます"),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    if (!session.queueRepeat.enabled) {
      session.queue.unshift(session.currentVideo);
      session.queueRepeat = {
        enabled: true,
        shuffle: false,
        index: 0,
      };
    } else {
      session.queue = session.queue.slice(session.queueRepeat.index + 1);
      session.queueRepeat = {
        enabled: false,
        shuffle: false,
        index: 0,
      };
    }

    await interaction.reply({
      content: `:white_check_mark: 全体リピートモードを${
        session.queueRepeat.enabled ? "有効" : "無効"
      }にしました`,
    });
    autoDeleteReply(interaction);

    await updatePanel(session, ["fields", "buttons"]);
  },
};
