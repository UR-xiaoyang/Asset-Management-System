# AGENTS.md

## 项目概述

实验室资产管理系统：Go后端 + React前端全栈应用，支持资产录入、二维码标签、移动端扫码借用、类OA审批流程。

## 服务管理

```bash
./start.sh      # 一键启动后端(8080)和前端(3000)
./stop.sh       # 停止所有服务
./status.sh     # 查看服务状态
```

- 后台管理: http://localhost:3000
- API服务: http://localhost:8080
- 默认账号: admin / admin123

## 开发命令

**后端** (Go 1.24, Gin, GORM):
```bash
cd backend
go build -o server ./cmd/server/   # 编译产物为 server 二进制（非 main）
./server                           # 运行，数据库默认在 ./data/lab_asset.db
```

**前端** (React 19, TypeScript, Vite):
```bash
cd frontend
npm run dev          # 开发服务器 (热重载，代理/api到后端:8080)
npm run build        # 生产构建 (先 tsc -b 再 vite build)
npm run lint         # ESLint检查
```

## 架构

- **后端入口**: `backend/cmd/server/main.go`
- **后端结构**: `internal/{api,handler,model,repository,service}` + `pkg/qrcode` + `internal/handler/{auth,user,import,qr}_handler.go`
- **前端结构**: `src/{components,pages,services,store}` (无 types 目录，类型内联或共用)
- **二维码格式**: JSON `{"uuid":"xxx","name":"xxx","owner":"xxx","quantity":1,"date":"auto"}`
- **移动端扫码**: `/scan` 页面，解析二维码 `data.uuid` 查询资产
- **额外handler**: AuthHandler, UserHandler, ImportHandler, QRHandler (未被上层 `handler/` 结构概览覆盖)

## 关键约束

- 前端 `npm run build` 需先 `tsc -b` 类型检查，再 `vite build`
- 数据库默认路径 `./data/lab_asset.db`（相对于 backend 目录），可通过 `DB_PATH` 环境变量覆盖
- Vite 开发服务器代理 `/api` 到后端 8080 端口
- 后端编译产物为 `server` 二进制，非 `main` 或其他名称
- 后端静态文件服务: `./public` 目录（ SPA fallback 到 `index.html`）
- 后端注册了 ImportHandler (Excel批量导入) 和 UserHandler，未在 API 文档中显式列出

## 环境变量

- `PORT`: 后端端口，默认 8080
- `DB_PATH`: 数据库路径，默认 `./data/lab_asset.db`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: 邮件通知配置
