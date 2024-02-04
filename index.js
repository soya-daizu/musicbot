import { Client, Events, GatewayIntentBits } from "discord.js";

import botConfig, { writeCurrentConfig } from "./src/botConfig.js";
import CommandHandler from "./src/CommandHandler.js";

import deployCommands from "./src/functions/deployCommands.js";
import handleVoiceStateUpdate from "./src/functions/handleVoiceStateUpdate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commandHandler = new CommandHandler();
client.commands = commandHandler.commandCollection;
client.on(Events.InteractionCreate, commandHandler.handleCommand);
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

client.once(Events.ClientReady, async (c) => {
  console.log(`[起動完了] ${c.user.tag}`);
});

client.once(Events.GuildCreate, async (guild) => {
  if (botConfig.guildIds.includes(guild.id)) return;
  console.log(`[サーバー追加] ${guild.name}`);
  await deployCommands([guild.id]);

  botConfig.guildIds.push(guild.id);
  writeCurrentConfig();
});

client.once(Events.GuildDelete, (guild) => {
  console.log(`[サーバー削除] ${guild.name}`);

  botConfig.guildIds = botConfig.guildIds.filter((id) => id !== guild.id);
  writeCurrentConfig();
});

client.login(botConfig.token);
