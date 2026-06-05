#!/usr/bin/bash

CONTAINER="transit_server_mysql_db"
PARENT_DIR=$(realpath ..)

ENV_FILE="$PARENT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Check if database exists
DB_EXISTS=$(docker exec "$CONTAINER" mysql \
  -u "$TRANSIT_DB_USER" \
  -p"$TRANSIT_DB_PASSWORD" \
  -se "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$TRANSIT_DB_NAME';")

if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Database does not exist - restore needed"
  exit 1
fi

# Check if database has any tables with data
HAS_DATA=$(docker exec "$CONTAINER" mysql \
  -u "$TRANSIT_DB_USER" \
  -p"$TRANSIT_DB_PASSWORD" \
  -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$TRANSIT_DB_NAME' AND table_rows > 0;")

if [[ "$HAS_DATA" -eq 0 ]]; then
  echo "Database exists but has no data - restore needed"
  exit 1
fi

echo "Database exists and has data - no restore needed"
exit 0