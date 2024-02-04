export default async function autoDeleteReply(interaction) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await interaction.deleteReply().catch(() => {});
}
