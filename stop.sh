#!/bin/bash

# 实验室资产管理系统 停止脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.pid"

echo "正在停止服务..."

# 从 PID 文件读取并停止
if [ -f "$PID_FILE" ]; then
    while read pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "已停止 PID: $pid"
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# 兜底清理
pkill -f "lab-asset-manager/backend/server" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "所有服务已停止"
