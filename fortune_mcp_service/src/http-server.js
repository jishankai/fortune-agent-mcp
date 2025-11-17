#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './mcp-service.js';
import { logger, isDebugEnabled } from './utils/logger.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS 配置支持浏览器客户端
app.use(cors({
  origin: '*', // 生产环境应配置具体域名
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));

// 增加body parser限制并添加调试
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    logger.debug(`原始Buffer大小: ${buf.length} 字节`);
  }
}));

// 会话管理 - 存储每个会话的传输实例
const transports = {};

// 清理超时会话的定时器
setInterval(() => {
  const now = Date.now();
  Object.entries(transports).forEach(([sessionId, transport]) => {
    if (transport.lastActivity && now - transport.lastActivity > 30 * 60 * 1000) { // 30分钟超时
      logger.debug(`清理超时会话: ${sessionId}`);
      transport.close();
      delete transports[sessionId];
    }
  });
}, 5 * 60 * 1000); // 每5分钟检查一次

// 处理 MCP 协议的 POST 请求
app.post('/mcp', async (req, res) => {
  try {
    if (isDebugEnabled) {
      const bodySize = JSON.stringify(req.body).length;
      logger.debug('=== HTTP请求调试 ===');
      logger.debug(`Content-Length: ${req.headers['content-length']}`);
      logger.debug(`Body大小: ${bodySize} 字符`);
      
      if (req.body && req.body.params && req.body.params.arguments) {
        const args = req.body.params.arguments;
        logger.debug(`Method: ${req.body.method}`);
        logger.debug(`Arguments keys: ${Object.keys(args)}`);
        
        if (args.astrolabe_data) {
          const astrolabeSize = JSON.stringify(args.astrolabe_data).length;
          logger.debug(`astrolabe_data大小: ${astrolabeSize} 字符`);
          logger.debug(`astrolabe_data keys: ${Object.keys(args.astrolabe_data)}`);
          
          if (args.astrolabe_data.palace_data) {
            logger.debug(`palace_data长度: ${args.astrolabe_data.palace_data.length}`);
            const firstPalace = args.astrolabe_data.palace_data[0];
            logger.debug(`第一个宫位keys: ${Object.keys(firstPalace || {})}`);
            logger.debug(`第一个宫位数据大小: ${JSON.stringify(firstPalace || {}).length} 字符`);
          }
        }
      }
      logger.debug('=== HTTP请求调试结束 ===');
    }

    // 检查现有会话ID
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports[sessionId]) {
      // 重用现有传输
      transport = transports[sessionId];
      transport.lastActivity = Date.now();
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // 新的初始化请求
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          logger.info(`新会话初始化: ${newSessionId}`);
          transports[newSessionId] = transport;
          transport.lastActivity = Date.now();
        },
        // DNS 重绑定保护 - 生产环境建议启用
        enableDnsRebindingProtection: false,
        // allowedHosts: ['127.0.0.1', 'localhost'],
      });

      // 会话关闭时清理
      transport.onclose = () => {
        if (transport.sessionId) {
          logger.info(`会话关闭: ${transport.sessionId}`);
          delete transports[transport.sessionId];
        }
      };

      // 创建并连接 MCP 服务器
      const mcpServer = createMcpServer();
      await mcpServer.connect(transport);
    } else {
      // 无效请求
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided or not an initialize request',
        },
        id: null,
      });
    }

    // 处理请求
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error('MCP 请求处理错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// 处理服务器到客户端的通知 (SSE)
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).send('Invalid or missing session ID');
  }
  
  const transport = transports[sessionId];
  transport.lastActivity = Date.now();
  await transport.handleRequest(req, res);
});

// 处理会话终止
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).send('Invalid or missing session ID');
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: Object.keys(transports).length,
    version: '1.0.0'
  });
});

// 服务信息端点
app.get('/', (req, res) => {
  res.json({
    name: 'fortune-mcp-http-service',
    version: '1.0.0',
    description: '紫微斗数星盘计算 MCP HTTP 服务',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    },
    activeSessions: Object.keys(transports).length
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('服务器错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 启动服务器
app.listen(port, () => {
  logger.info(`🚀 Fortune MCP HTTP 服务已启动`);
  logger.info(`📡 服务地址: http://localhost:${port}`);
  logger.info(`🏥 健康检查: http://localhost:${port}/health`);
  logger.info(`🔗 MCP 端点: http://localhost:${port}/mcp`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.warn('收到 SIGTERM 信号，正在关闭服务器...');
  Object.values(transports).forEach(transport => transport.close());
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.warn('收到 SIGINT 信号，正在关闭服务器...');
  Object.values(transports).forEach(transport => transport.close());
  process.exit(0);
});
