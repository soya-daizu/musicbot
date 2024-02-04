import botConfig from "./src/botConfig.js";

import deployCommands from "./src/functions/deployCommands.js";

deployCommands(botConfig.guildIds);
