#!/bin/bash

# Script para aplicar migraciones en producción con manejo de baseline

echo "🔄 Applying database migrations..."

# Intentar aplicar migraciones y capturar output
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATE_EXIT_CODE=$?

# Si tiene éxito, salir
if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
  echo "$MIGRATE_OUTPUT"
  echo "✅ Migrations applied successfully!"
  exit 0
fi

# Si falla, verificar si es error P3005 (database not empty)
if echo "$MIGRATE_OUTPUT" | grep -q "P3005\|not empty"; then
  echo "⚠️  Database is not empty. Attempting to baseline existing migrations..."
  
  # Obtener lista de migraciones del directorio
  MIGRATIONS_DIR="prisma/migrations"
  
  if [ -d "$MIGRATIONS_DIR" ]; then
    # Obtener todas las migraciones y ordenarlas
    MIGRATIONS=($(ls -1 "$MIGRATIONS_DIR" | grep -E '^[0-9]' | sort))
    
    # Marcar todas excepto la última como aplicadas (la última es la nueva)
    if [ ${#MIGRATIONS[@]} -gt 1 ]; then
      for i in $(seq 0 $((${#MIGRATIONS[@]} - 2))); do
        migration_name="${MIGRATIONS[$i]}"
        echo "📝 Marking migration $migration_name as applied..."
        npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || echo "   (Migration $migration_name may already be marked)"
      done
    fi
    
    # Intentar aplicar migraciones nuevamente (solo las nuevas)
    echo "🔄 Retrying migration deployment for new migrations..."
    if npx prisma migrate deploy; then
      echo "✅ Migrations applied successfully!"
      exit 0
    fi
  fi
fi

# Si aún falla, mostrar el error
echo "❌ Migration failed:"
echo "$MIGRATE_OUTPUT"
exit 1

