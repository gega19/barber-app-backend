# Contexto del Entorno de Servidor - Barber App

Este documento sirve como referencia técnica completa sobre la infraestructura, despliegue y mantenimiento del backend en el servidor de producción. Está diseñado para que cualquier agente de IA entienda rápidamente el entorno.

## 📍 Ubicaciones y Rutas Críticas

| Recurso | Ruta en Servidor | Descripción |
|---------|------------------|-------------|
| **Directorio Base** | `/opt/inventarioceg/` | Raíz de la infraestructura del proyecto. |
| **Código Backend** | `/opt/inventarioceg/barber-app-backend` | Repositorio clonado del backend (Node.js/TypeScript). |
| **Docker Compose** | `/opt/inventarioceg/docker-compose.prod.yml` | Archivo orquestador de producción. |
| **Contenedor** | `barber_backend` | Nombre del servicio/contenedor Docker principal. |
| **Prisma Schema** | `/opt/inventarioceg/barber-app-backend/prisma/schema.prisma` | Definición de la base de datos (dentro del repo). |

## 🏗 Arquitectura de Infraestructura

*   **SO**: Linux.
*   **Containerización**: Docker & Docker Compose.
*   **Base de Datos**: PostgreSQL (gestionado vía Prisma ORM).
*   **Backend Runtime**: Node.js.
*   **Acceso**: SSH vía PuTTY.

## 🚀 Flujos de Trabajo (Workflows)

### 1. Despliegue Estándar (Deployment)
Para aplicar cambios de código subidos a `main`:

```bash
# 1. Navegar al directorio del backend
cd /opt/inventarioceg/barber-app-backend

# 2. Obtener últimos cambios
git pull origin main

# 3. Reconstruir contenedor (IMPORTANTE: --no-cache para asegurar copia de archivos)
docker compose -f /opt/inventarioceg/docker-compose.prod.yml build --no-cache barber_backend

# 4. Levantar servicio en segundo plano
docker compose -f /opt/inventarioceg/docker-compose.prod.yml up -d barber_backend
```

### 2. Actualización de Base de Datos (Prisma)
Si hubo cambios en `schema.prisma` (nuevas tablas, columnas, enums):

```bash
# 1. Ejecutar dentro del contenedor corriendo
docker exec -it barber_backend npx prisma db push

# 2. Regenerar cliente de Prisma (Client)
docker exec -it barber_backend npx prisma generate

# 3. Reiniciar para recargar el cliente en memoria
docker restart barber_backend
```

## 🔧 Solución de Problemas Comunes

### Container Ignora Cambios de Código
Si después de un deploy el código parece viejo:
*   **Causa**: Docker layer caching.
*   **Solución**: Usar siempre `build --no-cache` como se indica en el flujo de despliegue.

### Error "Value not found in enum" (Prisma)
Si la DB y el código están desincronizados:
*   **Causa**: El archivo `schema.prisma` dentro del contenedor no se actualizó correctamente durante el build.
*   **Solución Manual**:
    ```bash
    # Copiar forzosamente el schema local al contenedor
    docker cp /opt/inventarioceg/barber-app-backend/prisma/schema.prisma barber_backend:/app/prisma/schema.prisma
    
    # Regenerar y reiniciar
    docker exec -it barber_backend npx prisma generate
    docker restart barber_backend
    ```

## 📊 Monitoreo y Logs (Debugging)

Para ver logs en tiempo real de la aplicación:

```bash
docker logs -f barber_backend
```
*Usa `Ctrl + C` para salir.*

---
**Nota para la IA**: Al generar comandos para el usuario, siempre asume estas rutas absolutas para evitar errores de navegación.
