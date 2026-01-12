# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY registro-horas/ .
# Copiar los archivos
COPY . .

# Instalar dependencias con pnpm o npm según corresponda
RUN npm install -g pnpm && pnpm install

# Construir la app
RUN pnpm build

# Exponer puerto para Next.js
EXPOSE 3000

# Ejecutar en modo producción
CMD ["pnpm", "start"]