# Guía de Despliegue en Render

## Backend - Configuración en Render

### Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas en Render:

#### Base de Datos
- `DATABASE_URL` - URL de conexión a PostgreSQL

#### Autenticación
- `JWT_SECRET` - Secreto para tokens JWT
- `JWT_REFRESH_SECRET` - Secreto para refresh tokens
- `JWT_EXPIRES_IN` - Tiempo de expiración (default: 24h)
- `JWT_REFRESH_EXPIRES_IN` - Tiempo de expiración refresh (default: 7d)

#### CORS
- `CORS_ORIGIN` - Origen permitido para CORS (ej: https://barber-app-backoffice.onrender.com)

#### Cloudinary (Opcional - para uploads de imágenes/videos)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### Firebase (Para notificaciones push)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` - La clave privada completa (con \n convertidos a saltos de línea)
- `FIREBASE_CLIENT_EMAIL`

#### Socket.IO
- `SOCKET_CORS_ORIGIN` - Origen para Socket.IO (opcional, usa CORS_ORIGIN si no está definido)

### Configuración del Servicio

1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npm start` (ya incluye migraciones automáticas)
3. **Environment**: `Node`
4. **Node Version**: `20.x` o superior

### Migraciones

El script `scripts/migrate-deploy.sh` se ejecuta automáticamente en el `start` command y:
- ✅ Aplica todas las migraciones pendientes
- ✅ Maneja automáticamente casos donde las tablas ya existen
- ✅ Resuelve migraciones fallidas automáticamente

**Migraciones incluidas:**
- `20251110232303` - Migración inicial
- `20251116213641_add_barber_courses` - Cursos de barberos
- `20251117190000_add_fcm_tokens` - Tokens FCM
- `20251117191000_add_campaigns` - Campañas
- `20251118150453_add_legal_documents` - Documentos legales ✨ **NUEVA**

### Verificación Post-Deploy

Después del deploy, verifica:
1. ✅ Las migraciones se aplicaron correctamente (revisa los logs)
2. ✅ El servidor inicia sin errores
3. ✅ La API responde en `/api/health` o similar
4. ✅ Las nuevas rutas funcionan:
   - `/api/app/version` - Versión de APK
   - `/api/legal/privacy` - Política de privacidad
   - `/api/legal/terms` - Términos de servicio

### Troubleshooting

Si las migraciones fallan:
1. Revisa los logs en Render
2. El script intentará resolver automáticamente
3. Si persiste, verifica que `DATABASE_URL` sea correcta
4. Verifica que la base de datos tenga permisos suficientes

---

## Backoffice - Configuración en Render

### Variables de Entorno Requeridas

- `NEXT_PUBLIC_API_URL` - URL del backend (ej: https://barber-app-backend-kj6s.onrender.com)
- `PORT` - Puerto (opcional, default: 3001)

### Configuración del Servicio

1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npm start`
3. **Environment**: `Node`
4. **Node Version**: `20.x` o superior

### Notas Importantes

- El backoffice necesita acceso a la API del backend
- Asegúrate de que `CORS_ORIGIN` en el backend incluya la URL del backoffice
- El backoffice usa cookies para autenticación

---

## Checklist Pre-Deploy

### Backend
- [ ] Todas las variables de entorno configuradas
- [ ] Migraciones en `prisma/migrations/` están commitadas
- [ ] `package.json` tiene el script `start` correcto
- [ ] `scripts/migrate-deploy.sh` tiene permisos de ejecución

### Backoffice
- [ ] `NEXT_PUBLIC_API_URL` apunta al backend correcto
- [ ] Todas las dependencias están en `package.json`
- [ ] Build funciona localmente (`npm run build`)

### General
- [ ] Código commitado y pusheado a GitHub
- [ ] Render está conectado al repositorio correcto
- [ ] Variables de entorno configuradas en Render

---

## Comandos Útiles

### Verificar migraciones localmente
```bash
cd barber-app-backend
npx prisma migrate status
```

### Aplicar migraciones manualmente (si es necesario)
```bash
cd barber-app-backend
npx prisma migrate deploy
```

### Ver logs en Render
- Ve a tu servicio en Render
- Click en "Logs"
- Revisa los logs de build y runtime

