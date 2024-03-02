const botConfig = {
  clientId: process.env.CLIENT_ID || "",
  token: process.env.TOKEN || "",
  guildIds: [],
}

export default botConfig;

export function writeCurrentConfig() {}
