import {
  SlashCommandSubcommandBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { readFileSync } from "fs";

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("edit")
    .setDescription("プレイリストを編集します"),
  execute: async (interaction) => {
    const urls = readFileSync("playlist.txt").toString().trim().split("\n");
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId("editModal")
        .setTitle("プレイリスト編集")
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setCustomId("urls")
              .setLabel("URL(改行区切り)")
              .setValue(urls.join("\n"))
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        )
    );
  },
};
