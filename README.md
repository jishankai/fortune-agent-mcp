# Fortune MCP Project

本仓库包含一个提供紫微斗数（Ziwei Dou Shu）算命服务的模型上下文协议（MCP）项目。

## 🚀 核心组件

- **`fortune_mcp_service`**: 一个 Node.js 服务，它将 [iztro](https://github.com/Sylarlong/iztro) 紫微斗数库封装为 MCP 服务，提供专业的紫微斗数分析功能。

## ⚡️ 快速开始

本项目使用 Docker Compose 进行管理，方便一键部署。

### 生产环境

启动生产环境服务：

```bash
docker-compose up -d fortune-mcp-http
```

服务将在 `http://localhost:3000` 上可用。

### 开发环境

如果需要在开发模式下运行（代码热重载），请运行：

```bash
docker-compose --profile dev up -d
```

开发服务将在 `http://localhost:3001` 上可用。

### 停止服务

```bash
# 停止生产服务
docker-compose down

# 停止开发服务
docker-compose --profile dev down
```

## 📂 目录结构

```
.
├── docker-compose.yml      # Docker Compose 配置文件
├── fortune_mcp_service/    # 核心 MCP 服务
│   ├── src/                # 服务源代码
│   ├── Dockerfile          # 服务的 Dockerfile
│   ├── package.json        # Node.js 项目文件
│   └── README.md           # 服务的详细文档
└── README.md               # 本文档
```

## 📖 详细文档

关于 `fortune_mcp_service` 的详细功能、API 使用、配置和技术细节，请参阅其内部的 README 文件：

[**fortune_mcp_service/README.md**](./fortune_mcp_service/README.md)
