FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma y PostgreSQL
RUN apk add --no-cache \
    openssl \
    wget \
    bash

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (incluyendo devDependencies para TypeScript)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el código fuente
COPY . .

# Dar permisos de ejecución al script de migración
RUN chmod +x scripts/migrate-deploy.sh

# Compilar TypeScript
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
# El script start ejecuta las migraciones y luego inicia el servidor
CMD ["npm", "start"]

