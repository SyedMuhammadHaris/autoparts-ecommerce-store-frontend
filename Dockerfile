FROM node:24.22.3-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Explicitly approved dependency changes only. Exports just the lockfile.
FROM base AS resolver
COPY package.json ./
RUN npm install --package-lock-only --ignore-scripts --no-audit --no-fund

FROM scratch AS lockfile
COPY --from=resolver /app/package-lock.json /package-lock.json

FROM base AS dependencies
COPY --chown=node:node package.json package-lock.json ./
RUN chown node:node /app
USER node
RUN npm ci --no-audit --no-fund

FROM dependencies AS development
ENV WATCHPACK_POLLING=true
COPY --chown=node:node . .
RUN mkdir -p /app/.next
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Public-only value, used for repeatable compilation without private env files.
FROM development AS verification
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run lint && npm run test && npm run verify:boundary && npm run build && npm run typecheck
