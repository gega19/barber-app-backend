# Solución de Problemas de Base de Datos en Railway

## Problema: "Can't reach database server at `postgres.railway.internal:5432`"

Este error indica que el servicio del backend no puede conectarse a la base de datos PostgreSQL en Railway.

## Pasos para Resolver

### 1. Verificar que la Base de Datos esté Corriendo

1. Ve a tu proyecto en Railway: https://railway.app
2. En el dashboard del proyecto, busca el servicio de **PostgreSQL**
3. Verifica que el estado sea **"Active"** o **"Running"**
4. Si está pausado o detenido:
   - Haz clic en el servicio de PostgreSQL
   - Haz clic en el botón **"Start"** o **"Resume"**

### 2. Verificar la Variable DATABASE_URL

1. Ve al servicio del **backend** (no la base de datos)
2. Haz clic en la pestaña **"Variables"**
3. Busca la variable `DATABASE_URL`
4. Verifica que:
   - ✅ La variable existe
   - ✅ Tiene un valor (no está vacía)
   - ✅ El formato es correcto: `postgresql://user:password@host:port/database`

### 3. Vincular la Base de Datos al Backend

Si la variable `DATABASE_URL` no existe o está vacía:

1. En el servicio del **backend**, ve a la pestaña **"Variables"**
2. Haz clic en **"New Variable"** o **"Add Reference"**
3. Si ves la opción **"Add Reference"**:
   - Haz clic en **"Add Reference"**
   - Selecciona tu servicio de **PostgreSQL**
   - Railway creará automáticamente la variable `DATABASE_URL`
4. Si no ves esa opción, crea la variable manualmente:
   - **Name**: `DATABASE_URL`
   - **Value**: Copia la **Connection URL** del servicio de PostgreSQL
     - Ve al servicio de PostgreSQL
     - En la pestaña **"Connect"** o **"Data"**, copia la **Connection URL**
     - Pégala como valor de `DATABASE_URL`

### 4. Obtener la Connection URL Correcta

1. Ve al servicio de **PostgreSQL** en Railway
2. Haz clic en la pestaña **"Connect"** o **"Data"**
3. Busca la sección **"Connection URL"** o **"Postgres Connection URL"**
4. Copia la URL completa (debe verse algo como):
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```
   O si es interna:
   ```
   postgresql://postgres:password@postgres.railway.internal:5432/railway
   ```

### 5. Verificar que Ambos Servicios Estén en el Mismo Proyecto

1. Asegúrate de que tanto el servicio del **backend** como el de **PostgreSQL** estén en el **mismo proyecto** de Railway
2. Si están en proyectos diferentes, necesitas:
   - Mover uno de los servicios al proyecto del otro, O
   - Usar la URL pública de la base de datos (no la interna)

### 6. Usar la URL Pública (Si la Interna No Funciona)

Si después de verificar todo lo anterior aún no funciona:

1. Ve al servicio de **PostgreSQL**
2. En la pestaña **"Connect"**, busca la **"Public Network"** o **"Public URL"**
3. Copia esa URL (será algo como: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`)
4. Ve al servicio del **backend** → **"Variables"**
5. Actualiza `DATABASE_URL` con la URL pública

### 7. Reiniciar el Servicio del Backend

Después de hacer los cambios:

1. Ve al servicio del **backend**
2. Haz clic en **"Deploy"** → **"Redeploy"** o simplemente espera a que Railway detecte los cambios
3. Revisa los logs para verificar que la conexión funcione

## Verificación

Después de aplicar los cambios, los logs deberían mostrar:

```
✅ Database connected successfully
✅ Migrations applied successfully!
```

En lugar de:

```
⚠️  Database connection failed
```

## Notas Importantes

- La URL interna (`postgres.railway.internal`) solo funciona si ambos servicios están en el mismo proyecto y la red privada está habilitada
- La URL pública funciona desde cualquier lugar, pero puede tener restricciones de seguridad
- Railway debería crear automáticamente `DATABASE_URL` cuando vinculas servicios, pero a veces necesitas hacerlo manualmente
