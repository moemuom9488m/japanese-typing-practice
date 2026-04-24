FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Vite default port
EXPOSE 5173

# Run the dev server with host flag to allow access from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
