#!/bin/bash

# 实验室资产管理系统 - 版本更新部署脚本
# 服务器: 38.12.6.102
# 部署方式: Docker + Nginx
# 执行方式: bash update-deploy.sh

set -e

echo "==================================="
echo "实验室资产管理系统 - 版本更新"
echo "==================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否在项目根目录
if [ ! -f "CLAUDE.md" ]; then
    echo -e "${RED}错误: 请在项目根目录执行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}步骤 1/7: 备份当前数据库...${NC}"
if [ -d "data" ] && [ -f "data/assets.db" ]; then
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r data "$BACKUP_DIR/"
    echo -e "${GREEN}✓ 数据库已备份到: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}! 未找到数据库文件，跳过备份${NC}"
fi

echo ""
echo -e "${YELLOW}步骤 2/7: 停止旧版本容器...${NC}"
if docker ps -q --filter "name=asset-backend" | grep -q .; then
    docker stop asset-backend || true
    docker rm asset-backend || true
    echo -e "${GREEN}✓ 旧版本后端容器已停止${NC}"
else
    echo -e "${YELLOW}! 未找到运行中的后端容器${NC}"
fi

if docker ps -q --filter "name=asset-frontend" | grep -q .; then
    docker stop asset-frontend || true
    docker rm asset-frontend || true
    echo -e "${GREEN}✓ 旧版本前端容器已停止${NC}"
else
    echo -e "${YELLOW}! 未找到运行中的前端容器${NC}"
fi

echo ""
echo -e "${YELLOW}步骤 3/7: 检查环境变量配置...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}! 未找到 .env 文件，从示例创建...${NC}"
    cp backend/.env.example backend/.env

    # 自动生成强 JWT 密钥
    JWT_SECRET_VALUE=$(openssl rand -base64 32)
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET_VALUE|" backend/.env

    # 设置生产模式
    sed -i "s|^GIN_MODE=.*|GIN_MODE=release|" backend/.env
    sed -i "s|^LOG_LEVEL=.*|LOG_LEVEL=prod|" backend/.env

    echo -e "${GREEN}✓ JWT_SECRET 已自动生成${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}重要: 请立即编辑 backend/.env 配置以下内容:${NC}"
    echo -e "${RED}1. ADMIN_PASSWORD=your-strong-password (必须修改)${NC}"
    echo -e "${RED}2. ALLOWED_ORIGINS=https://your-domain.com (根据实际域名修改)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    read -p "配置完成后按回车继续..."
else
    echo -e "${GREEN}✓ 找到现有 .env 配置${NC}"

    # 确保生产模式已启用
    if ! grep -q "^GIN_MODE=release" backend/.env; then
        echo "GIN_MODE=release" >> backend/.env
        echo -e "${GREEN}✓ 已启用生产模式 (GIN_MODE=release)${NC}"
    fi

    if ! grep -q "^LOG_LEVEL=prod" backend/.env; then
        echo "LOG_LEVEL=prod" >> backend/.env
        echo -e "${GREEN}✓ 已设置生产日志级别 (LOG_LEVEL=prod)${NC}"
    fi
fi

# 检查关键配置
JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env | cut -d'=' -f2)
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}错误: JWT_SECRET 长度不足 32 字符！${NC}"
    echo "自动生成新密钥..."
    NEW_JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_JWT_SECRET|" backend/.env
    echo -e "${GREEN}✓ 已生成新的 JWT_SECRET${NC}"
fi

ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" backend/.env | cut -d'=' -f2)
if [ "$ADMIN_PASSWORD" = "admin123" ]; then
    echo -e "${RED}警告: 仍在使用默认管理员密码 'admin123'${NC}"
    echo -e "${RED}强烈建议修改为强密码！${NC}"
    read -p "是否继续? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}步骤 4/7: 构建新版本后端镜像...${NC}"
cd backend
docker build -t asset-backend:latest .
echo -e "${GREEN}✓ 后端镜像构建完成${NC}"
cd ..

echo ""
echo -e "${YELLOW}步骤 5/7: 构建新版本前端镜像...${NC}"
cd frontend
docker build -t asset-frontend:latest .
echo -e "${GREEN}✓ 前端镜像构建完成${NC}"
cd ..

echo ""
echo -e "${YELLOW}步骤 6/7: 启动新版本容器...${NC}"

# 启动后端
docker run -d \
  --name asset-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  --env-file backend/.env \
  asset-backend:latest

echo -e "${GREEN}✓ 后端容器已启动 (端口 8080)${NC}"

# 等待后端启动
echo "等待后端启动..."
sleep 5

# 健康检查
if curl -s http://localhost:8080/health | grep -q "ok"; then
    echo -e "${GREEN}✓ 后端健康检查通过${NC}"
else
    echo -e "${RED}警告: 后端健康检查失败，请检查日志: docker logs asset-backend${NC}"
fi

# 启动前端
docker run -d \
  --name asset-frontend \
  --restart unless-stopped \
  -p 3000:80 \
  asset-frontend:latest

echo -e "${GREEN}✓ 前端容器已启动 (端口 3000)${NC}"

echo ""
echo -e "${YELLOW}步骤 7/7: 验证部署...${NC}"

# 检查容器状态
if docker ps | grep -q "asset-backend"; then
    echo -e "${GREEN}✓ 后端容器运行正常${NC}"
else
    echo -e "${RED}✗ 后端容器未运行${NC}"
fi

if docker ps | grep -q "asset-frontend"; then
    echo -e "${GREEN}✓ 前端容器运行正常${NC}"
else
    echo -e "${RED}✗ 前端容器未运行${NC}"
fi

echo ""
echo "==================================="
echo -e "${GREEN}部署完成！${NC}"
echo "==================================="
echo ""
echo "访问地址:"
echo "  - 直接访问: http://38.12.6.102:3000"
echo "  - API端点: http://38.12.6.102:8080"
echo ""
echo "Nginx 配置需要更新，请参考: DEPLOY_UPDATE.md"
echo ""
echo "常用命令:"
echo "  查看后端日志: docker logs -f asset-backend"
echo "  查看前端日志: docker logs -f asset-frontend"
echo "  重启后端: docker restart asset-backend"
echo "  重启前端: docker restart asset-frontend"
echo "  停止所有: docker stop asset-backend asset-frontend"
echo ""
echo "默认管理员账号:"
echo "  用户名: admin"
echo "  密码: (在 backend/.env 中配置的 ADMIN_PASSWORD)"
echo ""
echo -e "${YELLOW}重要提醒:${NC}"
echo "  1. 请立即登录并修改管理员密码"
echo "  2. 检查 JWT_SECRET 是否为强随机值"
echo "  3. 确认 CORS 配置允许您的域名"
echo "  4. 建议配置 HTTPS (参考 SECURITY.md)"
