FROM node:22-bookworm-slim AS base

# Prisma needs OpenSSL in both the build and runtime images. ca-certificates is
# also required for outbound HTTPS calls from the application.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
# Copy the Prisma schema + config before install: the package.json `postinstall`
# hook runs `prisma generate`, which needs the schema to be present.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && exec npx next start -H 0.0.0.0 -p 3000"]
