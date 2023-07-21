# Pull base image.
FROM node:18-alpine

# Install Dependencies
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache g++ make python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip catt

WORKDIR /app

COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY index.ts index.ts
COPY dist dist

# install deps
RUN npm install

# cast in iframe
RUN sed -i 's/force=True/force=False/g' /usr/lib/python3.10/site-packages/catt/controllers.py

# Expose ports
EXPOSE 8080

CMD [ "npm", "start" ]

VOLUME '/app'