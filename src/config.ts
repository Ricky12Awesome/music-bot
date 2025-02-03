const env = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  TEST_AUDIO_PATH: process.env.TEST_AUDIO_PATH,
};

export function initConfig() {
  Object.entries(env).forEach(([name, value]) => {
    if (!value) {
      console.error(`no environment variable ${name}`);
      process.exit(1);
    }
  });
}

export const config = {
  env,
};
