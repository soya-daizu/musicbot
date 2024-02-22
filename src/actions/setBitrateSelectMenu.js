import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

import { updatePanel } from "../functions/buildPanel.js";

export default {
  data: { name: "setBitrateSelectMenu" },
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("BotがVCに接続していません");
    if (session.channelId !== interaction.member.voice.channelId)
      throw new CommandError(
        "Botの接続しているVCに接続していないようです。VCに接続しているか、正しいBotでコマンドを実行しているかご確認ください。"
      );

    const bitrate = Number(interaction.values[0]);
    session.bitrate = bitrate * 1000;
    if (session.currentVideo)
      session.player.state.resource.encoder.setBitrate(session.bitrate);

    await interaction.update({
      content: `:gear: ビットレートを選択してください\n現在のビットレート: ${
        session.bitrate / 1000
      }kbps`,
      components: [
        new ActionRowBuilder().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("setBitrateSelectMenu")
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("8kbps")
                .setValue("8")
                .setDefault(session.bitrate === 8000),
              new StringSelectMenuOptionBuilder()
                .setLabel("16kbps")
                .setValue("16")
                .setDefault(session.bitrate === 16000),
              new StringSelectMenuOptionBuilder()
                .setLabel("32kbps")
                .setValue("32")
                .setDefault(session.bitrate === 32000),
              new StringSelectMenuOptionBuilder()
                .setLabel("64kbps")
                .setValue("64")
                .setDefault(session.bitrate === 64000),
              new StringSelectMenuOptionBuilder()
                .setLabel("128kbps")
                .setValue("128")
                .setDefault(session.bitrate === 128000),
              new StringSelectMenuOptionBuilder()
                .setLabel("168kbps")
                .setValue("168")
                .setDefault(session.bitrate === 168000)
            )
        ),
        new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setCustomId("closeDialogButton")
            .setLabel("閉じる")
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
    });

    await updatePanel(session, ["currentVideo", "fields"]);
  },
};
