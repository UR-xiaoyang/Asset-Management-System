#!/bin/bash

# 实验室资产管理系统 状态检查脚本

echo "========================================"
echo "   实验室资产管理系统 - 服务状态"
echo "========================================"

# 检查后端
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✓ 后端服务: 运行中 (http://localhost:8080)"
    echo "  - 健康检查: OK"
else
    echo "✗ 后端服务: 未运行"
fi

# 检查前端
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ 前端服务: 运行中 (http://localhost:3000)"
else
    echo "✗ 前端服务: 未运行"
fi

echo "========================================"