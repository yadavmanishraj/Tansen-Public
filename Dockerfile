FROM node:20.17.0

# Set the Google Application Credentials environment variable
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/audio-haven-firebase-adminsdk-bof3v-5431f3167e.json

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright dependencies and browsers
RUN npx playwright install-deps && npx playwright install

# Copy the rest of the application code
COPY . .

# Ensure the Google Application Credentials are available
COPY audio-haven-firebase-adminsdk-bof3v-5431f3167e.json .

# Run the Node.js application
CMD ["node", "app.js"]