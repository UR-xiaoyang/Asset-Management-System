#!/bin/bash

# 实验室资产管理系统 一键启动脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_FILE="$SCRIPT_DIR/.pid"
LOG_FILE="$SCRIPT_DIR/server.log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   实验室资产管理系统 一键启动${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查依赖
if ! command -v go &> /dev/null; then
    echo -e "${RED}错误: 未找到Go环境，请先安装Go${NC}"
    exit 1
fi
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js环境，请先安装Node.js${NC}"
    exit 1
fi

# 清理旧进程
if [ -f "$PID_FILE" ]; then
    echo "清理旧进程..."
    while read pid; do
        kill "$pid" 2>/dev/null
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# 清理占用端口的进程
echo "清理占用端口的进程..."
for port in 8080 3000; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "  杀死占用端口 $port 的进程 (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done

# 启动后端
echo -e "\n${YELLOW}[1/2] 启动后端服务...${NC}"
cd "$BACKEND_DIR"

if [ ! -f "./server" ]; then
    echo "  编译后端..."
    go build -o server ./cmd/server/ 2>&1
fi

./server > "$SCRIPT_DIR/server.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"
echo -e "  后端服务已启动 (PID: $BACKEND_PID)"
sleep 2

# 检查后端
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "  ${RED}✗ 后端服务启动失败，请检查日志: $SCRIPT_DIR/server.log${NC}"
    cat "$SCRIPT_DIR/server.log" | tail -5
    exit 1
fi
echo -e "  ${GREEN}✓ 后端服务运行正常 (http://localhost:8080)${NC}"

# 启动前端
echo -e "\n${YELLOW}[2/2] 启动前端服务...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"
echo -e "  前端服务已启动 (PID: $FRONTEND_PID)"
sleep 3

# 检查前端
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "  ${RED}✗ 前端服务启动失败，请检查日志: $SCRIPT_DIR/frontend.log${NC}"
    cat "$SCRIPT_DIR/frontend.log" | tail -5
    exit 1
fi
echo -e "  ${GREEN}✓ 前端服务运行正常 (http://localhost:3000)${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   启动完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  后台管理: ${YELLOW}http://localhost:3000${NC}"
echo -e "  API服务:  ${YELLOW}http://localhost:8080${NC}"
echo -e "  默认账号: ${YELLOW}admin / admin123${NC}"
echo -e "\n停止服务请运行: ${YELLOW}./stop.sh${NC}"
echo ""
echo "按 Ctrl+C 可以停止所有服务"
echo ""

# 等待任意信号（Ctrl+C 或进程结束）
wait
