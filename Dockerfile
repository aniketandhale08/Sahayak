# --- Base Image ---
FROM node:20-slim AS base

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the source code
COPY . .

# Build Next.js app
RUN npm run build

# --- Production Image ---
FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=base /app/.next ./.next
COPY --from=base /app/package.json ./package.json

# If you have a `public` folder, copy it too:
# This won't fail if `public` doesn't exist
COPY --from=base /app/public ./public

EXPOSE 3000

# Make sure files are owned by non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

CMD ["npm", "start"]
