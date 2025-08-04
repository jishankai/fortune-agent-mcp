# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

LABEL maintainer="Claude Code MCP Service"
LABEL description="紫微斗数星盘计算 MCP HTTP 服务"

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（仅生产环境）
RUN npm ci --only=production && npm cache clean --force

# 运行阶段
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 创建非 root 用户
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser

# 复制依赖
COPY --from=builder --chown=mcpuser:mcpuser /app/node_modules ./node_modules

# 复制应用代码和配置
COPY --chown=mcpuser:mcpuser package.json ./
COPY --chown=mcpuser:mcpuser src/ ./src/

# 切换到非 root 用户
USER mcpuser

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/http-server.js"]