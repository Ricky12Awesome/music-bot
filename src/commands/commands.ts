import type {
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import play from "./play.ts";

interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export const commands = {
  play,
} satisfies Record<string, Command>;