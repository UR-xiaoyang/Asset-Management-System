# 一键部署指令

**服务器**: 38.12.6.102  
**要求**: 禁止 IP 访问，仅通过域名访问  
**Nginx**: 已配置，无需修改

---

## 🚀 快速部署（推荐）

在**本地**项目目录执行：

```bash
# 进入项目目录
cd /home/xiaoyang/project/实验室资产管理

# 执行一键部署
./deploy-to-server.sh root /opt/asset-management
```

**参数说明**：
- 第1个参数：SSH 用户名（默认 root）
- 第2个参数：远程部署目录（默认 /opt/asset-management）

---

## 📋 部署步骤详解

脚本会自动执行以下操作：

### 1️⃣ 检查服务器连接
- 验证 SSH 连接
- 确认服务器在线

### 2️⃣ 上传项目文件
- 使用 rsync 或 scp 上传代码
- 自动排除 node_modules、.git、data 等

### 3️⃣ 检查服务器环境
- 验证 Docker 已安装
- 检查端口占用情况

### 4️⃣ 执行远程部署
- 自动生成强 JWT 密钥
- 备份旧数据库
- 构建新镜像
- 启动新容器

### 5️⃣ 验证部署
- 检查容器状态
- 后端健康检查
- 显示部署信息

---

## ⚙️ 环境变量配置（重要）

部署完成后，需要在**服务器上**编辑配置：

```bash
# SSH 登录服务器
ssh root@38.12.6.102

# 编辑环境变量
cd /opt/asset-management
nano backend/.env
```

**必须配置的项目**：

```env
# JWT 密钥（脚本已自动生成）
JWT_SECRET=<已自动生成32+字符>

# 修改管理员密码（必须！）
ADMIN_PASSWORD=YourStrongPassword123!

# 配置域名（禁止 IP 访问）
ALLOWED_ORIGINS=https://your-domain.com,https://assets.example.com

# 生产模式（脚本已自动设置）
GIN_MODE=release
LOG_LEVEL=prod
```

修改后重启容器：

```bash
docker restart asset-backend asset-frontend
```

---

## 🔒 禁止 IP 访问配置

### 后端配置

已在 `backend/.env` 中配置：
```env
ALLOWED_ORIGINS=https://your-domain.com
```

**不要添加** IP 地址，只允许域名访问。

### Nginx 配置（您的已配置好）

如果需要强制禁止 IP 访问，可在 Nginx 中添加：

```nginx
# 禁止 IP 直接访问
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    
    ssl_reject_handshake on;
    return 444;
}

# 仅允许域名访问
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 前端
    location / {
        proxy_pass http://localhost:3000;
        # ... 其他配置
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:8080;
        # ... 其他配置
    }
}
```

---

## ✅ 部署验证

### 在服务器上验证

```bash
# SSH 登录
ssh root@38.12.6.102

# 检查容器状态
docker ps | grep asset

# 查看后端日志
docker logs asset-backend

# 查看前端日志
docker logs asset-frontend

# 健康检查
curl http://localhost:8080/health
```

### 通过浏览器验证

1. **访问域名**：https://your-domain.com
2. **确认无法通过 IP 访问**：http://38.12.6.102（应该被拒绝）
3. **登录测试**：
   - 用户名：admin
   - 密码：（您在 .env 中配置的）
4. **登录后立即修改密码**

---

## 🔧 常用运维命令

### 查看日志
```bash
ssh root@38.12.6.102 "docker logs -f asset-backend"
ssh root@38.12.6.102 "docker logs -f asset-frontend"
```

### 重启服务
```bash
ssh root@38.12.6.102 "docker restart asset-backend asset-frontend"
```

### 查看状态
```bash
ssh root@38.12.6.102 "docker ps -a | grep asset"
```

### 备份数据库
```bash
ssh root@38.12.6.102 "cd /opt/asset-management && tar czf backup-$(date +%Y%m%d).tar.gz data/"
```

### 更新代码
```bash
# 在本地再次执行即可
./deploy-to-server.sh
```

---

## ❌ 问题排查

### 问题1：无法连接服务器

```bash
# 测试 SSH 连接
ssh root@38.12.6.102 "echo 'connection ok'"

# 检查 SSH 密钥
ssh-add -l
```

### 问题2：容器无法启动

```bash
# 查看详细日志
ssh root@38.12.6.102 "docker logs asset-backend"

# 检查端口占用
ssh root@38.12.6.102 "netstat -tuln | grep -E '8080|3000'"
```

### 问题3：通过 IP 仍可访问

检查 `backend/.env` 中的 `ALLOWED_ORIGINS` 配置，确保：
- ✅ 只包含域名（https://your-domain.com）
- ❌ 不包含 IP 地址
- ❌ 不包含 http://38.12.6.102

然后重启容器：
```bash
ssh root@38.12.6.102 "docker restart asset-backend"
```

### 问题4：JWT 验证失败

```bash
# 检查 JWT_SECRET 长度
ssh root@38.12.6.102 "cd /opt/asset-management && grep JWT_SECRET backend/.env | awk -F= '{print length(\$2)}'"

# 应该 >= 32
```

---

## 📞 部署支持

如遇问题，提供以下信息：

```bash
# 收集诊断信息
ssh root@38.12.6.102 bash << 'EOF'
echo "=== 容器状态 ==="
docker ps -a | grep asset

echo ""
echo "=== 后端日志 ==="
docker logs --tail 30 asset-backend

echo ""
echo "=== 环境变量（脱敏） ==="
cd /opt/asset-management
grep -v "SECRET\|PASSWORD" backend/.env
EOF
```

---

## 🎯 下一步

1. ✅ **执行部署**：`./deploy-to-server.sh`
2. ✅ **配置密码**：编辑 `backend/.env` 修改 `ADMIN_PASSWORD`
3. ✅ **验证访问**：通过域名访问并测试功能
4. ✅ **修改密码**：首次登录后立即修改密码
5. ✅ **备份数据**：定期备份数据库

部署完成后，系统即可投入生产使用！
