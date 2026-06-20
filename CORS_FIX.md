# CORS 配置问题修复

**问题**: 登录时出现 403 错误

**原因**: CORS 配置域名不匹配
- 配置的域名: `https://lab-asset.thehubzone.com`
- 实际访问域名: `https://asset.ur-xiaoyang.com`

**修复**:
1. 修改 `/opt/lab-asset-manager/backend/.env`
2. 将 `ALLOWED_ORIGINS` 改为 `https://asset.ur-xiaoyang.com`
3. 重启后端容器

**已执行**:
```bash
sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://asset.ur-xiaoyang.com|' /opt/lab-asset-manager/backend/.env
docker restart asset-backend
```

**验证**:
- 访问 https://asset.ur-xiaoyang.com
- 尝试登录
- 应该可以正常登录了

**状态**: ✅ 已修复
