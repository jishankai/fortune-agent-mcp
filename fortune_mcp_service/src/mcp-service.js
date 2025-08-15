import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateAstrolabeSolar, generateAstrolabeLunar } from './tools/astrolabe.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'fortune-mcp-service',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {}
    }
  });

  // 注册阳历星盘生成工具
  server.registerTool(
    'generate_astrolabe_solar',
    {
      title: '增强阳历星盘生成器',
      description: '根据阳历生辰、城市位置生成紫微斗数星盘，包含真太阳时计算和全面运势分析',
      inputSchema: {
        solar_date: z.string().describe('阳历日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，如：北京、上海、广州等，用于经纬度查询和真太阳时计算'),
      }
    },
    async (args) => {
      console.log(`生成增强阳历星盘：${JSON.stringify(args)}`);
      const result = await generateAstrolabeSolar(args);
      console.log('增强星盘生成完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册阴历星盘生成工具
  server.registerTool(
    'generate_astrolabe_lunar',
    {
      title: '增强阴历星盘生成器',
      description: '根据阴历生辰、城市位置生成紫微斗数星盘，包含真太阳时计算和全面运势分析',
      inputSchema: {
        lunar_date: z.string().describe('阴历日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，如：北京、上海、广州等，用于经纬度查询和真太阳时计算'),
      }
    },
    async (args) => {
      console.log(`生成增强阴历星盘：${JSON.stringify(args)}`);
      const result = await generateAstrolabeLunar(args);
      console.log('增强阴历星盘生成完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  console.log('✅ MCP 服务器创建完成，已注册 2 个工具');
  return server;
}
