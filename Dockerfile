FROM node:18-alpine AS builder
WORKDIR /work
COPY ./ ./
RUN npm ci
RUN npm run build
RUN npm prune --production

FROM node:18-alpine
WORKDIR /work
COPY --from=builder /work/build build
COPY package.json .
EXPOSE 3000
CMD ["node", "build"]
