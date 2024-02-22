import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import { CommandError } from "../CommandHandler.js";
import { getMusicSession } from "../voiceConnections.js";

export default {
  data: { name: "settingsButton" },
  execute: async (interaction) => {
    const session = getMusicSession(interaction.guild.id);
    if (!session) throw new CommandError("BotがVCに接続していません");
    if (session.channelId !== interaction.member.voice.channelId)
      throw new CommandError(
        "Botの接続しているVCに接続していないようです。VCに接続しているか、正しいBotでコマンドを実行しているかご確認ください。"
      );

    const reply = await interaction.reply({
      content: `:gear: 変更する設定項目を選択してください`,
      components: [
        new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setCustomId("settingsButtonVolume")
            .setLabel("音量")
            .setEmoji("🔉")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("settingsButtonBitrate")
            .setLabel("ビットレート")
            .setEmoji("📡")
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      fetchReply: true,
    });

    const typeInteraction = await reply.awaitMessageComponent({
      filter: (i) =>
        i.channelId === interaction.channelId &&
        (i.customId === "settingsButtonVolume" ||
          i.customId === "settingsButtonBitrate"),
      time: 1000 * 60 * 5,
    });

    if (typeInteraction.customId === "settingsButtonVolume") {
      await typeInteraction.update({
        content: `:gear: 音量を調節してください\n現在の音量: ${
          session.volume * 100
        }%`,
        components: [
          new ActionRowBuilder().setComponents(
            new ButtonBuilder()
              .setCustomId("setVolumeButton#-10")
              .setLabel("-10")
              .setEmoji("🔉")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("setVolumeButton#-5")
              .setLabel("-5")
              .setEmoji("🔉")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("setVolumeButton#5")
              .setLabel("+5")
              .setEmoji("🔊")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("setVolumeButton#10")
              .setLabel("+10")
              .setEmoji("🔊")
              .setStyle(ButtonStyle.Primary)
          ),
          new ActionRowBuilder().setComponents(
            new ButtonBuilder()
              .setCustomId("closeDialogButton")
              .setLabel("閉じる")
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
      });
    } else if (typeInteraction.customId === "settingsButtonBitrate") {
      await typeInteraction.update({
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
    }
  },
};
