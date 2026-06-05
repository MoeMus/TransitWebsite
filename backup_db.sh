#!/bin/bash
set -euo pipefail

CONTAINER="transit_server_mysql_db"
BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/transit_db_$TIMESTAMP.sql"

# Load .env variables
ENV_FILE="$(dirname "$0")/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Verify the container is running
if ! docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "ERROR: Container '$CONTAINER' is not running. Start the Docker containers first."
  exit 1
fi

# Attempt to connect to MySQL database
if ! docker exec "$CONTAINER" mysqladmin ping -u "$TRANSIT_DB_USER" -p"$TRANSIT_DB_PASSWORD" --silent 2>/dev/null; then
  echo "ERROR: Cannot connect to MySQL inside container '$CONTAINER'."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Backing up database '$TRANSIT_DB_NAME' to $BACKUP_FILE ..."
docker exec "$CONTAINER" mysqldump \
  -u "$TRANSIT_DB_USER" \
  -p"$TRANSIT_DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  "$TRANSIT_DB_NAME" > "$BACKUP_FILE"

echo "Backup complete: $BACKUP_FILE"
