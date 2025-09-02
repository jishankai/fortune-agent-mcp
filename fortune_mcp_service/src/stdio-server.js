#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateAstrolabe } from './tools/astrolabe.js';
import { analyzeStar, getPalaceInfo, analyzeRelationships } from './tools/analysis.js';
import { getHoroscope } from './tools/horoscope.js';

const server = new McpServer({
  name: 'iztro-mcp-service',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// 注册统一星盘生成工具
server.registerTool(
  'generate_astrolabe',
  {
    title: '增强星盘生成器',
    description: '根据生辰、城市位置生成紫微斗数星盘，支持阳历和农历，包含真太阳时计算和全面运势分析',
    inputSchema: {
      birth_date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
      time: z.string().describe('出生时间，格式：HH:mm'),
      gender: z.enum(['男', '女']).describe('性别'),
      city: z.string().describe('出生城市，如：北京、上海、广州等，用于经纬度查询和真太阳时计算'),
      is_lunar: z.boolean().optional().default(false).describe('是否为农历日期，默认false表示阳历'),
      is_leap: z.boolean().optional().default(false).describe('是否为闰月（仅农历有效)')
    }
  },
  async (args) => {
    console.error(`生成增强星盘：${JSON.stringify(args)}`);
    const result = await generateAstrolabe(args);
    console.error('星盘生成完成！');
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);


// 注册星曜分析工具
server.registerTool(
  'analyze_star',
  {
    title: '星曜分析器',
    description: '分析特定星曜的意义与影响',
    inputSchema: {
      star_name: z.string().describe('星曜名称，如：紫微、天府、太阳等'),
      palace: z.string().optional().describe('所在宫位，如：命宫、财帛宫、事业宫等')
    }
  },
  async (args) => {
    console.error(`分析星曜：${JSON.stringify(args)}`);
    const result = await analyzeStar(args);
    console.error('星曜分析完成！');
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

// 注册运势查询工具
server.registerTool(
  'get_horoscope',
  {
    title: '运势查询器',
    description: '获取大运、流年、流月等运势信息',
    inputSchema: {
      astrolabe_data: z.object({
        basic_info: z.object({
          solar_date: z.string(),
          lunar_date: z.string().optional(),
          time: z.string(),
          gender: z.string(),
          zodiac: z.string().optional(),
          five_elements: z.string().optional()
        }),
        palace_data: z.array(z.object({})).optional(),
        star_locations: z.object({}).optional()
      }).describe('星盘数据（从generate_astrolabe_*获得）'),
      year: z.number().describe('查询年份'),
      month: z.number().optional().describe('查询月份（可选）')
    }
  },
  async (args) => {
    console.error(`查询运势：${JSON.stringify(args)}`);
    const result = await getHoroscope(args);
    console.error('运势查询完成！');
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

// 注册宫位信息查询工具
server.registerTool(
  'get_palace_info',
  {
    title: '宫位信息查询器',
    description: '查询特定宫位的详细信息',
    inputSchema: {
      astrolabe_data: z.object({
        basic_info: z.object({}).optional(),
        palace_data: z.array(z.object({})).optional(),
        star_locations: z.object({}).optional()
      }).describe('星盘数据（从generate_astrolabe_*获得）'),
      palace_name: z.string().describe('宫位名称，如：命宫、财帛宫、夫妻宫等')
    }
  },
  async (args) => {
    console.error(`查询宫位信息：${JSON.stringify(args)}`);
    const result = await getPalaceInfo(args);
    console.error('宫位信息查询完成！');
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

// 注册关系分析工具
server.registerTool(
  'analyze_relationships',
  {
    title: '关系分析器',
    description: '分析星曜与宫位之间的关系和影响',
    inputSchema: {
      astrolabe_data: z.object({
        basic_info: z.object({}).optional(),
        palace_data: z.array(z.object({})).optional(),
        star_locations: z.object({}).optional()
      }).describe('星盘数据（从generate_astrolabe_*获得）'),
      analysis_type: z.enum(['基本格局', '财运分析', '事业分析', '感情分析', '健康分析']).describe('分析类型')
    }
  },
  async (args) => {
    console.error(`分析关系：${JSON.stringify(args)}`);
    const result = await analyzeRelationships(args);
    console.error('关系分析完成！');
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('紫微斗数 MCP 服务已启动');
}

runServer().catch((error) => {
  console.error('服务启动失败:', error);
  process.exit(1);
});
