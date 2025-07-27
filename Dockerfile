# --- Base Image ---
FROM node:20-slim AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# --- Production Image ---
FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT 8080

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=base /app/.next ./.next
COPY --from=base /app/package.json ./package.json

EXPOSE 8080

RUN chown -R nextjs:nodejs /app

USER nextjs

CMD ["npm", "start"]
