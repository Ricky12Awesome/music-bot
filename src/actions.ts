import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonComponentData,
  ButtonStyle,
  type Interaction,
} from "discord.js";

export const actions = {
  play: {
    customId: "play",
    label: "Play",
    style: ButtonStyle.Primary,
  },
  pause: {
    customId: "pause",
    label: "Pause",
    style: ButtonStyle.Primary,
  },
  resume: {
    customId: "resume",
    label: "Resume",
    style: ButtonStyle.Primary,
  },
} satisfies Record<string, Partial<ButtonComponentData>>;

export async function runActions(interaction: Interaction) {
  if (!interaction.isButton()) {
    return;
  }

  const { customId } = interaction;
  const components = interaction.message.components[0];

  let buttons = components.components.map((component) => {
    const action = actions[component.customId as keyof typeof actions];

    return new ButtonBuilder({
      ...action,
      disabled: customId === component.customId || component.disabled,
    });
  });

  let row = new ActionRowBuilder<ButtonBuilder>({ components: buttons });

  interaction.update({
    content: interaction.message.content,
    components: [row],
  });
}
