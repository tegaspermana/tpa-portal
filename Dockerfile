
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --silent
COPY . .
RUN npm run css:build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/app.js"]
