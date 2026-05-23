# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM golang:1.25-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN rm -rf internal/web/dist && mkdir -p internal/web/dist
COPY --from=frontend-builder /app/frontend/dist ./internal/web/dist
RUN CGO_ENABLED=0 go build -o server ./cmd/server/

# Stage 3: Runtime
FROM alpine:3.21

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy backend binary. Frontend assets are embedded in the binary.
COPY --from=backend-builder /app/backend/server ./

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV DB_PATH=/app/data/lab_asset.db

# Start server
CMD ["./server"]
