export default {
  data: { name: "closeDialogButton" },
  execute: async (interaction) => {
    await interaction.update({ components: [] });
    await interaction.deleteReply();
  },
};
