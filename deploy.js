import deployCommands from "./src/functions/deploy-commands.js";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./config.json"));
deployCommands(config.guildIds);
