FROM oven/bun:alpine AS base

WORKDIR /usr/src/app
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=true

RUN apk update
RUN apk add --no-cache -U ffmpeg yt-dlp

FROM base AS install

RUN mkdir -p /tmp/dev
COPY package.json bun.lock /tmp/dev/
RUN cd /tmp/dev && bun install --frozen-lockfile

RUN mkdir -p /tmp/prod
COPY package.json bun.lock /tmp/prod/
RUN cd /tmp/prod && bun install --frozen-lockfile --production

FROM base AS src
COPY package.json .
COPY bun.lock .
COPY .env .
COPY tsconfig.json .
COPY src src

FROM base AS prerelease
COPY --from=install /tmp/dev/node_modules node_modules
COPY --from=src /usr/src/app .
RUN mkdir -p build
RUN bun build --compile src/main.ts --outfile=build/app

FROM base AS release
COPY --from=install /tmp/prod/node_modules node_modules
COPY --from=src /usr/src/app .
RUN mkdir -p build
RUN bun build --compile src/main.ts --outfile=build/app

USER bun
ENTRYPOINT [ "build/app" ]
