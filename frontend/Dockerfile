# Use Node.js 20 Alpine as the base image
FROM node:20-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Stage 1: Builder stage to build the Next.js app
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy all files from the host to the container
COPY . .

# Install all dependencies, including devDependencies
RUN npm install

# Build the Next.js app for production
RUN npm run build

# Stage 2: Production stage to serve the app
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the production port (default is 3000)
EXPOSE 3000

# Start the Next.js app in production mode
CMD ["npm", "start"]