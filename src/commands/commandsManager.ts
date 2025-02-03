import { type Interaction, REST, type RouteLike, Routes } from "discord.js";
import { type RESTGetAPIApplicationGuildCommandsResult } from "discord-api-types/rest/v10";

import { config } from "../config";
import { commands } from "./commands.ts";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.env.DISCORD_TOKEN!);

export async function unregisterOldCommands(guildId: string) {
  try {
    console.log("Started deleting old application (/) commands.");

    const oldCommands = (await rest.get(
      Routes.applicationGuildCommands(config.env.DISCORD_CLIENT_ID!, guildId),
    )) as RESTGetAPIApplicationGuildCommandsResult;

    const promises = [];

    for (const command of oldCommands) {
      const deleteUrl: RouteLike = `${Routes.applicationGuildCommands(config.env.DISCORD_CLIENT_ID!, guildId)}/${command.id}`;

      promises.push(rest.delete(deleteUrl));
    }

    await Promise.all(promises);

    console.log("Successfully deleted old application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

export async function registerCommands(guildId: string) {
  try {
    console.log("Started adding application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(config.env.DISCORD_CLIENT_ID!, guildId),
      {
        body: commandsData,
      },
    );

    console.log("Successfully added application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

export async function runCommands(interaction: Interaction) {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;
  const key = commandName as keyof typeof commands;

  if (commands[key]) {
    await commands[key].execute(interaction);
  }
}
