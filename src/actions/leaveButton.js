import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  data: { name: "leaveButton" },
  execute: async (interaction) => {
    await interaction.reply({
      content: ":warning: 再生を終了し、VCから切断します。よろしいですか？",
      components: [
        new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setCustomId("leaveConfirmButton")
            .setLabel("切断する")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
  },
};
