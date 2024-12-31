# Use the latest Node.js LTS version
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Install development dependencies (if needed)
RUN npm install --only=development

# Expose the application port
EXPOSE 8000

# Use nodemon for hot-reloading in development
CMD ["npm", "run", "start:dev"]
