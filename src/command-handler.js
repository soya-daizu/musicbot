import { Collection } from "discord.js";

import join from "./commands/join.js";
import leave from "./commands/leave.js";
import toggle from "./commands/toggle.js";
import list from "./commands/list.js";

import editModal from "./actions/editModal.js";

export class CommandError extends Error {
  constructor(message) {
    super(message);
    this.name = "CommandError";
  }
}

export default class CommandHandler {
  static commands = [join, leave, toggle, list];
  static actions = [editModal];
  static ignoreList = [];

  constructor() {
    this.commandCollection = new Collection();
  }

  async handleCommand(interaction) {
    let commandName, command;
    if (
      interaction.isChatInputCommand() ||
      interaction.isContextMenuCommand() ||
      interaction.isAutocomplete()
    ) {
      commandName = interaction.commandName;
      command = CommandHandler.commands.find(
        (c) => c.data.name === commandName
      );
    } else if (
      interaction.isModalSubmit() ||
      interaction.isButton() ||
      interaction.isAnySelectMenu()
    ) {
      commandName = interaction.customId.split("#")[0];
      command = CommandHandler.actions.find((c) => c.data.name === commandName);
    }

    if (!command) {
      console.error(`不明なコマンド: ${commandName}`);
      return;
    }

    if (interaction.isAutocomplete()) {
      try {
        await command.autocomplete(interaction);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      await command.execute(interaction);
    } catch (e) {
      let message;
      if (e instanceof CommandError) {
        message = `:boom: ${e.message}`;
      } else {
        console.error(e);
        message = `:boom: コマンドの実行中にエラーが発生しました: \`${e.toString()}\``;
      }

      if (interaction.replied) {
        await interaction
          .editReply({ content: message, ephemeral: true, components: [] })
          .catch((e) => console.error(e));
      } else {
        await interaction
          .reply({ content: message, ephemeral: true, components: [] })
          .catch((e) => console.error(e));
      }
    }
  }
}
