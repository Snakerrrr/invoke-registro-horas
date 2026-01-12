#!/bin/bash

# Script para verificar que la migración se completó correctamente
# Uso: ./verify-migration.sh

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

OLD_URL="https://backend-invoke.azurewebsites.net"
FRONTEND_DIR="$(dirname "$0")/../frontend/registro-horas"
BACKEND_DIR="$(dirname "$0")/../backend"

echo -e "${BLUE}🔍 Verificando migración...${NC}"
echo ""

# Verificar frontend
echo -e "${BLUE}📱 Verificando Frontend...${NC}"
cd "$FRONTEND_DIR"

# 1. Verificar referencias a Azure
echo -e "1. Buscando referencias a Azure..."
AZURE_REFS=$(grep -r "$OLD_URL" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$AZURE_REFS" -eq 0 ]; then
    echo -e "   ${GREEN}✅ No se encontraron referencias a Azure${NC}"
else
    echo -e "   ${RED}❌ Se encontraron $AZURE_REFS referencias a Azure${NC}"
    grep -r "$OLD_URL" --include="*.ts" --include="*.tsx" || true
fi

# 2. Verificar .env.local
echo ""
echo -e "2. Verificando archivo .env.local..."
if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✅ .env.local existe${NC}"
    if grep -q "NEXT_PUBLIC_BACKEND_URL" .env.local; then
        echo -e "   ${GREEN}✅ NEXT_PUBLIC_BACKEND_URL está configurada${NC}"
        echo -e "   ${YELLOW}   Valor: $(grep NEXT_PUBLIC_BACKEND_URL .env.local | cut -d '=' -f2)${NC}"
    else
        echo -e "   ${RED}❌ NEXT_PUBLIC_BACKEND_URL no está configurada${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  .env.local no existe (puede ser normal si usas variables de entorno del sistema)${NC}"
fi

# 3. Verificar uso de variables de entorno
echo ""
echo -e "3. Verificando uso de variables de entorno..."
ENV_USAGE=$(grep -r "process.env.NEXT_PUBLIC_BACKEND_URL" --include="*.ts" --include="*.tsx" | wc -l)
echo -e "   ${GREEN}✅ Se encontraron $ENV_USAGE usos de process.env.NEXT_PUBLIC_BACKEND_URL${NC}"

# Verificar backend
echo ""
echo -e "${BLUE}🔧 Verificando Backend...${NC}"
cd "$BACKEND_DIR"

# 4. Verificar .env
echo -e "4. Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "   ${GREEN}✅ .env existe${NC}"
    if grep -q "DATABASE_URL" .env; then
        echo -e "   ${GREEN}✅ DATABASE_URL está configurada${NC}"
        DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
        if [[ "$DB_URL" == *"supabase"* ]]; then
            echo -e "   ${GREEN}✅ DATABASE_URL apunta a Supabase${NC}"
        else
            echo -e "   ${YELLOW}⚠️  DATABASE_URL no parece ser de Supabase${NC}"
        fi
    else
        echo -e "   ${RED}❌ DATABASE_URL no está configurada${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  .env no existe (puede ser normal si usas variables de entorno del sistema)${NC}"
fi

# 5. Verificar CORS en server.js
echo ""
echo -e "5. Verificando configuración CORS..."
if [ -f "server.js" ]; then
    if grep -q "cors" server.js; then
        echo -e "   ${GREEN}✅ Configuración CORS encontrada${NC}"
        echo -e "   ${YELLOW}   Orígenes configurados:${NC}"
        grep -A 5 "cors({" server.js | grep -E "(origin|'|`)" || true
    else
        echo -e "   ${YELLOW}⚠️  No se encontró configuración CORS explícita${NC}"
    fi
else
    echo -e "   ${RED}❌ server.js no encontrado${NC}"
fi

# Resumen
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$AZURE_REFS" -eq 0 ] && [ "$ENV_USAGE" -gt 0 ]; then
    echo -e "${GREEN}✅ Migración del frontend: COMPLETA${NC}"
else
    echo -e "${RED}❌ Migración del frontend: INCOMPLETA${NC}"
fi

if [ -f "$BACKEND_DIR/.env" ] && grep -q "DATABASE_URL" "$BACKEND_DIR/.env" 2>/dev/null; then
    echo -e "${GREEN}✅ Configuración del backend: COMPLETA${NC}"
else
    echo -e "${YELLOW}⚠️  Configuración del backend: VERIFICAR MANUALMENTE${NC}"
fi

echo ""
echo -e "${BLUE}✨ Verificación completada${NC}"
