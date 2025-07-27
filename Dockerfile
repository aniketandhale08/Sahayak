# Use an official Node.js runtime as a parent image
FROM node:20-slim AS base

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# --- Production Image ---
FROM node:20-slim AS production

WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application from the 'base' stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json

# The Next.js app will run on port 3000 by default. Cloud Run will automatically use this port.
EXPOSE 3000

# Change ownership of the files to the non-root user
RUN chown -R nextjs:nodejs /app/.next

# Switch to the non-root user
USER nextjs

# The command to start the application
CMD ["npm", "start"]
