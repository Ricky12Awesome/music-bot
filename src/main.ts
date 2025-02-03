import { Client } from "discord.js";
import { config, initConfig } from "./config";
import { registerCommands, runCommands } from "./commands/commandsManager.ts";
import { runActions } from "./actions.ts";

initConfig();

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildVoiceStates"],
});

client.once("ready", async (client) => {
  console.log(`Logged in as ${client.user.tag}`);

  await registerCommands(config.env.GUILD_ID!);
});

client.on("interactionCreate", async (interaction) => {
  await runCommands(interaction);
  await runActions(interaction);
});

await client.login(config.env.DISCORD_TOKEN);
