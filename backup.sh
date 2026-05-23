#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

get_env() {
    local key="$1"
    local fallback="${2:-}"
    local line name value

    if [ -f .env ]; then
        while IFS= read -r line || [ -n "$line" ]; do
            line="${line%%#*}"
            [ -z "$line" ] && continue
            name="${line%%=*}"
            value="${line#*=}"
            name="${name//[[:space:]]/}"
            if [ "$name" = "$key" ]; then
                value="${value%\"}"
                value="${value#\"}"
                value="${value%\'}"
                value="${value#\'}"
                printf '%s\n' "$value"
                return
            fi
        done < .env
    fi

    printf '%s\n' "$fallback"
}

DB_TYPE="$(get_env DB_TYPE sqlite)"

case "$DB_TYPE" in
    sqlite)
        DB_FILE="$SCRIPT_DIR/data/lab_asset.db"
        BACKUP_FILE="$BACKUP_DIR/lab_asset_$TIMESTAMP.db"

        if [ ! -f "$DB_FILE" ]; then
            echo "错误: 未找到数据库文件: $DB_FILE"
            exit 1
        fi

        if command -v sqlite3 >/dev/null 2>&1; then
            sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
        else
            cp "$DB_FILE" "$BACKUP_FILE"
            echo "提示: 未安装 sqlite3，已直接复制数据库文件。建议在服务低峰期备份。"
        fi
        gzip -f "$BACKUP_FILE"
        echo "备份完成: $BACKUP_FILE.gz"
        ;;
    mysql)
        MYSQL_DATABASE="$(get_env MYSQL_DATABASE lab_asset)"
        MYSQL_USER="$(get_env MYSQL_USER lab_asset)"
        MYSQL_PASSWORD="$(get_env MYSQL_PASSWORD lab_asset_pass)"
        BACKUP_FILE="$BACKUP_DIR/lab_asset_mysql_$TIMESTAMP.sql.gz"

        docker exec -e MYSQL_PWD="$MYSQL_PASSWORD" lab-asset-mysql mysqldump -u "$MYSQL_USER" "$MYSQL_DATABASE" | gzip > "$BACKUP_FILE"
        echo "备份完成: $BACKUP_FILE"
        ;;
    postgres|postgresql)
        POSTGRES_DB="$(get_env POSTGRES_DB lab_asset)"
        POSTGRES_USER="$(get_env POSTGRES_USER lab_asset)"
        BACKUP_FILE="$BACKUP_DIR/lab_asset_postgres_$TIMESTAMP.sql.gz"

        docker exec lab-asset-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
        echo "备份完成: $BACKUP_FILE"
        ;;
    *)
        echo "错误: 不支持的 DB_TYPE: $DB_TYPE"
        exit 1
        ;;
esac
