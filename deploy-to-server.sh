#!/bin/bash

# 实验室资产管理系统 - 一键部署到服务器
# 目标服务器: 38.12.6.102
# 执行方式: bash deploy-to-server.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SERVER_IP="38.12.6.102"
SERVER_USER="${1:-root}"  # 默认使用 root，可通过第一个参数指定
REMOTE_DIR="${2:-/opt/asset-management}"  # 默认部署目录，可通过第二个参数指定
PROJECT_DIR=$(pwd)

echo "==================================="
echo -e "${BLUE}实验室资产管理系统 - 远程部署${NC}"
echo "==================================="
echo ""
echo "目标服务器: $SERVER_IP"
echo "SSH 用户: $SERVER_USER"
echo "部署目录: $REMOTE_DIR"
echo ""

# 检查是否在项目根目录
if [ ! -f "CLAUDE.md" ]; then
    echo -e "${RED}错误: 请在项目根目录执行此脚本${NC}"
    exit 1
fi

# 检查 SSH 连接
echo -e "${YELLOW}检查服务器连接...${NC}"
if ! ssh -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo '连接成功'" > /dev/null 2>&1; then
    echo -e "${RED}错误: 无法连接到服务器 $SERVER_IP${NC}"
    echo "请检查:"
    echo "  1. 服务器 IP 是否正确"
    echo "  2. SSH 密钥是否已配置"
    echo "  3. 服务器是否在线"
    echo ""
    echo "使用方式: $0 [用户名] [远程目录]"
    echo "示例: $0 ubuntu /home/ubuntu/asset-management"
    exit 1
fi
echo -e "${GREEN}✓ 服务器连接正常${NC}"

# 步骤 1: 上传项目文件
echo ""
echo -e "${YELLOW}步骤 1/5: 上传项目文件到服务器...${NC}"

# 创建临时排除文件列表
cat > /tmp/rsync-exclude.txt << EOF
.git/
node_modules/
frontend/dist/
backend/server
data/
*.db
*.db-journal
.env
.env.local
*.log
.DS_Store
.idea/
.vscode/
EOF

# 使用 rsync 上传（如果可用），否则使用 scp
if command -v rsync &> /dev/null; then
    echo "使用 rsync 上传文件..."
    rsync -avz --delete \
        --exclude-from=/tmp/rsync-exclude.txt \
        "$PROJECT_DIR/" \
        "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
else
    echo "使用 scp 上传文件（较慢）..."
    # 先创建目录结构
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR"

    # 压缩并上传
    tar czf /tmp/project.tar.gz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='frontend/dist' \
        --exclude='backend/server' \
        --exclude='data' \
        --exclude='*.db' \
        --exclude='.env' \
        --exclude='*.log' \
        -C "$PROJECT_DIR" .

    scp /tmp/project.tar.gz "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
    ssh "$SERVER_USER@$SERVER_IP" "cd $REMOTE_DIR && tar xzf project.tar.gz && rm project.tar.gz"
    rm /tmp/project.tar.gz
fi

rm /tmp/rsync-exclude.txt
echo -e "${GREEN}✓ 文件上传完成${NC}"

# 步骤 2: 检查服务器环境
echo ""
echo -e "${YELLOW}步骤 2/5: 检查服务器环境...${NC}"

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
set -e

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

echo "✓ Docker 已安装: $(docker --version)"
echo "✓ Docker Compose 已安装"

# 检查端口占用
if netstat -tuln 2>/dev/null | grep -q ':8080 ' || ss -tuln 2>/dev/null | grep -q ':8080 '; then
    echo "警告: 端口 8080 已被占用"
fi

if netstat -tuln 2>/dev/null | grep -q ':3000 ' || ss -tuln 2>/dev/null | grep -q ':3000 '; then
    echo "警告: 端口 3000 已被占用"
fi
ENDSSH

echo -e "${GREEN}✓ 服务器环境检查完成${NC}"

# 步骤 3: 远程执行部署
echo ""
echo -e "${YELLOW}步骤 3/5: 在服务器上执行部署...${NC}"

ssh "$SERVER_USER@$SERVER_IP" "cd $REMOTE_DIR && bash update-deploy.sh" || {
    echo -e "${RED}部署脚本执行失败${NC}"
    echo "请登录服务器手动检查:"
    echo "  ssh $SERVER_USER@$SERVER_IP"
    echo "  cd $REMOTE_DIR"
    echo "  docker logs asset-backend"
    exit 1
}

echo -e "${GREEN}✓ 部署脚本执行完成${NC}"

# 步骤 4: 验证部署
echo ""
echo -e "${YELLOW}步骤 4/5: 验证部署状态...${NC}"

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
set -e

cd /opt/asset-management

# 检查容器状态
if ! docker ps | grep -q "asset-backend"; then
    echo "错误: 后端容器未运行"
    docker logs --tail 20 asset-backend
    exit 1
fi

if ! docker ps | grep -q "asset-frontend"; then
    echo "错误: 前端容器未运行"
    docker logs --tail 20 asset-frontend
    exit 1
fi

echo "✓ 后端容器运行正常"
echo "✓ 前端容器运行正常"

# 健康检查
if curl -s http://localhost:8080/health | grep -q "ok"; then
    echo "✓ 后端健康检查通过"
else
    echo "警告: 后端健康检查失败"
fi
ENDSSH

echo -e "${GREEN}✓ 部署验证通过${NC}"

# 步骤 5: 显示部署信息
echo ""
echo -e "${YELLOW}步骤 5/5: 收集部署信息...${NC}"

# 获取容器状态
CONTAINER_INFO=$(ssh "$SERVER_USER@$SERVER_IP" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep asset")

echo ""
echo "==================================="
echo -e "${GREEN}部署完成！${NC}"
echo "==================================="
echo ""
echo "容器状态:"
echo "$CONTAINER_INFO"
echo ""
echo "访问地址:"
echo "  通过 Nginx: https://your-domain.com (您的 Nginx 已配置)"
echo ""
echo "默认管理员账号:"
echo "  用户名: admin"
echo "  密码: (在服务器 backend/.env 中配置的 ADMIN_PASSWORD)"
echo ""
echo -e "${YELLOW}重要提醒:${NC}"
echo "  1. 确认已在 backend/.env 中配置强管理员密码"
echo "  2. 确认 ALLOWED_ORIGINS 已配置正确的域名（禁止 IP 访问）"
echo "  3. 首次登录后立即修改密码"
echo "  4. 检查 Nginx 配置是否正确代理到容器"
echo ""
echo "查看日志:"
echo "  ssh $SERVER_USER@$SERVER_IP 'docker logs -f asset-backend'"
echo "  ssh $SERVER_USER@$SERVER_IP 'docker logs -f asset-frontend'"
echo ""
echo "重启服务:"
echo "  ssh $SERVER_USER@$SERVER_IP 'docker restart asset-backend asset-frontend'"
