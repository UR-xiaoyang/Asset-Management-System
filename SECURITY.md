# 安全指南

## 生产环境部署检查清单

### 必须配置项

1. **JWT_SECRET**
   - ✅ 长度至少 32 字符
   - ✅ 使用强随机字符串
   - ✅ 生成方法：`openssl rand -base64 32`
   - ❌ 禁止使用示例值

2. **管理员密码**
   - ✅ 首次启动后立即修改默认密码
   - ✅ 使用强密码（≥12 字符，包含大小写字母、数字、特殊字符）
   - ❌ 禁止使用 `admin123` 等弱密码

3. **CORS 来源**
   - ✅ 在 `.env` 中配置 `ALLOWED_ORIGINS`
   - ✅ 指定具体域名，避免使用 `*`
   - 示例：`ALLOWED_ORIGINS=https://assets.example.com,https://assets-admin.example.com`

4. **数据库**
   - ✅ 生产环境使用 MySQL 或 PostgreSQL
   - ✅ 定期备份数据库
   - ✅ 限制数据库访问权限

### 推荐配置项

1. **HTTPS**
   - 使用反向代理（Nginx/Caddy）配置 HTTPS
   - 强制重定向 HTTP → HTTPS
   - 配置 HSTS 头

2. **日志级别**
   - 生产环境设置 `LOG_LEVEL=prod` 或 `GIN_MODE=release`
   - 减少敏感信息输出

3. **防火墙规则**
   - 仅开放必要端口（80/443）
   - 限制数据库端口访问（仅本地或内网）

4. **定期更新**
   - 及时更新依赖包
   - 关注安全公告

## 已知的安全特性

### 认证与授权
- JWT token 认证
- 三级权限控制（访客/管理员/超级管理员）
- 密码 bcrypt 哈希存储

### 数据保护
- SQL 参数化查询（防止 SQL 注入）
- 输入验证与绑定
- CORS 白名单机制
- 安全响应头（CSP, X-Frame-Options, X-Content-Type-Options）

### 会话管理
- Token 24 小时过期
- 自动登出机制
- 密码修改后需重新登录

## 安全最佳实践

### 开发环境
```bash
# 使用示例配置
cp backend/.env.example backend/.env

# 生成强 JWT 密钥
openssl rand -base64 32

# 编辑 .env，替换 JWT_SECRET
nano backend/.env
```

### 生产环境
```bash
# 使用环境变量注入（推荐）
export JWT_SECRET="$(openssl rand -base64 32)"
export ADMIN_PASSWORD="your-strong-password"
export ALLOWED_ORIGINS="https://your-domain.com"
export GIN_MODE=release
export LOG_LEVEL=prod

# 或使用 .env 文件（确保权限 600）
chmod 600 .env
```

### Docker 部署
```bash
# 使用 secrets 管理敏感信息
docker secret create jwt_secret /path/to/jwt_secret.txt

# docker-compose.yml 中引用
services:
  app:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

## 漏洞报告

如果发现安全漏洞，请勿公开披露，发送邮件至：
- security@example.com

我们会在 48 小时内响应，并在修复后公开致谢。

## 审计日志

系统记录以下操作：
- 用户登录/登出
- 权限变更
- 资产创建/修改/删除
- 审批操作

日志位置：`data/audit.log`（如果启用）

## 定期安全检查

### 每月
- [ ] 检查异常登录记录
- [ ] 审查用户权限分配
- [ ] 备份数据库

### 每季度
- [ ] 更新依赖包
- [ ] 审计访问日志
- [ ] 测试备份恢复

### 每年
- [ ] 修改管理员密码
- [ ] 轮换 JWT 密钥
- [ ] 安全审计

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Go Security](https://go.dev/doc/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
