import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export default {
  data: { name: "addButton" },
  execute: async (interaction) => {
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId("addModal")
        .setTitle("楽曲追加")
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setCustomId("url")
              .setLabel("URL")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        )
    );
  },
};
