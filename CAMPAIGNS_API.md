# 📢 API de Campañas - Prueba de Notificaciones Push

Este módulo permite crear campañas y enviar notificaciones push a usuarios para probar la funcionalidad.

## 🚀 Endpoints

### 1. Crear Campaña y Enviar Notificaciones

**POST** `/api/campaigns`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Prueba de Notificación",
  "message": "Este es un mensaje de prueba para verificar que las notificaciones push funcionan correctamente",
  "targetType": "all"
}
```

**Tipos de targetType:**
- `"all"` - Envía a todos los usuarios que tienen tokens FCM
- `"specific_users"` - Envía a usuarios específicos (requiere `targetUserIds`)
- `"barbers_only"` - Envía solo a usuarios que son barberos
- `"clients_only"` - Envía solo a usuarios que son clientes (no barberos)

**Ejemplo con usuarios específicos:**
```json
{
  "title": "Oferta Especial",
  "message": "Tienes un descuento del 20% este fin de semana",
  "targetType": "specific_users",
  "targetUserIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Campaign created and notifications sent successfully",
  "data": {
    "id": "campaign_id",
    "title": "Prueba de Notificación",
    "message": "Este es un mensaje de prueba...",
    "targetType": "all",
    "targetUserIds": null,
    "sentAt": "2024-11-17T19:00:00.000Z",
    "sentCount": 15,
    "createdBy": "user_id",
    "createdAt": "2024-11-17T19:00:00.000Z",
    "updatedAt": "2024-11-17T19:00:00.000Z"
  }
}
```

### 2. Obtener Todas las Campañas

**GET** `/api/campaigns`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "campaign_id_1",
      "title": "Prueba de Notificación",
      "message": "...",
      "targetType": "all",
      "sentCount": 15,
      "sentAt": "2024-11-17T19:00:00.000Z",
      "createdAt": "2024-11-17T19:00:00.000Z"
    }
  ]
}
```

### 3. Obtener Campaña por ID

**GET** `/api/campaigns/:id`

**Headers:**
```
Authorization: Bearer <token>
```

## 🧪 Ejemplos de Prueba

### Prueba 1: Enviar a todos
```bash
curl -X POST https://tu-api.com/api/campaigns \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Prueba General",
    "message": "Notificación de prueba para todos los usuarios",
    "targetType": "all"
  }'
```

### Prueba 2: Enviar solo a barberos
```bash
curl -X POST https://tu-api.com/api/campaigns \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nueva Funcionalidad",
    "message": "Hemos agregado nuevas funciones para barberos",
    "targetType": "barbers_only"
  }'
```

### Prueba 3: Enviar a usuarios específicos
```bash
curl -X POST https://tu-api.com/api/campaigns \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Oferta Personalizada",
    "message": "Tienes una oferta especial",
    "targetType": "specific_users",
    "targetUserIds": ["user_id_1", "user_id_2"]
  }'
```

## 📱 Qué Esperar en el Dispositivo

Cuando se crea una campaña:
1. Se envía una notificación push a todos los usuarios objetivo que tienen tokens FCM registrados
2. La notificación aparecerá en el dispositivo con:
   - **Título**: El `title` de la campaña
   - **Mensaje**: El `message` de la campaña
   - **Datos adicionales**: `{ type: "campaign", campaignId: "..." }`

## 📊 Campos de la Campaña

- `id` - ID único de la campaña
- `title` - Título de la notificación (máx 100 caracteres)
- `message` - Mensaje de la notificación (máx 500 caracteres)
- `targetType` - Tipo de audiencia
- `targetUserIds` - Array de IDs de usuarios (solo si `targetType` es `specific_users`)
- `sentAt` - Fecha/hora en que se enviaron las notificaciones
- `sentCount` - Cantidad de notificaciones enviadas exitosamente
- `createdBy` - ID del usuario que creó la campaña
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de última actualización

## ⚠️ Notas

- Solo se envían notificaciones a usuarios que tienen tokens FCM registrados
- Si un usuario no tiene token FCM, no recibirá la notificación (pero la campaña se creará igual)
- El `sentCount` indica cuántos usuarios recibieron la notificación
- Si hay un error al enviar, la campaña se crea pero `sentCount` será 0

## 🔄 Próximos Pasos

Una vez probado que funciona, podemos:
- Agregar programación de campañas (enviar en fecha/hora específica)
- Agregar imágenes a las notificaciones
- Agregar acciones/buttons en las notificaciones
- Agregar estadísticas más detalladas
- Agregar plantillas de campañas
- Agregar segmentación más avanzada

