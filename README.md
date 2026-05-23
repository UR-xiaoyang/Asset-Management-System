# 实验室资产管理系统

一个完整的实验室资产管理解决方案，支持资产录入、二维码标签、移动端扫码借用、类OA审批流程。

## 功能特性

- **资产管理**: 资产的增删改查，支持层级分类
- **移动端借用**: 扫码即可进入借用申请页面
- **审批流程**: 完整的借用审批流程，OA留痕
- **邮件通知**: 审批结果自动邮件通知
- **离线支持**: 标签含UUID，支持离线记录

## 快速开始

### Docker 部署（推荐生产环境）

服务器只需要安装 Docker 和 Docker Compose。

从 GitHub 拉取源码并在服务器本机构建：

```bash
git clone https://github.com/UR-xiaoyang/Asset-Management-System.git
cd Asset-Management-System
./deploy.sh
```

如果只想拉取已经打包好的镜像部署：

```bash
git clone https://github.com/UR-xiaoyang/Asset-Management-System.git
cd Asset-Management-System
./deploy.sh --pull-image
```

默认镜像地址：

```text
ghcr.io/ur-xiaoyang/asset-management-system:latest
```

首次运行会进入初始化向导，可以选择数据库并配置初始管理员：

- `SQLite`：默认推荐，零配置，数据保存在 `data/lab_asset.db`
- `MySQL`：自动启动 MySQL 容器，数据保存在 Docker volume `mysql_data`
- `PostgreSQL`：自动启动 PostgreSQL 容器，数据保存在 Docker volume `postgres_data`

启动后访问：
- 系统地址: http://localhost:8080
- 管理员账号: 初始化时填写的用户名和密码

如需重新选择数据库或重置初始化配置：

```bash
./deploy.sh --reconfigure
```

使用预构建镜像并重新初始化：

```bash
./deploy.sh --pull-image --reconfigure
```

如果只是修改端口、域名或邮件配置，编辑 `.env` 后重新部署：

```bash
./deploy.sh
```

常用 Docker 命令：

```bash
docker compose ps
docker compose logs -f app
docker compose restart
docker compose down
```

SQLite 数据库会持久化在项目根目录的 `data/` 中。备份 SQLite 数据库：

```bash
./backup.sh
```

如果通过域名访问，需要在 `.env` 中配置允许的访问来源，例如：

```env
APP_PORT=8080
APP_IMAGE=ghcr.io/ur-xiaoyang/asset-management-system:latest
DB_TYPE=sqlite
ALLOWED_ORIGINS=https://assets.example.com,http://localhost:8080
```

镜像会由 GitHub Actions 自动构建并发布到 GitHub Container Registry：

- 推送到 `main`：发布 `latest`、`main`、`sha-xxxxxxx` 标签
- 推送 `v*.*.*` 标签：发布对应版本标签，例如 `v1.0.0`
- Pull Request：只构建测试，不推送镜像

### Release 单文件部署

推送版本标签后，GitHub Actions 会自动创建 Release，并上传内置前端资源的单文件可执行程序：

- Linux: `linux_amd64`、`linux_arm64`
- macOS: `darwin_amd64`、`darwin_arm64`
- Windows: `windows_amd64`、`windows_arm64`

发布版本示例：

```bash
git tag v1.0.0
git push origin v1.0.0
```

下载对应系统的压缩包，解压后直接运行：

```bash
chmod +x asset-management-system_linux_amd64
./asset-management-system_linux_amd64
```

默认访问地址：

```text
http://localhost:8080
```

默认数据库为当前目录下的 `data/lab_asset.db`。可以通过环境变量配置管理员和数据库：

```bash
ADMIN_USERNAME=admin \
ADMIN_PASSWORD=your_password \
DB_TYPE=sqlite \
DB_PATH=./data/lab_asset.db \
./asset-management-system_linux_amd64
```

### 一键启动（推荐）

```bash
cd /home/xiaoyang/project/实验室资产管理
./start.sh
```

启动后访问：
- 后台管理: http://localhost:3000
- 默认账号: admin / admin123

### 手动启动

**后端：**
```bash
cd backend
go run cmd/server/main.go
```

服务器默认运行在 `http://localhost:8080`

**前端：**
```bash
cd frontend
npm run dev
```

前端默认运行在 `http://localhost:3000`

### 常用脚本

| 脚本 | 说明 |
|------|------|
| `./start.sh` | 一键启动后端和前端 |
| `./stop.sh` | 停止所有服务 |
| `./status.sh` | 查看服务状态 |
| `./deploy.sh` | Docker 构建并后台启动 |
| `./backup.sh` | 备份 Docker 部署的 SQLite 数据库 |

## 项目结构

```
实验室资产管理/
├── backend/                    # Go后端
│   ├── cmd/server/            # 入口文件
│   ├── internal/
│   │   ├── api/              # API路由
│   │   ├── handler/          # 处理器
│   │   ├── model/            # 数据模型
│   │   ├── service/          # 业务逻辑
│   │   └── repository/        # 数据访问
│   └── pkg/
│       └── qrcode/            # 二维码生成
│
├── frontend/                   # Vite前端
│   └── src/
│       ├── components/        # 组件
│       ├── pages/             # 页面
│       ├── store/             # 状态管理
│       └── services/          # API服务
│
└── docs/                      # 文档
```

## CI / 合并检查

项目包含 GitHub Actions 自动测试流程 `.github/workflows/ci.yml`，在 Pull Request、推送 `main` 和手动触发时运行：

- 后端：`gofmt` 检查、`go test`、`go vet`、无 CGO Linux 二进制编译
- 前端：`npm ci`、`npm run build`
- 前端 lint：`npm run lint`
- Docker：构建镜像，并校验 SQLite/MySQL/PostgreSQL 的 Compose 组合
- 安全：`govulncheck`、`npm audit --audit-level=high`、Trivy 文件系统扫描

本地可执行核心检查：

```bash
cd backend
go test ./cmd/... ./internal/... ./pkg/...
go vet ./cmd/... ./internal/... ./pkg/...

cd ../frontend
npm ci
npm run build
npm audit --audit-level=high --registry=https://registry.npmjs.org/
```

## API接口

### 认证
- POST `/api/v1/auth/login` - 登录
- POST `/api/v1/auth/register` - 注册

### 分类
- GET `/api/v1/categories` - 获取分类列表
- GET `/api/v1/categories/tree` - 获取分类树
- POST `/api/v1/categories` - 创建分类
- PUT `/api/v1/categories/:id` - 更新分类
- DELETE `/api/v1/categories/:id` - 删除分类

### 资产
- GET `/api/v1/assets` - 获取资产列表
- GET `/api/v1/assets/:id` - 获取单个资产
- GET `/api/v1/assets/uuid/:uuid` - 通过UUID获取资产
- POST `/api/v1/assets` - 创建资产
- PUT `/api/v1/assets/:id` - 更新资产
- DELETE `/api/v1/assets/:id` - 删除资产

### 借用记录
- GET `/api/v1/borrows` - 获取借用记录列表
- GET `/api/v1/borrows/pending` - 获取待审批列表
- POST `/api/v1/borrows` - 创建借用申请
- POST `/api/v1/borrows/:id/approve` - 审批通过
- POST `/api/v1/borrows/:id/reject` - 审批拒绝
- POST `/api/v1/borrows/:id/return` - 归还

### 二维码

## 环境变量

### 后端
- `APP_PORT` - Docker 对外访问端口，默认8080
- `PORT` - 服务器端口，默认8080
- `DB_PATH` - 数据库路径，Docker 默认 /app/data/lab_asset.db
- `DB_TYPE` - 数据库类型，支持 sqlite、mysql、postgres
- `DB_DSN` - 数据库连接字符串，Docker 部署通常由 compose 自动生成
- `ALLOWED_ORIGINS` - 允许跨域访问的来源，多个用英文逗号分隔
- `ADMIN_USERNAME` - 初始管理员用户名，仅用户表为空时生效
- `ADMIN_PASSWORD` - 初始管理员密码，仅用户表为空时生效
- `ADMIN_EMAIL` - 初始管理员邮箱，仅用户表为空时生效
- `ADMIN_NAME` - 初始管理员名称，仅用户表为空时生效
- `SMTP_HOST` - SMTP服务器地址
- `SMTP_PORT` - SMTP端口，默认587
- `SMTP_USER` - SMTP用户名
- `SMTP_PASS` - SMTP密码
- `SMTP_FROM` - 发件人地址

## 使用流程

1. **资产录入**: 管理员在后台添加资产信息
2. **借用申请**: 访客扫描资产上的二维码，填写借用信息
3. **审批流程**: 管理员审核申请，通过后借用生效

## 许可证

MIT
