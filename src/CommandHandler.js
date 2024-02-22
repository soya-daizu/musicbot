import join from "./commands/join.js";
import makeJoinBtn from "./commands/makeJoinBtn.js";
import leave from "./commands/leave.js";
import play from "./commands/play.js";
import list from "./commands/list.js";
import clear from "./commands/clear.js";
import toggle from "./commands/toggle.js";
import startOver from "./commands/startOver.js";
import skip from "./commands/skip.js";
import repeat from "./commands/repeat.js";
import repeatQueue from "./commands/repeatQueue.js";
import shuffle from "./commands/shuffle.js";
import _import from "./commands/import.js";
import _export from "./commands/export.js";
import set from "./commands/set.js";

import joinButton from "./actions/joinButton.js";
import startOverButton from "./actions/startOverButton.js";
import toggleButton from "./actions/toggleButton.js";
import skipButton from "./actions/skipButton.js";
import repeatButton from "./actions/repeatButton.js";
import repeatQueueButton from "./actions/repeatQueueButton.js";
import shuffleButton from "./actions/shuffleButton.js";
import addButton from "./actions/addButton.js";
import addModal from "./actions/addModal.js";
import clearButton from "./actions/clearButton.js";
import clearConfirmButton from "./actions/clearConfirmButton.js";
import leaveButton from "./actions/leaveButton.js";
import leaveConfirmButton from "./actions/leaveConfirmButton.js";
import settingsButton from "./actions/settingsButton.js";
import setVolumeButton from "./actions/setVolumeButton.js";
import setBitrateSelectMenu from "./actions/setBitrateSelectMenu.js";
import closeDialogButton from "./actions/closeDialogButton.js";

export class CommandError extends Error {
  constructor(message) {
    super(message);
    this.name = "CommandError";
  }
}

export default class CommandHandler {
  static commands = [
    join,
    makeJoinBtn,
    leave,
    play,
    list,
    clear,
    toggle,
    startOver,
    skip,
    repeat,
    repeatQueue,
    shuffle,
    _import,
    _export,
    set,
  ];
  static actions = [
    joinButton,
    startOverButton,
    toggleButton,
    skipButton,
    repeatButton,
    repeatQueueButton,
    shuffleButton,
    addButton,
    addModal,
    clearButton,
    clearConfirmButton,
    leaveButton,
    leaveConfirmButton,
    settingsButton,
    setVolumeButton,
    setBitrateSelectMenu,
    closeDialogButton,
  ];
  static ignoreList = [
    "voiceRankExcludeButton",
    "voiceRankExcludeRemoveButton",
    "voiceRankResetButton",
    "inviteRankExcludeButton",
    "inviteRankExcludeRemoveButton",
    "inviteRankResetButton",
    "settingsButtonVolume",
    "settingsButtonBitrate",
  ];

  constructor() {}

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

    if (CommandHandler.ignoreList.includes(commandName)) return;

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
      } else if (e.code === "InteractionCollectorError") {
        message = `:boom: 一定時間以内に操作がなかったため、コマンドの実行を中止しました`;
      } else {
        console.error(e);
        message = `:boom: コマンドの実行中にエラーが発生しました: \`${e.toString()}\``;
      }

      if (interaction.replied || interaction.deferred) {
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
