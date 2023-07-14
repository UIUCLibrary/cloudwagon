# Build step #1: build the React front end
FROM node:lts-alpine AS build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json  ./
COPY package-lock.json  ./
RUN npm install
COPY tsconfig.json vite.config.ts ./

COPY src/frontend/index.html  ./src/frontend/index.html
COPY ./src/frontend/src ./src/frontend/src
COPY ./src/frontend/public ./src/frontend/public
RUN npm run build

# Build step #2: build an Caddy container
FROM caddy:alpine
EXPOSE 80
EXPOSE 443
COPY --from=build-step /app/dist/frontend /usr/share/caddy