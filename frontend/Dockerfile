# Build step #1: build the React front end
FROM node:lts-alpine as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY frontend/package.json  ./
COPY frontend/package-lock.json  ./
RUN npm install
COPY frontend/tsconfig.json  ./
COPY ./frontend/src ./src
COPY ./frontend/public ./public
RUN npm run build

# Build step #2: build an Caddy container
FROM caddy:alpine
EXPOSE 80
EXPOSE 443
COPY --from=build-step /app/build /usr/share/caddy