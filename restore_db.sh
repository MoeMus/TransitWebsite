#!/usr/bin/bash

CONTAINER="transit_server_mysql_db"
BACKUP_DIR="$(dirname "$0")/backups"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/transit_db_*.sql 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "No backup files found"
    exit 1
fi

# Verify the container is running
if ! docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "ERROR: Container '$CONTAINER' is not running. Start the Docker containers first."
  exit 1
fi

ENV_FILE="$(dirname "$0")/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if ! docker exec -i "$CONTAINER" mysql \
  -u "$TRANSIT_DB_USER" \
  -p"$TRANSIT_DB_PASSWORD" \
  "$TRANSIT_DB_NAME" < "$LATEST_BACKUP"; then
    echo "ERROR: Restore failed"
    exit 1
fi

echo "Database restore complete from $LATEST_BACKUP"
exit 0