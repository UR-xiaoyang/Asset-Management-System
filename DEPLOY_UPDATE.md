# 版本更新部署指南

**目标服务器**: 38.12.6.102  
**部署方式**: Docker + Nginx  
**更新日期**: 2026-06-18

---

## 快速更新（推荐）

### 在服务器上执行

```bash
# 1. 进入项目目录
cd /path/to/实验室资产管理

# 2. 拉取最新代码
git pull origin main

# 3. 执行更新脚本
chmod +x update-deploy.sh
./update-deploy.sh
```

更新脚本会自动：
- ✅ 备份数据库
- ✅ 停止旧容器
- ✅ 构建新镜像
- ✅ 启动新容器
- ✅ 健康检查

---

## 手动更新步骤

### 步骤 1: 备份数据库

```bash
# 创建备份
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r data $BACKUP_DIR/

echo "数据库已备份到: $BACKUP_DIR"
```

### 步骤 2: 停止旧版本

```bash
# 停止并删除旧容器
docker stop asset-backend asset-frontend
docker rm asset-backend asset-frontend

# 可选：删除旧镜像（节省空间）
docker rmi asset-backend:old asset-frontend:old 2>/dev/null || true
```

### 步骤 3: 配置环境变量

```bash
# 检查是否存在 .env 文件
cd backend

if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
fi

# 编辑配置（重要！）
nano .env
```

**必须配置的项目**：

```env
# 生成强 JWT 密钥
JWT_SECRET=<运行: openssl rand -base64 32>

# 修改管理员密码
ADMIN_PASSWORD=<your-strong-password>

# 配置 CORS（根据实际域名修改）
ALLOWED_ORIGINS=http://38.12.6.102,http://your-domain.com

# 生产模式
GIN_MODE=release
LOG_LEVEL=prod
```

### 步骤 4: 构建新镜像

```bash
# 构建后端
cd backend
docker build -t asset-backend:latest .

# 构建前端
cd ../frontend
docker build -t asset-frontend:latest .

cd ..
```

### 步骤 5: 启动新容器

```bash
# 启动后端（端口 8080）
docker run -d \
  --name asset-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  --env-file backend/.env \
  asset-backend:latest

# 启动前端（端口 3000）
docker run -d \
  --name asset-frontend \
  --restart unless-stopped \
  -p 3000:80 \
  asset-frontend:latest
```

### 步骤 6: 验证部署

```bash
# 检查容器状态
docker ps | grep asset

# 后端健康检查
curl http://localhost:8080/health
# 期望输出: {"status":"ok"}

# 检查后端日志
docker logs asset-backend

# 检查前端日志
docker logs asset-frontend
```

---

## Nginx 配置更新

### 方式 1: 反向代理到前端容器（推荐）

编辑 Nginx 配置（通常在 `/etc/nginx/sites-available/` 或 `/etc/nginx/conf.d/`）：

```nginx
server {
    listen 80;
    server_name 38.12.6.102 your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API（如果前端代理失败，可以直接暴露）
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 方式 2: Nginx 直接服务前端静态文件

```nginx
server {
    listen 80;
    server_name 38.12.6.102 your-domain.com;

    # 从前端容器复制静态文件
    # docker cp asset-frontend:/usr/share/nginx/html /var/www/assets
    root /var/www/assets;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 重载 Nginx

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 或
sudo nginx -s reload
```

---

## HTTPS 配置（推荐）

### 使用 Certbot 自动获取 Let's Encrypt 证书

```bash
# 安装 Certbot (Ubuntu/Debian)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 自动配置 HTTPS
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

配置后 Nginx 会自动添加 SSL 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... 其他配置同上
}

# 自动重定向 HTTP → HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**更新 CORS 配置**：

```bash
# 编辑 backend/.env
ALLOWED_ORIGINS=https://your-domain.com

# 重启后端容器
docker restart asset-backend
```

---

## 验证更新

### 1. 检查容器状态

```bash
docker ps -a | grep asset
```

期望输出：
```
CONTAINER ID   IMAGE                    STATUS         PORTS
xxx            asset-backend:latest     Up 5 minutes   0.0.0.0:8080->8080/tcp
xxx            asset-frontend:latest    Up 5 minutes   0.0.0.0:3000->80/tcp
```

### 2. 测试后端 API

```bash
# 健康检查
curl http://localhost:8080/health

# 登录测试
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-admin-password"}'
```

### 3. 测试前端访问

浏览器打开：
- 直接访问: http://38.12.6.102:3000
- 通过 Nginx: http://38.12.6.102 或 http://your-domain.com

### 4. 检查日志

```bash
# 查看最近 50 行日志
docker logs --tail 50 asset-backend
docker logs --tail 50 asset-frontend

# 实时跟踪日志
docker logs -f asset-backend
```

---

## 回滚到旧版本

如果更新出现问题，可以快速回滚：

```bash
# 1. 停止新容器
docker stop asset-backend asset-frontend
docker rm asset-backend asset-frontend

# 2. 恢复数据库（如果需要）
BACKUP_DIR="backups/20260618_160000"  # 替换为实际备份目录
rm -rf data
cp -r $BACKUP_DIR/data ./

# 3. 启动旧版本（如果保留了旧镜像）
docker run -d \
  --name asset-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  --env-file backend/.env \
  asset-backend:old

docker run -d \
  --name asset-frontend \
  --restart unless-stopped \
  -p 3000:80 \
  asset-frontend:old
```

---

## 常见问题

### Q1: 容器无法启动

```bash
# 查看详细日志
docker logs asset-backend
docker logs asset-frontend

# 常见原因：
# - 端口被占用: lsof -i :8080
# - 权限问题: sudo chown -R $(whoami):$(whoami) data/
# - 配置错误: 检查 backend/.env
```

### Q2: 数据库迁移失败

```bash
# 进入容器手动检查
docker exec -it asset-backend sh

# 查看数据库文件
ls -la /app/data/

# 检查权限
chmod 644 data/assets.db
```

### Q3: 前端无法连接后端

```bash
# 检查 CORS 配置
grep ALLOWED_ORIGINS backend/.env

# 检查后端是否运行
curl http://localhost:8080/health

# 检查前端代理配置
docker exec asset-frontend cat /etc/nginx/nginx.conf
```

### Q4: JWT 验证失败

```bash
# 确认 JWT_SECRET 长度
grep JWT_SECRET backend/.env | awk -F= '{print length($2)}'

# 应该 >= 32

# 重新生成密钥
echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env

# 重启后端
docker restart asset-backend
```

---

## 维护命令

```bash
# 查看容器资源占用
docker stats asset-backend asset-frontend

# 查看镜像大小
docker images | grep asset

# 清理未使用的镜像
docker image prune -a

# 查看容器详细信息
docker inspect asset-backend

# 进入容器 shell
docker exec -it asset-backend sh

# 导出日志
docker logs asset-backend > backend.log 2>&1

# 备份数据库
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

---

## 性能监控

```bash
# 安装监控工具
docker run -d \
  --name=cadvisor \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8081:8080 \
  google/cadvisor:latest

# 访问监控面板
# http://38.12.6.102:8081
```

---

## 联系支持

如遇到问题，请提供：
1. 容器日志: `docker logs asset-backend`
2. 容器状态: `docker ps -a`
3. 环境变量（隐藏敏感信息）
4. 错误截图

参考文档：
- 安全指南: `SECURITY.md`
- 修复日志: `FIXES.md`
- 项目说明: `README.md`
