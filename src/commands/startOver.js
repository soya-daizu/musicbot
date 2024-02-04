import { SlashCommandBuilder } from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("start_over")
    .setDescription(
      "再生位置を0秒に戻し、再生中の楽曲をもう一度はじめから再生します。"
    ),
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("VCに接続していません");
    if (!session.currentVideo)
      throw new CommandError("再生中の楽曲がありません");

    const { player, queue, currentVideo, queueRepeat } = session;
    if (queueRepeat.enabled) {
      let rewindSize;
      if (player.state.resource.playbackDuration <= 5000) rewindSize = 2;
      else rewindSize = 1;

      queueRepeat.index -= rewindSize;
      if (queueRepeat.index < 0)
        queueRepeat.index = queue.length + queueRepeat.index;

      player.stop();
    } else {
      queue.unshift(currentVideo);
      player.stop();
    }

    await interaction.reply({
      content: `:white_check_mark: 現在の楽曲をもう一度はじめから再生します`,
    });
    autoDeleteReply(interaction);
  },
};
