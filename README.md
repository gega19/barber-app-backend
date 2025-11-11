# Barber App Backend

Backend del proyecto Barber App usando Node.js, TypeScript, Express y Prisma.

## 🏗️ Arquitectura

El proyecto sigue **Clean Architecture** y está organizado en las siguientes capas:

```
src/
├── config/       # Configuración (app, env, prisma)
├── controllers/  # Controladores de las rutas
├── middleware/   # Middleware (auth, error handling)
├── models/       # Modelos de dominio (si se necesitan)
├── routes/       # Definición de rutas
├── services/     # Lógica de negocio
├── types/        # TypeScript types
├── utils/        # Utilidades (jwt, hash, etc)
└── validators/   # Validadores con class-validator
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Generar Prisma Client y crear la base de datos:
```bash
npm run prisma:generate
npm run prisma:migrate
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm run build` - Compila TypeScript a JavaScript
- `npm run start` - Ejecuta el servidor compilado
- `npm run prisma:generate` - Genera el Prisma Client
- `npm run prisma:migrate` - Ejecuta migraciones de base de datos
- `npm run prisma:studio` - Abre Prisma Studio para ver/editar la BD

## 🔧 Configuración

Las variables de entorno se configuran en el archivo `.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (SQLite para desarrollo)
DATABASE_URL=file:./dev.db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
```

## 🗄️ Base de Datos

El proyecto usa **SQLite** con **Prisma ORM** para desarrollo.

**Nota**: SQLite es perfecto para desarrollo local. Para producción, se recomienda usar PostgreSQL o MySQL.

### Modelos Principales

- **User**: Usuarios del sistema (clientes, barberos, admin)
- **Barber**: Información de los barberos
- **Appointment**: Citas/Reservas
- **RefreshToken**: Tokens de refresh para JWT

### Migraciones

Para crear una nueva migración después de modificar el schema:

```bash
npm run prisma:migrate -- --name nombre_migracion
```

Para ver la base de datos visualmente:

```bash
npm run prisma:studio
```

## 🔐 Autenticación

El módulo de auth incluye:

- `/api/auth/register` - Registro de usuarios
- `/api/auth/login` - Inicio de sesión
- `/api/auth/logout` - Cerrar sesión
- `/api/auth/refresh-token` - Renovar token
- `/api/auth/me` - Obtener usuario actual

### Usuario de Prueba

Ya existe un usuario de prueba en la base de datos:
- Email: `test@test.com`
- Password: `Test123`

## 🛠️ Tecnologías

- **Node.js** - Runtime
- **TypeScript** - Lenguaje
- **Express** - Framework web
- **Prisma** - ORM
- **SQLite** - Base de datos (desarrollo)
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **class-validator** - Validación
- **Helmet** - Seguridad
- **CORS** - CORS
- **Morgan** - Logging HTTP
- **Compression** - Compresión de respuestas

## 🔧 Solución de Problemas

### El servidor no inicia

- Verifica que las variables de entorno en `.env` estén correctas
- Asegúrate de que el Prisma Client esté generado: `npm run prisma:generate`
- Verifica que exista el archivo `dev.db` en la carpeta backend

### Error de base de datos

Si hay problemas con la base de datos:

```bash
# Eliminar la base de datos y recrearla
rm dev.db
npm run prisma:migrate
```

## 📝 Notas

⚠️ **IMPORTANTE**: Este proyecto está en desarrollo. La configuración de producción requerirá:

- Variables de entorno seguras
- HTTPS
- Rate limiting
- Validación de inputs más estricta
- Logging robusto
- Monitoreo y alertas
- Base de datos de producción (PostgreSQL/MySQL)

## 🎯 Estado del Proyecto

✅ Backend completamente funcional con:
- Clean Architecture
- Autenticación JWT completa
- Validaciones con class-validator
- Manejo de errores robusto
- SQLite con Prisma ORM para desarrollo
- TypeScript estricto
- Base de datos lista para usar
