# Dockerfile
# Use the official Node.js LTS (Long Term Support) image as the base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory.
# This step is done separately to leverage Docker's layer caching.
# If only package.json changes, npm install will run. If only code changes, this layer is cached.
COPY package*.json ./

# Install project dependencies
# 'npm install' reads package.json and installs all dependencies.
# In a production setup, you would typically use 'npm install --production' to skip dev dependencies.
RUN npm install

# --- ADDED: Install netcat for health checks/waiting ---
# netcat is used in docker-compose.yml's 'command' for the 'app' service
# to wait for MySQL to be ready before starting the Node.js application.
# 'apk add --no-cache' is the command for installing packages in Alpine Linux (node:20-alpine).
RUN apk add --no-cache netcat-openbsd
# --- END ADDED ---

# Copy the rest of the application code to the working directory
# This includes all your config, models, routes, and server.js
COPY . .

# Expose the port that your Express app will listen on.
# This informs Docker that the container listens on this port.
EXPOSE 5000

# Define the command to run the application when the container starts.
# For development, we use 'npm run dev' which triggers nodemon for hot-reloading.
# Note: This CMD is technically overridden by the 'command' in docker-compose.yml,
# but it's good practice to keep a default CMD for standalone Dockerfile builds.
CMD ["npm", "run", "dev"]

# For a production build, you would change the CMD to:
# CMD ["npm", "start"]
