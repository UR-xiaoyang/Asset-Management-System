# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

实验室资产管理系统：支持资产录入、二维码标签、移动端扫码借用、类OA审批流程的全栈应用。

## 服务管理

```bash
./start.sh      # 一键启动后端和前端
./stop.sh       # 停止所有服务
./status.sh     # 查看服务状态
```

- 后端: http://localhost:8080
- 前端: http://localhost:3000 (代理 /api 到后端)
- 默认账号: admin / admin123
- 数据库: backend/data/assets.db (SQLite)

## 开发命令

**后端** (Go + Gin + GORM + SQLite):
```bash
cd backend
go build -o server ./cmd/server/   # 编译
./server                            # 运行
# 数据库会在首次运行时自动创建并初始化
```

**前端** (React 19 + Vite + Ant Design):
```bash
cd frontend
npm run dev          # 开发服务器 (热重载)
npm run build        # 生产构建
npm run lint         # ESLint 检查
```

## 架构

```
backend/
├── cmd/server/       # 程序入口
├── internal/
│   ├── api/          # 路由注册
│   ├── handler/      # HTTP 处理器 (asset, borrow, category, qr, auth)
│   ├── model/        # 数据模型 (GORM)
│   ├── repository/   # 数据库访问层
│   └── service/      # 业务逻辑
└── pkg/
    └── qrcode/       # 二维码生成 (skip2/go-qrcode)

frontend/
├── src/
│   ├── components/   # 通用组件 (PrintLabelModal, ImportModal, Layout)
│   ├── pages/        # 页面组件
│   ├── services/     # API 调用层 (api.ts)
│   ├── store/        # Zustand 状态管理 (auth.ts)
│   └── types/        # TypeScript 类型定义
└── vite.config.ts    # Vite 配置 (含 API 代理)
```

## 技术栈

- **后端**: Go 1.24, Gin, GORM, SQLite, skip2/go-qrcode
- **前端**: React 19, TypeScript, Vite, Ant Design 6, Zustand, React Router 7, jsPDF

## 核心功能模块

1. **资产管理**: 层级分类 + CRUD，支持批量导入 (Excel)
2. **二维码**: 基于资产UUID生成，JSON格式存储: `{"uuid":"xxx","name":"xxx","owner":"xxx","quantity":1,"date":"auto"}`
3. **借用审批**: 申请 → 审批 → 归还全流程
4. **打印标签**: 支持多种尺寸 (50x25mm, 90x40mm等)，可导出PDF或直接打印

## 常用 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/assets | 资产列表 (支持分页、搜索) |
| GET | /api/v1/assets/uuid/:uuid | 根据UUID查询资产 |
| POST | /api/v1/qr/batch | 批量生成二维码 |
| GET | /api/v1/borrows | 借用记录列表 |
| POST | /api/v1/borrows | 创建借用申请 |
| POST | /api/v1/borrows/:id/approve | 审批通过 |

## 移动端相关

- 扫码页面: /scan (访客扫码借用)
- 二维码内容为JSON格式，需解析 `data.uuid` 获取资产UUID
- 支持闪光灯控制、前后摄像头切换
