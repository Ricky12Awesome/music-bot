import fs from "fs";
import stream from "stream";
import { URL } from "url";
import { AudioResource, createAudioResource } from "@discordjs/voice";

type StdIoReader = ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>;

interface UrlParser {
  hosts: string[];
  parse: (url: URL) => void;
}

const urlParsers = {
  youtube: {
    hosts: ["www.youtube.com", "youtube.com", "youtu.be"],
    parse: (url) => {
      let video = url.searchParams.get("v");
      let path = url.pathname;

      if (video) {
        return video;
      }

      if (!path || (path && path.startsWith("/watch"))) {
        return undefined;
      }

      return path.substring(1);
    },
  },
} satisfies Record<string, UrlParser>;

function parseUrl(url: string) {
  let parsed = URL.parse(url);

  if (!parsed) {
    return undefined;
  }

  let parser = Object.entries(urlParsers)
    .map(([_, value]) => value)
    .find((value) => value.hosts.includes(parsed.host ?? "\0"));

  return parser?.parse(parsed);
}

function parse(url: string) {
  const parsed = parseUrl(url);

  if (!parsed) {
    return undefined;
  }

  // prettier-ignore
  return {
    name: parsed,
    cmd: [
      "yt-dlp",
      "--quiet",
      "--extract-audio",
      "--limit-rate", "128k",
      "--audio-format", "opus",
      "--audio-quality", "0",
      "--output", "-", url,
    ],
  };
}

function writeTask(reader: StdIoReader, fileWrite: stream.Writable) {
  return new Promise<void>(async (resolve) => {
    while (true) {
      const { value, done } = await reader.readMany();

      if (done) break;
      if (!value) break;

      for (const chunk of value) {
        fileWrite.write(chunk);
      }
    }

    resolve();
  });
}

interface CreateOptions {
  readonly cacheDir: string;
}

const defaultOptions: CreateOptions = {
  cacheDir: "./cache",
};

interface CreateResult {
  readonly writeTask: Promise<void>;
  readonly resource: AudioResource<null>;
  readonly cancel: () => Promise<void>;
}

export async function create(
  url: string,
  options: CreateOptions = defaultOptions,
) {
  const { cacheDir } = options;
  const { name, cmd } = parse(url) ?? {};

  if (!name || !cmd) {
    return undefined;
  }

  const filename = `${name}.webm`;
  const path = `${cacheDir}/${filename}`;

  if (fs.existsSync(path)) {
    const fileRead = fs.createReadStream(path);
    const resource = createAudioResource(fileRead);

    return {
      writeTask: new Promise<void>(() => {}),
      resource,
      cancel: () => {
        fileRead.close();
        resource?.audioPlayer?.stop();
      },
    } as CreateResult;
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  } else {
    if (!fs.statSync(cacheDir).isDirectory()) {
      console.error(`cache directory is not a directory: ${cacheDir}`);
      return undefined;
    }
  }

  const process = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "ignore",
  });

  const reader = process.stdout.getReader();
  const fileWrite = fs.createWriteStream(path);
  const passthrough = new stream.PassThrough();

  passthrough.pipe(fileWrite);

  const task = writeTask(reader, passthrough);

  passthrough.on("error", () => fileWrite.close());
  passthrough.on("end", () => fileWrite.close());
  passthrough.on("finish", () => fileWrite.close());

  const resource = createAudioResource(passthrough);

  return {
    writeTask: task,
    resource,
    cancel: async () => {
      await reader.cancel();
      await task;

      resource.audioPlayer?.stop(true);

      process.kill();

      if (fs.existsSync(path)) {
        fs.rmSync(path);
      }
    },
  } as CreateResult;
}

// const data = await create("https://youtu.be/cE0wfjsybIQ");

// data?.cancel();
