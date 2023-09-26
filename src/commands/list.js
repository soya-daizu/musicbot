import { SlashCommandBuilder } from "discord.js";

import add from "./list/add.js";
import edit from "./list/edit.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("再生リスト関連の操作を行います")
    .addSubcommand(add.data)
    .addSubcommand(edit.data),
  execute: async (interaction) => {
    const subcommandType = interaction.options.getSubcommand();
    switch (subcommandType) {
      case "add":
        await add.execute(interaction);
        break;
      case "edit":
        await edit.execute(interaction);
        break;
    }
  },
};
