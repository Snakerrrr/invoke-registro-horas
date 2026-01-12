#!/bin/bash

# Script para migrar URLs hardcodeadas de Azure a variables de entorno
# Uso: ./migrate-urls.sh [nueva-url-backend]

set -e

# Color codes para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Nueva URL del backend (puede pasarse como argumento)
NEW_BACKEND_URL="${1:-https://tu-nueva-url-backend.com}"
OLD_URL="https://backend-invoke.azurewebsites.net"

# Directorio base del frontend
FRONTEND_DIR="$(dirname "$0")/../frontend/registro-horas"

echo -e "${GREEN}🚀 Iniciando migración de URLs...${NC}"
echo -e "${YELLOW}URL antigua: ${OLD_URL}${NC}"
echo -e "${YELLOW}URL nueva: ${NEW_BACKEND_URL}${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio del frontend${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

cd "$FRONTEND_DIR"

# Buscar todas las ocurrencias
echo -e "${GREEN}📋 Buscando ocurrencias de la URL antigua...${NC}"
OCCURRENCES=$(grep -r "$OLD_URL" --include="*.ts" --include="*.tsx" | wc -l)
echo -e "Se encontraron ${YELLOW}$OCCURRENCES${NC} ocurrencias"

if [ $OCCURRENCES -eq 0 ]; then
    echo -e "${GREEN}✅ No se encontraron ocurrencias. La migración ya está completa.${NC}"
    exit 0
fi

# Mostrar archivos afectados
echo ""
echo -e "${GREEN}📁 Archivos afectados:${NC}"
grep -r "$OLD_URL" --include="*.ts" --include="*.tsx" -l

echo ""
read -p "¿Deseas continuar con el reemplazo? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

# Realizar reemplazo
echo -e "${GREEN}🔄 Realizando reemplazo...${NC}"

# Reemplazar en todos los archivos TypeScript/TSX
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak "s|$OLD_URL|$NEW_BACKEND_URL|g" {} +

# Eliminar archivos de backup
find . -type f -name "*.bak" -delete

# Verificar que el reemplazo fue exitoso
REMAINING=$(grep -r "$OLD_URL" --include="*.ts" --include="*.tsx" | wc -l)

if [ $REMAINING -eq 0 ]; then
    echo -e "${GREEN}✅ Migración completada exitosamente${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "1. Revisa manualmente los archivos modificados"
    echo "2. Asegúrate de usar variables de entorno donde sea apropiado"
    echo "3. Verifica que el código compile correctamente"
    echo "4. Prueba la aplicación localmente antes de desplegar"
else
    echo -e "${RED}❌ Advertencia: Aún quedan $REMAINING ocurrencias sin reemplazar${NC}"
    echo "Revisa manualmente los siguientes archivos:"
    grep -r "$OLD_URL" --include="*.ts" --include="*.tsx" -l
fi

echo ""
echo -e "${GREEN}✨ Proceso completado${NC}"
