# 🚀 Guía de Despliegue en Render

## 📋 Preparación para Render

### 1. Variables de Entorno en Render

Asegúrate de tener estas variables configuradas en el dashboard de Render:

#### Variables Existentes (ya configuradas):

- `DATABASE_URL` - URL de PostgreSQL
- `JWT_SECRET` - Secret para JWT
- `JWT_REFRESH_SECRET` - Secret para refresh tokens
- `NODE_ENV=production`
- `PORT` - Render lo asigna automáticamente
- Variables de Cloudinary (si las usas)

#### Variables NUEVAS para Notificaciones Push:

```
FIREBASE_PROJECT_ID=bartop-a29a5
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCuNj+3ysqG0Y7S\nMqkLOcICCy5HAnHmVERkvyLycXOkX4EnsIhvs9keYoPSWkPNTmgRoJVD3o+riwOX\n6s4HMxO3n1v8mTO2Ryzm0SzLA+Dl4XR8B/0F41Q8vqW7BDqqeGZ3V3yRMIQCYloL\nJwNbaCeCFnCoIwojcuGfHdhNG0P2e6hWkxv8SKRce+SRpoFUOIpZ9hT/KxOw4c8o\nUo7V9oK6gJwLSakJm0F7ZitAYnyd1a/wiC++nTk/GJJFAZpmQtKG4wi1ArkhPAYb\nVpn4u/+06rOeEqgOVR+ItObGOUuepck8P7EGJCRzySx7CefteV8hqHviBvYK3kzx\n2yIp9p6/AgMBAAECggEAFmtDyuate9O8UfTpXS5LIbvc8jrF0Ugh3xHb26BZq0W2\nbMGij+Fwp6Dc6Z/qdCF1cg3yIjWiKTIZaHOenOg9TtboCGXndOXMSPiSj55e/aZZ\nuQZxe3r+9wGVJAU4ztbyChn3nVrwJLsRxGKlDh56tcUmgp9eaXkaFkHJzq5wvLzZ\nt2BPdVfVwJqHqSr6RWqnmnfheBIrhwfrDSGKdPFa1/3aIj6rcW++gv6m/3aEjsZP\nBFBaH1hDEP0yOCzszHQeYT9sZwrKN4WAy8hExPHf8AE9NRocGsGhZMZ78wkYgnWs\nnueXsJLy6tP0dMCxRnF8gaC3ATQYGD0SM0n4Li/tVQKBgQDcS0zvxDJH4I6S19fA\ntSX0HU0pH6J5BaaQ0r37D8Nn+nhztJ85gfHdoaUiQdbDPEUNoNaaKUnokkSHj0ls\nA+sy+/mRXZHsZzRzTucCK5at62oMMQ8F2D3af5ssZqikpDtds0Pu7ViDfjf2pl5R\nSXQdbbyUC90NwxERER/h00EEtQKBgQDKctndY+y5D3V0ItfcRuq7Rm8uE5n/way7\n/jbCvMAGJ5LD1rrbQ08eeC0lXJOlWUhL/G6IzvYBOefH3ovR2ABueXgw3FwV3Xnu\nrm8kIuLeQOtwEKmwTLFAKA9mnwN1pr/nh0wgolmlGrGnsny7MqkwjKRRIHEbzmlK\nVew+Ve1SIwKBgQDHrqXdjBz7lCwIJQhXkJwHi+veQ+OVCa8zBSPaCC7a+Gnoj6fo\ni8Y+XIB/7egK7n21Xb5I3PY2jyb5LcOi2mZ+v3I39vYHsIEVqEaza+lYWtS0ml+A\nr8NZZGO2upNRMeDyDUWdtJyQDIAT3jgOPKO47TiLhblo+RFmQ/x/SWtdJQKBgQDF\nVH2Xlja/i5nowa22QEm8kUL9no2VBarg80FdP63MUfZ0fXFVF56fDHS03i/sE8Ks\njjkPkOuo9lA+OWX//JMvG6dTuPbpOSAIzm32wypviMf0S8ma1qZO6r1YQdaVbxvP\nCcniZV0L2aEg3JFHxnGzqOLhUMXvXJq0olvLxuW0EQKBgFFx0q0UqMwpn/r0dKCM\n+MUVChmsA8p0U8d/TnqKQFP/pBeeiLtVj87hdhJFQE47l43UP7BZbGmFQhID33lE\n4i3XGOVsbCaxmrtwicTLchf8ns9M9+XnFCXBJ4Y06QfALPnMvS2BuSpG9DDwLX2g\nkJXtZfaQKcudh5nLUxDRfhRy\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bartop-a29a5.iam.gserviceaccount.com
```

**⚠️ IMPORTANTE:**

- Copia el `FIREBASE_PRIVATE_KEY` completo incluyendo las comillas dobles
- Los `\n` deben mantenerse como están (no convertirlos a saltos de línea reales)

### 2. Migración de Base de Datos

La migración `20251117190000_add_fcm_tokens` ya está creada y lista. El script `migrate-deploy.sh` la aplicará automáticamente cuando Render despliegue.

**La migración usa `CREATE TABLE IF NOT EXISTS`** para evitar errores si la tabla ya existe.

### 3. Proceso de Despliegue

1. **Commit y Push:**

   ```bash
   git add .
   git commit -m "feat: Add FCM tokens and push notifications system"
   git push origin main
   ```

2. **Render detectará el push automáticamente** y:
   - Instalará dependencias (`npm install`)
   - Generará Prisma Client (`postinstall` script)
   - Ejecutará el script de migración (`migrate-deploy.sh`)
   - Iniciará el servidor

### 4. Verificación Post-Despliegue

Después del despliegue, verifica en los logs de Render:

✅ Deberías ver:

```
✅ Firebase Admin SDK initialized successfully
✅ Database connected successfully
🚀 Barber App Backend Server Running
```

❌ Si ves errores:

- `Firebase Admin credentials not configured` → Verifica las variables de entorno
- `Migration failed` → Revisa los logs del script de migración

### 5. Probar los Endpoints

Una vez desplegado, puedes probar:

```bash
# Registrar un token (requiere autenticación)
POST https://tu-app.onrender.com/api/fcm-tokens
{
  "token": "fcm_token_here",
  "deviceType": "android"
}
```

## 🔧 Solución de Problemas

### Si la migración falla en Render:

El script `migrate-deploy.sh` tiene manejo de errores, pero si aún falla:

1. **Opción 1: Marcar migración como aplicada manualmente**

   - Conecta a la base de datos de Render
   - Ejecuta: `npx prisma migrate resolve --applied 20251117190000_add_fcm_tokens`

2. **Opción 2: Crear la tabla manualmente**
   - Si la tabla no existe, créala manualmente en la base de datos:
   ```sql
   CREATE TABLE IF NOT EXISTS "fcm_tokens" (
       "id" TEXT NOT NULL,
       "token" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "deviceType" TEXT NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,
       CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id")
   );
   CREATE UNIQUE INDEX IF NOT EXISTS "fcm_tokens_token_key" ON "fcm_tokens"("token");
   CREATE INDEX IF NOT EXISTS "fcm_tokens_userId_idx" ON "fcm_tokens"("userId");
   ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_userId_fkey"
       FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
   ```
   - Luego marca la migración como aplicada

## 📝 Checklist Pre-Despliegue

- [ ] Variables de Firebase agregadas en Render
- [ ] Migración `20251117190000_add_fcm_tokens` en el repositorio
- [ ] `firebase-admin` en `package.json`
- [ ] Código commiteado y pusheado
- [ ] Build exitoso en Render
- [ ] Logs muestran Firebase inicializado correctamente

## ✅ Listo para Desplegar

Una vez que completes el checklist, simplemente haz push y Render se encargará del resto.
