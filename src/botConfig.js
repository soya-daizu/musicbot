import { readFileSync, writeFileSync } from "fs";

const botConfig = JSON.parse(readFileSync("./smusic_bot_config.json"));

export default botConfig;

export function writeCurrentConfig() {
  writeFileSync("./smusic_bot_config.json", JSON.stringify(botConfig, null, 2));
}
