# 后端构建阶段 - 使用 Go 1.25
FROM golang:alpine AS builder

WORKDIR /build

# 安装编译依赖
RUN apk add --no-cache gcc musl-dev sqlite-dev

# 复制 go.mod 和 go.sum
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 整理依赖
RUN go mod tidy

# 编译
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# 运行阶段
FROM alpine:latest

WORKDIR /app

# 安装运行依赖
RUN apk add --no-cache ca-certificates sqlite-libs tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 从构建阶段复制二进制文件
COPY --from=builder /build/server .

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 8080

# 运行
CMD ["./server"]
