# Foreman Ops Console (foreman-hub) — local-only, read-only, no authentication.
# Build context is plugins/foreman-line/ (the console's relative ESM imports
# reach the shipped receipts/ + contracts/ packages read-only).
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app/plugins/foreman-line

# Shipped read-only inputs: receipts validator (+ its ajv dep) and contracts types.
COPY receipts/package.json receipts/package-lock.json ./receipts/
RUN cd receipts && npm ci --omit=dev && npm cache clean --force
COPY contracts/src ./contracts/src
COPY receipts/src ./receipts/src

# The console itself (dev deps included: tsx runs the TypeScript directly).
COPY ops-console/package.json ops-console/package-lock.json ./ops-console/
RUN cd ops-console && npm ci && npm cache clean --force
COPY ops-console/src ./ops-console/src
COPY ops-console/ui ./ops-console/ui

WORKDIR /app/plugins/foreman-line/ops-console
# FOC_CONTAINER=1 permits the container-internal 0.0.0.0 bind; the publish
# MUST stay `-p 127.0.0.1:8081:8080` (charter D6 — loopback only, ever).
ENV FOC_CONTAINER=1
ENV PORT=8080
# Truth sources are mounted read-only at /data (FOC_REPO_ROOT).
ENV FOC_REPO_ROOT=/data
EXPOSE 8080
CMD ["node", "node_modules/tsx/dist/cli.mjs", "src/server.ts"]
