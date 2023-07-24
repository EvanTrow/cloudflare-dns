# Pull base image.
FROM node:18-alpine

WORKDIR /app

COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY index.ts index.ts
COPY database database
COPY dist dist
COPY web-app/src/types.tsx web-app/src/types.tsx

# install deps
RUN npm install
RUN npm install ts-node -g

# Expose ports
EXPOSE 8080

ENV PUBLIC_IP_POLL_RATE_SEC=90

CMD [ "npm", "start" ]

VOLUME '/db'