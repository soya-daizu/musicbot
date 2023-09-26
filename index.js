import { Client, Events, GatewayIntentBits } from "discord.js";
import { readFileSync, writeFileSync } from "fs";

import startHttpServer from "./keep-alive.js";

import CommandHandler from "./src/command-handler.js";
import deployCommands from "./src/functions/deploy-commands.js";
import { preloadVideos } from "./src/functions/preloadVideos.js";
import { restoreSessions } from "./src/voice-connections.js";

const config = JSON.parse(readFileSync("./config.json"));
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const commandHandler = new CommandHandler();
client.commands = commandHandler.commandCollection;
client.on(Events.InteractionCreate, (i) => commandHandler.handleCommand(i));

client.once(Events.ClientReady, (c) => {
  console.log(`[起動完了] ${c.user.tag}`);
  restoreSessions(c);

  const urls = readFileSync("playlist.txt").toString().trim().split("\n");
  preloadVideos(urls);

  startHttpServer();
});

client.once(Events.GuildCreate, async (guild) => {
  if (config.guildIds.includes(guild.id)) return;
  console.log(`[サーバー追加] ${guild.name}`);
  await deployCommands([guild.id]);

  config.guildIds.push(guild.id);
  writeFileSync("./config.json", JSON.stringify(config, null, 2));
});

client.once(Events.GuildDelete, (guild) => {
  console.log(`[サーバー削除] ${guild.name}`);

  config.guildIds = config.guildIds.filter((id) => id !== guild.id);
  writeFileSync("./config.json", JSON.stringify(config, null, 2));
});

client.login(process.env.TOKEN);
