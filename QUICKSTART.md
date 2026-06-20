# 快速部署清单

## 服务器: 38.12.6.102

### 第一步：上传代码到服务器

```bash
# 在本地执行（如果使用 git）
ssh user@38.12.6.102
cd /path/to/deployment
git clone <repository-url>
cd 实验室资产管理

# 或使用 scp 上传
scp -r /path/to/实验室资产管理 user@38.12.6.102:/path/to/deployment/
```

### 第二步：执行更新脚本

```bash
# SSH 登录到服务器
ssh user@38.12.6.102

# 进入项目目录
cd /path/to/实验室资产管理

# 执行更新脚本
chmod +x update-deploy.sh
./update-deploy.sh
```

### 第三步：配置环境变量（首次部署）

编辑 `backend/.env`：

```bash
nano backend/.env
```

**必须修改**：
```env
JWT_SECRET=<运行: openssl rand -base64 32>
ADMIN_PASSWORD=<your-strong-password>
ALLOWED_ORIGINS=http://38.12.6.102,http://your-domain.com
GIN_MODE=release
LOG_LEVEL=prod
```

### 第四步：更新 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/default
```

添加配置（参考 DEPLOY_UPDATE.md）后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 第五步：验证部署

```bash
# 检查容器
docker ps | grep asset

# 测试健康检查
curl http://localhost:8080/health

# 浏览器访问
# http://38.12.6.102 或 http://your-domain.com
```

### 完成！

默认账号：
- 用户名: admin
- 密码: （在 .env 中配置的 ADMIN_PASSWORD）

**登录后立即修改密码！**

---

## 关键文件

- ✅ `update-deploy.sh` - 自动更新脚本
- ✅ `DEPLOY_UPDATE.md` - 详细部署文档
- ✅ `backend/.env.example` - 环境变量模板
- ✅ `SECURITY.md` - 安全配置指南
- ✅ `FIXES.md` - 版本修复日志

## 问题排查

```bash
# 查看后端日志
docker logs -f asset-backend

# 查看前端日志
docker logs -f asset-frontend

# 重启服务
docker restart asset-backend asset-frontend
```
