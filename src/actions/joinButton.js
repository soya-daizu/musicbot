import { CommandError } from "../CommandHandler.js";
import { createVoiceConnection } from "../voiceConnections.js";

import buildPanel from "../functions/buildPanel.js";
import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: { name: "joinButton" },
  execute: async (interaction) => {
    const channel = interaction.member.voice.channel;
    if (!channel)
      throw new CommandError(
        "BotをVCに接続させるには、まず接続させたいチャンネルにユーザー自身が参加してください"
      );

    await interaction.reply({
      content: ":hourglass: 接続中です...",
    });
    const session = createVoiceConnection(channel);
    session.panelMsg = await interaction.channel.send(buildPanel(session));
    await interaction.editReply({
      content: `:white_check_mark: ${channel}に接続しました`,
    });
    autoDeleteReply(interaction);
  },
};
