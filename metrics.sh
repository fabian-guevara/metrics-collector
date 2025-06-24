#!/bin/bash

# 🌐 Atlas Service Account Metrics Collector (Full Bash Edition)
# Requiere: jq, curl, mongo, y un archivo .env con las siguientes variables:
# ATLAS_TOKEN_ID, ATLAS_TOKEN_SECRET, PROJECT_ID

# --- CARGAR VARIABLES DE ENTORNO ---
set -a
source .env
set +a

# --- VALIDACIÓN DE VARIABLES NECESARIAS ---
REQUIRED_VARS=(ATLAS_CLIENT_ID ATLAS_CLIENT_SECRET PROJECT_ID )

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ La variable $var no está definida. Verifica tu archivo .env"
    exit 1
  fi
done

# --- AUTENTICACIÓN CON ATLAS ---
echo "🔐 Solicitando token JWT..."
B64_AUTH=$(echo -n "${ATLAS_CLIENT_ID}:${ATLAS_CLIENT_SECRET}" | base64)
JWT=$(curl -s --request POST \
  --url https://cloud.mongodb.com/api/oauth/token \
  --header "accept: application/json" \
  --header "authorization: Basic $B64_AUTH" \
  --header "content-type: application/x-www-form-urlencoded" \
  --data 'grant_type=client_credentials' | jq -r '.access_token')
echo -e "\n🧾 Respuesta completa de la API:"
echo "$response" | jq .

if [ -z "$JWT" ] || [ "$JWT" == "null" ]; then
  echo "❌ Error: no se pudo obtener el token JWT."
  exit 1
fi

# --- OBTENER CLUSTERS ---
echo "📡 Obteniendo clusters del proyecto $PROJECT_ID..."
response=$(curl -s --request GET \
  --url "https://cloud.mongodb.com/api/atlas/v2/groups/$PROJECT_ID/clusters" \
  --header "Authorization: Bearer $JWT" \
  --header "Accept: application/vnd.atlas.2024-08-05+json")

# Guardar JSON completo
echo "$response" > clusters.json


echo -e "\n✅ Proceso completo terminado."
