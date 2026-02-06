# Configuración de Twilio para verificación de teléfono

La verificación por SMS usa **Twilio Verify**. Añade estas variables a tu archivo `.env` del backend:

```env
# Twilio (verificación por SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Dónde obtener los valores

1. **Account SID y Auth Token:** [Twilio Console](https://console.twilio.com) → Dashboard (aparecen en la página principal).
2. **Verify Service SID:** Console → **Verify** → **Services** → crea un servicio (ej. "Barber App") y copia el **SID** (empieza por `VA...`).

Sin estas variables, los endpoints `POST /api/auth/send-phone-code` y `POST /api/auth/confirm-phone` responderán con error indicando que la verificación no está configurada.

### Cooldown entre envíos (opcional)

Para evitar envíos seguidos al mismo número, se usa un tiempo de espera entre un código y el siguiente:

```env
# Segundos de espera antes de poder solicitar otro código al mismo número (por defecto: 60)
PHONE_CODE_COOLDOWN_SECONDS=60
```

Si no lo defines, el valor por defecto es 60 segundos.
