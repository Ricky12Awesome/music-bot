import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandStringOption,
} from "discord.js";

import {
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";

import { create } from "../yt-dlp.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .addChannelOption(
      new SlashCommandChannelOption()
        .setName("channel")
        .setDescription("Select Voice Channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice),
    )
    .addStringOption(
      new SlashCommandStringOption()
        .setName("url")
        .setDescription("Youtube URL")
        .setRequired(true),
    )
    .setDescription("Replies with balls!"),

  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const channel = interaction.options.getChannel<ChannelType.GuildVoice>(
      "channel",
      true,
    );

    const url = interaction.options.getString("url", true);

    if (!channel) return;
    if (!url) return;

    const player = createAudioPlayer();
    const result = await create(url);

    if (!result) return;

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, async () => {
      connection.subscribe(player);
      player.play(result.resource);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        connection.destroy();
      }
    });

    await interaction.reply({
      content: `Playing <${url}>`,
    });
  },
};
