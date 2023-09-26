import { REST, Routes } from "discord.js";
import { readFileSync } from "fs";

import CommandHandler from "../command-handler.js";

const config = JSON.parse(readFileSync("./config.json"));
const commands = CommandHandler.commands.map((c) => c.data.toJSON());
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

export default async function deployCommands(guildIds) {
  try {
    for (const guildId of guildIds) {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`[コマンド登録完了] guildId: ${guildId} (${data.length}件)`);
    }
  } catch (e) {
    console.error(e);
  }
}
