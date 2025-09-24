# 1. Use Node.js image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 4. Copy the rest of the app
COPY . .

# 5. Build Next.js for production
RUN npm run build

# 6. Expose port
EXPOSE 3000

# 7. Start Next.js
CMD ["npm", "start"]
