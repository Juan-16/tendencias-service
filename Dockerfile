FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# OpenShift ejecuta los contenedores con un UID aleatorio no-root,
# por eso el WORKDIR debe ser escribible por el grupo raíz.
RUN chgrp -R 0 /app && chmod -R g=u /app

EXPOSE 8080
CMD ["node", "server.js"]
