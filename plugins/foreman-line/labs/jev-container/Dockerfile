FROM node:22.14.0-bookworm-slim

WORKDIR /app

COPY plugins/foreman-line/jev-decisions/src ./src
COPY plugins/foreman-line/jev-decisions/container/jev-run.mjs ./container/jev-run.mjs
COPY plugins/foreman-line/jev-decisions/container/fixtures ./container/fixtures

USER node
ENTRYPOINT ["node", "--experimental-strip-types", "/app/container/jev-run.mjs"]
