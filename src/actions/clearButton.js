import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default {
  data: { name: "clearButton" },
  execute: async (interaction) => {
    await interaction.reply({
      content: ":warning: 再生待ちリストをクリアします。よろしいですか？",
      components: [
        new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setCustomId("clearConfirmButton")
            .setLabel("クリアする")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
  },
};
