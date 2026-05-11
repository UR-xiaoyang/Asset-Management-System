# 实验室资产管理系统

一个完整的实验室资产管理解决方案，支持资产录入、二维码标签、移动端扫码借用、类OA审批流程。

## 功能特性

- **资产管理**: 资产的增删改查，支持层级分类
- **移动端借用**: 扫码即可进入借用申请页面
- **审批流程**: 完整的借用审批流程，OA留痕
- **邮件通知**: 审批结果自动邮件通知
- **离线支持**: 标签含UUID，支持离线记录

## 快速开始

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
- `PORT` - 服务器端口，默认8080
- `DB_PATH` - 数据库路径，默认./data/lab_asset.db
- `SMTP_HOST` - SMTP服务器地址
- `SMTP_USER` - SMTP用户名
- `SMTP_PASS` - SMTP密码
- `SMTP_FROM` - 发件人地址

## 使用流程

1. **资产录入**: 管理员在后台添加资产信息
2. **借用申请**: 访客扫描资产上的二维码，填写借用信息
3. **审批流程**: 管理员审核申请，通过后借用生效

## 许可证

MIT
