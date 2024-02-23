import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import { updatePanel } from "../functions/buildPanel.js";

export default {
  data: { name: "setVolumeButton" },
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("BotがVCに接続していません");
    if (session.channelId !== interaction.member.voice.channelId)
      throw new CommandError(
        "Botの接続しているVCに接続していないようです。VCに接続しているか、正しいBotでコマンドを実行しているかご確認ください。"
      );

    const delta = Number(interaction.customId.split("#")[1]);
    session.volume = parseFloat((session.volume + delta / 100).toFixed(2));
    if (session.volume < 0) session.volume = 0;
    else if (session.volume > 2) session.volume = 2;

    if (session.currentVideo)
      session.player.state.resource.volume.setVolumeLogarithmic(session.volume);

    await interaction.update({
      content: `:gear: 音量を調節してください\n現在の音量: ${(
        session.volume * 100
      ).toFixed()}%`,
    });

    await updatePanel(session, ["currentVideo", "fields"]);
  },
};
