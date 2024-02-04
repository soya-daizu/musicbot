import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import autoDeleteReply from "../functions/autoDeleteReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("make_join_btn")
    .setDescription("/joinコマンドと同等の機能を持つボタンを作成します")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("ボタンのテキスト")
        .setMaxLength(100)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("作成するメッセージの内容")
        .setMaxLength(100)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (interaction) => {
    const text = interaction.options.getString("text");
    const content = interaction.options.getString("content") ?? "";
    await interaction.channel.send({
      content,
      components: [
        new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setCustomId("joinButton")
            .setLabel(text)
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });

    await interaction.reply({
      content: ":white_check_mark: VC接続ボタンを作成しました",
      ephemeral: true,
    });
    autoDeleteReply(interaction);
  },
};
